# Frontend Architecture

Last verified against implementation: 2026-04-13

## Architectural Style

The frontend follows a layered SPA architecture:

1. **Page layer** (`src/pages/*`) for route-level composition
2. **Feature component layer** (`src/components/chat`, `src/components/layout`, `src/components/products`)
3. **State/control hooks** (`src/hooks/useChat.ts`, `src/hooks/useTheme.tsx`)
4. **Integration layer** (`src/services/api.ts`, `src/services/authStorage.ts`, `src/config/environments.ts`)
5. **Styling foundation** (`src/index.css`, `tailwind.config.ts`)

This is not a Redux-style centralized state architecture; state is managed via React hook-local state and prop flow.

## Bootstrapping and Providers

`src/main.tsx` mounts `App`.

`src/App.tsx` wraps route tree with:

- `QueryClientProvider` (React Query client available app-wide)
- `ThemeProvider` (theme context + localStorage sync)
- `TooltipProvider`
- Toast systems (`Toaster`, `Sonner`)
- `BrowserRouter`
- Suspense fallback for route chunks

## Route Architecture

All pages are lazy-loaded using `React.lazy`.

Benefits implemented:

- Smaller initial JS payload
- Route-based chunk loading
- Simple loading shell (`Loading page...`) during chunk fetch

### Page Components

| Route | Component | Purpose |
|---|---|---|
| `/` | `Index.tsx` | Marketing/onboarding entry |
| `/chat` | `ChatPage.tsx` | Main recommendation workflow |
| `/login` | `LoginPage.tsx` | User authentication |
| `/signup` | `SignUpPage.tsx` | Account creation |
| `/profile` | `ProfilePage.tsx` | Profile edit and display |
| `/settings` | `SettingsPage.tsx` | User preferences |
| `*` | `NotFound.tsx` | 404 fallback |

## Chat Domain Architecture

### State Owner

`useChat` (`src/hooks/useChat.ts`) is the single owner for:

- Chat session list and active session
- Message history per session
- Clarification state (round number, pending questions)
- Loading phases and error states
- Call to backend API and response handling
- Session persistence to `sessionStorage`

### View Orchestration

`ChatPage.tsx` binds UI to `useChat` API:

- Sidebar session selection/new/delete
- Message list rendering with typing indicators
- Input bar and send handling
- Answer submission for clarification rounds
- Product recommendations display
- Loading states and error messages

### Component Composition

```
ChatPage
  ├── Sidebar (session list + new chat)
  ├── ChatHeader (title + toggle sidebar)
  └── MainArea
      ├── MessageList (message rendering)
      │   ├── UserMessage
      │   ├── AIMessage
      │   │   ├── QuestionRound (for clarification)
      │   │   └── RecommendationResults (for products)
      │   └── LoadingIndicator
      └── InputBar (query input + send)
```

## State Machine: Clarification Flow

Chat progresses through these states:

```
START
  → (send query)
ASKING (Round 1)
  → (answer 3 questions)
ASKING (Round 2)
  → (answer 2 more questions)
READY (generating recommendations)
  → (wait for products)
COMPLETE (recommendations shown, chat mode active)
  → (can ask follow-up questions)
```

## Component Layer Details

### Layout Components (`src/components/layout`)

- **Sidebar**: collapsible session list, new/delete session buttons
- **ChatHeader**: title, sidebar toggle, new chat button
- **MainArea**: flex container for message list and input

### Chat Components (`src/components/chat`)

- **MessageList**: scrollable message container, auto-scroll to bottom
- **UserMessage**: styled user query bubble
- **AIMessage**: styled AI response with text and/or questions and/or recommendations
- **InputBar**: textarea with auto-expand, send button, character counter
- **QuestionRound**: interactive question display with selectable answer options
- **StarterPrompts**: suggested queries for new session
- **LoadingIndicator**: spinner with loading phase text

### Product Components (`src/components/products`)

- **CategoryList**: renders new format (`productTypes`) or legacy format (`categories`)
- **ProductTypeSection**: expandable product type with description and scroll
- **ProductScrollRow**: horizontal scrollable product card container with nav arrows
- **ProductCard**: individual product card with image, price, rating, brand, description, buy link
- **ExpertTip**: (if present) context-aware tip

## API Integration Pattern

`src/services/api.ts` implements:

- **Type normalization**: backend responses (new + legacy) → frontend types
- **Backward compatibility**: handles both response formats transparently
- **Error mapping**: HTTP error codes → user-friendly messages
- **Request retry**: exponential backoff on transient failures
- **Timeout enforcement**: customizable per-request timeout

Response normalization examples:

```typescript
// Backend: { status: "recommendations", product_types: [...] }
// Frontend receives: { type: "recommendations", productTypes: [...] }

// Backend (legacy): { type: "recommendations", categories: [...] }
// Frontend receives: { type: "recommendations", categories: [...] }
```

## State Persistence

### sessionStorage (chat state)

Key: `recommendme-chat-state-v2`

Stores:
- Active session ID
- All sessions with messages, metadata
- Serialized timestamps and message types

Used for:
- Surviving page refresh during active chat
- Multi-tab session isolation
- Post-login session restoration

### sessionStorage (pending recommendation marker)

Key: `recommendme-pending-recommendation-session-v2`

Stores:
- Session ID with pending recommendation (after answering 5 questions but before login)
- Cleared once user logs in and recommendation completes

