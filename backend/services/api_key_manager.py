import os
from typing import Optional, Dict, Any
import httpx
from app.database.user_operations import get_user_by_id
from app.utils.encryption import decrypt_api_key

class APIKeyManager:
    """Centralized API key management for workflow execution"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self._cached_keys = {}
    
    async def get_api_key(self, service: str) -> Optional[str]:
        """Get decrypted API key for a service"""
        try:
            # Check cache first
            if service in self._cached_keys:
                return self._cached_keys[service]
            
            # Get user data
            user = await get_user_by_id(self.user_id)
            if not user:
                return None
            
            api_keys_data = user.get("api_keys", {})
            
            if service not in api_keys_data:
                # Fallback to environment variables
                return self._get_env_fallback(service)
            
            encrypted_data = api_keys_data[service]
            decrypted_key = decrypt_api_key(encrypted_data)
            
            if decrypted_key:
                self._cached_keys[service] = decrypted_key
                return decrypted_key
            
            # Fallback to environment variables if decryption fails
            return self._get_env_fallback(service)
            
        except Exception as e:
            print(f"Error getting API key for {service}: {str(e)}")
            return self._get_env_fallback(service)
    
    def _get_env_fallback(self, service: str) -> Optional[str]:
        """Fallback to environment variables"""
        env_mapping = {
            "openai": "OPENAI_API_KEY",
            "openrouter": "OPENROUTER_API_KEY",
            "google": "GOOGLE_API_KEY",
            "discord": "SOCIAL_MEDIA_TEST_WEBHOOK",
            "github": "GITHUB_TOKEN",
            "twilio_sid": "TWILIO_ACCOUNT_SID",
            "twilio_token": "TWILIO_AUTH_TOKEN",
            "twilio_phone": "TWILIO_PHONE_NUMBER",
            "stability": "STABILITY_API_KEY",
            "twitter_api_key": "TWITTER_API_KEY",
            "twitter_api_secret": "TWITTER_API_SECRET",
            "twitter_access_token": "TWITTER_ACCESS_TOKEN",
            "twitter_access_secret": "TWITTER_ACCESS_TOKEN_SECRET",
            "linkedin_token": "LINKEDIN_ACCESS_TOKEN",
            "instagram_token": "INSTAGRAM_ACCESS_TOKEN"
        }
        
        env_var = env_mapping.get(service)
        if env_var:
            return os.getenv(env_var)
        
        return None
    
    async def get_openai_key(self) -> Optional[str]:
        """Get OpenAI API key"""
        return await self.get_api_key("openai")
    
    async def get_openrouter_key(self) -> Optional[str]:
        """Get OpenRouter API key"""
        return await self.get_api_key("openrouter")
    
    async def get_google_key(self) -> Optional[str]:
        """Get Google API key"""
        return await self.get_api_key("google")
    
    async def get_discord_webhook(self) -> Optional[str]:
        """Get Discord webhook URL"""
        return await self.get_api_key("discord")
    
    async def get_twilio_credentials(self) -> Dict[str, Optional[str]]:
        """Get Twilio credentials"""
        return {
            "account_sid": await self.get_api_key("twilio_sid"),
            "auth_token": await self.get_api_key("twilio_token"),
            "phone_number": await self.get_api_key("twilio_phone")
        }
    
    async def get_twitter_credentials(self) -> Dict[str, Optional[str]]:
        """Get Twitter API credentials"""
        return {
            "api_key": await self.get_api_key("twitter_api_key"),
            "api_secret": await self.get_api_key("twitter_api_secret"),
            "access_token": await self.get_api_key("twitter_access_token"),
            "access_secret": await self.get_api_key("twitter_access_secret")
        }
    
    async def get_stability_key(self) -> Optional[str]:
        """Get Stability AI API key"""
        return await self.get_api_key("stability")
    
    async def get_github_token(self) -> Optional[str]:
        """Get GitHub personal access token"""
        return await self.get_api_key("github")
    
    async def get_linkedin_token(self) -> Optional[str]:
        """Get LinkedIn access token"""
        return await self.get_api_key("linkedin_token")
    
    async def get_instagram_token(self) -> Optional[str]:
        """Get Instagram access token"""
        return await self.get_api_key("instagram_token")
    
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
