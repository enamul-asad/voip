# accounts/views_admin.py

from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied

from .models import Company
from .serializers import CompanyAdminSerializer
from .permissions import IsAdminUserRole
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Company

class AdminCompanyViewSet(ModelViewSet):

    queryset = Company.objects.all().order_by("-created_at")
    serializer_class = CompanyAdminSerializer
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    # =============================
    # TOGGLE COMPANY STATUS
    # =============================
    @action(detail=True, methods=["post"])
    def toggle(self, request, pk=None):

        company = self.get_object()
        company.is_active = not company.is_active
        company.save(update_fields=["is_active"])

        return Response({
            "id": company.id,
            "is_active": company.is_active
        })

    # =============================
    # ADD CREDIT (ADMIN TOOL)
    # =============================
    @action(detail=True, methods=["post"])
    def credit(self, request, pk=None):

        try:
            amount = float(request.data.get("amount"))
        except (TypeError, ValueError):
            return Response(
                {"detail": "Invalid amount"},
                status=400
            )

        if amount <= 0:
            return Response(
                {"detail": "Amount must be positive"},
                status=400
            )

        company = self.get_object()
        company.credit_balance += amount
        company.save(update_fields=["credit_balance"])

        return Response({
            "id": company.id,
            "balance": str(company.credit_balance),
            "currency": company.currency
        })

    # =============================
    # CREATE COMPANY + AUTO CLIENT
    # =============================
    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company = serializer.save()

        response_data = serializer.data

        # auto client admin credentials
        response_data["client_username"] = f"{company.name.lower().replace(' ', '_')}_admin"
        response_data["client_password"] = company._generated_password

        return Response(response_data, status=status.HTTP_201_CREATED)
    


    # =============================
    # ADJUST RATE PER MINUTE
    # =============================
    @action(detail=True, methods=["patch"])
    def adjust_rate(self, request, pk=None):

        company = self.get_object()

        try:
            new_rate = float(request.data.get("rate_per_minute"))
        except (TypeError, ValueError):
            return Response(
                {"detail": "Invalid rate"},
                status=400
            )

        if new_rate < 0:
            return Response(
                {"detail": "Rate must be positive"},
                status=400
            )

        company.rate_per_minute = new_rate
        company.save(update_fields=["rate_per_minute"])

        return Response({
            "company_id": company.id,
            "rate_per_minute": str(company.rate_per_minute)
        })