from django.urls import path
from .views import (
    PersonalChatHistoryView, 
    GroupChatHistoryView, 
    UserListView,
    GuildListView,
    GuildDetailView,
    GuildJoinView,
    GuildLeaveView,
    MyGuildView,
)

urlpatterns = [
    # Personal chat
    path('messages/<str:user_email>/', PersonalChatHistoryView.as_view(), name='personal-chat-history'),
    
    # Group/Guild chat
    path('group/<str:group_name>/messages/', GroupChatHistoryView.as_view(), name='group-chat-history'),
    
    # Users list
    path('users/', UserListView.as_view(), name='user-list'),
    
    # Guild management
    path('guilds/', GuildListView.as_view(), name='guild-list'),  # GET: list all, POST: create
    path('guilds/<int:guild_id>/', GuildDetailView.as_view(), name='guild-detail'),  # GET: guild details
    path('guilds/<int:guild_id>/join/', GuildJoinView.as_view(), name='guild-join'),  # POST: join guild
    path('guilds/<int:guild_id>/leave/', GuildLeaveView.as_view(), name='guild-leave'),  # POST: leave guild
    path('guilds/my-guild/', MyGuildView.as_view(), name='my-guild'),  # GET: current user's guild
]