# Chat Flow

Last verified against implementation: 2026-04-13

## End-to-End Recommendation Workflow

The chat flow orchestrates the complete recommendation pipeline:

```
START
  ↓
[User sends initial query]
  ↓
Backend analyzes intent
  ├─ Insufficient info for recommendation → ask clarifications (Round 1)
  ├─ Out of scope → send explanation
  └─ Clear intent → fetch products directly
  ↓
[If asking: User answers questions]
  ↓
Backend decides:
  ├─ Clarifications sufficient → fetch products
  ├─ More info needed → ask more (Round 2)
  └─ Still out of scope → explain
  ↓
[If products received:]
Render recommendations
Enable follow-up questions
  ↓
[Optional: User asks follow-up]
  ↓
Backend fetches more products
Append to recommendations
  ↓
END
```

## Session Lifecycle

### Session Creation

Called when user clicks "New Chat" or initially visits `/chat`.

```typescript
// useChat hook
createNewSession = async (initialMessage?: string) => {
  const sessionId = crypto.randomUUID();
  const newSession: ChatSession = {
    id: sessionId,
    title: initialMessage ? truncate(initialMessage, 40) : "New Chat",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    clarificationRound: 0,
    clarificationAsked: false,
    clarificationAnswers: {},
    status: "ready", // Can accept user message
  };
  
  dispatch({
    type: "CREATE_SESSION",
    payload: newSession
  });
  
  dispatch({
    type: "SET_ACTIVE_SESSION_ID",
    payload: sessionId
  });
  
  // Auto-send first message if provided
  if (initialMessage) {
    sendMessage(sessionId, initialMessage);
  }
};
```

### Session Selection

User clicks a session in sidebar.

```typescript
setActiveSessionId = (sessionId: string | null) => {
  dispatch({
    type: "SET_ACTIVE_SESSION_ID",
    payload: sessionId
  });
  
  // Game: check if session data stale
  if (sessionId && !unavailableSessionIds.has(sessionId)) {
    syncSessionFromBackend(sessionId);
  }
};

// Optional: backend sync to get latest server state
const syncSessionFromBackend = async (sessionId: string) => {
  try {
    const response = await api.get(`/api/v1/sessions/${sessionId}`);
    const normalizedSession = normalizeSessionResponse(response);
    
    dispatch({
      type: "UPSERT_SESSION_FROM_BACKEND",
      payload: normalizedSession
    });
  } catch (err) {
    if (err.status === 404) {
      unavailableSessionIds.add(sessionId);
      dispatch({
        type: "SET_ERROR",
        payload: "Session no longer available on server"
      });
    }
  }
};
```

### Session Deletion

User clicks delete button on session card.

```typescript
deleteSession = (sessionId: string) => {
  dispatch({
    type: "DELETE_SESSION",
    payload: sessionId
  });
  
  // If deleted session active, clear activeSessionId
  if (activeSessionId === sessionId) {
    dispatch({
      type: "SET_ACTIVE_SESSION_ID",
      payload: null
    });
  }
  
  // Optional: notify backend of deletion
  api.delete(`/api/v1/sessions/${sessionId}`).catch(err => {
    console.error("Failed to sync delete to backend", err);
  });
};
```

## Initial Query Flow

### State Transitions

**Before send**:
```typescript
{
  status: "ready",              // Can send
  clarificationRound: 0,
  messages: [/* empty or prior */],
  isLoading: false
}
```

**During send**:
```typescript
{
  status: "loading",
  isLoading: true,
  loadingPhase: "understanding",
  messages: [..., userMessage]  // Optimistically add user message
}
```

**After receiving clarifications**:
```typescript
{
  status: "asking",             // Waiting for answers
  clarificationRound: 1,
  clarificationAsked: true,
  messages: [..., userMessage, assistantQuestionsMessage],
  isLoading: false
}
```

**After receiving recommendations**:
```typescript
{
  status: "complete",           // Chat mode enabled
  messages: [..., userMessage, assistantRecommendationsMessage],
  isLoading: false,
  chatModeEnabled: true         // Can ask follow-ups
}
```

### Step-by-Step Implementation

