from django.db import models
from accounts.models import Company
from sip.models import SIPUser
from decimal import Decimal, ROUND_HALF_UP


class CallLog(models.Model):

    # 🔥 Link call to SIP user
    sip_user = models.ForeignKey(
        SIPUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="calls"
    )

    caller = models.CharField(max_length=20)
    callee = models.CharField(max_length=20)
    duration = models.IntegerField()  # seconds
    status = models.CharField(max_length=20)

    rate_per_minute = models.DecimalField(
        max_digits=6,
        decimal_places=4,
        default=Decimal("0.0200")
    )

    cost = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        default=Decimal("0.0000")
    )

    billed = models.BooleanField(default=False)

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="call_logs"
    )

    timestamp = models.DateTimeField(auto_now_add=True)

    def calculate_cost(self):
        if self.status.lower() != "completed" or self.duration <= 0:
            return Decimal("0.0000")

        minutes = Decimal(self.duration) / Decimal("60")
        return (minutes * self.rate_per_minute).quantize(
            Decimal("0.0001"),
            rounding=ROUND_HALF_UP
        )
    
    def save(self, *args, **kwargs):

        # 🔥 SET RATE FROM COMPANY
        self.rate_per_minute = self.company.rate_per_minute

        if self.company.credit_balance <= 0:
            raise ValueError("Insufficient balance. Calls blocked.")

        # Calculate cost
        self.cost = self.calculate_cost()

        if (
            not self.billed and
            self.status.lower() == "completed" and
            self.cost > 0
        ):
            current_balance = Decimal(str(self.company.credit_balance))

            if current_balance < self.cost:
                raise ValueError("Insufficient balance")

            self.company.credit_balance = current_balance - self.cost
            self.company.save()

            self.billed = True

        super().save(*args, **kwargs)