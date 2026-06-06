from django.urls import path
from .views import PublicChangelogListView

urlpatterns = [
    path('', PublicChangelogListView.as_view(), name='changelog-public-list'),
]
