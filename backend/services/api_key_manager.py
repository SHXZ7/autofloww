import os
import sys
from typing import Optional, Dict, Any

# Add the backend directory to Python path for imports
backend_path = os.path.join(os.path.dirname(__file__), '..')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Try multiple import strategies
try:
    from app.database.user_operations import get_user_by_id
    from app.utils.encryption import decrypt_api_key
except ImportError:
    try:
        # Alternative import path
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'app'))
        from database.user_operations import get_user_by_id
        from utils.encryption import decrypt_api_key
    except ImportError:
        # Final fallback - create dummy functions
        print("⚠️ Warning: Could not import database operations, using fallback functions")
        
        async def get_user_by_id(user_id: str):
            return None
            
        def decrypt_api_key(encrypted_data):
            if isinstance(encrypted_data, dict):
                return encrypted_data.get("encrypted", "")
            return str(encrypted_data) if encrypted_data else ""

class UserAPIManager:
    """Manages API keys for a specific user"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self._user_data = None
    
    async def _get_user_data(self):
        """Get user data and cache it"""
        if self._user_data is None:
            try:
                self._user_data = await get_user_by_id(self.user_id)
            except Exception as e:
                print(f"Error getting user data: {str(e)}")
                return None
        return self._user_data
    
    async def get_openai_key(self) -> Optional[str]:
        """Get OpenAI API key for the user"""
        try:
            user = await self._get_user_data()
            if not user:
                return os.getenv("OPENAI_API_KEY")
            
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
                return os.getenv("OPENROUTER_API_KEY")
            
            api_keys = user.get("api_keys", {})
            encrypted_key = api_keys.get("openrouter")
            
            if encrypted_key:
                return decrypt_api_key(encrypted_key)
            
            return os.getenv("OPENROUTER_API_KEY")
        except Exception as e:
            print(f"Error getting OpenRouter key: {str(e)}")
            return os.getenv("OPENROUTER_API_KEY")
    
    async def get_stability_key(self) -> Optional[str]:
        """Get Stability API key for the user"""
        try:
            user = await self._get_user_data()
            if not user:
                return os.getenv("STABILITY_API_KEY")
            
            api_keys = user.get("api_keys", {})
            encrypted_key = api_keys.get("stability")
            
            if encrypted_key:
                return decrypt_api_key(encrypted_key)
            
            return os.getenv("STABILITY_API_KEY")
        except Exception as e:
            print(f"Error getting Stability key: {str(e)}")
            return os.getenv("STABILITY_API_KEY")
    
    async def get_discord_webhook(self) -> Optional[str]:
        """Get Discord webhook URL for the user"""
        try:
            user = await self._get_user_data()
            if not user:
                return os.getenv("SOCIAL_MEDIA_TEST_WEBHOOK")
            
            api_keys = user.get("api_keys", {})
            encrypted_webhook = api_keys.get("discord")
            
            if encrypted_webhook:
                return decrypt_api_key(encrypted_webhook)
            
            return os.getenv("SOCIAL_MEDIA_TEST_WEBHOOK")
        except Exception as e:
            print(f"Error getting Discord webhook: {str(e)}")
            return os.getenv("SOCIAL_MEDIA_TEST_WEBHOOK")

# Type alias for backward compatibility
APIKeyManager = UserAPIManager

async def get_user_api_manager(user_id: str) -> Optional[UserAPIManager]:
    """Get API manager for a user"""
    if not user_id:
        return None
    
    return UserAPIManager(user_id)