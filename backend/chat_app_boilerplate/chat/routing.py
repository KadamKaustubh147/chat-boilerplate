from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Personal chat using email - matches both with and without leading slash
    # Handles paths like: ws/personal/user@example.com/ or /ws/personal/user@example.com/
    re_path(r"^/?ws/personal/(?P<user_email>[^/]+)/$", consumers.PersonalChatConsumer.as_asgi()),

    # Group chat: ws://<host>/ws/group/<group_name>/
    re_path(r"^/?ws/group/(?P<group_name>\w+)/$", consumers.GroupChatConsumer.as_asgi()),
]