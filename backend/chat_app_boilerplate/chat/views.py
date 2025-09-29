from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import PersonalChat, Chat_Group, GroupMessage
from django.db.models import Q

User = get_user_model()


class PersonalChatHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_email):
        """Get chat history between current user and another user"""
        try:
            other_user = User.objects.get(email=user_email)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        # Get all messages between the two users
        messages = PersonalChat.objects.filter(
            Q(sender=request.user, receiver=other_user) |
            Q(sender=other_user, receiver=request.user)
        ).order_by('timestamp')

        data = [{
            "message": msg.message,
            "sender": msg.sender.email,
            "sender_name": msg.sender.name,
            "timestamp": msg.timestamp.isoformat(),
        } for msg in messages]

        return Response(data)


class GroupChatHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, group_name):
        """Get chat history for a group"""
        try:
            group = Chat_Group.objects.get(name=group_name)
        except Chat_Group.DoesNotExist:
            return Response({"error": "Group not found"}, status=404)

        # Check if user is a member
        if not group.members.filter(id=request.user.id).exists():
            return Response({"error": "You are not a member of this group"}, status=403)

        messages = GroupMessage.objects.filter(group=group).order_by('timestamp')

        data = [{
            "message": msg.message,
            "sender": msg.sender.email,
            "sender_name": msg.sender.name,
            "timestamp": msg.timestamp.isoformat(),
        } for msg in messages]

        return Response(data)


class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get list of all users (for contacts)"""
        users = User.objects.filter(is_active=True).exclude(id=request.user.id)
        
        data = [{
            "email": user.email,
            "name": user.name,
        } for user in users]

        return Response(data)