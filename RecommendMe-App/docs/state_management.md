# State Management

Last verified against implementation: 2026-04-13

## State Strategy Overview

The application uses **local React state + Context API**, without Redux or Zustand. This keeps the codebase lightweight and avoids state boilerplate for a single-document chat application.

Primary state domains:

1. **Chat domain** (`useChat` hook) — session mgmt, message history, workflow state
2. **Theme domain** (`useTheme` context) — light/dark mode
3. **Auth storage** (`authStorage` service) — token + user metadata persistence
4. **Page-local state** (component useState) — form fields, UI toggles, modals

## Chat State Management (useChat)

Source file: `src/hooks/useChat.ts`

### Core Data Structures

**ChatSession**

```typescript
interface ChatSession {
  id: string;                                    // UUID for session
  title: string;                                 // User's initial query
  createdAt: number;                            // Timestamp in ms
  updatedAt: number;                            // Last modified
  messages: ChatMessage[];                      // Full timeline
  clarificationRound: number;                   // 1-5 (0 = no ask yet)
  clarificationAsked: boolean;                  // Have Q's been shown?
  clarificationAnswers: Record<number, string[]>; // Answers per round
  status: "asking" | "ready" | "loading" | "complete"; // Workflow state
}

interface ChatMessage {
  id: string;                      // UUID
  type: "user" | "ai";           // Message origin
  content: string;                // Text content
  timestamp: number;              // Time sent (ms)
  clarificationRound?: number;   // If Q's
  questions?: string[];          // If clarification
  answers?: string[];            // If user answered
  products?: ProductType[];      // If recommendations
  errorMessage?: string;         // If API error
}
```

**useChat State**

```typescript
{
  sessions: ChatSession[],                    // All sessions (persisted)
  activeSessionId: string | null,             // Currently open
  isLoading: boolean,                         // Any async in flight
  loadingPhase: "understanding" | "generating" | "fetching",
  error: string | null,                       // Last error message
  chatModeEnabled: boolean,                   // Can ask follow-ups
  isDemoMode: boolean,                        // No auth token
  hasPendingRecommendation: boolean,         // Resume after login
}
```

### Internal Refs for Race Prevention

```typescript
currentRequestIdRef    // Unique ID per async request, rejects stale responses
inFlightSessionIdRef   // Prevent overlapping ops on same session
isLoadingRef          // Prevent concurrent send/submit when already loading
unavailableSessionIdsRef // Skip retry on 404 sessions
```

### State Transitions & Lifecycle

#### Mount and Hydration

```
1. useChat() called
2. useReducer initializes with default state
3. useEffect runs: ACTION_LOAD_FROM_STORAGE
4. Reads sessionStorage['recommendme-chat-state-v2']
5. Deserializes JSON → reconstructs sessions
6. Deserializes dates (stored as numbers)
7. Dispatch LOAD_SUCCESS
8. SessionStorage sync listener attached
9. UI renders with restored conversations
```

#### Send User Message

```
1. User types and hits send
2. InputBar calls sendMessage(sessionId, text)
3. useChat dispatches ADD_USER_MESSAGE
4. useChat dispatches SET_LOADING(true, "understanding")
5. currentRequestId = UUID()
6. API call: POST /api/v1/chat/send
   Headers: Authorization: Bearer <token> (if authenticated)
   Body: { session_id, message }
7. Response parsing:
   - If status == "asking": add AI message with questions, set round
   - If status == "recommendations": fetch products next
8. Dispatch SET_LOADING(false)
9. _persistSessionsToStorage()
10. UI shows questions OR loading for products
```

#### Answer Clarification Questions

