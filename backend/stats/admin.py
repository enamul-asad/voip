from django.contrib import admin
from .models import CallLog

@admin.register(CallLog)
class CallLogAdmin(admin.ModelAdmin):
    # 1. Columns to show in the list view
    list_display = (
        'id', 
        'caller', 
        'callee', 
        'company', 
        'status', 
        'duration_formatted', 
        'cost', 
        'billed', 
        'timestamp'
    )

    # 2. Filters on the right sidebar
    list_filter = ('status', 'billed', 'company', 'timestamp')

    # 3. Search bar (Search by phone numbers or company name)
    search_fields = ('caller', 'callee', 'company__name')

    # 4. Read-only fields (CRITICAL for data integrity)
    # We prevent admins from editing 'cost' (it's auto-calc) and 'billed' (system flag)
    readonly_fields = ('cost', 'billed', 'timestamp')

    # 5. Default sorting (Newest first)
    ordering = ('-timestamp',)

    # 6. Organized Layout
    fieldsets = (
        ('Call Details', {
            'fields': ('caller', 'callee', 'duration', 'status')
        }),
        ('Billing Information', {
            'fields': ('company', 'rate_per_minute', 'cost', 'billed')
        }),
        ('Timestamps', {
            'fields': ('timestamp',)
        }),
    )

    # Helper to show duration nicely (e.g., "2m 30s" instead of "150")
    def duration_formatted(self, obj):
        if obj.duration:
            minutes, seconds = divmod(obj.duration, 60)
            return f"{minutes}m {seconds}s"
        return "0s"
    duration_formatted.short_description = "Duration"