# This import is REQUIRED (see Celery "First steps with Django"): it makes the
# configured Celery app load in every Django process, so web-side .delay()/
# .apply_async() use the routes/queues from settings. Without it, tasks bind to
# an UNCONFIGURED default app and publish to a queue named "celery" that no
# worker consumes — jobs silently vanish. The __all__ marks the import as
# intentionally re-exported so linters don't flag it as unused.
from .celery import app as celery_app

__all__ = ("celery_app",)

default_app_config = "backend.apps.BackendConfig"