```
1. User selects answers for round 1-5
2. QuestionRound component calls submitRoundAnswers(sessionId, answers)
3. Dispatch SAVE_CLARIFICATION_ANSWERS
4. IF responses.length > 0: Dispatch SET_LOADING(true, "generating")
5. IF clarificationRound < 5:
     API call: POST /api/v1/chat/submit-answers
     Body: { session_id, round, answers }
     Response: next questions
     Add AI message with new questions, increment round, wait for user
   ELSE:
     Dispatch SET_LOADING(true, "fetching")
     API call: POST /api/v1/chat/recommend
     Response: { product_types: [...] } or { categories: [...] }
     Add AI message with recommendations
     Dispatch SET_CHAT_MODE_ENABLED(true)
6. Dispatch SET_LOADING(false)
7. _persistSessionsToStorage()
```

#### Create New Session

```
1. User clicks "New Chat" button
2. Component calls createNewSession(initialMessage)
3. Generate sessionId = UUID()
4. Create ChatSession with empty messages, title = initialMessage
5. Dispatch CREATE_SESSION
6. Dispatch SET_ACTIVE_SESSION_ID(newSessionId)
7. Trigger sendMessage(newSessionId, initialMessage)
```

#### Delete Session

```
1. User clicks delete on session card
2. Sidebar calls deleteSession(sessionId)
3. Dispatch DELETE_SESSION
4. If activeSessionId == sessionId:
     Dispatch SET_ACTIVE_SESSION_ID(null)
     UI shows empty state
5. Remove from sessions array
6. _persistSessionsToStorage()
```

#### Page Refresh

```
1. User reloads page
2. ChatPage remounts
3. useChat useEffect fires
4. Dispatch ACTION_LOAD_FROM_STORAGE
5. sessionStorage is read synchronously (no loss)
6. Sessions, activeSessionId, messages all restored
7. UI renders full chat history
8. MessageList auto-scrolls to bottom
```

#### Multi-Tab Sync

```
1. Tab A sends message → updates sessionStorage
2. Browser fires 'storage' event in other tabs
3. useChat storage listener receives event
4. Dispatch SYNC_FROM_STORAGE with event.newValue
5. Tab B now has updated sessions without user refresh
6. Timestamps ensure correct sort order
```

### Persistence Mechanics

#### sessionStorage Keys

**`recommendme-chat-state-v2`** (primary)

```json
{
  "sessions": [
    {
      "id": "abc123",
      "title": "Wireless Headphones",
      "createdAt": 1701234567000,
      "updatedAt": 1701234890000,
      "messages": [...],
      "clarificationRound": 2,
      "clarificationAsked": true,
      "clarificationAnswers": {
        "1": ["premium", "noise-cancelling"],
        "2": ["bluetooth", "over-ear"]
      },
      "status": "asking"
    }
  ],
  "activeSessionId": "abc123"
}
```

**`recommendme-pending-recommendation-session-v2`** (secondary)

Used to mark which session needs recommendation fetch after login:

```json
{
  "sessionId": "abc123",
  "createdAt": 1701234890000
}
```

#### Serialization & Deserialization

**Serialization** (on PERSIST):

```typescript
const state = { sessions, activeSessionId };
const json = JSON.stringify(state);
sessionStorage.setItem('recommendme-chat-state-v2', json);
```

**Deserialization** (on LOAD_FROM_STORAGE):

```typescript
const json = sessionStorage.getItem('recommendme-chat-state-v2');
if (!json) return; // first visit
const { sessions, activeSessionId } = JSON.parse(json);
// Dates already stored as numbers, no conversion needed
```

#### Auto-Persist Throttling

After every state-mutating action:

1. Mark `dirty = true`
2. Schedule `persistDebouncer` (1000ms)
3. When timer fires: call `_persistSessionsToStorage()`
4. If action arrives before timer: reschedule

Benefit: write to sessionStorage ~1-2 times per second, not on every keystroke.

### Message Deduplication

Function `appendMessageIfNotDuplicate`:

```typescript
if (messages.length > 0) {
  const last = messages[messages.length - 1];
  if (last.type === newMessage.type &&
      last.content === newMessage.content) {
    return; // Skip duplicate add
  }
}
messages.push(newMessage);
```

