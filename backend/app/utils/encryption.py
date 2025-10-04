import os
import json
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# Get encryption key from environment
ENCRYPTION_KEY = os.getenv("API_KEY_ENCRYPTION_KEY", "8b1c4d97f2a0e39c5f71c8b99d46a3d2")

def _get_fernet_key():
    """Generate a Fernet key from the encryption key"""
    try:
        # Use PBKDF2 to derive a proper key
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'autoflow_salt',  # In production, use a random salt per user
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(ENCRYPTION_KEY.encode()))
        return Fernet(key)
    except Exception as e:
        print(f"Error creating Fernet key: {str(e)}")
        # Fallback to simple key
        key = base64.urlsafe_b64encode(ENCRYPTION_KEY[:32].ljust(32, '0').encode())
        return Fernet(key)

def encrypt_api_key(api_key: str) -> dict:
    """Encrypt an API key"""
    try:
        if not api_key:
            return None
        
        fernet = _get_fernet_key()
        encrypted_data = fernet.encrypt(api_key.encode())
        
        return {
            "encrypted": base64.urlsafe_b64encode(encrypted_data).decode(),
            "version": "1"
        }
    except Exception as e:
        print(f"Error encrypting API key: {str(e)}")
        return None

def decrypt_api_key(encrypted_data: dict) -> str:
    """Decrypt an API key"""
    try:
        if not encrypted_data or not isinstance(encrypted_data, dict):
            return None
        
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_data["encrypted"].encode())
        
        fernet = _get_fernet_key()
        decrypted_data = fernet.decrypt(encrypted_bytes)
        
        return decrypted_data.decode()
    except Exception as e:
        print(f"Error decrypting API key: {str(e)}")
        return None
