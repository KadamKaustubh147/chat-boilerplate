from django.db import models
from django.contrib.auth import get_user_model

from django.core.exceptions import ValidationError

User = get_user_model()


class Chat_Group(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    # related names meaning --> user model mei aisa dekhega --> created_group karke refer karenge
    # this should be on the user model
    created_by = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, related_name='created_group')
    # many users 
    # members = models.ForeignKey(User, related_name="chat_groups", blank=True, on_delete=models.DO_NOTHING)
    created_at = models.DateTimeField(auto_now_add=True)
    max_members = models.IntegerField(default=15)

    def add_member(self, user):
        """Add a member to the guild with validation"""
        # Check if user is already in another guild
        existing_guilds = Chat_Group.objects.filter(members=user)
        if existing_guilds.exists():
            raise ValidationError(f"User {user.email} is already in guild: {existing_guilds.first().name}")
        
        # Check if guild is full
        if self.members.count() >= self.max_members:
            raise ValidationError(f"Guild is full. Maximum {self.max_members} members allowed.")
        
        self.members.add(user)

    def remove_member(self, user):
        """Remove a member from the guild"""
        self.members.remove(user)

    def __str__(self):
        return f"{self.name} ({self.members.count()}/{self.max_members} members)"


# this is the schema of every message of personal chat
# TODO add end to end encryption
class PersonalChat(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_messages")
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"{self.sender} → {self.receiver}: {self.message[:20]}"


class GroupMessage(models.Model):
    group = models.ForeignKey(Chat_Group, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"[{self.group.name}] {self.sender}: {self.message[:20]}"