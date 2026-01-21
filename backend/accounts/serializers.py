from rest_framework import serializers
from .models import SIPUser


class SIPUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = SIPUser
        fields = "__all__"
        read_only_fields = ["company"]
