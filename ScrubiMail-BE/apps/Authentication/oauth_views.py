from django.shortcuts import redirect
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import login
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from authlib.integrations.django_client import OAuth
from apps.User.models import User
from apps.User.serializer import UserSerializer
import logging

logger = logging.getLogger(__name__)

# Initialize OAuth
oauth = OAuth()
oauth.register(
    name="github",
    client_id=settings.GITHUB_CLIENT_ID,
    client_secret=settings.GITHUB_CLIENT_SECRET,
    access_token_url="https://github.com/login/oauth/access_token",
    access_token_params=None,
    authorize_url="https://github.com/login/oauth/authorize",
    authorize_params=None,
    api_base_url="https://api.github.com/",
    client_kwargs={"scope": "user:email"},
    redirect_uri="https://scrubimail.com/api/auth/oauth/github/callback/",
)

oauth.register(
    name="gitlab",
    client_id=settings.GITLAB_CLIENT_ID,
    client_secret=settings.GITLAB_CLIENT_SECRET,
    access_token_url="https://gitlab.com/oauth/token",
    access_token_params=None,
    authorize_url="https://gitlab.com/oauth/authorize",
    authorize_params=None,
    api_base_url="https://gitlab.com/api/v4/",
    client_kwargs={"scope": "read_user"},
    redirect_uri="https://scrubimail.com/api/auth/oauth/gitlab/callback/",
)

oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid_configuration",
    client_kwargs={"scope": "openid email profile"},
    redirect_uri="https://scrubimail.com/api/auth/oauth/google/callback/",
)


