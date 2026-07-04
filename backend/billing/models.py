from django.db import models
from accounts.models import Company

from django.db import models
from django.conf import settings

class Invoice(models.Model):

    STATUS_CHOICES = [
        ("unpaid", "Unpaid"),
        ("paid", "Paid"),
        ("overdue", "Overdue"),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE)

    month = models.IntegerField()
    year = models.IntegerField()

    total_calls = models.IntegerField()
    total_minutes = models.DecimalField(max_digits=10, decimal_places=2)
    total_cost = models.DecimalField(max_digits=12, decimal_places=4)

    currency = models.CharField(max_length=10)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="unpaid"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("company", "month", "year")

# billing/models.py


class CreditTransaction(models.Model):

    TRANSACTION_TYPES = [
        ("add", "Add"),
        ("deduct", "Deduct"),
        ("adjustment", "Adjustment"),
    ]

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="credit_transactions"
    )

    amount = models.DecimalField(max_digits=12, decimal_places=4)
    type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)

    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    note = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)


class Payment(models.Model):

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("success", "Success"),
        ("failed", "Failed"),
    ]

    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    transaction_id = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)