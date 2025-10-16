from django.contrib import admin
from .models import CustomUser

# Register your models here.

# in admin needed --> email, name and date created

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'date_joined', 'is_active', 'guild']