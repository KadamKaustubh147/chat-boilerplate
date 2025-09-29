from django.urls import path
from .views import PersonalChatHistoryView, GroupChatHistoryView, UserListView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Get chat history between current user and another user
    path('messages/<str:user_email>/', PersonalChatHistoryView.as_view(), name='personal-chat-history'),
    
    # Get group chat history
    path('group/<str:group_name>/messages/', GroupChatHistoryView.as_view(), name='group-chat-history'),
    
    # Get list of all users (for contacts list)
    path('users/', UserListView.as_view(), name='user-list'),
]