```typescript
sendMessage = async (sessionId: string, content: string) => {
  // 1. Validation & guard
  if (isLoadingRef.current) {
    console.warn("Request already in flight, ignoring");
    return;
  }
  
  const session = sessions.find(s => s.id === sessionId);
  if (!session) {
    dispatch({
      type: "SET_ERROR",
      payload: `Session ${sessionId} not found`
    });
    return;
  }
  
  // 2. Optimistic UI update: add user message immediately
  const userMessage: ChatMessage = {
    id: crypto.randomUUID(),
    type: "user",
    content,
    timestamp: Date.now()
  };
  
  dispatch({
    type: "ADD_MESSAGE",
    payload: { sessionId, message: userMessage }
  });
  
  // 3. Set loading state
  isLoadingRef.current = true;
  const requestId = crypto.randomUUID();
  currentRequestIdRef.current = requestId;
  
  dispatch({
    type: "SET_LOADING",
    payload: { isLoading: true, loadingPhase: "understanding" }
  });
  
  try {
    // 4. Build request payload
    const requestPayload = {
      session_id: sessionId,
      message: content,
      conversation_history: session.messages.map(msg => ({
        role: msg.type === "user" ? "user" : "assistant",
        content: msg.content
      })),
      clarification_round: session.clarificationRound,
      clarification_answers: session.clarificationAnswers,
      // Optional: include user profile context if authenticated
      user_context: authStorage.isAuthenticated() 
        ? { profile: await fetchUserProfile() }
        : undefined
    };
    
    // 5. Make API call
    const response = await api.post('/api/v1/chat/send', requestPayload, {
      headers: authStorage.isAuthenticated()
        ? { Authorization: `Bearer ${authStorage.getAuthSession()?.token}` }
        : {}
    });
    
    // 6. Check if request was superseded by newer request
    if (requestId !== currentRequestIdRef.current) {
      console.log("Newer request sent, discarding stale response");
      return;
    }
    
    // 7. Parse response and normalize
    const normalized = normalizeQueryResponse(response);
    
    // 8. Create assistant message
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      type: "ai",
      content: normalized.text || "",
      timestamp: Date.now(),
      ...createMessageByType(normalized)  // questions, products, errorMessage
    };
    
    // 9. Branch by response type
    switch (normalized.type) {
      case "clarification":
        // Asking for more information
        assistantMessage.questions = normalized.questions;
        assistantMessage.clarificationRound = sessionData.clarificationRound + 1;
        
        dispatch({
          type: "ADD_MESSAGE",
          payload: { sessionId, message: assistantMessage }
        });
        
        dispatch({
          type: "UPDATE_SESSION",
          payload: {
            sessionId,
            updates: {
              status: "asking",
              clarificationRound: sessionData.clarificationRound + 1,
              clarificationAsked: true
            }
          }
        });
        break;
        
      case "recommendations":
        // Ready to show products
        // First update loading to "fetching" phase
        dispatch({
          type: "SET_LOADING",
          payload: { isLoading: true, loadingPhase: "fetching" }
        });
        
        // Parse products from response
        assistantMessage.products = normalized.product_types || normalized.categories;
        
        dispatch({
          type: "ADD_MESSAGE",
          payload: { sessionId, message: assistantMessage }
        });
        
        dispatch({
          type: "UPDATE_SESSION",
          payload: {
            sessionId,
            updates: {
              status: "complete",
              chatModeEnabled: true
            }
          }
        });
        break;
        
      case "out_of_scope":
        // Cannot help with this request
        dispatch({
          type: "ADD_MESSAGE",
          payload: { sessionId, message: assistantMessage }
        });
        
        dispatch({
          type: "UPDATE_SESSION",
          payload: {
            sessionId,
            updates: { status: "ready" }
          }
        });
        break;
    }
    
    // 10. Persist state
    dispatch({ type: "PERSIST_TO_STORAGE" });
    
  } catch (err) {
    // Error handling
    const errorMessage: ChatMessage = {
      id: crypto.randomUUID(),
      type: "ai",
      content: "I encountered an error processing your request.",
      timestamp: Date.now(),
      errorMessage: err.message
    };
    
    dispatch({
      type: "ADD_MESSAGE",
      payload: { sessionId, message: errorMessage }
    });
    
    dispatch({
      type: "SET_ERROR",
      payload: err.message || "Unknown error"
    });
    
    dispatch({
      type: "UPDATE_SESSION",
      payload: {
        sessionId,
        updates: { status: "ready" }
      }
    });
    
  } finally {
    // 11. Clear loading state
    if (requestId === currentRequestIdRef.current) {
      dispatch({
        type: "SET_LOADING",
        payload: { isLoading: false, loadingPhase: undefined }
      });
    }
    
    isLoadingRef.current = false;
  }
};
```

## Clarification Round Answer Flow

### State Transitions

**When answering Round N**:

```typescript
{
  clarificationRound: N,
  clarificationAsked: true,
  clarificationAnswers: {
    ...existingAnswers,
    N: ["answer1", "answer2", ...]  // Answers for round N
  },
  status: "asking"
}
```

