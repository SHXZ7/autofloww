import os
import sys
from typing import Optional, Dict, Any

# Add the backend directory to Python path for imports
backend_path = os.path.join(os.path.dirname(__file__), '..')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

try:
    from app.database.user_operations import get_user_by_id
    from app.utils.encryption import decrypt_api_key
except ImportError:
    # Fallback imports for different deployment contexts
    try:
        from backend.app.database.user_operations import get_user_by_id
        from backend.app.utils.encryption import decrypt_api_key
    except ImportError:
        # Final fallback
        def get_user_by_id(user_id: str):
            return None
        def decrypt_api_key(encrypted_data):
            return None

class UserAPIManager:
    """Manages API keys for a specific user"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self._user_data = None
    
    async def _get_user_data(self):
        """Get user data and cache it"""
        if self._user_data is None:
            self._user_data = await get_user_by_id(self.user_id)
        return self._user_data
    
    async def get_openai_key(self) -> Optional[str]:
        """Get OpenAI API key for the user"""
        try:
            user = await self._get_user_data()
            if not user:
                return None
            
            api_keys = user.get("api_keys", {})
            encrypted_key = api_keys.get("openai")
            
            if encrypted_key:
                return decrypt_api_key(encrypted_key)
            
            # Fallback to environment variable
            return os.getenv("OPENAI_API_KEY")
        except Exception as e:
            print(f"Error getting OpenAI key: {str(e)}")
            return os.getenv("OPENAI_API_KEY")
    
    async def get_openrouter_key(self) -> Optional[str]:
        """Get OpenRouter API key for the user"""
        try:
            user = await self._get_user_data()
            if not user:
                return None
            
            api_keys = user.get("api_keys", {})
            encrypted_key = api_keys.get("openrouter")
            
            if encrypted_key:
                return decrypt_api_key(encrypted_key)
            
            # Fallback to environment variable
            return os.getenv("OPENROUTER_API_KEY")
        except Exception as e:
            print(f"Error getting OpenRouter key: {str(e)}")
            return os.getenv("OPENROUTER_API_KEY")
    
    async def get_stability_key(self) -> Optional[str]:
        """Get Stability API key for the user"""
        try:
            user = await self._get_user_data()
            if not user:
                return None
            
            api_keys = user.get("api_keys", {})
            encrypted_key = api_keys.get("stability")
            
            if encrypted_key:
                return decrypt_api_key(encrypted_key)
            
            # Fallback to environment variable
            return os.getenv("STABILITY_API_KEY")
        except Exception as e:
            print(f"Error getting Stability key: {str(e)}")
            return os.getenv("STABILITY_API_KEY")
    
    async def get_discord_webhook(self) -> Optional[str]:
        """Get Discord webhook URL for the user"""
        try:
            user = await self._get_user_data()
            if not user:
                return None
            
            api_keys = user.get("api_keys", {})
            encrypted_webhook = api_keys.get("discord")
            
            if encrypted_webhook:
                return decrypt_api_key(encrypted_webhook)
            
            # Fallback to environment variable
            return os.getenv("SOCIAL_MEDIA_TEST_WEBHOOK")
        except Exception as e:
            print(f"Error getting Discord webhook: {str(e)}")
            return os.getenv("SOCIAL_MEDIA_TEST_WEBHOOK")

async def get_user_api_manager(user_id: str) -> Optional[UserAPIManager]:
    """Get API manager for a user"""
    if not user_id:
        return None
    
    return UserAPIManager(user_id)
    
    async def validate_service_keys(self, service: str) -> bool:
        """Validate if required keys are available for a service"""
        validation_map = {
            "openai": ["openai"],
            "openrouter": ["openrouter"],
            "google": ["google"],
            "discord": ["discord"],
            "twilio": ["twilio_sid", "twilio_token", "twilio_phone"],
            "twitter": ["twitter_api_key", "twitter_api_secret", "twitter_access_token", "twitter_access_secret"],
            "stability": ["stability"],
            "github": ["github"],
            "linkedin": ["linkedin_token"],
            "instagram": ["instagram_token"]
        }
        
        required_keys = validation_map.get(service, [])
        
        for key in required_keys:
            api_key = await self.get_api_key(key)
            if not api_key:
                return False
        
        return True

async def get_user_api_manager(user_id: str) -> APIKeyManager:
    """Factory function to create APIKeyManager for a user"""
    return APIKeyManager(user_id)
