# RecommendMe

RecommendMe is a full-stack conversational product recommendation project. The app helps users describe what they need in natural language, asks clarifying questions when the request is vague, and returns ranked product suggestions with useful explanations.

This repository is organized as a monorepo with separate backend and frontend projects.

## Repository Structure

```text
RecommendMe/
+-- RecommendMe-API/   # FastAPI backend for AI orchestration and product recommendations
`-- RecommendMe-App/   # React + Vite frontend for the user experience
```

## Projects

### RecommendMe-API

The backend is a Python FastAPI service that handles:

- Query validation and session handling
- Vagueness detection and follow-up question generation
- Product intent extraction
- Product fetching through shopping search APIs
- Ranking and response formatting

Read more in [RecommendMe-API/README.md](RecommendMe-API/README.md).

### RecommendMe-App

The frontend is a React + TypeScript application built with Vite. It includes:

- Landing page
- Conversational recommendation chat
- Authentication pages
- Profile and settings pages
- Reusable UI components

Read more in [RecommendMe-App/README.md](RecommendMe-App/README.md).

## Getting Started

Clone the repository:

```bash
git clone https://github.com/darshanbngowdar-cell/RecommendMe.git
cd RecommendMe
```

## Backend Setup

```bash
cd RecommendMe-API
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API exposes the main recommendation flow through:

```text
POST /v1/query
```

Check the backend README for environment variables and AI/search provider configuration.

## Frontend Setup

```bash
cd RecommendMe-App
npm install
npm run setup
npm run dev
```

The Vite development server is configured to run on port `8080`.

## Common Commands

Backend:

```bash
cd RecommendMe-API
pytest
```

Frontend:

```bash
cd RecommendMe-App
npm run build
npm run test
npm run lint
```

## Environment Files

Do not commit local `.env` files. Use the provided example file as a template:

```text
RecommendMe-App/.env.example
```

Add backend environment values according to the backend README and your local provider setup.

## Tech Stack

- Python
- FastAPI
- React
- TypeScript
- Vite
- Tailwind CSS
- Radix UI primitives

## Status

The monorepo contains the current backend and frontend codebases for RecommendMe. Each project can be developed independently from its own folder.
