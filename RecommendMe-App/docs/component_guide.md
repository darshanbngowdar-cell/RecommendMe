# Component Guide

Last verified against implementation: 2026-04-13

## Component Architecture

### Dependency Tree

```
App.tsx (providers)
├── (routes)
│   ├── ChatPage
│   │   ├── ChatHeader
│   │   │   └── ui/Button (Radix)
│   │   ├── Sidebar
│   │   │   ├── SessionList
│   │   │   │   └── SessionCard
│   │   │   ├── ProfileCard
│   │   │   └── ui/ThemeToggle
│   │   └── MainArea
│   │       ├── MessageList
│   │       │   ├── UserMessage
│   │       │   ├── AIMessage
│   │       │   │   ├── QuestionRound
│   │       │   │   │   ├── ui/Select (Radix)
│   │       │   │   │   └── ui/Button
│   │       │   │   └── CategoryList
│   │       │   │       ├── ProductCard
│   │       │   │       │   └── ui/Card (shadcn)
│   │       │   │       └── ProductScrollRow
│   │       │   ├── LoadingIndicator
│   │       │   └── StarterPrompts
│   │       └── InputBar
│   │           ├── ui/Textarea
│   │           └── ui/Button
│   ├── LoginPage
│   │   ├── ui/Input
│   │   ├── ui/Button
│   │   └── ui/Card
│   ├── SignUpPage
│   ├── ProfilePage
│   ├── SettingsPage
│   └── NotFound
└── Providers:
    ├── QueryClientProvider
    ├── ThemeProvider
    ├── TooltipProvider
    ├── Toaster
    └── BrowserRouter
```

## Core Components

### Chat Domain (src/components/chat/)

#### MessageList

**File**: `src/components/chat/MessageList.tsx`

**Purpose**: Renders chronological message stream with auto-scroll and loading states.

**Props**:
```typescript
{
  messages: ChatMessage[];              // Full timeline
  isLoading: boolean;                   // Show spinner
  loadingPhase?: string;               // "understanding" | "generating" | "fetching"
  onSubmitAnswers?: (answers: string[]) => Promise<void>;
  chatModeEnabled: boolean;            // Show new search prompt
  isDemoMode: boolean;                 // Show login CTA
  isDarkMode: boolean;                 // Colors
}
```

**Key behaviors**:
- Ref-based scroll container (`scrollContainerRef`)
- Auto-scroll triggered on `messages` or `isLoading` change
- Detects scroll position: if user scrolls up, auto-scroll pauses
- User scrolls down 100px from bottom → re-enable auto-scroll
- Identifies last AI message with `questions` → enables answer submission only on that
- Shows `LoadingIndicator` when `isLoading=true`
- Shows "Ask a follow-up question" CTAssistant when `chatModeEnabled=true`
- Shows "Search for another product" when demo mode and loading

**Internal state**:
```typescript
const [autoScroll, setAutoScroll] = useState(true);
```

#### UserMessage

**File**: `src/components/chat/UserMessage.tsx`

**Purpose**: Styled user bubble with message text.

**Props**:
```typescript
{
  content: string;
  timestamp?: number;
  isDarkMode: boolean;
}
```

**Styling**:
- Right-aligned bubble
- Light blue background (light mode) or dark blue (dark mode)
- Max-width constraint with word wrapping
- Timestamp display (optional)
- Framer Motion fade-in animation

#### AIMessage

**File**: `src/components/chat/AIMessage.tsx`

**Purpose**: Complex assistant message renderer supporting text, questions, recommendations.

**Props**:
```typescript
{
  message: ChatMessage;                      // Full message object
  onSubmitAnswers?: (answers: string[]) => Promise<void>;
  isDarkMode: boolean;
}
```

**Responsibilities**:

1. **Text rendering**: parses markdown, converts bare URLs to `<a>` tags
2. **Question detection**: if `message.questions` present, render `QuestionRound`
3. **Product detection**: if `message.products` present, render `CategoryList`
4. **Error display**: if `message.errorMessage`, show error banner

**Conditional Logic**:
```typescript
if (message.clarificationRound) {
  return <QuestionRound questions={message.questions} onSubmit={onSubmitAnswers} />
}
if (message.products) {
  return <CategoryList products={message.products} />
}
return <TextContent content={message.content} />
```

**Animations**:
- Fade-in + slide-up via Framer Motion
- Question pills animate in sequence
- Product cards lazy-load as visible

#### QuestionRound

**File**: `src/components/chat/QuestionRound.tsx`

