from django.contrib import admin
from .models import Chat_Group, PersonalChat, GroupMessage

# Register your models here.

admin.site.register(Chat_Group)
admin.site.register(PersonalChat)
admin.site.register(GroupMessage)