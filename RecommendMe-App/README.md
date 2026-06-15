# RecommendMe Frontend

React + Vite frontend for RecommendMe.

Last verified against implementation: 2026-04-13

## Project Overview

This frontend provides:

- Landing experience (`/`)
- Conversational recommendation flow (`/chat`)
- Authentication screens (`/login`, `/signup`)
- Profile management (`/profile`)
- Application settings (`/settings`)

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router DOM
- Tailwind CSS
- Framer Motion
- Radix UI primitives (shadcn-style component layer)

## Main Frontend Routes

- `/` -> `Index`
- `/chat` -> `ChatPage`
- `/login` -> `LoginPage`
- `/signup` -> `SignUpPage`
- `/profile` -> `ProfilePage`
- `/settings` -> `SettingsPage`
- `*` -> `NotFound`

All routes are lazy-loaded in `src/App.tsx`.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment (choose one):

```bash
npm run setup
```

or

```bash
copy .env.example .env
```

3. Run development server:

```bash
npm run dev
```

Vite dev server port is configured as `8080` in `vite.config.ts`.

## Build, Test, Lint

```bash
npm run build
npm run test
npm run lint
```

Verification status in this workspace on 2026-04-12:

- `npm run build`: passed
- `npm run test`: passed (1 test)
- `npm run lint`: executed without reported errors

## Environment Variables

Configured in `.env` and consumed by `src/config/environments.ts` and `src/services/api.ts`:

- `VITE_ENVIRONMENT`
- `VITE_LOCAL_API_URL`
- `VITE_PRODUCTION_API_URL`
- `VITE_API_TIMEOUT`
- `VITE_DEBUG_API`

## API Integration (Client Side)

Frontend API functions are implemented in `src/services/api.ts`.

Primary paths used by the frontend:

- `POST /v1/query`
- `GET /v1/sessions/{sessionId}`
- `POST /v1/chat/mode`
- `POST /v1/auth/login`
- `POST /v1/auth/signup`
- `POST /v1/auth/forgot-password`
- `POST /v1/auth/reset-password`
- `GET /v1/profile`
- `POST /v1/profile`
- `PUT /v1/profile/update`
- `GET /v1/profile/avatars`
- `POST /v1/profile/avatar/upload`
- `GET /v1/health`

## Documentation Map

- `docs/DocsIndex.md`
- `docs/frontend/frontend_overview.md`
- `docs/frontend/architecture.md`
- `docs/frontend/component_guide.md`
- `docs/frontend/state_management.md`
- `docs/frontend/chat_flow.md`
- `docs/frontend/api_integration.md`
