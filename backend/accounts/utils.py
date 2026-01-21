from cryptography.fernet import Fernet
from django.conf import settings
import base64
import hashlib

def get_key():
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return base64.urlsafe_b64encode(key)

fernet = Fernet(get_key())

def encrypt(text: str) -> str:
    return fernet.encrypt(text.encode()).decode()

def decrypt(text: str) -> str:
    return fernet.decrypt(text.encode()).decode()
