# Backend image — used here to run the SMTP-egress Celery worker on a host
# with outbound port 25 open (e.g. a Hetzner box). Same image can serve web too.
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

# Default: SMTP-egress validation worker. Overridable in compose.
CMD ["celery", "-A", "backend", "worker", "-l", "INFO", \
     "--concurrency=8", "--queues=smtp_validation", "--hostname=smtp-egress@%h"]