Prevents double-adding same message when:
- Retry logic fires
- Race condition between optimistic + server response
- Reducer processes same action twice (shouldn't happen, but safe)

### Concurrency & Race Handling

#### Request ID Pattern

```typescript
const requestId = generateUUID();
currentRequestIdRef.current = requestId;

const response = await api.post('/chat/send', payload);

if (requestId !== currentRequestIdRef.current) {
  // Newer request arrived, discard this response
  return;
}
// Process response safely
```

Prevents:
- Slow response arriving after new faster request
- Render with stale data
- Race condition on session state

#### In-Flight Session Tracking

```typescript
inFlightSessionIdRef.current = sessionId;
try {
  await apiCall();
} finally {
  if (inFlightSessionIdRef.current === sessionId) {
    // Clear loading flag only if no new request started
    dispatch(SET_LOADING(false));
  }
}
```

#### Unavailable Session Cache

```typescript
unavailableSessionIdsRef.current = new Set();

const send = async (sessionId, msg) => {
  if (unavailableSessionIdsRef.current.has(sessionId)) {
    // Skip retry for known-404 sessions
    return;
  }
  try {
    // API call
  } catch (err) {
    if (err.status === 404) {
      unavailableSessionIdsRef.current.add(sessionId);
    }
  }
}
```

### Derived State Computation

#### chatModeEnabled

```typescript
const computeChatModeEnabled = (activeSession?: ChatSession): boolean => {
  if (!activeSession) return false;
  const hasRecommendations = activeSession.messages.some(
    msg => msg.type === "ai" && msg.products && msg.products.length > 0
  );
  return activeSession.status === "complete" && hasRecommendations;
};
```

Computed fresh in render; allows sending follow-up questions once recommendations shown.

## Theme State (useTheme)

Source file: `src/hooks/useTheme.tsx`

### Provider Setup

```typescript
const [theme, setTheme] = useState<"light" | "dark">(() => {
  // Load from localStorage, fallback to system preference
  const stored = localStorage.getItem('recommendme-theme');
  if (stored) return stored as "light" | "dark";
  
  const darkPreferred = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return darkPreferred ? "dark" : "light";
});
```

### Theme Update Flow

```
1. User clicks theme toggle button
2. toggleTheme() called
3. setTheme(opposite) → re-render
4. useEffect runs: if (theme) { ... }
5. document.documentElement.classList.add/remove('dark')
6. localStorage.setItem('recommendme-theme', theme)
7. Tailwind CSS applies .dark selector styles
```

### Storage

**Key**: `recommendme-theme`

**Value**: `"light"` | `"dark"`

## Auth Session Storage

Source file: `src/services/authStorage.ts`

### Data Structure

```typescript
interface AuthSession {
  token: string;              // Bearer token for API
  userId: string;             // User ID from backend
  username: string;           // Display name
  expiresAt?: number;         // Expiration timestamp (ms)
}
```

### API

```typescript
export const authStorage = {
  getAuthSession: (): AuthSession | null => {
    const stored = localStorage.getItem('recommendme-auth-v2');
    return stored ? JSON.parse(stored) : null;
  },
  
  saveAuthSession: (session: AuthSession) => {
    localStorage.setItem('recommendme-auth-v2', JSON.stringify(session));
  },
  
  clearAuthSession: () => {
    localStorage.removeItem('recommendme-auth-v2');
  },
  
  isAuthenticated: (): boolean => {
    const session = getAuthSession();
    if (!session?.token) return false;
    if (session.expiresAt && Date.now() > session.expiresAt) return false;
    return true;
  },
};
```

### Storage

**Key**: `recommendme-auth-v2`

**Value**:

```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "userId": "user-uuid-123",
  "username": "john_doe",
  "expiresAt": 1701234890000
}
```

## Component-Level Local State

### Form State Patterns

**InputBar** (`src/components/chat/InputBar.tsx`):

```typescript
const [message, setMessage] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSend = async () => {
  if (!message.trim()) return;
  setIsSubmitting(true);
  try {
    await onSendMessage(message);
    setMessage(""); // Clear after send
  } catch (err) {
    // Error handled by parent
  } finally {
    setIsSubmitting(false);
  }
};
```

**LoginPage** (`src/pages/LoginPage.tsx`):

```typescript
const [identifier, setIdentifier] = useState("");
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState("");
```

**SignUpPage** (`src/pages/SignUpPage.tsx`):

```typescript
const [email, setEmail] = useState("");
const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [termsAccepted, setTermsAccepted] = useState(false);
const [showTermsModal, setShowTermsModal] = useState(false);
```

**MessageList** (`src/components/chat/MessageList.tsx`):

```typescript
const [autoScroll, setAutoScroll] = useState(true);
const scrollContainerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (autoScroll && scrollContainerRef.current) {
    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
  }
}, [messages, autoScroll]);

const handleScroll = () => {
  const el = scrollContainerRef.current;
  const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 100;
  setAutoScroll(atBottom);
};
```

## Data Flow Architecture

### API → State → UI Boundary

```
API Call (src/services/api.ts)
  ↓
Response Normalization (handles old + new formats)
  ↓
useChat Dispatcher (ADD_MESSAGE, SET_LOADING, etc.)
  ↓
sessionStorage Persist
  ↓
React Re-render
  ↓
Component Props
  ↓
UI Display
```

**Key invariant**: Components receive data via props, never access storage directly (except authStorage for token).

### Chat Hook as Single Source of Truth

- Only `useChat` mutates chat domain state
- All components using chat state consume via `useChat` return values
- No duplicate state in components
- Consistency guaranteed by single mutation path

## Performance Considerations

### Storage Write Limits

- sessionStorage limited to ~5-10 MB
- Large chats (1000+ messages) approach limit
- Mitigation: archive old sessions, prune history

### State Update Frequency

- Debounce sessionStorage writes (1s throttle)
- Prevents 100+ writes/sec on rapid user input
- Trade-off: storage slightly behind real-time on crash

### Re-render Optimization

- useChat returns stable object reference (via useMemo) for non-primitive values
- InputBar, MessageList use useCallback for handlers
- ProductCard uses React.memo to skip re-render if props unchanged

### Potential Bottlenecks

- Large sessions array (100+) → sidebar rendering slow
- Many messages (500+) → MessageList scroll jerky without virtualization
- High API latency hides loading state, appears frozen

## Testing Guidance

### Unit Test Candidates

1. **useChat reducer logic**:
   - ADD_USER_MESSAGE updates session and persists
   - SET_LOADING(true) prevents concurrent sends
   - DELETE_SESSION clears activeSessionId if needed

2. **localStorage sync**:
   - getAuthSession() returns null on empty key
   - saveAuthSession() stringifies correctly
   - isAuthenticated() checks expiry

3. **Message deduplication**:
   - appendMessageIfNotDuplicate skips duplicate add
   - Allows legitimate same-text messages by different authors

### Integration Test Outline

```typescript
test("send message → see response → answer → get recommendations", async () => {
  // 1. Render ChatPage
  // 2. type & send "headphones"
  // 3. verify API call made with session context
  // 4. mock response: questions
  // 5. verify questions displayed
  // 6. select answers, submit
  // 7. mock response: recommendations
  // 8. verify products displayed
  // 9. verify chat mode enabled
  // 10. verify sessionStorage updated
});
```

### E2E Test Outline

```
1. Cold start, no auth
2. Send query → see questions
3. Answer questions → login prompt
4. Log in
5. Auto-resume → see recommendations
6. Refresh page → verify chat restored
7. Switch tabs → verify sync
8. Delete session → verify removal
```

- Settings copy says conversations clear on refresh, but chat state is persisted in `sessionStorage` for current browser session/tab lifecycle.
- `useChat` exposes no-op `enableChatMode`/`disableChatMode`; chat mode activation is automatic and derived.