class OAuthLoginView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, provider):
        """Initiate OAuth login for the specified provider"""

        print("=== OAuth Login Debug Info ===")
        print(f"Provider: {provider}")
        print(f"Method: {request.method}")
        print(f"URL: {request.build_absolute_uri()}")
        print(f"Headers: {dict(request.headers)}")
        print(f"GET params: {dict(request.GET)}")
        print(f"POST data: {request.data}")
        print(f"User: {request.user}")
        print(
            f"Session: {dict(request.session) if hasattr(request, 'session') else 'No session'}"
        )

        # Debug OAuth configuration
        print("=== OAuth Configuration Debug ===")
        if provider == "github":
            print(f"GITHUB_CLIENT_ID: {settings.GITHUB_CLIENT_ID}")
            print(
                f"GITHUB_CLIENT_SECRET: {'*' * len(settings.GITHUB_CLIENT_SECRET) if settings.GITHUB_CLIENT_SECRET else 'None'}"
            )
        elif provider == "gitlab":
            print(f"GITLAB_CLIENT_ID: {settings.GITLAB_CLIENT_ID}")
            print(
                f"GITLAB_CLIENT_SECRET: {'*' * len(settings.GITLAB_CLIENT_SECRET) if settings.GITLAB_CLIENT_SECRET else 'None'}"
            )
        elif provider == "google":
            print(f"GOOGLE_CLIENT_ID: {settings.GOOGLE_CLIENT_ID}")
            print(
                f"GOOGLE_CLIENT_SECRET: {'*' * len(settings.GOOGLE_CLIENT_SECRET) if settings.GOOGLE_CLIENT_SECRET else 'None'}"
            )
        print("=================================")
        if provider not in ["github", "gitlab", "google"]:
            return Response(
                {"error": "Invalid provider"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get the redirect URI for the frontend (where user will be redirected after OAuth)
        frontend_redirect_uri = request.GET.get(
            "redirect_uri", "http://192.168.0.103:5173/oauth/callback"
        )

        # Store the frontend redirect URI in session for later use
        request.session["oauth_redirect_uri"] = frontend_redirect_uri

        # Generate the OAuth authorization URL
        try:
            oauth_client = oauth.create_client(provider)

            # Check if OAuth client is properly configured
            if not oauth_client:
                return Response(
                    {
                        "error": f"OAuth client for {provider} is not configured. Please check your environment variables."
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            # Generate authorization URL (don't pass redirect_uri, use the one configured in oauth.register)
            result = oauth_client.authorize_redirect(request)

            # Debug the result
            print(f"=== OAuth Result Debug ===")
            print(f"Result type: {type(result)}")
            print(f"Result value: {result}")
            print(
                f"Result length: {len(result) if hasattr(result, '__len__') else 'No length'}"
            )
            print("==========================")

            # Handle different return types
            if isinstance(result, tuple) and len(result) == 2:
                authorization_url, state = result
            elif isinstance(result, str):
                authorization_url = result
                state = None
            elif hasattr(result, "url"):  # Handle HttpResponse objects
                authorization_url = result.url
                state = None
            else:
                return Response(
                    {
                        "error": f"Unexpected response from OAuth client for {provider}. Type: {type(result)}, Value: {result}"
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            return Response(
                {
                    "authorization_url": authorization_url,
                    "state": state,
                    "provider": provider,
                    "redirect_uri": frontend_redirect_uri,
                }
            )

        except Exception as e:
            logger.error(f"OAuth login error for {provider}: {str(e)}")
            return Response(
                {
                    "error": f"Failed to initialize OAuth for {provider}. Please check your configuration."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class OAuthCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, provider):
        """Handle OAuth callback from the provider"""
        print("=== OAuth Callback Debug Info ===")
        print(f"Provider: {provider}")
        print(f"Method: {request.method}")
        print(f"URL: {request.build_absolute_uri()}")
        print(f"Headers: {dict(request.headers)}")
        print(f"GET params: {dict(request.GET)}")
        print(f"POST data: {request.data}")
        print(f"User: {request.user}")
        print(
            f"Session: {dict(request.session) if hasattr(request, 'session') else 'No session'}"
        )
        print("=================================")

        if provider not in ["github", "gitlab", "google"]:
            return Response(
                {"error": "Invalid provider"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            oauth_client = oauth.create_client(provider)
            token = oauth_client.authorize_access_token(request)

            # Get user info from the provider
            user_info = self.get_user_info(oauth_client, token, provider)

            # Create or get user
            user = self.get_or_create_user(user_info, provider)

            # Log the user in
            login(request, user)

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            # Get the redirect URI from session
            redirect_uri = request.session.get(
                "oauth_redirect_uri", "http://192.168.0.103:5173/oauth/callback"
            )

            # Create response with tokens
            response_data = {
                "user": UserSerializer(user).data,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "provider": provider,
            }

            # For API response
            if request.headers.get("Accept") == "application/json":
                return Response(response_data)

            # For browser redirect (with tokens in URL params)
            redirect_url = f"{redirect_uri}?access_token={access_token}&refresh_token={refresh_token}&provider={provider}"
            return redirect(redirect_url)

        except Exception as e:
            logger.error(f"OAuth callback error for {provider}: {str(e)}")
            return Response(
                {"error": "OAuth authentication failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def get_user_info(self, oauth_client, token, provider):
        """Get user information from the OAuth provider"""
        if provider == "github":
            resp = oauth_client.get("user", token=token)
            user_info = resp.json()
            return {
                "id": str(user_info["id"]),
                "email": user_info.get("email", ""),
                "username": user_info["login"],
                "first_name": (
                    user_info.get("name", "").split()[0]
                    if user_info.get("name")
                    else ""
                ),
                "last_name": (
                    " ".join(user_info.get("name", "").split()[1:])
                    if user_info.get("name")
                    and len(user_info.get("name", "").split()) > 1
                    else ""
                ),
                "avatar_url": user_info.get("avatar_url", ""),
            }

        elif provider == "gitlab":
            resp = oauth_client.get("user", token=token)
            user_info = resp.json()
            return {
                "id": str(user_info["id"]),
                "email": user_info.get("email", ""),
                "username": user_info["username"],
                "first_name": user_info.get("first_name", ""),
                "last_name": user_info.get("last_name", ""),
                "avatar_url": user_info.get("avatar_url", ""),
            }

        elif provider == "google":
            resp = oauth_client.parse_id_token(
                token, nonce=self.request.session.get("oauth_nonce")
            )
            user_info = resp
            return {
                "id": user_info["sub"],
                "email": user_info["email"],
                "username": user_info.get(
                    "preferred_username", user_info["email"].split("@")[0]
                ),
                "first_name": user_info.get("given_name", ""),
                "last_name": user_info.get("family_name", ""),
                "avatar_url": user_info.get("picture", ""),
            }

    def get_or_create_user(self, user_info, provider):
        """Get existing user or create a new one"""
        email = user_info["email"]

        # Try to find user by email first
        try:
            user = User.objects.get(email=email)
            # Update user info if needed
            if not user.first_name and user_info.get("first_name"):
                user.first_name = user_info["first_name"]
            if not user.last_name and user_info.get("last_name"):
                user.last_name = user_info["last_name"]
            if not user.profile_picture and user_info.get("avatar_url"):
                user.profile_picture = user_info["avatar_url"]
            user.save()
            return user
        except ObjectDoesNotExist:
            pass

        # Create new user
        user = User.objects.create_user(
            email=email,
            username=user_info["username"],
            first_name=user_info.get("first_name", ""),
            last_name=user_info.get("last_name", ""),
            profile_picture=user_info.get("avatar_url", ""),
            password=None,  # OAuth users don't need password
        )

        # Store OAuth provider info
        user.notification_preferences = {
            "oauth_provider": provider,
            "oauth_id": user_info["id"],
        }
        user.save()

        return user


class OAuthProvidersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """Get available OAuth providers and their configuration"""
        providers = {
            "github": {
                "name": "GitHub",
                "client_id": settings.GITHUB_CLIENT_ID,
                "authorize_url": "/api/auth/oauth/github/login/",
                "available": bool(
                    settings.GITHUB_CLIENT_ID and settings.GITHUB_CLIENT_SECRET
                ),
            },
            "gitlab": {
                "name": "GitLab",
                "client_id": settings.GITLAB_CLIENT_ID,
                "authorize_url": "/api/auth/oauth/gitlab/login/",
                "available": bool(
                    settings.GITLAB_CLIENT_ID and settings.GITLAB_CLIENT_SECRET
                ),
            },
            "google": {
                "name": "Google",
                "client_id": settings.GOOGLE_CLIENT_ID,
                "authorize_url": "/api/auth/oauth/google/login/",
                "available": bool(
                    settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET
                ),
            },
        }

        return Response(providers)
