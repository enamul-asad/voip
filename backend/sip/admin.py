from django.contrib import admin
from .models import SIPUser

@admin.register(SIPUser)
class SIPUserAdmin(admin.ModelAdmin):
    list_display = ("extension", "company", "is_active", "created_at")
    search_fields = ("extension",)
    list_filter = ("is_active", "company")
