import base64
import hmac
import hashlib
import time
import secrets
import urllib.parse

def generate_totp_secret():
    """Generate a new TOTP secret"""
    # Generate a random secret (32 characters)
    random_bytes = secrets.token_bytes(20)
    return base64.b32encode(random_bytes).decode('utf-8')

def generate_totp_uri(secret, username, issuer="AutoFlow"):
    """Generate a TOTP URI for QR code generation"""
    # Create otpauth URI according to the spec
    issuer_encoded = urllib.parse.quote(issuer)
    username_encoded = urllib.parse.quote(username)
    return f"otpauth://totp/{issuer_encoded}:{username_encoded}?secret={secret}&issuer={issuer_encoded}&algorithm=SHA1&digits=6&period=30"

def verify_totp(secret, code):
    """Verify a TOTP code against a secret"""
    try:
        # Convert code to integer
        code = int(code)
        
        # Calculate time steps (30-second intervals since Unix epoch)
        current_time_step = int(time.time() // 30)
        
        # Check codes within a time window of -1, 0, +1 time steps
        # to account for clock skew and user delay
        for time_step in [current_time_step - 1, current_time_step, current_time_step + 1]:
            if _generate_totp(secret, time_step) == code:
                return True
        
        return False
    except (ValueError, TypeError):
        return False

def _generate_totp(secret, time_step):
    """Generate a TOTP code for a specific time step"""
    # Decode the base32 secret
    key = base64.b32decode(secret)
    
    # Convert time step to bytes (big-endian 64-bit integer)
    time_bytes = time_step.to_bytes(8, byteorder='big')
    
    # Generate HMAC-SHA1 hash
    hmac_hash = hmac.new(key, time_bytes, hashlib.sha1).digest()
    
    # Extract dynamic binary code (last 4 bits of hash)
    offset = hmac_hash[-1] & 0x0f
    
    # Extract 4 bytes from hash starting at offset
    truncated_hash = hmac_hash[offset:offset + 4]
    
    # Convert to integer and apply mask
    code = int.from_bytes(truncated_hash, byteorder='big') & 0x7fffffff
    
    # Return 6-digit code
    return code % 1000000
