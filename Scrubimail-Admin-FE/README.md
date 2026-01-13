# Scrubimail Admin Frontend (Scrubimail-Admin-FE)

React + Vite frontend for the Scrubimail admin dashboard.

For the overall monorepo overview and backend/API docs, see the root README: [../README.md](../README.md).

## Prerequisites

- Node.js + npm
- Running backend API (local default): `http://localhost:8000/scrubimail/api/v1/`

## Setup

```bash
npm install
```

### Environment variables

Create a local env file:

```bash
echo "VITE_API_URL=http://localhost:8000/scrubimail/api/v1" > .env.local
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
npm run preview
```