**Purpose**: Interactive form for capturing user answers to clarification questions.

**Props**:
```typescript
{
  questions: string[];                  // Question texts
  options?: string[][];                 // Multiple choice options (optional)
  onSubmit: (answers: string[]) => Promise<void>;
  isLoading?: boolean;                 // Show submit in loading state
}
```

**Behavior**:

1. Renders one question per card
2. For each question:
   - If `options[i]` provided: show selectable pills
   - Otherwise: show textarea for custom input
3. All questions must be answered before "Submit" enabled
4. Tracks selected answers in local state
5. On submit: calls `onSubmit(answers)` with `answers[i]` for question `i`
6. Shows loading spinner while submitting
7. Disables interaction while `isLoading=true`

**Internal state**:
```typescript
const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>(
  Array(questions.length).fill(null)
);
```

**Answer format**:
```typescript
// If option selected: answer = selected option string
// If custom text: answer = textarea value
const answers = ["premium", "noise-cancelling", "On-ear"];
```

#### InputBar

**File**: `src/components/chat/InputBar.tsx`

**Purpose**: Text input for composing and sending messages.

**Props**:
```typescript
{
  onSendMessage: (message: string) => Promise<void>;
  isLoading?: boolean;              // Disable input during fetch
  isDarkMode: boolean;
  maxLength?: number;              // Default: 500
}
```

**Keyboard handling**:
- `Enter` → send message
- `Shift+Enter` → newline
- `Ctrl/Cmd+Enter` → send message (alternative)

**Features**:
- Dynamic textarea height (grows up to 128px)
- Character counter (shows `current/max`)
- Debounce rapid submits (300ms gap required)
- Send button enabled only if:
  - `message.trim().length > 0`
  - `!isLoading`
  - Debounce timer expired
- Disable all interaction when `isLoading=true`

**Focus management**:
- Auto-focus on component mount
- Preserve focus after send (for quick follow-ups)

#### LoadingIndicator

**File**: `src/components/chat/LoadingIndicator.tsx`

**Purpose**: Animated loading state with phase-specific messaging.

**Props**:
```typescript
{
  phase?: "understanding" | "generating" | "fetching";
  isDarkMode: boolean;
}
```

**Display logic**:
- "understanding" → "Analyzing your request..."
- "generating" → "Generating questions..."
- "fetching" → "Fetching recommendations..."
- (default) → "Please wait..."

**Animations**:
- Ellipsis dot animation
- Pulsing spinner icon
- Framer Motion fade-in

#### StarterPrompts

**File**: `src/components/chat/StarterPrompts.tsx`

**Purpose**: Quick-start suggestions shown in empty chat state.

**Props**:
```typescript
{
  onSelectPrompt: (prompt: string) => void;
  isDarkMode: boolean;
}
```

**Behavior**:
- Displays hardcoded list of 4-6 suggested queries
- Click prompt → calls `onSelectPrompt(prompt)`
- Examples:
  - "Show me budget wireless headphones"
  - "Best gaming laptop under $1000"
  - "Coffee makers with WiFi connectivity"

### Layout Components (src/components/layout/)

#### ChatHeader

**File**: `src/components/layout/ChatHeader.tsx`

**Purpose**: Top bar with session title and controls.

**Props**:
```typescript
{
  sessionTitle?: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  isDarkMode: boolean;
}
```

**Layout**:
```
[Hamburger] [Session Title] [New Chat Btn]
```

**Features**:
- Responsive hamburger toggle (mobile)
- Session title truncation on small screens
- "New Chat" button with icon
- Right-aligned controls

#### Sidebar

**File**: `src/components/layout/Sidebar.tsx`

**Purpose**: Navigation and session management panel.

**Props**:
```typescript
{
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string | null) => void;
  onDeleteSession: (id: string) => void;
  onNewSession: () => void;
  onLogout?: () => void;
  isDarkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
}
```

**Sections** (top to bottom):
1. **Header**: "RecommendMe" logo + close button (mobile)
2. **Session Search**: filter input, debounced client-side filtering
3. **Session List**: scrollable list of `SessionCard`s
4. **Profile Card**: shows username + avatar from `authStorage`
5. **Footer**: theme toggle + settings link

**Behaviors**:
- Click session card → activate it
- Right-click/long-press → delete option
- Search filters sessions by title substring (case-insensitive)
- Desktop: always visible, resizable (200-500px)
- Mobile: overlay, click outside closes
- New Chat button at top

#### SessionCard

