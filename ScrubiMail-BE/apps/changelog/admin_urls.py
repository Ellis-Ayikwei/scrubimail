from django.urls import path
from .views import (
    AdminChangelogListCreateView,
    AdminChangelogDetailView,
    AdminPublishChangelogView,
)

urlpatterns = [
    path('', AdminChangelogListCreateView.as_view(), name='admin-changelog-list'),
    path('<int:pk>/', AdminChangelogDetailView.as_view(), name='admin-changelog-detail'),
    path('<int:pk>/publish/', AdminPublishChangelogView.as_view(), name='admin-changelog-publish'),
]
