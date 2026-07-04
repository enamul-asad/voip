from django.db import models
from accounts.models import Company
from django.contrib.auth.hashers import make_password, check_password


class SIPUser(models.Model):

    username = models.CharField(max_length=50, unique=True)
    extension = models.CharField(max_length=20, unique=True)

    # 🔥 ADD THIS FIELD
    secret = models.CharField(max_length=128)

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="sip_users"
    )

    is_active = models.BooleanField(default=True)
    is_registered = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def set_secret(self, raw_secret):
        self.secret = make_password(raw_secret)

    def check_secret(self, raw_secret):
        return check_password(raw_secret, self.secret)

    def __str__(self):
        return f"{self.extension} ({self.company.name})"