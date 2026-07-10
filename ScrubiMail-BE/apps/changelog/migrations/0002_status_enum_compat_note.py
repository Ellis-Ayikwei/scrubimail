"""Data migration: publish a compatibility note for the validation status-enum
normalization (Issue 5). The verification `status` field is now exactly five
snake_case values — `catch-all` became `catch_all` and the standalone
`spamtrap` status was folded into `do_not_mail`."""

from django.db import migrations
from django.utils import timezone

VERSION = "v2.5.0"
TITLE = "Validation status enum normalized to five values"
BODY = """\
**Breaking (API):** the email-validation `status` field now uses exactly five
values, all snake_case:

`valid`, `invalid`, `catch_all`, `unknown`, `do_not_mail`

Changes from the previous vocabulary:

- `catch-all` (hyphen) → `catch_all` (underscore), so the whole enum shares one
  convention.
- The standalone `spamtrap` status has been **removed**. Spam traps are now
  reported as `do_not_mail` with `sub_status = "spamtrap_detected"`, matching the
  ZeroBounce convention.

The human-readable `verdict` strings are unchanged: `Valid`, `Invalid`,
`Catch-All`, `Unknown`, `Do Not Mail`. If you branch on the machine-readable
`status`, update any comparisons against `"catch-all"` or `"spamtrap"`.
"""


def add_note(apps, schema_editor):
    ChangelogEntry = apps.get_model("changelog", "ChangelogEntry")
    ChangelogEntry.objects.update_or_create(
        version=VERSION,
        title=TITLE,
        defaults={
            "summary": (
                "The validation `status` field is now five snake_case values; "
                "`catch-all` → `catch_all` and `spamtrap` folds into `do_not_mail`."
            ),
            "body": BODY,
            "entry_type": "breaking",
            "status": "published",
            "published_at": timezone.now(),
        },
    )


def remove_note(apps, schema_editor):
    ChangelogEntry = apps.get_model("changelog", "ChangelogEntry")
    ChangelogEntry.objects.filter(version=VERSION, title=TITLE).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("changelog", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(add_note, remove_note),
    ]
