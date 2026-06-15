# Frontend Overview

Last verified against implementation: 2026-04-13

## Scope

This document covers the actual frontend implementation in `RecommendMe-APP/src`.

The frontend is a React + TypeScript + Vite single-page application that provides:

- Marketing and onboarding entry (`/`)
- Conversational recommendation workflow (`/chat`)
- Authentication (`/login`, `/signup`)
- Profile management (`/profile`)
- User-level settings (`/settings`)

## Technology Stack

- Runtime: React 18, TypeScript, Vite 5
- Routing: `react-router-dom` (lazy-loaded route modules)
- Async/data infra: `@tanstack/react-query` (provider installed globally)
- UI and motion: Tailwind CSS, Radix/shadcn component layer, `framer-motion`, `lucide-react`
- State persistence:
  - `sessionStorage` for chat session state and pending recommendation resume markers
  - `localStorage` for auth session and theme preference

## Runtime Entry Points

- App bootstrap: `src/main.tsx`
- App shell and route tree: `src/App.tsx`

Route mapping is implementation-defined as:

- `/` -> `pages/Index.tsx`
- `/chat` -> `pages/ChatPage.tsx`
- `/login` -> `pages/LoginPage.tsx`
- `/signup` -> `pages/SignUpPage.tsx`
- `/profile` -> `pages/ProfilePage.tsx`
- `/settings` -> `pages/SettingsPage.tsx`
- `*` -> `pages/NotFound.tsx`

## Core Product Behavior

### 1. Chat-first recommendation UX

`useChat` (`src/hooks/useChat.ts`) is the primary state and control-flow engine.

It manages:

- Multi-session chat list and active session
- Initial query and clarification rounds
- Recommendation completion state
- Post-recommendation chat mode (auto-enabled)
- Loading phases (`understanding` -> `generating` -> `fetching`)
- Request de-duplication and stale response protection

### 2. API contract normalization and compatibility

`src/services/api.ts` accepts backend responses in both:

- New format (`status`, `product_types`, structured `questions`)
- Legacy format (`type`, `categories`)

Frontend components consume normalized frontend-safe types, reducing coupling to backend schema evolution.

### 3. Personalization context

When profile data exists in local auth storage, `useChat` injects a synthetic assistant-context message into `conversation_history` before calling `/query`, enabling profile-aware recommendations without changing visible user messages.

### 4. Resumable recommendation context

A pending recommendation session marker is persisted so authenticated users can resume server-backed session state after auth transitions.

## Environment and API Endpoint Resolution

`src/config/environments.ts` resolves runtime environment with this priority:

1. `VITE_ENVIRONMENT` override (guarded to avoid localhost API on public host)
2. Vite mode (`production` -> production config)
3. Hostname fallback (`localhost`/`127.0.0.1`/`[::1]` -> development)

`src/services/api.ts` derives:

- API base URL from environment resolver
- Timeout from `VITE_API_TIMEOUT` or environment default
- Debug logging toggle from `VITE_DEBUG_API`

## UI System Summary

- Design tokens and palettes are defined in `src/index.css`
- Tailwind extensions (fonts, semantic colors, keyframes, animations) are in `tailwind.config.ts`
- Theme class switching (`light`/`dark`) is controlled by `ThemeProvider` in `src/hooks/useTheme.tsx`

## Performance and Delivery Notes

- Route-level code splitting via `React.lazy` + `Suspense`
- Build chunk strategy configured in `vite.config.ts` with manual vendor chunk groups (`vendor-react`, `vendor-motion`, `vendor-query`, `vendor-radix`, `vendor-ui`)
- Product cards use lazy image loading (`loading="lazy"`)
- Chat list auto-scrolls only on message/loading change boundaries

## Determinability

The following are not implemented in frontend runtime behavior and should not be assumed:

- No frontend checkout/cart transaction flow
- No explicit frontend telemetry pipeline in source
- No persistent cloud sync of chat sessions from frontend alone (client persists local state; backend session fetch is per-session API)
