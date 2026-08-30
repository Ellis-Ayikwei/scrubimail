"""Every endpoint under the admin API must require staff, not merely a login.

Eleven of these were IsAuthenticated, so any signed-in customer could list every
user and update or delete any of them — reachable from the admin SPA by simply
signing in with a social provider.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import URLPattern, URLResolver
from rest_framework import permissions

from apps.admin import urls as admin_urls

User = get_user_model()


def _iter_callbacks(patterns):
    for entry in patterns:
        if isinstance(entry, URLResolver):
            yield from _iter_callbacks(entry.url_patterns)
        elif isinstance(entry, URLPattern):
            yield entry


class AdminEndpointPermissionTests(TestCase):
    def test_no_admin_endpoint_settles_for_is_authenticated(self):
        offenders = []

        for pattern in _iter_callbacks(admin_urls.urlpatterns):
            callback = pattern.callback
            # Class-based views expose the class; @api_view functions carry the
            # decorator's permission_classes on the wrapper.
            view_cls = getattr(callback, "cls", None)
            perms = getattr(view_cls, "permission_classes", None)
            if perms is None:
                perms = getattr(callback, "permission_classes", None)
            if perms is None:
                continue

            if permissions.IsAuthenticated in perms and not any(
                p is permissions.IsAdminUser for p in perms
            ):
                offenders.append(str(pattern.pattern))

        self.assertEqual(
            offenders,
            [],
            "admin endpoints reachable by any logged-in user: " + ", ".join(offenders),
        )