**File**: `src/components/layout/SessionCard.tsx` (or inline)

**Purpose**: Single session list item.

**Props**:
```typescript
{
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}
```

**Display**:
- Session title (truncate if long)
- Updated timestamp (e.g., "2 hours ago")
- Active indicator (highlight color)
- Hover: show delete icon

### Product Components (src/components/products/)

#### CategoryList (RecommendationResults)

**File**: `src/components/products/CategoryList.tsx`

**Purpose**: Main container for recommendation display.

**Props**:
```typescript
{
  productTypes?: ProductType[];  // New format
  categories?: Category[];       // Legacy format (backward compat)
  isDarkMode: boolean;
}
```

**Behavior**:
1. Detects which format provided (prioritize `productTypes`)
2. Renders sections for each product type/category
3. Each section: title + horizontal scroll of product cards
4. Collapse/expand toggle per section
5. Sticky section headers during scroll

**Error handling**:
- If products empty: show "No products found for your criteria"
- If API failed: show "Could not fetch products. Showing cached results."

**Structure**:
```
ProductType 1
├─ Description
└─ [Card] [Card] [Card] ← horizontal scroll
ProductType 2
├─ Description
└─ [Card] [Card] [Card]
...
```

#### ProductCard

**File**: `src/components/products/ProductCard.tsx`

**Purpose**: Individual product tile.

**Props**:
```typescript
{
  product: Product;
  isDarkMode: boolean;
  index?: number;  // For lazy load timing
}
```

**Displays**:
- Product image (lazily loaded, `loading="lazy"`)
- Brand + title
- Price in INR (or converted)
- Star rating + review count
- Brief description
- "View on Google Shopping" link (external, `target="_blank"`)

**Styling**:
- Card with shadow
- Image aspect ratio: 1:1
- Text truncated at 2-3 lines
- Hover: shadow intensifies, underline appears
- Click: opens product link in new tab

**Link Safety**:
```typescript
<a 
  href={product.url}
  target="_blank"
  rel="noopener noreferrer"
  onClick={(e) => e.stopPropagation()}
>
  View on Google Shopping
</a>
```

#### ProductScrollRow

**File**: `src/components/products/ProductScrollRow.tsx`

**Purpose**: Horizontal scrolling container for product cards with arrow navigation.

**Props**:
```typescript
{
  products: Product[];
  isDarkMode: boolean;
}
```

**Features**:
- Ref-based horizontal scroll container
- Left/right arrow buttons
- Arrow visible when scrollable content exists
- Click arrow → scroll by ~3 card widths
- Smooth scroll behavior
- Hide arrows on mobile (swipe instead)

**Implementation**:
```typescript
const scrollContainerRef = useRef<HTMLDivElement>(null);

const scroll = (direction: 'left' | 'right') => {
  const container = scrollContainerRef.current;
  container!.scrollBy({
    left: direction === 'left' ? -400 : 400,
    behavior: 'smooth'
  });
};
```

#### ExpertTip

**File**: `src/components/products/ExpertTip.tsx`

**Purpose**: Contextual advice block accompanying recommendations.

**Props**:
```typescript
{
  tip: string;
  isDarkMode: boolean;
}
```

**Display**:
- Light bulb icon + colored background
- Tip text, italic or emphasized
- Appears after recommendations
- Optional; not required

### Page Components (src/pages/)

#### ChatPage

**File**: `src/pages/ChatPage.tsx`

**Purpose**: Main recommendation workflow container and orchestrator.

**Key logic**:
1. On mount:
   - Load `useChat` state
   - If `hasPendingRecommendation`: auto-call `resumePendingRecommendation()`
   - If URL has initial query: send it
2. Track session list → on change, set `beforeunload` guard
3. State binding:
   - `useChat` → `ChatHeader`, `MessageList`, `InputBar`
   - `useAuth` → check if authenticated, show login prompt
4. Sidebar:
   - Desktop: sidebar always visible, resizable
   - Mobile: drawer overlay, togglable

**Sidebar resizing** (desktop):
```typescript
// Allow user to drag sidebar edge to resize (200px min, 500px max)
const [sidebarWidth, setSidebarWidth] = useState(300);
// onMouseDown divider → onMouseMove updates width
```

#### LoginPage

**File**: `src/pages/LoginPage.tsx`

**Purpose**: User authentication entry point.

**Form fields**:
- Email or username (identifier)
- Password
- "Show password" toggle
- Remember me (optional)

**Validation**:
- Client-side: identifier required, password length > 0
- Server validation: attempt login, catch 401/400

