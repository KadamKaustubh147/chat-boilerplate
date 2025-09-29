# import json
# from channels.generic.websocket import AsyncWebsocketConsumer
# from channels.db import database_sync_to_async
# from django.contrib.auth import get_user_model
# from .models import Chat_Group, PersonalChat, GroupMessage

# User = get_user_model()


# class PersonalChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         # before accepting the connection request
        
#         # we extract the user and the other user jiske saath chat karne wala hai
        
#         self.user = self.scope["user"]
#         # from routing 👇
#         self.other_user = self.scope["url_route"]["kwargs"]["email"]
        
#         # deciding the room name which is straight forward --> minimum name_maximum name
#         # now below all this is just some usual jazz we have to do
#         self.room_name = f"personal_{min(self.user.username, self.other_user)}_{max(self.user.username, self.other_user)}"
#         self.room_group_name = f"chat_{self.room_name}"

#         await self.channel_layer.group_add(
#             self.room_group_name, self.channel_name
#         )
#         await self.accept()

#     async def disconnect(self, close_code):
#         await self.channel_layer.group_discard(
#             self.room_group_name, self.channel_name
#         )

#     async def receive(self, text_data):
#         # convert json to python object
#         data = json.loads(text_data)
#         message = data["message"]

#         sender = self.user
#         # here username is actually the url
#         receiver = await database_sync_to_async(User.objects.get)(username=self.other_user)

#         # first add in channel layer or database??
#         await database_sync_to_async(PersonalChat.objects.create)(
#             sender=sender, receiver=receiver, message=message
#         )

#         '''
#         Here's what happens step by step when you group_send:

#         Your consumer publishes the event to Redis (pub/sub).

#         Redis pushes the event to all subscribers (your other connected consumers in the same group).

#         Each consumer receives it, and your chat_message handler runs → then you call self.send() to push it out through the WebSocket to the client.

#         Once delivered, the event is gone from Redis immediately — Redis does not keep a copy.
        
        
#         Delivered? → Removed instantly from Redis.

#         Nobody listening? → Dropped instantly.
#         '''

#         # ok the db save comes before the redis message bus
#         # but then why can't we use DB as the message bus --> after creating we have to query it --> the query induces latency we need stuff as fast as fuck boi
        
        
#         # send the message to channels/consumers of the group and also adds in the redis memory layer
#         await self.channel_layer.group_send(
#             self.room_group_name,
#             # now 
#             {"type": "chat_message", "message": message, "sender": sender.username},
#         )

#     # actually send the stuff to the client
#     async def chat_message(self, event):
#         await self.send(text_data=json.dumps({
#             "message": event["message"],
#             "sender": event["sender"]
#         }))


# class GroupChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.user = self.scope["user"]
        
#         # group name from url parameters
#         self.group_name = self.scope["url_route"]["kwargs"]["group_name"]
#         self.room_group_name = f"group_{self.group_name}"

#         group = await database_sync_to_async(Chat_Group.objects.get)(name=self.group_name)
#         if not group:
#             await self.close()
#             return

#         try:
#             await self.add_member(group, self.user)
#         except ValueError:
#             await self.close()
#             return

#         await self.channel_layer.group_add(
#             self.room_group_name, self.channel_name
#         )
#         await self.accept()

#     async def disconnect(self, close_code):
#         await self.channel_layer.group_discard(
#             self.room_group_name, self.channel_name
#         )

#     async def receive(self, text_data):
#         data = json.loads(text_data)
#         message = data["message"]

#         group = await database_sync_to_async(Chat_Group.objects.get)(name=self.group_name)
#         await database_sync_to_async(GroupMessage.objects.create)(
#             group=group, sender=self.user, message=message
#         )

#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {"type": "chat_message", "message": message, "sender": self.user.username},
#         )

#     async def chat_message(self, event):
#         await self.send(text_data=json.dumps({
#             "message": event["message"],
#             "sender": event["sender"]
#         }))

#     @database_sync_to_async
#     def add_member(self, group, user):
#         if group.members.count() >= 15:
#             raise ValueError("Group is full. Max 15 members allowed.")
#         group.members.add(user)


import json
import hashlib
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Chat_Group, PersonalChat, GroupMessage

User = get_user_model()


class PersonalChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        # Check if user is authenticated
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Get other user's email from URL
        self.other_user_email = self.scope["url_route"]["kwargs"]["user_email"]
        
        # Create a unique and safe room name using a hash
        user_emails = sorted([self.user.email, self.other_user_email])
        room_name_str = f"personal_{user_emails[0]}_{user_emails[1]}"

        # Create an SHA256 hash of the room name string
        m = hashlib.sha256()
        m.update(room_name_str.encode('utf-8'))
        self.room_name = m.hexdigest() 

        # The group name will now be safe, e.g., "chat_a1b2c3d4..."
        self.room_group_name = f"chat_{self.room_name}"

        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data["message"]

        sender = self.user
        receiver = await database_sync_to_async(User.objects.get)(email=self.other_user_email)

        # Save to database
        await database_sync_to_async(PersonalChat.objects.create)(
            sender=sender, receiver=receiver, message=message
        )

        # Broadcast to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message,
                "sender": sender.email,
                "sender_name": sender.name,
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


class GroupChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        self.group_name = self.scope["url_route"]["kwargs"]["group_name"]
        self.room_group_name = f"group_{self.group_name}"

        group = await database_sync_to_async(Chat_Group.objects.get)(name=self.group_name)
        if not group:
            await self.close()
            return

        try:
            await self.add_member(group, self.user)
        except ValueError:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name
        )
        await self.accept()

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