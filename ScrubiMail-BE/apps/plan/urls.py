from django.urls import path
from .views import (
    PlanListView,
    PlanDetailView,
    PlanComparisonView,
    RecommendPlanView,
)

urlpatterns = [
    path('', PlanListView.as_view(), name='plan-list'),
    path('<int:pk>/', PlanDetailView.as_view(), name='plan-detail'),
    path('compare/', PlanComparisonView.as_view(), name='plan-comparison'),
    path('recommend/', RecommendPlanView.as_view(), name='plan-recommend'),
]
