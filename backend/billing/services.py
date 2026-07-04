from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum, Count

from stats.models import CallLog
from .models import Invoice
from accounts.models import Company


# ==========================================================
# 1️⃣ SINGLE INVOICE CALCULATION (No DB Write)
# ==========================================================

def generate_invoice(company, month, year):

    logs = CallLog.objects.filter(
        company=company,
        status="completed",
        timestamp__month=month,
        timestamp__year=year
    )

    aggregates = logs.aggregate(
        total_calls=Count("id"),
        total_duration=Sum("duration"),
        total_cost=Sum("cost")
    )

    total_calls = aggregates["total_calls"] or 0
    total_duration = aggregates["total_duration"] or 0
    total_cost = aggregates["total_cost"] or Decimal("0.00")

    total_minutes = (
        Decimal(total_duration) / Decimal("60")
        if total_duration else Decimal("0.00")
    )

    return {
        "total_calls": total_calls,
        "total_minutes": total_minutes.quantize(Decimal("0.01")),
        "total_cost": total_cost,
        "currency": company.currency
    }


# ==========================================================
# 2️⃣ CREATE MONTHLY INVOICE (DB Write)
# ==========================================================

def generate_monthly_invoice(company, month, year):

    data = generate_invoice(company, month, year)

    # 🚫 Optional: Skip zero-usage invoices
    if data["total_calls"] == 0:
        return None

    invoice, created = Invoice.objects.get_or_create(
        company=company,
        month=month,
        year=year,
        defaults={
            "total_calls": data["total_calls"],
            "total_minutes": data["total_minutes"],
            "total_cost": data["total_cost"],
            "currency": data["currency"],
            "status": "unpaid"
        }
    )

    return invoice


# ==========================================================
# 3️⃣ GENERATE FOR ALL COMPANIES (Used by Command)
# ==========================================================

def generate_all_invoices():

    now = timezone.now()

    # Previous month logic
    if now.month == 1:
        month = 12
        year = now.year - 1
    else:
        month = now.month - 1
        year = now.year

    companies = Company.objects.filter(is_active=True)

    created_count = 0

    for company in companies:
        invoice = generate_monthly_invoice(company, month, year)

        if invoice:
            created_count += 1

    return created_count