**After submitting answers**:

```typescript
{
  status: "loading",
  isLoading: true,
  loadingPhase: "generating"  // More intensive than initial understanding
}
```

**Response determines next state**:
- If more clarifications: `status = "asking"`, `clarificationRound++`
- If ready for recommendations: `status = "complete"`, `chatModeEnabled = true`
- If out of scope: status = "ready", clear clarificationAsked

### Implementation

```typescript
submitRoundAnswers = async (sessionId: string, answers: string[]) => {
  // 1. Find active session and validate
  const session = sessions.find(s => s.id === sessionId);
  if (!session || session.status !== "asking") {
    return;
  }
  
  // 2. Create summary message for user's answers
  const answerSummary = answers.join(", ");
  const summaryMessage: ChatMessage = {
    id: crypto.randomUUID(),
    type: "user",  // Display as user response
    content: `I chose: ${answerSummary}`,
    timestamp: Date.now(),
    answers: answers  // Internal: track answers
  };
  
  dispatch({
    type: "ADD_MESSAGE",
    payload: { sessionId, message: summaryMessage }
  });
  
  // 3. Merge answers into session history
  dispatch({
    type: "UPDATE_SESSION",
    payload: {
      sessionId,
      updates: {
        clarificationAnswers: {
          ...session.clarificationAnswers,
          [session.clarificationRound]: answers
        }
      }
    }
  });
  
  // 4. Determine loading phase
  const isLastRound = session.clarificationRound === 5;
  const loadingPhase = isLastRound ? "generating" : "understanding";
  
  // 5. Set loading
  dispatch({
    type: "SET_LOADING",
    payload: { isLoading: true, loadingPhase }
  });
  
  isLoadingRef.current = true;
  const requestId = crypto.randomUUID();
  currentRequestIdRef.current = requestId;
  
  try {
    // 6. Build request with full context
    const requestPayload = {
      session_id: sessionId,
      // Reconstruct conversation for backend context
      conversation_history: buildConversationHistory(session),
      clarification_round: session.clarificationRound,
      clarification_answers: {
        ...session.clarificationAnswers,
        [session.clarificationRound]: answers
      }
    };
    
    // 7. Call API
    const response = await api.post(
      '/api/v1/chat/submit-answers',
      requestPayload,
      { headers: buildAuthHeaders() }
    );
    
    // 8. Check for stale request
    if (requestId !== currentRequestIdRef.current) {
      return;
    }
    
    // 9. Normalize and handle response (same as sendMessage)
    const normalized = normalizeQueryResponse(response);
    
    const assistantMessage = createMessageForResponse(normalized);
    
    // 10. Branch by response type
    if (normalized.type === "clarification") {
      // More rounds needed
      dispatch({
        type: "ADD_MESSAGE",
        payload: { sessionId, message: assistantMessage }
      });
      dispatch({
        type: "UPDATE_SESSION",
        payload: {
          sessionId,
          updates: {
            clarificationRound: session.clarificationRound + 1,
            status: "asking"
          }
        }
      });
    } else if (normalized.type === "recommendations") {
      // Final recommendations
      dispatch({
        type: "SET_LOADING",
        payload: { isLoading: true, loadingPhase: "fetching" }
      });
      
      assistantMessage.products = normalized.product_types;
      
      dispatch({
        type: "ADD_MESSAGE",
        payload: { sessionId, message: assistantMessage }
      });
      dispatch({
        type: "UPDATE_SESSION",
        payload: {
          sessionId,
          updates: {
            status: "complete",
            chatModeEnabled: true
          }
        }
      });
    }
    
    // 11. Persist
    dispatch({ type: "PERSIST_TO_STORAGE" });
    
  } catch (err) {
    // Same error handling as sendMessage
    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        sessionId,
        message: {
          id: crypto.randomUUID(),
          type: "ai",
          content: "Error processing your answers.",
          timestamp: Date.now(),
          errorMessage: err.message
        }
      }
    });
    dispatch({
      type: "SET_ERROR",
      payload: err.message
    });
    
  } finally {
    if (requestId === currentRequestIdRef.current) {
      dispatch({
        type: "SET_LOADING",
        payload: { isLoading: false }
      });
    }
    isLoadingRef.current = false;
  }
};
```

## Post-Recommendation Chat Mode

Once products displayed and `status = "complete"`:

```typescript
// Derived state in hook
chatModeEnabled = activeSession?.status === "complete";
```

