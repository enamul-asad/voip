from rest_framework import serializers
from .models import Invoice

class InvoiceSerializer(serializers.ModelSerializer):
    # --- 1. Fields for Admin Billing ---
    company_name = serializers.CharField(
        source="company.name",
        read_only=True
    )

    # --- 2. Fields for Client Billing ---
    # Map 'total_cost' from DB -> 'amount' for Frontend
    amount = serializers.DecimalField(source='total_cost', max_digits=12, decimal_places=2, read_only=True)
    date = serializers.SerializerMethodField()
    ref = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            # Base & Admin Fields
            "id",
            "company",
            "company_name",
            "month",
            "year",
            "total_calls",
            "total_minutes",
            "total_cost",
            "currency",
            "created_at",
            
            # Client Mapped Fields
            "amount",
            "date",
            "ref",
            "status"
        ]

    def get_date(self, obj):
        # Formats the datetime into a simple date string (YYYY-MM-DD)
        return obj.created_at.date()

    def get_ref(self, obj):
        # Generates a reference like: INV-2026-02-15
        return f"INV-{obj.year}-{obj.month:02d}-{obj.id}"

    def get_status(self, obj):
        # Safely checks if the Invoice model actually has a status field now.
        # If it does, return it. If it doesn't, default to "Paid".
        if hasattr(obj, 'status') and obj.status:
            return obj.status
        return "Paid"