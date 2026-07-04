from rest_framework import serializers
from .models import CallLog


class CallLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallLog
        fields = [
            "id",
            "caller",
            "callee",
            "duration",
            "status",
            "rate_per_minute",
            "cost",
            "timestamp",
        ]
