from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
import uuid

from .models import SIPUser
from .serializers import SIPUserSerializer
from accounts.models import Company
from accounts.permissions import IsAdminRole


# ---------------------------------------------------
# 1️⃣ CREATE SIP USER (ADMIN ONLY)
# ---------------------------------------------------

class SIPUserCreateView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request):

        username = request.data.get("username")
        extension = request.data.get("extension")
        company_id = request.data.get("company")

        if not username or not extension or not company_id:
            return Response({"detail": "All fields required"}, status=400)

        if SIPUser.objects.filter(username=username).exists():
            return Response({"detail": "Username already exists"}, status=400)

        if SIPUser.objects.filter(extension=extension).exists():
            return Response({"detail": "Extension already exists"}, status=400)

        company = get_object_or_404(Company, id=company_id)

        raw_password = uuid.uuid4().hex[:8]

        sip_user = SIPUser(
            username=username,
            extension=extension,
            company=company
        )

        sip_user.set_secret(raw_password)  # ✅ Secure
        sip_user.save()

        return Response({
            "id": sip_user.id,
            "username": sip_user.username,
            "extension": sip_user.extension,
            "password": raw_password  # show once only
        })


# ---------------------------------------------------
# 2️⃣ TOGGLE SIP USER (ADMIN ONLY)
# ---------------------------------------------------

class ToggleSIPUserView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):

        sip_user = get_object_or_404(SIPUser, pk=pk)

        sip_user.is_active = not sip_user.is_active
        sip_user.save()

        return Response({
            "is_active": sip_user.is_active
        })


# ---------------------------------------------------
# 3️⃣ RESET SIP PASSWORD (ADMIN ONLY)
# ---------------------------------------------------

class ResetSIPPasswordView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk):

        sip_user = get_object_or_404(SIPUser, pk=pk)

        new_password = uuid.uuid4().hex[:8]

        sip_user.set_secret(new_password)  # ✅ HASHED
        sip_user.save()

        return Response({
            "new_password": new_password
        })


# ---------------------------------------------------
# 4️⃣ LIST SIP USERS (MULTI-TENANT SAFE)
# ---------------------------------------------------

class SIPUserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user

        # 🔐 ADMIN → See All
        if user.role in ["admin", "super_admin"]:
            sip_users = SIPUser.objects.select_related("company").all()

        # 🔐 CLIENT → Only Their Company
        elif user.role == "client":

            if not user.company:
                raise PermissionDenied("No company assigned.")

            sip_users = SIPUser.objects.select_related("company").filter(
                company=user.company
            )

        else:
            raise PermissionDenied("Access denied.")

        data = []

        for u in sip_users:
            data.append({
                "id": u.id,
                "username": u.username,
                "extension": u.extension,
                "company": u.company.name,
                "is_active": u.is_active,
                # Remove call_count if relation not defined
            })

        return Response(data)