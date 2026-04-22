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
    from app.database.connection import connect_to_mongo
except ImportError:
    # Fallback imports for different deployment contexts
    try:
        from backend.app.database.user_operations import get_user_by_id
        from backend.app.utils.encryption import decrypt_api_key
        from backend.app.database.connection import connect_to_mongo
    except ImportError:
        # Final fallback
        def get_user_by_id(user_id: str):
            return None
        def decrypt_api_key(encrypted_data):
            return None
        async def connect_to_mongo():
            return None

class UserAPIManager:
    """Manages API keys for a specific user"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self._user_data = None

    @staticmethod
    def _is_truthy(value: Optional[str]) -> bool:
        return str(value).strip().lower() in {"1", "true", "yes", "on"}

    def _allow_server_fallback(self) -> bool:
        """Whether env-based server key fallback is allowed.

        Production default: disabled.
        Non-production default: enabled.
        Override with ALLOW_SERVER_KEY_FALLBACK=true|false.
        """
        explicit = os.getenv("ALLOW_SERVER_KEY_FALLBACK")
        if explicit is not None:
            return self._is_truthy(explicit)

        app_env = os.getenv("APP_ENV", "development").strip().lower()
        return app_env not in {"prod", "production"}
    
    async def _get_user_data(self):
        """Get user data and cache it"""
        if self._user_data is None:
            try:
                self._user_data = await get_user_by_id(self.user_id)
            except Exception as e:
                err_text = str(e)
                print(f"Error loading user data for {self.user_id}: {err_text}")

                # Scheduler jobs can run in a different execution context where DB
                # was not initialized yet. Try to reconnect once, then retry lookup.
                if "Database not connected" in err_text:
                    try:
                        await connect_to_mongo()
                        self._user_data = await get_user_by_id(self.user_id)
                    except Exception as reconnect_error:
                        print(
                            f"Error reloading user data after reconnect for {self.user_id}: "
                            f"{str(reconnect_error)}"
                        )
                        self._user_data = None
                else:
                    self._user_data = None
        return self._user_data
    
    async def get_api_key(self, key: str) -> Optional[str]:
        """Get a specific API key by name"""
        try:
            user = await self._get_user_data()
            if not user:
                return None
            
            api_keys = user.get("api_keys", {})
            encrypted_key = api_keys.get(key)
            
            if encrypted_key:
                return decrypt_api_key(encrypted_key)
            
            return None
        except Exception as e:
            print(f"Error getting API key {key}: {str(e)}")
            return None
    
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
            
            return os.getenv("OPENAI_API_KEY") if self._allow_server_fallback() else None
        except Exception as e:
            print(f"Error getting OpenAI key: {str(e)}")
            return os.getenv("OPENAI_API_KEY") if self._allow_server_fallback() else None
    
    async def get_groq_key(self) -> Optional[str]:
        """Get Groq API key for the user"""
        try:
            user = await self._get_user_data()
            if not user:
                return None
            
            api_keys = user.get("api_keys", {})
            encrypted_key = api_keys.get("groq")
            
            if encrypted_key:
                return decrypt_api_key(encrypted_key)
            
            return os.getenv("GROQ_API_KEY") if self._allow_server_fallback() else None
        except Exception as e:
            print(f"Error getting Groq key: {str(e)}")
            return os.getenv("GROQ_API_KEY") if self._allow_server_fallback() else None
    
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
            
            return os.getenv("STABILITY_API_KEY") if self._allow_server_fallback() else None
        except Exception as e:
            print(f"Error getting Stability key: {str(e)}")
            return os.getenv("STABILITY_API_KEY") if self._allow_server_fallback() else None
    
    async def get_discord_webhook(self) -> Optional[str]:
        """Get Discord webhook URL for the user"""
        try:
            user = await self._get_user_data()
            if not user:
                return os.getenv("SOCIAL_MEDIA_TEST_WEBHOOK") if self._allow_server_fallback() else None
            
            api_keys = user.get("api_keys", {})
            encrypted_webhook = api_keys.get("discord")
            
            if encrypted_webhook:
                return decrypt_api_key(encrypted_webhook)
            
            return os.getenv("SOCIAL_MEDIA_TEST_WEBHOOK") if self._allow_server_fallback() else None
        except Exception as e:
            print(f"Error getting Discord webhook: {str(e)}")
            return os.getenv("SOCIAL_MEDIA_TEST_WEBHOOK") if self._allow_server_fallback() else None

    async def get_whatsapp_token(self) -> Optional[str]:
        """Get WhatsApp Cloud API access token for the user."""
        try:
            user = await self._get_user_data()
            if not user:
                return os.getenv("WHATSAPP_ACCESS_TOKEN") if self._allow_server_fallback() else None

            api_keys = user.get("api_keys", {})
            encrypted_token = api_keys.get("whatsapp_token")
            if encrypted_token:
                return decrypt_api_key(encrypted_token)

            return os.getenv("WHATSAPP_ACCESS_TOKEN") if self._allow_server_fallback() else None
        except Exception as e:
            print(f"Error getting WhatsApp token: {str(e)}")
            return os.getenv("WHATSAPP_ACCESS_TOKEN") if self._allow_server_fallback() else None

    async def get_whatsapp_phone_number_id(self) -> Optional[str]:
        """Get WhatsApp Cloud phone number ID for the user."""
        try:
            user = await self._get_user_data()
            if not user:
                return os.getenv("WHATSAPP_PHONE_NUMBER_ID") if self._allow_server_fallback() else None

            api_keys = user.get("api_keys", {})
            encrypted_id = api_keys.get("whatsapp_phone_number_id")
            if encrypted_id:
                return decrypt_api_key(encrypted_id)

            return os.getenv("WHATSAPP_PHONE_NUMBER_ID") if self._allow_server_fallback() else None
        except Exception as e:
            print(f"Error getting WhatsApp phone number ID: {str(e)}")
            return os.getenv("WHATSAPP_PHONE_NUMBER_ID") if self._allow_server_fallback() else None

    async def get_gmail_token_json(self) -> Optional[str]:
        """Get Gmail OAuth token JSON string for the user."""
        try:
            user = await self._get_user_data()
            if not user:
                return os.getenv("GMAIL_TOKEN_JSON") if self._allow_server_fallback() else None

            api_keys = user.get("api_keys", {})
            encrypted_token_json = api_keys.get("gmail_token_json")
            if encrypted_token_json:
                return decrypt_api_key(encrypted_token_json)

            return os.getenv("GMAIL_TOKEN_JSON") if self._allow_server_fallback() else None
        except Exception as e:
            print(f"Error getting Gmail token JSON: {str(e)}")
            return os.getenv("GMAIL_TOKEN_JSON") if self._allow_server_fallback() else None

    async def get_google_token_json(self) -> Optional[str]:
        """Get generic Google OAuth token JSON string for the user.

        Backward-compatible lookup order:
        1) google_token_json
        2) google (legacy field)
        """
        try:
            user = await self._get_user_data()
            if not user:
                return os.getenv("GOOGLE_TOKEN_JSON") if self._allow_server_fallback() else None

            api_keys = user.get("api_keys", {})
            encrypted_token_json = api_keys.get("google_token_json") or api_keys.get("google")
            if encrypted_token_json:
                return decrypt_api_key(encrypted_token_json)

            return os.getenv("GOOGLE_TOKEN_JSON") if self._allow_server_fallback() else None
        except Exception as e:
            print(f"Error getting Google token JSON: {str(e)}")
            return os.getenv("GOOGLE_TOKEN_JSON") if self._allow_server_fallback() else None
    
    async def validate_service_keys(self, service: str) -> bool:
        """Validate if all required keys for a service are available"""
        validation_map = {
            "openai": ["openai"],
            "openrouter": ["openrouter"],
            "google": ["google"],
            "discord": ["discord"],
            "gmail": ["gmail_token_json"],
            "whatsapp": ["whatsapp_token", "whatsapp_phone_number_id"],
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

# Type alias for backward compatibility
APIKeyManager = UserAPIManager

async def get_user_api_manager(user_id: str) -> Optional[UserAPIManager]:
    """Factory function to create UserAPIManager for a user"""
    if not user_id:
        return None
    
    return UserAPIManager(user_id)