from django.db import models

from django.contrib.auth import get_user_model

User = get_user_model()


class Chat_Group(models.Model):
    name = models.CharField(max_length=255, unique=True)
    members = models.ManyToManyField(User, related_name="chat_groups", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def add_member(self, user):
        """Restrict to max 15 members"""
        if self.members.count() >= 15:
            raise ValueError("Group is full. Max 15 members allowed.")
        self.members.add(user)

    def __str__(self):
        return self.name


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
