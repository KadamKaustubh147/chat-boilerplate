import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Chat_Group, PersonalChat, GroupMessage

User = get_user_model()


class PersonalChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("=" * 50)
        print("🔌 WebSocket Connection Attempt")
        print("=" * 50)
        
        self.user = self.scope["user"]
        print(f"👤 User from scope: {self.user}")
        print(f"🔐 Is authenticated: {self.user.is_authenticated}")
        
        # Check if user is authenticated
        if not self.user.is_authenticated:
            print("❌ User not authenticated - closing connection")
            await self.close()
            return
        
        # Get other user's email from URL
        self.other_user_email = self.scope["url_route"]["kwargs"]["user_email"]
        print(f"👥 Other user email: {self.other_user_email}")
        
        # Create room name using emails (sorted for consistency)
        emails = sorted([self.user.email, self.other_user_email])
        self.room_name = f"personal_{emails[0]}_{emails[1]}"
        self.room_group_name = f"chat_{self.room_name}"
        
        print(f"🏠 Room name: {self.room_name}")
        print(f"📢 Room group name: {self.room_group_name}")

        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name
        )
        
        print(f"✅ Added to group: {self.room_group_name}")
        await self.accept()
        print(f"✅ WebSocket connection accepted for {self.user.email}")
        print("=" * 50)

    async def disconnect(self, close_code):
        print(f"❌ WebSocket disconnecting: {self.user.email if hasattr(self, 'user') else 'Unknown'}")
        print(f"   Close code: {close_code}")
        
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            )
            print(f"🗑️ Removed from group: {self.room_group_name}")

    async def receive(self, text_data):
        print("=" * 50)
        print("📨 Message Received")
        print("=" * 50)
        print(f"📦 Raw data: {text_data}")
        
        try:
            data = json.loads(text_data)
            print(f"✅ Parsed data: {data}")
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error: {e}")
            return
        
        message = data.get("message")
        if not message:
            print("❌ No message in data")
            return
        
        print(f"💬 Message: {message}")
        print(f"👤 Sender: {self.user.email}")
        print(f"👥 Receiver: {self.other_user_email}")

        sender = self.user
        
        try:
            receiver = await database_sync_to_async(User.objects.get)(email=self.other_user_email)
            print(f"✅ Receiver found: {receiver.email}")
        except User.DoesNotExist:
            print(f"❌ Receiver not found: {self.other_user_email}")
            return

        # Save to database
        try:
            await database_sync_to_async(PersonalChat.objects.create)(
                sender=sender, receiver=receiver, message=message
            )
            print("✅ Message saved to database")
        except Exception as e:
            print(f"❌ Error saving to database: {e}")

        # Broadcast to group
        broadcast_data = {
            "type": "chat_message",
            "message": message,
            "sender": sender.email,
            "sender_name": sender.name,
            "timestamp": data.get("timestamp", "")
        }
        
        print(f"📢 Broadcasting to group: {self.room_group_name}")
        print(f"📦 Broadcast data: {broadcast_data}")
        
        try:
            await self.channel_layer.group_send(
                self.room_group_name,
                broadcast_data
            )
            print("✅ Message broadcasted successfully")
        except Exception as e:
            print(f"❌ Error broadcasting: {e}")
        
        print("=" * 50)

    async def chat_message(self, event):
        print(f"📤 Sending message to client: {event}")
        
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "sender": event["sender"],
            "sender_name": event["sender_name"],
            "timestamp": event["timestamp"]
        }))
        
        print("✅ Message sent to client")


class GroupChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("=" * 50)
        print("🏰 Guild WebSocket Connection Attempt")
        print("=" * 50)
        
        self.user = self.scope["user"]
        print(f"👤 User from scope: {self.user}")
        print(f"🔐 Is authenticated: {self.user.is_authenticated}")
        
        if not self.user.is_authenticated:
            print("❌ User not authenticated - closing connection")
            await self.close()
            return
        
        # Get group name from URL and decode it (handles URL encoding like %20 for spaces)
        from urllib.parse import unquote
        self.group_name = unquote(self.scope["url_route"]["kwargs"]["group_name"])
        self.room_group_name = f"group_{self.group_name}"
        
        print(f"🏰 Guild name (decoded): {self.group_name}")
        print(f"📢 Room group name: {self.room_group_name}")

        try:
            group = await database_sync_to_async(Chat_Group.objects.get)(name=self.group_name)
            print(f"✅ Guild found: {group.name}")
        except Chat_Group.DoesNotExist:
            print(f"❌ Guild not found: {self.group_name}")
            await self.close()
            return

        # Check if user is a member
        is_member = await database_sync_to_async(
            lambda: group.members.filter(id=self.user.id).exists()
        )()
        
        if not is_member:
            print(f"❌ User {self.user.email} is not a member of {self.group_name}")
            await self.close()
            return
        
        print(f"✅ User is member of guild")

        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name
        )
        
        print(f"✅ Added to group: {self.room_group_name}")
        await self.accept()
        print(f"✅ WebSocket connection accepted for {self.user.email} in guild {self.group_name}")
        print("=" * 50)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data["message"]

        group = await database_sync_to_async(Chat_Group.objects.get)(name=self.group_name)
        await database_sync_to_async(GroupMessage.objects.create)(
            group=group, sender=self.user, message=message
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message,
                "sender": self.user.email,
                "sender_name": self.user.name,
                "timestamp": data.get("timestamp", "")
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "sender": event["sender"],
            "sender_name": event["sender_name"],
            "timestamp": event["timestamp"]
        }))

    @database_sync_to_async
    def add_member(self, group, user):
        if group.members.count() >= 15:
            raise ValueError("Group is full. Max 15 members allowed.")
        group.members.add(user)