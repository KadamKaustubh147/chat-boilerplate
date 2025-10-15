from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Personal chat - updated regex to match emails with @ and dots
    # Handles paths like: ws/personal/user@example.com/ or /ws/personal/user@example.com/
    re_path(r"^/?ws/personal/(?P<user_email>[^/]+)/$", consumers.PersonalChatConsumer.as_asgi()),

    # Group chat - matches any characters including URL-encoded ones
    # Handles: ws/group/Guild%20Name/ or ws/group/GuildName/
    re_path(r"^/?ws/group/(?P<group_name>[^/]+)/$", consumers.GroupChatConsumer.as_asgi()),
]