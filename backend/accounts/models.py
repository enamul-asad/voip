from django.contrib.auth.models import AbstractUser
from django.db import models
from .utils import encrypt, decrypt


class Company(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    credit_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    ROLE_CHOICES = (
        ('client', 'Client'),
        ('admin', 'Admin'),
        ('super_admin', 'Super Admin'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class SIPUser(models.Model):
    extension = models.CharField(max_length=10, unique=True)
    secret = models.CharField(max_length=255)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def set_secret(self, raw_secret):
        self.secret = encrypt(raw_secret)

    def get_secret(self):
        return decrypt(self.secret)

    def __str__(self):
        return self.extension
