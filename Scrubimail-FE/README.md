# Scrubimail User Frontend (Scrubimail-FE)

React + Vite frontend for the Scrubimail user dashboard.

For the overall monorepo overview and backend/API docs, see the root README: [../README.md](../README.md).

## Prerequisites

- Node.js + npm
- Running backend API (local default): `http://localhost:8000/scrubimail/api/v1/`

## Setup

```bash
npm install
```

### Environment variables

This app reads the API base URL from Vite env vars.

Create a local env file:

```bash
echo "VITE_API_URL=http://localhost:8000/scrubimail/api/v1" > .env.local
echo "VITE_IMG_API_URL=http://localhost:8000/images/" >> .env.local
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

## API key authentication (external consumers)

The dashboard primarily uses JWT auth flows.
If you are calling the validation API directly (outside the dashboard), use:

- `X-API-Key: <your-api-key>` or
- `Authorization: ApiKey <your-api-key>`

Endpoint:

- `POST /scrubimail/api/v1/validate/`

Example (curl):

```bash
curl -X POST http://localhost:8000/scrubimail/api/v1/validate/ \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-api-key>" \
  -d '{"email":"test@example.com","real_time":true}'
```

For additional SDK examples, see the SDK docs under `public/sdks/`.