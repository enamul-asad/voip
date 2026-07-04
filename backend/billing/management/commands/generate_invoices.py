from django.core.management.base import BaseCommand
from billing.services import generate_all_invoices


class Command(BaseCommand):

    def handle(self, *args, **kwargs):
        count = generate_all_invoices()

        self.stdout.write(
            self.style.SUCCESS(f"{count} invoices generated.")
        )