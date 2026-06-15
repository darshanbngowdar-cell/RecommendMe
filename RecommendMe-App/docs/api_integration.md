# API Integration

Last verified against implementation: 2026-04-13

## Integration Architecture

The frontend communicates with backend via `src/services/api.ts` module.

**Responsibilities**:
- Single point of HTTP communication (no direct fetch calls elsewhere)
- Request/response normalization (handle both new and legacy formats)
- Automatic auth header injection
- Timeout and retry handling
- Error translation to user-facing messages

**Not responsible for**:
- Business logic (deferred to `useChat` hook)
- State management (deferred to React hooks)
- Validation (frontend validates UI, backend validates data)

### Design Principle

All API calls go through `api.ts`, creating a firewall between HTTP transport and React state. This decoupling makes response format changes backward-compatible without touching components.

## Base URL Resolution

### Environment Configuration

Source: `src/config/environments.ts`

```typescript
interface EnvironmentConfig {
  apiUrl: string;      // Backend base URL
  environment: string; // "dev" | "prod" | "staging"
  debugApi: boolean;   // Log all requests/responses
  timeout: number;     // Request timeout in ms
}
```

### Resolution Priority

1. Check `VITE_ENVIRONMENT` variable (build-time, unsafe for secrets)
2. Check browser hostname:
   - `localhost` → dev with default `http://localhost:8000`
   - `127.0.0.1` → dev with default `http://localhost:8000`
   - Otherwise → production URL from `VITE_API_URL` env var
3. Fallback: `http://localhost:8000`

### Example Configurations

**Local development**:
```
VITE_ENVIRONMENT=dev
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
VITE_DEBUG_API=true
```

**Production**:
```
VITE_ENVIRONMENT=prod
VITE_API_URL=https://api.recommendme.com
VITE_API_TIMEOUT=15000
VITE_DEBUG_API=false
```

## Request/Response Pipeline

### HTTP Resilience

All API calls wrapped in `fetchWithRetry(url, options, maxRetries=2)`:

```typescript
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  maxRetries = 2
): Promise<Response> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
      
    } catch (err) {
      lastError = err;
      
      if (err.name === 'AbortError') {
        lastError = new Error(
          `Request timeout after ${timeout}ms. Please check your connection.`
        );
      }
      
      // Exponential backoff before next retry
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 500; // 500ms, 1000ms
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("Request failed after retries");
};
```

**Retry behavior**:
- Network errors (timeout, connection refused) → retry
- 5xx server errors → retry
- 4xx client errors (400, 401, 404) → fail immediately (no retry)
- Each retry waits 500ms * 2^attempt (exponential backoff)

### Auth Header Injection

For endpoints requiring authentication:

```typescript
const buildAuthHeaders = (): Record<string, string> => {
  const authSession = authStorage.getAuthSession();
  
  if (!authSession?.token) {
    return {};
  }
  
  return {
    Authorization: `Bearer ${authSession.token}`
  };
};

// Applied to all protected endpoints (marked with [Bearer])
// Unauthenticated endpoints simply omit the header
```

### Response Normalization

All 2xx responses passed through normalization functions:

```typescript
private normalizeResponse<T>(data: unknown): T {
  // JSON is already parsed by fetch().json()
  // Normalization handles:
  // 1. Snake_case to camelCase (backend standard)
  // 2. Date string → Date object conversion
  // 3. Array format detection (old vs new)
  // 4. Null/undefined field handling
  
  return transformKeysToJSON(data);
}
```

### Error Extraction & User Translation

On non-2xx response:

```typescript
const extractErrorMessage = (response: Response, data?: any): string => {
  // Priority order:
  // 1. detail (FastAPI standard)
  // 2. message (custom fields)
  // 3. error (generic)
  // 4. HTTP status text fallback
  
  if (typeof data?.detail === 'string') {
    return data.detail;
  }
  
  if (typeof data?.message === 'string') {
    return data.message;
  }
  
  if (response.status === 401) {
    return "Your session has expired. Please log in again.";
  }
  
  if (response.status === 429) {
    return "Too many requests. Please wait and try again.";
  }
  
  if (response.status === 500) {
    return "Server error. We'll fix this soon.";
  }
  
  return `Server error: HTTP ${response.status}`;
};
```

## Endpoint Reference

### Authentication Endpoints

#### `POST /api/v1/auth/token` (Login)

**Request**:
```typescript
{
  email_or_username: string;  // Email or username
  password: string;
}
```