### localStorage (auth session)

Key: `recommendme-auth-v2`

Stores:
- Bearer token
- User metadata (userId, username, etc.)
- Expiry time

Used for:
- Persistent login across browser sessions
- Protected API calls

### localStorage (theme)

Key: `theme-preference`

Stores: `light` or `dark`

Used for: initial theme load before Context renders

## Hook Structure

### useChat() + UseChatOptions

Main behavior controller, called from `ChatPage`:

```typescript
const {
  // Data
  sessions,
  activeSession,
  activeSessionId,
  error,
  
  // State flags
  isLoading,
  loadingPhase, // "understanding" | "generating" | "fetching"
  isDemoMode,
  chatModeEnabled,
  hasPendingRecommendation,
  
  // Actions
  createNewSession,
  setActiveSessionId,
  deleteSession,
  sendMessage,
  submitRoundAnswers,
  resumePendingRecommendation,
} = useChat({
  isAuthenticated: () => Boolean(getAuthSession()),
  onAuthRequired: () => navigate("/login"),
});
```

### useTheme()

Theme provider hook for light/dark mode toggle.

### Custom Hooks (if any)

- `use-mobile.tsx`: responsive breakpoint detection
- `use-toast.ts`: toast notification API

## Environment Resolution

`src/config/environments.ts` resolves environment with fallbacks:

1. Build-time `VITE_ENVIRONMENT` (if safe)
2. Vite mode (`production`)
3. Hostname heuristics (localhost → dev)

Resolved config includes:
- API base URL
- Default timeout
- Debug flags
- Environment name

## Performance Optimizations

1. **Code splitting**: route-based lazy loading
2. **Image lazy loading**: `loading="lazy"` on product cards
3. **Memoization**: `useCallback`/`useMemo` in high-frequency render paths
4. **Vendor chunks**: manual splits for react, motion, queries, UI libs
5. **CSS optimized**: Tailwind purge + minification in prod build

## Styling Architecture

### Design System (src/index.css)

- CSS custom properties for colors, spacing, timing
- Semantic color palette (foreground, background, primary, secondary, etc.)
- Typography scales (heading sizes, text weights)
- Shadow and animation definitions

### Tailwind Config (tailwind.config.ts)

- Extended theme: custom colors, fonts, keyframes
- Plugin integrations: Radix colors, custom gradients
- Class output strategy for production optimization

### Component Styling

- Tailwind utility classes for layout/spacing/sizing
- Shadcn/Radix components for consistent interactive elements
- Framer Motion for animations and transitions

## Error Boundaries

No explicit error boundary implemented; React's default error handling applies.

All API errors caught at `useChat` level and surfaced via `error` state → displayed in error banner in `ChatPage`.

## Testing Surface

The following integration points are testable:

- `useChat` hook behavior (session mgmt, API calls, state transitions)
- API response normalization (old/new formats)
- Component rendering given state (messages, questions, products)
- LocalStorage/sessionStorage persistence
- Auth flow (login/logout, token lifecycle)

Unit tests would target individual components and hooks; e2e tests would cover full chat flow.
- Message list rendering and answer submission
- Input bar message sends
- Pending recommendation auto-resume
- Sidebar layout controls and resize behavior

### Message rendering pipeline

- `MessageList` decides whether each item is `UserMessage` or `AIMessage`
- `AIMessage` branches by message type:
  - Follow-up/pre-clarification -> `QuestionRound`
  - Recommendations -> `CategoryList` (`RecommendationResults`)
  - Text/out-of-scope/error -> message bubble

## API Integration Architecture

`src/services/api.ts` provides a typed boundary that:

- Encapsulates HTTP transport
- Applies retry and timeout policy (`fetchWithRetry`)
- Normalizes backend payloads into frontend contracts
- Supports both current and legacy backend schemas

This reduces direct backend schema assumptions inside view components.

## Persistence Architecture

### Session storage

- Chat state key: `recommendme-chat-state-v2`
- Pending recommendation key: `recommendme-pending-recommendation-session-v2`

Used for:

- Restoring sessions and active session in current browser session
- Tracking resumable server-backed recommendation context

### Local storage

- Auth session key: `recommendme-auth-session-v1`
- Theme key: `recommendme-theme`

Used for:

- Auth token/user/profile reuse
- Theme persistence across reloads

## Security and Access Control (Frontend Scope)

Frontend controls are UX-level guards, not trust boundaries:

- `ProfilePage` redirects unauthenticated users to `/login`
- Chat flow can run without forced auth, but resumes pending recommendations only when auth session exists
- Auth token is attached to protected API calls through `Authorization: Bearer ...`

Backend remains the authorization authority.

## Performance Architecture

Implemented performance controls:

- Route-level lazy loading
- Manual vendor chunking in Vite build config
- AbortController-based API timeout
- Exponential backoff retries for transient failures
- Lazy image loading for recommendation cards
- Minimal re-render helpers in chat state (`appendMessageIfNotDuplicate`, stale request guard)

## Known Architectural Constraints

- React Query provider exists, but chat domain itself is hook-local state, not query-cache driven
- Settings page text claims chats clear on refresh, but `useChat` persists chat state in `sessionStorage` for tab session continuity
- Demo mode flag exists in `useChat` return shape (`isDemoMode: false`) but no active demo data source switch is implemented in the current hook
