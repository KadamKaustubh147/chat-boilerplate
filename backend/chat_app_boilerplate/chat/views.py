from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import PersonalChat, Chat_Group, GroupMessage
from django.db.models import Q, Max
from django.core.exceptions import ValidationError

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
        from urllib.parse import unquote
        
        # Decode URL-encoded group name (e.g., "Kau%20ka%20guild" -> "Kau ka guild")
        decoded_group_name = unquote(group_name)
        
        try:
            group = Chat_Group.objects.get(name=decoded_group_name)
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


class GuildListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get list of all available guilds"""
        guilds = Chat_Group.objects.all()
        
        data = []
        for guild in guilds:
            # accessing foreign key
            member_count = guild.group_members.count()
            is_member = guild.group_members.filter(id=request.user.id).exists()
            
            guild_info = {
                "id": guild.id,
                "name": guild.name,
                "description": guild.description or "No description",
                "memberCount": member_count,
                "maxMembers": guild.max_members,
                "isFull": member_count >= guild.max_members,
                "isMember": is_member,
                "createdBy": guild.created_by.name if guild.created_by else "Unknown",
                "createdAt": guild.created_at.isoformat(),
            }
            data.append(guild_info)
        
        return Response(data)

    def post(self, request):
        """Create a new guild"""
        name = request.data.get('name')
        description = request.data.get('description', '')
        
        if not name:
            return Response({"error": "Guild name is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user is already in a guild
        existing_guilds = Chat_Group.objects.filter(group_members=request.user)
        if existing_guilds.exists():
            return Response({
                "error": f"You are already in guild: {existing_guilds.first().name}. Leave it first to create a new one."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if guild name already exists
        if Chat_Group.objects.filter(name=name).exists():
            return Response({"error": "Guild name already exists"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create guild
        guild = Chat_Group.objects.create(
            name=name,
            description=description,
            created_by=request.user
        )
        
        # Add creator as first member
        guild.group_members.add(request.user)
        
        return Response({
            "message": "Guild created successfully",
            "guild": {
                "id": guild.id,
                "name": guild.name,
                "description": guild.description,
                "memberCount": 1,
                "maxMembers": guild.max_members,
            }
        }, status=status.HTTP_201_CREATED)


class GuildDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, guild_id):
        """Get guild details including members"""
        try:
            guild = Chat_Group.objects.get(id=guild_id)
        except Chat_Group.DoesNotExist:
            return Response({"error": "Guild not found"}, status=404)
        
        members = [{
            "id": member.id,
            "email": member.email,
            "name": member.name,
        } for member in guild.group_member.all()]
        
        return Response({
            "id": guild.id,
            "name": guild.name,
            "description": guild.description,
            "memberCount": guild.group_members.count(),
            "maxMembers": guild.max_members,
            "isMember": guild.group_members.filter(id=request.user.id).exists(),
            "createdBy": guild.created_by.name if guild.created_by else "Unknown",
            "members": members,
        })


class GuildJoinView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, guild_id):
        """Join a guild"""
        try:
            guild = Chat_Group.objects.get(id=guild_id)
        except Chat_Group.DoesNotExist:
            return Response({"error": "Guild not found"}, status=404)
        
        # Check if already a member
        if guild.group_members.filter(id=request.user.id).exists():
            return Response({"error": "You are already a member of this guild"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            guild.add_member(request.user)
            return Response({
                "message": f"Successfully joined {guild.name}",
                "guild": {
                    "id": guild.id,
                    "name": guild.name,
                    "memberCount": guild.group_members.count(),
                }
            })
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class GuildLeaveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, guild_id):
        """Leave a guild"""
        try:
            guild = Chat_Group.objects.get(id=guild_id)
        except Chat_Group.DoesNotExist:
            return Response({"error": "Guild not found"}, status=404)
        
        # Check if user is a member
        if not guild.group_members.filter(id=request.user.id).exists():
            return Response({"error": "You are not a member of this guild"}, status=status.HTTP_400_BAD_REQUEST)
        
        guild.remove_member(request.user)
        
        # If no members left, delete the guild
        if guild.group_members.count() == 0:
            guild_name = guild.name
            guild.delete()
            return Response({"message": f"You left {guild_name}. Guild was deleted as it had no members."})
        
        return Response({
            "message": f"Successfully left {guild.name}",
            "guild": {
                "id": guild.id,
                "name": guild.name,
                "memberCount": guild.group_members.count(),
            }
        })


class MyGuildView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get the guild current user is in"""
        guilds = Chat_Group.objects.filter(group_members=request.user)
        
        if not guilds.exists():
            return Response({"guild": None, "message": "You are not in any guild"})
        
        guild = guilds.first()
        members = [{
            "id": member.id,
            "email": member.email,
            "name": member.name,
        } for member in guild.group_members.all()]
        
        return Response({
            "guild": {
                "id": guild.id,
                "name": guild.name,
                "description": guild.description,
                "memberCount": guild.group_members.count(),
                "maxMembers": guild.max_members,
                "createdBy": guild.created_by.name if guild.created_by else "Unknown",
                "members": members,
            }
        })