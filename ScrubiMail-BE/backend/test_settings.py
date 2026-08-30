"""Test-only settings: run the suite against a fast, local, isolated SQLite DB
instead of the shared Railway Postgres (which is slow and flaky over the public
proxy, and must never be used as a test database).

Usage:
    python manage.py test <labels> --settings=backend.test_settings
"""

from backend.settings import *  # noqa: F401,F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Keep the broker/cache from reaching out during tests.
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
