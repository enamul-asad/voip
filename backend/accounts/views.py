# accounts/views.py

from decimal import Decimal
import secrets
import string

from django.contrib.auth import authenticate, get_user_model
from django.shortcuts import get_object_or_404

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from rest_framework.exceptions import PermissionDenied

from rest_framework_simplejwt.token_blacklist.models import (
    OutstandingToken, BlacklistedToken
)

from .models import Company
from .serializers import CompanyUpdateSerializer
from .utils_geo import get_client_ip, get_country_currency_from_ip
# from .tokens import get_tokens_for_user 


User = get_user_model()


# ==========================================================
# 1️⃣ LOGIN
# ==========================================================

@api_view(["POST"])
def login_view(request):

    user = authenticate(
        username=request.data.get("username"),
        password=request.data.get("password")
    )

    if not user:
        return Response({"detail": "Invalid credentials"}, status=401)

    # 🚫 Block inactive company
    if user.company and not user.company.is_active:
        return Response(
            {"detail": "Company account inactive"},
            status=403
        )

    company = user.company

    if company:
        ip = get_client_ip(request)

        geo = get_country_currency_from_ip(ip)

        if geo.get("currency"):
            company.currency = geo["currency"]
        if geo.get("country"):
            company.country = geo["country"]

        company.last_login_ip = ip
        company.save(update_fields=["currency", "country", "last_login_ip"])

    tokens = get_tokens_for_user(user) # pyright: ignore[reportUndefinedVariable]
    return Response(tokens)


# ==========================================================
# 2️⃣ ME VIEW
# ==========================================================

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user
        company = user.company

        # 🚫 Block inactive company
        if company and not company.is_active:
            return Response({
                "account_blocked": True,
                "detail": "Company inactive.",
                "role": user.role
            })

        # 🔐 Force password change
        if user.must_change_password:
            return Response({
                "force_password_change": True,
                "role": user.role
            })

        return Response({
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "company": {
                "id": company.id if company else None,
                "name": company.name if company else None,
                "credit_balance": str(company.credit_balance) if company else "0.00",
                "currency": company.currency if company else "USD",
                "country": company.country if company else None
            }
        })


# ==========================================================
# 3️⃣ BALANCE STATUS
# ==========================================================

class BalanceStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        company = request.user.company

        if not company:
            return Response({
                "balance": "0.00",
                "currency": "USD",
                "low_balance": False,
                "threshold": "0.00"
            })

        return Response({
            "balance": str(company.credit_balance),
            "currency": company.currency,
            "low_balance": company.credit_balance <= company.low_balance_threshold,
            "threshold": str(company.low_balance_threshold)
        })


# ==========================================================
# 4️⃣ COMPANY SETTINGS (CLIENT ONLY)
# ==========================================================

class CompanySettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):

        if request.user.role != "client":
            raise PermissionDenied("Only client can edit company settings.")

        if not request.user.company:
            return Response(
                {"detail": "Company not assigned"},
                status=400
            )

        serializer = CompanyUpdateSerializer(
            request.user.company,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            "message": "Company updated",
            "company": serializer.data
        })


# ==========================================================
# 5️⃣ LOGOUT ALL DEVICES
# ==========================================================

class LogoutAllView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        tokens = OutstandingToken.objects.filter(user=request.user)

        for token in tokens:
            BlacklistedToken.objects.get_or_create(token=token)

        return Response({"message": "All sessions logged out"})


# ==========================================================
# 6️⃣ CHANGE PASSWORD
# ==========================================================

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response(
                {"detail": "Old and new password required"},
                status=400
            )

        if not user.check_password(old_password):
            return Response(
                {"detail": "Old password incorrect"},
                status=400
            )

        user.set_password(new_password)
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])

        return Response({"success": True})


# ==========================================================
# 7️⃣ CREATE COMPANY USER (ADMIN ONLY)
# ==========================================================

class CreateCompanyUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, company_id):

        if request.user.role not in ["admin", "super_admin"]:
            raise PermissionDenied("Admin only.")

        company = get_object_or_404(Company, id=company_id)

        email = request.data.get("email")
        username = request.data.get("username")

        if not email:
            return Response({"detail": "Email required"}, status=400)

        if not username:
            base = company.name.lower().replace(" ", "_")
            username = f"{base}_{secrets.token_hex(2)}"

        if User.objects.filter(username=username).exists():
            return Response({"detail": "Username exists"}, status=400)

        password = ''.join(
            secrets.choice(string.ascii_letters + string.digits)
            for _ in range(10)
        )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role="client",
            company=company,
            must_change_password=True
        )

        return Response({
            "id": user.id,
            "username": username,
            "password": password
        })