**Response (200)**:
```typescript
{
  access_token: string;
  token_type: "bearer";
  expires_in?: number;        // Seconds
  user?: {
    id: string;
    username: string;
    email: string;
    created_at: number;       // Timestamp in ms
  }
}
```

**Response (401)**:
```typescript
{ detail: "Invalid credentials" }
```

**Frontend handling**:
```typescript
const loginUser = async (email: string, password: string) => {
  const response = await fetchWithRetry(
    `${apiUrl}/auth/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email_or_username: email,
        password: password
      })
    }
  );
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(extractErrorMessage(response, data));
  }
  
  const data = await response.json();
  
  const authSession = {
    token: data.access_token,
    userId: data.user?.id || UUID(),
    username: data.user?.username || email,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000
  };
  
  authStorage.saveAuthSession(authSession);
  
  return authSession;
};
```

#### `POST /api/v1/auth/signup` (Register)

**Request**:
```typescript
{
  email: string;
  username: string;
  password: string;
}
```

**Response (200)**:
```typescript
{
  message: "User created successfully";
  user: {
    id: string;
    email: string;
    username: string;
  }
}
```

**Response (400)**:
```typescript
{ detail: "Email already registered" }
or
{ detail: "Username already taken" }
```

### Chat Endpoints

#### `POST /api/v1/chat/send` (Send Initial Query or Follow-up)

**Request**:
```typescript
{
  session_id: string;
  message: string;              // User's query or follow-up
  conversation_history: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  clarification_round?: number;
  clarification_answers?: Record<number, string[]>;
}
```

**Response (200 — Clarification)**:
```typescript
{
  status: "asking",  // or "pre_clarification"
  message: string;   // AI response explaining the questions
  clarification_round: 1;
  questions: [
    "What is your budget?",
    "What features matter most?"
  ];
  
  // Legacy format (backward compat)
  // type: "followup"
  // followup_questions: [...]
}
```

**Response (200 — Recommendations)**:
```typescript
{
  status: "recommendations",
  message: string;   // Summary of recommendations
  
  // New format: product types with descriptions
  product_types: [
    {
      name: "Premium Headphones",
      description: "High-end audio equipment...",
      products: [
        {
          id: "prod-123",
          title: "Sony WH-1000XM5",
          brand: "Sony",
          price: 349.99,
          currency: "INR",
          image_url: "https://...",
          rating: 4.8,
          review_count: 1200,
          url: "https://google.com/shopping/...",
          category: "Headphones"
        }
      ]
    }
  ],
  
  // Legacy format (backward compat)
  // categories: [ { name, products } ]
}
```

**Response (200 — Out of Scope)**:
```typescript
{
  status: "out_of_scope",
  message: "I can't help with that. Try asking about..."
}
```

**Response (400)**:
```typescript
{ detail: "Message too long (max 500 chars)" }
```

**Response (401)**:
```typescript
{ detail: "Unauthorized" }
// Frontend catches, clears token, redirects to login
```

**Response (429)**:
```typescript
{ detail: "Rate limit exceeded. Try again later." }
// Backend has marked SERPapi unavailable
```

**Frontend handling**:
```typescript
const sendQuery = async (
  sessionId: string,
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  authToken?: string
): Promise<ChatResponse> => {
  const response = await fetchWithRetry(
    `${apiUrl}/chat/send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...buildAuthHeaders()
      },
      body: JSON.stringify({
        session_id: sessionId,
        message,
        conversation_history: conversationHistory
      })
    }
  );
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    
    if (response.status === 401) {
      authStorage.clearAuthSession();
      // Hook will detect and redirect/prompt login
    }
    
    throw new Error(extractErrorMessage(response, data));
  }
  
  const data = await response.json();
  return normalizeQueryResponse(data);
};
```

#### `POST /api/v1/chat/submit-answers` (Send Clarification Answers)

**Request**:
```typescript
{
  session_id: string;
  clarification_round: number;
  clarification_answers: Record<number, string[]>;
  // Full conversation_history (optional, backend may infer)
}
```

**Response**: Same shape as `POST /api/v1/chat/send`

#### `GET /api/v1/sessions/{sessionId}` (Get Session Details)

**Response (200)**:
```typescript
{
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  messages: Array<{
    id: string;
    type: "user" | "assistant";
    content: string;
    timestamp: number;
    clarification_round?: number;
    questions?: string[];
    products?: Product[];
  }>;
  clarification_round: number;
  status: "ready" | "asking" | "complete" | "error";
}
```

**Response (404)**:
```typescript
{ detail: "Session not found" }
// Frontend marks as unavailable, skips future syncs
```

### Profile Endpoints

#### `GET /api/v1/profile` [Bearer]

**Response (200)**:
```typescript
{
  id: string;
  email: string;
  username: string;
  bio?: string;
  preferences: {
    theme: "light" | "dark";
    notifications_enabled: boolean;
  };
  avatar_url?: string;
  created_at: number;
  updated_at: number;
}
```

**Response (401)**:
```typescript
{ detail: "Invalid token" }
```

#### `PUT /api/v1/profile` [Bearer]

**Request**:
```typescript
{
  username?: string;
  bio?: string;
  preferences?: {
    theme?: "light" | "dark";
    notifications_enabled?: boolean;
  }
}
```

**Response (200)**: Same as GET profile

#### `POST /api/v1/profile/avatar/upload` [Bearer]

**Request**: multipart/form-data
```
avatar: File
```

**Response (200)**:
```typescript
{
  id: string;
  avatar_url: string;
  updated_at: number;
}
```

**Response (400)**:
```typescript
{ detail: "Invalid file format (must be PNG, JPG, WebP)" }
```

## Backward Compatibility

### Legacy Response Formats Supported

The frontend maintains support for older backend response formats:

**Query response — Legacy type field**:
```typescript
{
  type: "followup",           // instead of status: "asking"
  followup_questions: [...],  // instead of questions
}
```

**Recommendations — Legacy categories**:
```typescript
{
  categories: [              // instead of product_types
    {
      name: "Budget Headphones",
      products: [...]
    }
  ]
}
```

### Normalization Handles Both

```typescript
const normalizeQueryResponse = (data: any): ChatResponse => {
  // If modern format (status field)
  if (data.status === 'asking') {
    return {
      type: "clarification",
      text: data.message,
      questions: data.questions
    };
  }
  
  // If legacy format (type field)
  if (data.type === 'followup') {
    return {
      type: "clarification",
      text: data.message || "",
      questions: data.followup_questions || []
    };
  }
  
  // Products: support both product_types and categories
  const productTypes = data.product_types || data.categories || [];
  
  return {
    type: "recommendations",
    product_types: productTypes
  };
};
```

**Why maintained?**
- Gradual backend migrations without forced frontend updates
- Dev/staging may run older versions while prod is updated
- Production deployments can roll out incrementally

## Error Scenarios & Recovery

### Timeout (>30s or custom config)

```
AbortController timeout
  ↓
Caught in fetchWithRetry
  ↓
Retry with backoff (2x)
  ↓
If still failing: throw "Request timeout"
  ↓
useChat catches → displays in error banner
  ↓
User can click "Retry"
```

### 401 Unauthorized

```
No/expired token
  ↓
Backend returns 401
  ↓
api.ts throws error
  ↓
useChat catches
  ↓
authStorage.clearAuthSession()
  ↓
If critical action: redirect /login
  ↓
On login, session restored from sessionStorage
```

### 429 Rate Limited

```
Backend quota exceeded
  ↓
Returns 429
  ↓
api.ts throws error (no retry, this is a policy error)
  ↓
useChat displays "API quota exceeded"
  ↓
User shown option to retry later
  ↓
Backend marks SERPapi unavailable (from backend logs)
```

### 500 Server Error

```
Backend throws unhandled exception
  ↓
Returns 500
  ↓
api.ts retries (up to 2x with backoff)
  ↓
If persists: throw "Server error. We'll fix this soon."
  ↓
useChat catches, shows in chat
  ↓
Session remains in state (not lost)
```

## Performance Considerations

### Request Caching

No frontend caching implemented. Backend is responsible for:
- Session caching
- Product recommendation caching
- User profile caching

Each request returns fresh data.

### Connection Pooling

Browsers handle automatically via `fetch()` implementation.

### Request Batching

Not implemented. Each interaction (send, answer, fetch profile) is separate request.

**Rationale**: Simplicity. If latency becomes issue, consider:
- Combining clarification answers + product fetch in single request
- Multi-question answering (all rounds) in one call

## Testing Approach

### Mock Setup

```typescript
// Mock entire api.ts module
jest.mock('src/services/api', () => ({
  sendQuery: jest.fn().mockResolvedValue({
    type: "clarification",
    questions: ["Q1", "Q2", "Q3"]
  }),
  loginUser: jest.fn().mockResolvedValue({
    token: "mock-token",
    username: "test-user"
  })
}));
```

### Integration Test Outline

```
1. Mock fetch() to return predefined responses
2. Call useChat.sendMessage()
3. Verify API called with correct payload
4. Verify response normalized correctly
5. Verify state updated with normalized data
6. Verify error handling on error response
```
