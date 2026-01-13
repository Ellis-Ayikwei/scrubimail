# Scrubimail Backend (ScrubiMail-BE)

Django + Django REST Framework backend for Scrubimail.

API base path (local): `http://localhost:8000/scrubimail/api/v1/`

## Prerequisites

- Python 3
- PostgreSQL
- Redis (optional unless you run Celery/bulk jobs)

## Setup

```bash
cp .env.example .env
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Database

This project supports configuring the database via `DATABASE_URL` in `.env`.

Example:

```dotenv
DATABASE_URL=postgresql://user:password@localhost:5432/scrubimail
```

## Run

```bash
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

## Authentication

The dashboards primarily use JWT auth.
External API consumers can use an API key.

Supported API key headers:

- `X-API-Key: <your-api-key>`
- `Authorization: ApiKey <your-api-key>`

## Key endpoints

- `POST /scrubimail/api/v1/validate/` (single email)
- `POST /scrubimail/api/v1/validate-bulk/` (bulk job)
- `GET /scrubimail/api/v1/bulk-status/<job_id>/`

See the more detailed validation docs in [apps/validation/README.md](apps/validation/README.md).