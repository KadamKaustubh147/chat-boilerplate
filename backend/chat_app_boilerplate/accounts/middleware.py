"""
WebSocket JWT Authentication Middleware
This is separate from authentication.py because WebSocket connections
need different middleware than HTTP requests.
"""

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token):
    """
    Validate JWT token and return the user.
    This is the WebSocket equivalent of CustomJWTAuthentication.
    """
    try:
        access_token = AccessToken(token)
        user_id = access_token['user_id']
        user = User.objects.get(id=user_id)
        print(f"✅ JWT Auth: User {user.email} authenticated")
        return user
    except Exception as e:
        print(f"❌ JWT Auth failed: {e}")
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware for WebSocket JWT authentication.
    Extracts JWT from cookies and adds user to scope.
    """
    
    async def __call__(self, scope, receive, send):
        print(f"🔐 JWT Middleware called for path: {scope.get('path')}")
        
        # Get cookies from headers
        headers = dict(scope['headers'])
        cookie_header = headers.get(b'cookie', b'').decode()
        
        # Parse cookies
        cookies = {}
        for cookie in cookie_header.split('; '):
            if '=' in cookie:
                key, value = cookie.split('=', 1)
                cookies[key] = value
        
        # Get access token from cookies
        token = cookies.get('access_token')
        
        if token:
            print(f"🔑 Found access_token in cookies")
            scope['user'] = await get_user_from_token(token)
        else:
            print(f"⚠️ No access_token found in cookies")
            scope['user'] = AnonymousUser()
        
        print(f"👤 User set to: {scope['user']}")
        
        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """
    Wraps the given application with JWTAuthMiddleware.
    Used in asgi.py routing.
    """
    return JWTAuthMiddleware(inner)