from django.contrib import admin
from .models import User, Company, SIPUser

admin.site.register(Company)
admin.site.register(SIPUser)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'company', 'is_active')
    list_filter = ('role', 'company', 'is_active')


