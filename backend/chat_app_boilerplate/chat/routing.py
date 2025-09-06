from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Personal chat: ws://<host>/ws/personal/<username>/
    # this user name will be extracted in the chat
    re_path(r"^ws/personal/(?P<username>\w+)/$", consumers.PersonalChatConsumer.as_asgi()),

    # Group chat: ws://<host>/ws/group/<group_name>/
    re_path(r"^ws/group/(?P<group_name>\w+)/$", consumers.GroupChatConsumer.as_asgi()),
]
