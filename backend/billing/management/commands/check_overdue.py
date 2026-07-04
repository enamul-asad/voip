from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from billing.models import Invoice


class Command(BaseCommand):

    def handle(self, *args, **kwargs):

        overdue_date = timezone.now() - timedelta(days=30)

        invoices = Invoice.objects.filter(
            status="unpaid",
            created_at__lt=overdue_date
        )

        count = invoices.update(status="overdue")

        self.stdout.write(
            self.style.SUCCESS(f"{count} invoices marked overdue.")
        )