from django.contrib.auth.models import AbstractUser
from django.db import models
from .utils_crypto import encrypt, decrypt
from decimal import Decimal


class Company(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)

    credit_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default="USD")

    low_balance_threshold = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=10.00
    )
    
    rate_per_minute = models.DecimalField(
    max_digits=6,
    decimal_places=4,
    default=Decimal("0.0200")
)

    country = models.CharField(max_length=5, blank=True, null=True)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)



class User(AbstractUser):
    ROLE_CHOICES = (
        ('client', 'Client'),
        ('admin', 'Admin'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True)
    must_change_password = models.BooleanField(default=True)
    def __str__(self):
        return f"{self.username} ({self.role})"