UI changes:
- MessageList shows "Ask a follow-up question" prompt below recommendations
- InputBar becomes active and gains focus
- New messages user sends treated as follow-up questions

### Follow-Up Question Flow

Follow-up message triggered by `sendMessage()` again, but now:

1. Backend receives message with `clarification_round < 0` (or flag)
2. Backend knows context (prior query + clarifications)
3. Returns new product recommendations for follow-up
4. Frontend appends to recommendations list instead of replacing
5. Chat continues in same session

## Demo Mode: Pending Recommendation Handling

### Scenario

User sends initial query but is not authenticated. After 5 clarification answers, products cannot fetch (401).

### Handler

```typescript
const handlePendingRecommendation = async () => {
  const session = activeSession;
  if (!session || session.status !== "complete") {
    return; // Was able to fetch
  }
  
  // Mark as pending
  setPendingRecommendationSessionId(session.id);
  
  // Prompt user to log in
  dispatch({
    type: "SET_ERROR",
    payload: "Log in to see product recommendations"
  });
};

// On successful login
const resumePendingRecommendation = async () => {
  if (!pendingRecommendationSessionId) return;
  
  const session = sessions.find(s => s.id === pendingRecommendationSessionId);
  if (!session) return;
  
  // Re-call answer submission with now-valid auth
  await submitRoundAnswers(pendingRecommendationSessionId, 
    flattenAllAnswers(session.clarificationAnswers));
  
  // Clear pending marker
  dispatch({
    type: "SET_PENDING_RECOMMENDATION",
    payload: null
  });
};
```

## Error Scenarios & Recovery

### Network Error During Send

```typescript
try {
  await api.post('/api/v1/chat/send', payload);
} catch (err) {
  if (err.code === 'NETWORK_ERROR') {
    // Retry with exponential backoff?
    // For now: show error, allow user to manually resend
    dispatch({
      type: "SET_ERROR",
      payload: "Network error. Please check your connection."
    });
  }
}
```

### 401 Unauthorized (Token Expired)

```typescript
const response = await api.post(path, payload);
// api.ts intercepts 401 → clears auth → redirects to login
// Chat session preserved in sessionStorage for resume after login
```

### 429 Rate Limited (API Quota Exhausted)

```typescript
if (response.status === 429) {
  dispatch({
    type: "SET_ERROR",
    payload: "API quota exhausted. Please try again later."
  });
  // Backend marks SERPapi unavailable
  // Products fetched from cache or not shown
}
```

### Session Not Found (404)

```typescript
const session = sessions.find(s => s.id === sessionId);
if (!session) {
  unavailableSessionIds.add(sessionId);
  dispatch({
    type: "SET_ERROR",
    payload: "This session is no longer available."
  });
  // Mark for skip on future syncs
}
```

## State Diagram

```
         ┌─────────────┐
         │   READY     │ ← Initial state, post-error
         └──────┬──────┘
                │ (send initial query)
                ▼
         ┌─────────────┐
    ┌───→│  LOADING    │
    │    └──────┬──────┘
    │           │
    │      ┌────┴─────┐
    │      ▼          ▼
    │   ┌──────┐  ┌──────────┐
    │   │ ASKING│  │COMPLETE  │
    │   └──┬───┘  └────┬─────┘
    │      │           │
    │      │ (answer)  │ (follow-up)
    │      └─────┬─────┘
    │            │
    │      ┌─────▼─────┐
    │      │  LOADING  │
    │      └─────┬─────┘
    │            │
    └────────────┴─────────────────────┘
``` (Can return to READY on error)

Subsequent `sendMessage` calls route to `POST /chat/mode` instead of `POST /query`.

Result:

- Assistant returns a plain text follow-up response
- Session remains `complete`
- Hook triggers backend sync to keep local and server snapshots aligned

## Loading and Error UX

### Loading

`LoadingIndicator` shows phase-specific copy:

- `understanding`: intent interpretation
- `generating`: recommendation generation
- `fetching`: final recommendation assembly

### Error paths

- API exceptions surface through shared `error` state and inline alert in `ChatPage`
- Error text is also appended into conversation stream as assistant message for continuity

## Resume and Recovery

If `pendingRecommendationSessionId` exists and user is authenticated, `resumePendingRecommendation()` syncs that session from backend and clears the pending marker.

## UI Guardrails and Interaction Rules

- Only the most recent question message receives an active `onSubmitAnswers` callback
- Input send is disabled while loading
- Input send is debounced to reduce accidental duplicate submissions
- `beforeunload` warning is attached when sessions exist to reduce accidental loss
