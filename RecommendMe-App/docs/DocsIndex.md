# Docs Index

Last verified: 2026-04-13

## Canonical Frontend Docs

The canonical frontend documentation set is under `docs/frontend/`:

1. `frontend/frontend_overview.md`
2. `frontend/architecture.md`
3. `frontend/component_guide.md`
4. `frontend/state_management.md`
5. `frontend/chat_flow.md`
6. `frontend/api_integration.md`

## Scope and Evidence

This set is aligned to implementation in:

- `src/` runtime files
- Root config files (`package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig*.json`)
- Environment/config integration (`src/config/environments.ts`)
- Service integration boundary (`src/services/api.ts`)

## Legacy Docs

Top-level docs in this folder (for example `FrontendArchitecture.md`, `StateManagement.md`, and related files) are retained for historical reference. Use `docs/frontend/*` as the current production-grade source of truth.

## Determinability Policy

When a behavior cannot be proven from the frontend source, docs explicitly mark it as not determinable from the current codebase.
