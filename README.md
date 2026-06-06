# Scrubimail

Scrubimail is an email validation SaaS (API + dashboards) for validating single emails in real time and processing bulk lists.

This repository is a monorepo containing:

```
ScrubiMail-BE/          Django backend (REST API)
Scrubimail-FE/          User dashboard (React + Vite)
Scrubimail-Admin-FE/    Admin dashboard (React + Vite)
```

## Local development

### 1) Backend (Django)

Prereqs: Python 3, PostgreSQL, Redis (optional unless you run Celery jobs).

```bash
cd ScrubiMail-BE
cp .env.example .env
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# If you use DATABASE_URL in .env, Django will use it automatically on Heroku.
# For local dev, make sure your database exists and credentials are correct.
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

API base URL (local): `http://localhost:8000/scrubimail/api/v1/`

### 2) User frontend

```bash
cd Scrubimail-FE
npm install

# optional
echo "VITE_API_URL=http://localhost:8000/scrubimail/api/v1" > .env.local

npm run dev
```

### 3) Admin frontend

```bash
cd Scrubimail-Admin-FE
npm install

# optional
echo "VITE_API_URL=http://localhost:8000/scrubimail/api/v1" > .env.local

npm run dev
```

## API authentication

The backend supports authenticating requests either by JWT (for the dashboards) or by API key (for external API consumers).

Supported API key headers:

- `X-API-Key: <your-api-key>`
- `Authorization: ApiKey <your-api-key>`

## Validate a single email

Endpoint:

- `POST /scrubimail/api/v1/validate/`

Example (curl):

```bash
curl -X POST http://localhost:8000/scrubimail/api/v1/validate/ \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_scrubimail_api_key" \
  -d '{"email":"test@example.com","real_time":true}'
```

Example (Python):

```python
import requests

url = "http://localhost:8000/scrubimail/api/v1/validate/"
headers = {"X-API-Key": "your_scrubimail_api_key"}
payload = {"email": "test@example.com", "real_time": True}

print(requests.post(url, json=payload, headers=headers).json())
```

## License

MIT — see [LICENSE](LICENSE).
