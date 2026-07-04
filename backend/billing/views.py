# billing/views.py

import os
from decimal import Decimal

from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from django.utils import timezone
from django.conf import settings

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import api_view, permission_classes

from stats.models import CallLog
from accounts.models import Company
from .models import Invoice, CreditTransaction
from .services import generate_invoice
from .pdf import generate_invoice_pdf
from .serializers import InvoiceSerializer


# ==========================================================
# 1️⃣ LIST INVOICES
# ==========================================================

class InvoiceListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role == "admin":
            invoices = Invoice.objects.all().order_by("-created_at")

        elif request.user.role == "client":
            if not request.user.company:
                return Response([], status=200)

            invoices = Invoice.objects.filter(
                company=request.user.company
            ).order_by("-created_at")

        else:
            raise PermissionDenied("Access denied.")

        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)


# ==========================================================
# 2️⃣ DOWNLOAD INVOICE (ADMIN + CLIENT SAFE)
# ==========================================================

class InvoiceDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        try:
            month = int(request.GET.get("month"))
            year = int(request.GET.get("year"))
        except (TypeError, ValueError):
            return Response({"error": "Invalid month/year"}, status=400)

        # 🔐 Admin can download any company invoice
        if request.user.role == "admin":
            company_id = request.GET.get("company_id")
            if not company_id:
                return Response({"error": "company_id required"}, status=400)

            company = get_object_or_404(Company, id=company_id)

        # 🔐 Client can only access their company
        elif request.user.role == "client":
            if not request.user.company:
                raise PermissionDenied("No company assigned.")
            company = request.user.company

        else:
            raise PermissionDenied("Access denied.")

        # Generate invoice data
        data = generate_invoice(company, month, year)

        invoice, created = Invoice.objects.get_or_create(
            company=company,
            month=month,
            year=year,
            defaults={
                "total_calls": data["total_calls"],
                "total_minutes": data["total_minutes"],
                "total_cost": data["total_cost"],
                "currency": company.currency
            }
        )

        filename = f"invoice_{company.id}_{year}_{month}.pdf"

        folder = os.path.join(settings.MEDIA_ROOT, "invoices")
        os.makedirs(folder, exist_ok=True)

        path = os.path.join(folder, filename)

        generate_invoice_pdf(invoice, company, path)

        return FileResponse(
            open(path, "rb"),
            as_attachment=True,
            filename=filename
        )


# ==========================================================
# 3️⃣ MANUAL CREDIT ADJUSTMENT (ADMIN ONLY)
# ==========================================================

class AdjustCreditView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, company_id):

        if request.user.role != "admin":
            raise PermissionDenied("Admin only.")

        company = get_object_or_404(Company, id=company_id)

        try:
            amount = Decimal(str(request.data.get("amount")))
        except:
            return Response({"detail": "Invalid amount"}, status=400)

        action = request.data.get("type")

        if amount <= 0:
            return Response({"detail": "Amount must be positive"}, status=400)

        if action == "add":
            company.credit_balance += amount

        elif action == "deduct":
            if company.credit_balance < amount:
                return Response(
                    {"detail": "Insufficient balance"},
                    status=400
                )
            company.credit_balance -= amount

        else:
            return Response({"detail": "Invalid action"}, status=400)

        company.save()

        CreditTransaction.objects.create(
            company=company,
            amount=amount,
            type=action,
            performed_by=request.user,
            note=request.data.get("note", "")
        )

        return Response({
            "new_balance": company.credit_balance
        })


# ==========================================================
# 4️⃣ MARK INVOICE AS PAID (ADMIN ONLY)
# ==========================================================

class MarkInvoicePaidView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, invoice_id):

        if request.user.role != "admin":
            raise PermissionDenied("Admin only.")

        invoice = get_object_or_404(Invoice, id=invoice_id)

        invoice.status = "paid"
        invoice.save()

        return Response({"status": "paid"})


# ==========================================================
# 5️⃣ COMPANY BILLING HISTORY
# ==========================================================

class CompanyBillingHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, company_id):

        # 🔐 Admin → any company
        if request.user.role == "admin":
            company = get_object_or_404(Company, id=company_id)

        # 🔐 Client → only own company
        elif request.user.role == "client":
            if not request.user.company:
                raise PermissionDenied("No company assigned.")
            company = request.user.company

        else:
            raise PermissionDenied("Access denied.")

        transactions = CreditTransaction.objects.filter(
            company=company
        ).order_by("-created_at")

        data = [
            {
                "amount": t.amount,
                "type": t.type,
                "note": t.note,
                "performed_by": t.performed_by.username if t.performed_by else None,
                "date": t.created_at
            }
            for t in transactions
        ]

        return Response(data)


# ==========================================================
# 6️⃣ GLOBAL REVENUE SUMMARY (ADMIN ONLY)
# ==========================================================

class RevenueSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != "admin":
            raise PermissionDenied("Admin only.")

        now = timezone.now()

        today_revenue = CallLog.objects.filter(
            timestamp__date=now.date(),
            status="completed"
        ).aggregate(total=Sum("cost"))["total"] or Decimal("0")

        month_revenue = CallLog.objects.filter(
            timestamp__year=now.year,
            timestamp__month=now.month,
            status="completed"
        ).aggregate(total=Sum("cost"))["total"] or Decimal("0")

        return Response({
            "today": float(today_revenue),
            "month": float(month_revenue),
            "currency": "USD"
        })


# ==========================================================
# 7️⃣ INVOICE DETAIL (MULTI-TENANT SAFE)
# ==========================================================

class InvoiceDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, invoice_id):

        invoice = get_object_or_404(Invoice, id=invoice_id)

        # 🔐 Admin allowed
        if request.user.role == "admin":
            pass

        # 🔐 Client only own invoice
        elif request.user.role == "client":
            if invoice.company != request.user.company:
                raise PermissionDenied("Access denied.")

        else:
            raise PermissionDenied("Access denied.")

        calls = CallLog.objects.filter(
            company=invoice.company,
            timestamp__month=invoice.month,
            timestamp__year=invoice.year
        )

        data = [
            {
                "caller": c.caller,
                "callee": c.callee,
                "duration": c.duration,
                "cost": c.cost,
                "timestamp": c.timestamp
            }
            for c in calls
        ]

        return Response(data)


# ==========================================================
# 8️⃣ GENERATE INVOICE (ADMIN ONLY)
# ==========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_company_invoice(request, company_id):

    if request.user.role != "admin":
        raise PermissionDenied("Admin only.")

    company = get_object_or_404(Company, id=company_id)

    month = request.data.get("month")
    year = request.data.get("year")

    if not month or not year:
        return Response(
            {"error": "month and year required"},
            status=400
        )

    data = generate_invoice(company, int(month), int(year))

    invoice = Invoice.objects.create(
        company=company,
        month=month,
        year=year,
        total_calls=data["total_calls"],
        total_minutes=data["total_minutes"],
        total_cost=data["total_cost"],
        currency=company.currency
    )

    filename = f"invoice_{company.id}_{year}_{month}.pdf"

    folder = os.path.join(settings.MEDIA_ROOT, "invoices")
    os.makedirs(folder, exist_ok=True)

    path = os.path.join(folder, filename)

    generate_invoice_pdf(invoice, company, path)

    return Response({
        "message": "Invoice generated successfully",
        "invoice_id": invoice.id,
        "file": filename
    })