**Behavior on success**:
1. Receive token from `POST /api/v1/auth/token`
2. Store in `localStorage` via `authStorage.setAuthSession()`
3. Navigate to `/chat`
4. If pending recommendation exists → auto-resume

**Error handling**:
- 401: "Invalid credentials"
- 400: suggest signup
- Network: "Connection failed, try again"

#### SignUpPage

**File**: `src/pages/SignUpPage.tsx`

**Purpose**: New account creation.

**Form fields**:
- Email
- Username  
- Password (with strength indicator)
- Confirm password
- Terms of service checkbox
- Terms modal (expandable)

**Validation**:
- Email format check (basic regex)
- Username length (3-20 chars)
- Password strength (uppercase + number + 8+ chars)
- Passwords match
- Terms accepted

**Behavior on success**:
1. `POST /api/v1/auth/signup`
2. Auto-login or redirect to login
3. Navigate to `/chat`

#### ProfilePage

**File**: `src/pages/ProfilePage.tsx`

**Purpose**: User profile management.

**Sections**:
1. **Avatar upload**: file input, preview, `POST /api/v1/profile/avatar`
2. **Profile fields**: edit username, bio, preferences
3. **Password reset**: request token, set new password

**Data source**:
- Load from `GET /api/v1/profile`
- Form state tracks edits
- Save via `PUT /api/v1/profile`

#### SettingsPage

**File**: `src/pages/SettingsPage.tsx`

**Purpose**: Application preferences.

**Settings**:
- Dark mode toggle (syncs with `useTheme`)
- Notifications preference
- Data export option
- Account deletion warning + button
- Keyboard shortcuts help

#### Index (Landing)

**File**: `src/pages/Index.tsx`

**Purpose**: Marketing and onboarding.

**Content**:
- Hero section with value proposition
- Feature showcase cards
- FAQ accordion
- Contact form (client-side validation)
- CTA to login/signup

**Form validation**:
- Email required, format check
- Message required, length check
- Submit → no backend call (contact form for demo)

## Animation & Motion

### Framer Motion Usage

**AIMessage animations**:
```typescript
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {children}
</motion.div>
```

**Question reveal**:
```typescript
<motion.div
  initial={{ scale: 0.95, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ delay: 0.1 * index }}
>
  {question}
</motion.div>
```

**Sidebar overlay** (mobile):
```typescript
<motion.div
  initial={{ x: -300 }}
  animate={{ x: 0 }}
  exit={{ x: -300 }}
  transition={{ duration: 0.2 }}
>
  <Sidebar />
</motion.div>
```

**All animations are decorative**: no interaction gates on completion.

## Testing Approach

### Component Unit Tests

Example: `MessageList.test.tsx`

```typescript
test("renders messages in order", () => {
  const messages = [
    { id: "1", type: "user", content: "Hello" },
    { id: "2", type: "ai", content: "Hi!" }
  ];
  render(<MessageList messages={messages} isLoading={false} chatModeEnabled={false} />);
  expect(screen.getByText("Hello")).toBeInTheDocument();
  expect(screen.getByText("Hi!")).toBeInTheDocument();
});

test("auto-scrolls to bottom on new message", async () => {
  const { rerender } = render(<MessageList messages={[message1]} />);
  const scrollContainer = screen.getByRole("region");
  expect(scrollContainer.scrollTop).toBeLessThan(scrollContainer.scrollHeight);
  
  rerender(<MessageList messages={[message1, message2]} />);
  expect(scrollContainer.scrollTop).toBe(scrollContainer.scrollHeight);
});
```

Example: `InputBar.test.tsx`

```typescript
test("sends message on Enter", async () => {
  const onSend = jest.fn();
  render(<InputBar onSendMessage={onSend} />);
  
  const input = screen.getByRole("textbox");
  await userEvent.type(input, "hello");
  await userEvent.keyboard("{Enter}");
  
  expect(onSend).toHaveBeenCalledWith("hello");
});

test("adds newline on Shift+Enter", async () => {
  const { container } = render(<InputBar onSendMessage={jest.fn()} />);
  const input = container.querySelector("textarea");
  
  await userEvent.type(input, "line1");
  await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
  
  expect(input.value).toContain("line1\nline2");
});
```

### Integration Tests (E2E Candidates)

```
1. Send query → see clarification questions
2. Answer questions → see submit button
3. Submit answers → see loading, then recommendations
4. Refresh page → verify chat restored
5. Delete session → verify removed
```
