       
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import PersonalChat, Chat_Group, GroupMessage
from django.db.models import Q, Max
from django.db.models.functions import Greatest

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
        """
        Get list of users with whom current user has had conversations,
        plus all active users (for starting new chats)
        """
        current_user = request.user
        
        # Get all users who have exchanged messages with current user
        conversations = PersonalChat.objects.filter(
            Q(sender=current_user) | Q(receiver=current_user)
        ).values(
            'sender', 'receiver'
        ).distinct()
        
        # Extract unique user IDs from conversations
        contact_ids = set()
        for conv in conversations:
            if conv['sender'] != current_user.id:
                contact_ids.add(conv['sender'])
            if conv['receiver'] != current_user.id:
                contact_ids.add(conv['receiver'])
        
        # Get all active users
        all_users = User.objects.filter(is_active=True).exclude(id=current_user.id)
        
        contacts_data = []
        for user in all_users:
            # Get last message with this user
            last_message = PersonalChat.objects.filter(
                Q(sender=current_user, receiver=user) |
                Q(sender=user, receiver=current_user)
            ).order_by('-timestamp').first()
            
            contact_info = {
                "id": user.id,
                "email": user.email,
                "name": user.name,
            }
            
            if last_message:
                contact_info["lastMessage"] = last_message.message[:50]  # Truncate
                contact_info["lastMessageTime"] = last_message.timestamp.strftime("%I:%M %p")
                contact_info["hasConversation"] = True
            else:
                contact_info["hasConversation"] = False
            
            contacts_data.append(contact_info)
        
        # Sort: users with conversations first, then alphabetically
        contacts_data.sort(key=lambda x: (not x.get('hasConversation', False), x['name'].lower()))
        
        return Response(contacts_data)