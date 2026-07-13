# Backend image. Defaults to serving the web app (see CMD at the bottom).
# docker-compose.smtp-egress.yml reuses this same image with an explicit command
# to run the SMTP-egress Celery worker on a host with outbound port 25 open
# (the Hetzner box).
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    DJANGO_SETTINGS_MODULE=backend.settings

WORKDIR /app

# Build deps for psycopg2 / cryptography wheels; libpq for Postgres at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run as non-root.
RUN useradd --create-home --uid 10001 appuser
USER appuser

# Default: serve the web app. This MUST stay a web server, because any platform
# that builds this image without an explicit command (Railway auto-detects a
# Dockerfile and then IGNORES the Procfile) runs this CMD — and if it isn't
# listening on $PORT, the platform serves 502s.
#
# The SMTP-egress worker does NOT rely on this default: it sets its command
# explicitly in docker-compose.smtp-egress.yml (celery ... --queues=smtp_validation).
#
# gthread + threads mirrors the Procfile `web:` line, and for the same reason:
# the realtime endpoint blocks up to VALIDATION_REALTIME_BUDGET_SECONDS on the
# egress worker's verdict, so a sync worker would serialize every other request
# behind it.
CMD ["sh", "-c", "gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers ${WEB_CONCURRENCY:-2} --worker-class gthread --threads ${GUNICORN_THREADS:-8} --timeout 120 --access-logfile - --error-logfile -"]
