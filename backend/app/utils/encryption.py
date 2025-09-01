import os
import base64
from cryptography.fernet import Fernet

# API Key encryption setup
API_KEY_ENCRYPTION_KEY = os.getenv("API_KEY_ENCRYPTION_KEY", "8b1c4d97f2a0e39c5f71c8b99d46a3d2")

def get_encryption_key():
    """Get or create encryption key for API keys"""
    # Ensure the key is 32 bytes for Fernet
    key = API_KEY_ENCRYPTION_KEY.encode()
    if len(key) < 32:
        key = key.ljust(32, b'0')
    elif len(key) > 32:
        key = key[:32]
    return base64.urlsafe_b64encode(key)

def encrypt_api_key(plaintext_key: str) -> dict:
    """Encrypt an API key"""
    if not plaintext_key:
        return None
    
    try:
        fernet = Fernet(get_encryption_key())
        encrypted_key = fernet.encrypt(plaintext_key.encode())
        return {
            "encrypted": base64.urlsafe_b64encode(encrypted_key).decode(),
            "algorithm": "fernet"
        }
    except Exception as e:
        print(f"Error encrypting API key: {str(e)}")
        return None

def decrypt_api_key(encrypted_data: dict) -> str:
    """Decrypt an API key"""
    if not encrypted_data or not encrypted_data.get("encrypted"):
        return None
    
    try:
        fernet = Fernet(get_encryption_key())
        encrypted_key = base64.urlsafe_b64decode(encrypted_data["encrypted"].encode())
        decrypted_key = fernet.decrypt(encrypted_key)
        return decrypted_key.decode()
    except Exception as e:
        print(f"Error decrypting API key: {str(e)}")
        return None
