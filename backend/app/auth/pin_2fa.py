import secrets
import hashlib
from typing import Optional

def generate_pin() -> str:
    """Generate a random 6-digit PIN"""
    return str(secrets.randbelow(900000) + 100000)

def hash_pin(pin: str) -> str:
    """Hash a PIN using SHA256"""
    return hashlib.sha256(pin.encode()).hexdigest()

def verify_pin(pin: str, hashed_pin: str) -> bool:
    """Verify a PIN against its hash"""
    return hash_pin(pin) == hashed_pin

def validate_pin_format(pin: str) -> bool:
    """Validate PIN format (4-6 digits)"""
    return pin.isdigit() and 4 <= len(pin) <= 6