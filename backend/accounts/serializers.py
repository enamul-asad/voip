from rest_framework import serializers
from .models import Company

from rest_framework import serializers
from .models import Company


from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
from rest_framework import serializers
from .models import Company

User = get_user_model()


class CompanyAdminSerializer(serializers.ModelSerializer):

    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "email",
            "currency",
            "country",
            "credit_balance",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def create(self, validated_data):
        # Create company first
        company = Company.objects.create(**validated_data)

        # 🔥 Generate username
        base_username = company.name.lower().replace(" ", "_")
        username = f"{base_username}_admin"

        # Ensure username unique
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_admin{counter}"
            counter += 1

        # 🔐 Generate random password
        password = get_random_string(10)

        # Create client user
        User.objects.create_user(
            username=username,
            email=company.email,
            password=password,
            role="client",
            company=company,
            must_change_password=True,
        )

        # OPTIONAL: return password in response (for now)
        company._generated_password = password

        return company


class CompanyUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ["country"]

