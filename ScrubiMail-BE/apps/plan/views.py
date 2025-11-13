from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count, Avg
from .models import Plan
from .serializers import PlanSerializer
from apps.billing.models import BillingProfile


class PlanListView(generics.ListAPIView):
    """
    List all active plans with detailed features
    Public endpoint - no authentication required
    """
    serializer_class = PlanSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return Plan.objects.filter(is_active=True).order_by('price')


class PlanDetailView(generics.RetrieveAPIView):
    """
    Get detailed information about a specific plan
    Public endpoint - no authentication required
    """
    serializer_class = PlanSerializer
    permission_classes = [AllowAny]
    queryset = Plan.objects.filter(is_active=True)


class PlanComparisonView(APIView):
    """
    Compare multiple plans side-by-side
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        plan_ids = request.query_params.getlist('plans[]') or request.query_params.getlist('plans')
        
        if not plan_ids:
            # Return all active plans for comparison
            plans = Plan.objects.filter(is_active=True).order_by('price')
        else:
            plans = Plan.objects.filter(id__in=plan_ids, is_active=True)
        
        serializer = PlanSerializer(plans, many=True)
        
        # Build comparison matrix
        comparison = {
            'plans': serializer.data,
            'feature_comparison': self._build_feature_matrix(plans),
            'price_comparison': self._build_price_comparison(plans),
        }
        
        return Response(comparison)
    
    def _build_feature_matrix(self, plans):
        """Build a matrix comparing features across plans"""
        all_features = set()
        for plan in plans:
            if plan.features:
                all_features.update(plan.features.keys())
        
        matrix = {}
        for feature in all_features:
            matrix[feature] = {}
            for plan in plans:
                matrix[feature][plan.name] = plan.features.get(feature, False) if plan.features else False
        
        return matrix
    
    def _build_price_comparison(self, plans):
        """Build price comparison showing value per credit"""
        comparison = []
        for plan in plans:
            comparison.append({
                'plan_name': plan.name,
                'monthly_price': float(plan.price),
                'credits_per_month': plan.credits_per_month,
                'cost_per_credit': float(plan.price / plan.credits_per_month) if plan.credits_per_month > 0 else 0,
                'additional_credit_price': float(plan.additional_credit_price),
                'supports_api': plan.supports_api,
                'supports_bulk': plan.supports_bulk,
                'trial_days': plan.trial_days,
            })
        return comparison


class RecommendPlanView(APIView):
    """
    AI-based plan recommendation based on user's usage patterns
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get user's billing profile and usage history
        try:
            profile = BillingProfile.objects.get(user=user)
            
            # Calculate average monthly usage
            avg_monthly_usage = profile.credits_used_this_month
            
            # Get usage trend (last 3 months if available)
            usage_trend = self._calculate_usage_trend(profile)
            
            # Get current plan
            current_plan = profile.current_plan
            
            # Recommend plan based on usage
            recommended_plan = self._recommend_plan(
                avg_monthly_usage, 
                usage_trend, 
                current_plan
            )
            
            return Response({
                'current_plan': PlanSerializer(current_plan).data if current_plan else None,
                'recommended_plan': PlanSerializer(recommended_plan).data if recommended_plan else None,
                'usage_stats': {
                    'avg_monthly_usage': avg_monthly_usage,
                    'usage_trend': usage_trend,
                    'credits_remaining': profile.credits_remaining,
                },
                'recommendation_reason': self._get_recommendation_reason(
                    avg_monthly_usage, 
                    current_plan, 
                    recommended_plan
                ),
                'potential_savings': self._calculate_potential_savings(
                    current_plan, 
                    recommended_plan, 
                    avg_monthly_usage
                ),
            })
            
        except BillingProfile.DoesNotExist:
            # New user - recommend Free plan
            free_plan = Plan.objects.filter(name='Free', is_active=True).first()
            return Response({
                'current_plan': None,
                'recommended_plan': PlanSerializer(free_plan).data if free_plan else None,
                'recommendation_reason': 'Start with our Free plan to explore our features',
                'usage_stats': None,
            })
    
    def _calculate_usage_trend(self, profile):
        """Calculate if usage is increasing, decreasing, or stable"""
        # Simple implementation - can be enhanced with time-series analysis
        current_usage = profile.credits_used_this_month
        
        if current_usage == 0:
            return 'new'
        elif current_usage > profile.credits_remaining:
            return 'increasing'
        elif current_usage < profile.credits_remaining * 0.5:
            return 'decreasing'
        else:
            return 'stable'
    
    def _recommend_plan(self, avg_usage, trend, current_plan):
        """Recommend plan based on usage and trend"""
        # Add buffer for growing usage
        if trend == 'increasing':
            target_credits = int(avg_usage * 1.5)
        elif trend == 'decreasing':
            target_credits = int(avg_usage * 1.2)
        else:
            target_credits = int(avg_usage * 1.3)
        
        # Find plans that can accommodate target usage
        suitable_plans = Plan.objects.filter(
            is_active=True,
            credits_per_month__gte=target_credits
        ).order_by('price')
        
        if suitable_plans.exists():
            return suitable_plans.first()
        
        # If no plan has enough credits, return highest tier
        return Plan.objects.filter(is_active=True).order_by('-price').first()
    
    def _get_recommendation_reason(self, usage, current_plan, recommended_plan):
        """Generate human-readable recommendation reason"""
        if not current_plan:
            return "Based on your needs, we recommend starting with this plan"
        
        if not recommended_plan:
            return "Continue with your current plan"
        
        if recommended_plan.id == current_plan.id:
            return f"Your current {current_plan.name} plan is perfect for your usage"
        
        if recommended_plan.price > current_plan.price:
            return f"Consider upgrading to {recommended_plan.name} - you're using {usage} credits monthly and might run out"
        else:
            return f"You could save money by switching to {recommended_plan.name} - you're only using {usage} credits monthly"
    
    def _calculate_potential_savings(self, current_plan, recommended_plan, usage):
        """Calculate potential monthly savings"""
        if not current_plan or not recommended_plan:
            return None
        
        current_cost = float(current_plan.price)
        recommended_cost = float(recommended_plan.price)
        
        # Calculate overage costs if applicable
        if usage > current_plan.credits_per_month:
            overage = usage - current_plan.credits_per_month
            current_cost += overage * float(current_plan.additional_credit_price)
        
        if usage > recommended_plan.credits_per_month:
            overage = usage - recommended_plan.credits_per_month
            recommended_cost += overage * float(recommended_plan.additional_credit_price)
        
        savings = current_cost - recommended_cost
        
        return {
            'monthly_savings': round(savings, 2),
            'annual_savings': round(savings * 12, 2),
            'percentage': round((savings / current_cost * 100) if current_cost > 0 else 0, 1),
        }
