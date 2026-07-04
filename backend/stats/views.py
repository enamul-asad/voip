import subprocess
import psutil # type: ignore
from decimal import Decimal
from datetime import timedelta

from django.utils import timezone
from django.db.models import Sum
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied

from .models import CallLog
from .serializers import CallLogSerializer
from accounts.models import Company


# ==========================================================
# 1️⃣ ACTIVE CALLS (ASTERISK LIVE)
# ==========================================================

class ActiveCallsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            cmd = [
                "wsl",
                "bash",
                "-c",
                "sudo asterisk -rx 'core show channels count'"
            ]

            output = subprocess.check_output(cmd).decode()

            for line in output.splitlines():
                line = line.lower().strip()
                if "active call" in line:
                    count = int(line.split()[0])
                    return Response({"active_calls": count})

            return Response({"active_calls": 0})

        except Exception as e:
            return Response({"error": str(e)}, status=500)


# ==========================================================
# 2️⃣ GLOBAL ACTIVE CALLS (ADMIN ONLY)
# ==========================================================

class GlobalActiveCallsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role not in ["admin", "super_admin"]:
            raise PermissionDenied("Permission denied.")

        active_calls = CallLog.objects.filter(status="active").count()

        return Response({
            "active_calls": active_calls
        })


# ==========================================================
# 3️⃣ ONLINE EXTENSIONS
# ==========================================================

class OnlineExtensionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            cmd = [
                "wsl",
                "bash",
                "-c",
                "sudo asterisk -rx 'sip show peers'"
            ]

            output = subprocess.check_output(cmd).decode().lower()

            total = 0
            online = 0
            offline = 0

            for line in output.splitlines():
                if "/" in line and "sip peers" not in line:
                    total += 1
                    if "ok" in line:
                        online += 1
                    else:
                        offline += 1

            return Response({
                "total": total,
                "online": online,
                "offline": offline
            })

        except Exception as e:
            return Response({"error": str(e)}, status=500)


# ==========================================================
# 4️⃣ CALL LOG LIST (MULTI-TENANT SAFE)
# ==========================================================

class CallLogListView(ListAPIView):
    serializer_class = CallLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # 🔐 Admin → all logs
        if user.role in ["admin", "super_admin"]:
            return CallLog.objects.select_related("company").order_by("-timestamp")

        # 🔐 Client → only own company
        if user.role == "client":
            if not user.company:
                raise PermissionDenied("No company assigned.")

            return CallLog.objects.select_related("company").filter(
                company=user.company
            ).order_by("-timestamp")

        raise PermissionDenied("Access denied.")


# ==========================================================
# 5️⃣ SYSTEM STATS
# ==========================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def system_stats(request):

    cpu = psutil.cpu_percent(interval=0.5)
    mem = psutil.virtual_memory()

    real_used_percent = round(
        ((mem.total - mem.available) / mem.total) * 100,
        2
    )

    return Response({
        "cpu": cpu,
        "memory": {
            "total": round(mem.total / (1024**3), 2),
            "used": round((mem.total - mem.available) / (1024**3), 2),
            "available": round(mem.available / (1024**3), 2),
            "percent": real_used_percent,
        }
    })


# ==========================================================
# 6️⃣ REVENUE ANALYTICS (ADMIN ONLY)
# ==========================================================

class RevenueAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role not in ["admin", "super_admin"]:
            raise PermissionDenied("Admin access required.")

        now = timezone.now()

        # ===== DAILY TREND (Last 7 Days) =====
        daily_data = []

        for i in range(6, -1, -1):
            day = now.date() - timedelta(days=i)

            total = CallLog.objects.filter(
                timestamp__date=day,
                status="completed"
            ).aggregate(total=Sum("cost"))["total"] or Decimal("0")

            daily_data.append({
                "date": day.strftime("%d %b"),
                "revenue": float(total)
            })

        # ===== MONTHLY TREND (Last 6 Months) =====
        monthly_data = []

        for i in range(5, -1, -1):
            target_date = now - timedelta(days=30 * i)

            total = CallLog.objects.filter(
                timestamp__year=target_date.year,
                timestamp__month=target_date.month,
                status="completed"
            ).aggregate(total=Sum("cost"))["total"] or Decimal("0")

            monthly_data.append({
                "month": target_date.strftime("%b %Y"),
                "revenue": float(total)
            })

        # ===== COMPANY RANKING =====
        ranking = Company.objects.annotate(
            total_revenue=Sum("call_logs__cost")
        ).order_by("-total_revenue")[:5]

        ranking_data = [
            {
                "name": c.name,
                "revenue": float(c.total_revenue or 0)
            }
            for c in ranking
        ]

        return Response({
            "daily": daily_data,
            "monthly": monthly_data,
            "ranking": ranking_data
        })


# ==========================================================
# 7️⃣ REVENUE SUMMARY (ADMIN + CLIENT SAFE)
# ==========================================================

class RevenueSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        today = timezone.now().date()
        now = timezone.now()

        # 🔐 Admin → Global Revenue
        if request.user.role in ["admin", "super_admin"]:

            today_total = CallLog.objects.filter(
                timestamp__date=today,
                status="completed"
            ).aggregate(total=Sum("cost"))["total"] or Decimal("0")

            month_total = CallLog.objects.filter(
                timestamp__year=now.year,
                timestamp__month=now.month,
                status="completed"
            ).aggregate(total=Sum("cost"))["total"] or Decimal("0")

            currency = "USD"

        # 🔐 Client → Company Revenue
        elif request.user.role == "client":

            if not request.user.company:
                raise PermissionDenied("No company assigned.")

            today_total = CallLog.objects.filter(
                company=request.user.company,
                timestamp__date=today,
                status="completed"
            ).aggregate(total=Sum("cost"))["total"] or Decimal("0")

            month_total = CallLog.objects.filter(
                company=request.user.company,
                timestamp__year=now.year,
                timestamp__month=now.month,
                status="completed"
            ).aggregate(total=Sum("cost"))["total"] or Decimal("0")

            currency = request.user.company.currency

        else:
            raise PermissionDenied("Access denied.")

        return Response({
            "today": float(today_total),
            "month": float(month_total),
            "currency": currency
        })