import os
import aiohttp
import asyncio
import json
from typing import Dict, Any, Optional
from datetime import datetime

# Twitter API dependencies
try:
    import tweepy
    TWEEPY_AVAILABLE = True
except ImportError:
    TWEEPY_AVAILABLE = False

# LinkedIn API dependencies
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

class SocialMediaPoster:
    """Handle social media posting to various platforms"""
    
    def __init__(self):
        self.twitter_client = None
        self.setup_clients()
    
    def setup_clients(self):
        """Initialize social media clients with API credentials"""
        try:
            # Twitter/X API v2 setup
            if TWEEPY_AVAILABLE:
                api_key = os.getenv("TWITTER_API_KEY")
                api_secret = os.getenv("TWITTER_API_SECRET")
                access_token = os.getenv("TWITTER_ACCESS_TOKEN")
                access_token_secret = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
                
                if all([api_key, api_secret, access_token, access_token_secret]):
                    try:
                        self.twitter_client = tweepy.Client(
                            consumer_key=api_key,
                            consumer_secret=api_secret,
                            access_token=access_token,
                            access_token_secret=access_token_secret
                        )
                        print("✅ Twitter client initialized")
                    except Exception as e:
                        print(f"⚠️ Twitter client setup failed: {str(e)}")
                else:
                    print("⚠️ Twitter credentials not found in environment")
            else:
                print("⚠️ Tweepy not available. Install with: pip install tweepy")
        except Exception as e:
            print(f"❌ Error setting up social media clients: {str(e)}")
    
    async def post_to_twitter(self, content: str, image_path: Optional[str] = None) -> Dict[str, Any]:
        """Post to Twitter/X"""
        try:
            if not self.twitter_client:
                return {"success": False, "error": "Twitter client not initialized"}
            
            # Limit content to Twitter's character limit
            if len(content) > 280:
                content = content[:277] + "..."
            
            # Post with or without media
            if image_path and os.path.exists(image_path):
                # Upload media first (requires Twitter API v1.1 for media upload)
                api_key = os.getenv("TWITTER_API_KEY")
                api_secret = os.getenv("TWITTER_API_SECRET")
                access_token = os.getenv("TWITTER_ACCESS_TOKEN")
                access_token_secret = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
                
                if all([api_key, api_secret, access_token, access_token_secret]):
                    # Use v1.1 API for media upload
                    auth = tweepy.OAuth1UserHandler(
                        api_key, api_secret, access_token, access_token_secret
                    )
                    api_v1 = tweepy.API(auth)
                    
                    try:
                        media = api_v1.media_upload(image_path)
                        response = self.twitter_client.create_tweet(
                            text=content,
                            media_ids=[media.media_id]
                        )
                        print(f"📱 Posted to Twitter with image: {response.data['id']}")
                        return {
                            "success": True,
                            "platform": "twitter",
                            "post_id": response.data['id'],
                            "url": f"https://twitter.com/user/status/{response.data['id']}",
                            "content": content,
                            "has_media": True
                        }
                    except Exception as e:
                        print(f"⚠️ Twitter media upload failed: {str(e)}")
                        # Fall back to text-only post
                        response = self.twitter_client.create_tweet(text=content)
                        print(f"📱 Posted to Twitter (text only): {response.data['id']}")
                        return {
                            "success": True,
                            "platform": "twitter",
                            "post_id": response.data['id'],
                            "url": f"https://twitter.com/user/status/{response.data['id']}",
                            "content": content,
                            "has_media": False,
                            "note": "Image upload failed, posted text only"
                        }
                else:
                    # Text-only post
                    response = self.twitter_client.create_tweet(text=content)
                    print(f"📱 Posted to Twitter: {response.data['id']}")
                    return {
                        "success": True,
                        "platform": "twitter",
                        "post_id": response.data['id'],
                        "url": f"https://twitter.com/user/status/{response.data['id']}",
                        "content": content,
                        "has_media": False
                    }
            else:
                # Text-only post
                response = self.twitter_client.create_tweet(text=content)
                print(f"📱 Posted to Twitter: {response.data['id']}")
                return {
                    "success": True,
                    "platform": "twitter",
                    "post_id": response.data['id'],
                    "url": f"https://twitter.com/user/status/{response.data['id']}",
                    "content": content,
                    "has_media": False
                }
                
        except tweepy.Forbidden as e:
            error_msg = f"Twitter API access forbidden: {str(e)}"
            print(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}
        except tweepy.TooManyRequests as e:
            error_msg = f"Twitter API rate limit exceeded: {str(e)}"
            print(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}
        except Exception as e:
            error_msg = f"Twitter posting failed: {str(e)}"
            print(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}
    
    async def post_to_linkedin(self, content: str, image_path: Optional[str] = None) -> Dict[str, Any]:
        """Post to LinkedIn"""
        try:
            access_token = os.getenv("LINKEDIN_ACCESS_TOKEN")
            
            if not access_token:
                return {"success": False, "error": "LinkedIn access token not found"}
            
            # LinkedIn API requires person ID
            # This is a simplified implementation - in production, you'd need proper OAuth flow
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            # Create post payload
            post_data = {
                "author": "urn:li:person:YOUR_PERSON_ID",  # This would need to be dynamic
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {
                            "text": content
                        },
                        "shareMediaCategory": "NONE"
                    }
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            }
            
            # Note: This is a placeholder implementation
            # Full LinkedIn integration requires proper OAuth setup
            print(f"📱 LinkedIn posting prepared (credentials needed for actual posting)")
            return {
                "success": False,
                "error": "LinkedIn posting requires full OAuth setup",
                "platform": "linkedin",
                "content": content,
                "note": "Implementation ready, needs LinkedIn app credentials"
            }
            
        except Exception as e:
            error_msg = f"LinkedIn posting failed: {str(e)}"
            print(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}
    
    async def post_to_instagram(self, content: str, image_path: Optional[str] = None) -> Dict[str, Any]:
        """Post to Instagram"""
        try:
            access_token = os.getenv("INSTAGRAM_ACCESS_TOKEN")
            
            if not access_token:
                return {"success": False, "error": "Instagram access token not found"}
            
            # Instagram requires images for posts
            if not image_path or not os.path.exists(image_path):
                return {"success": False, "error": "Instagram posting requires an image"}
            
            # Note: This is a placeholder implementation
            # Full Instagram integration requires Instagram Basic Display API or Instagram Graph API
            print(f"📱 Instagram posting prepared (Business API needed for actual posting)")
            return {
                "success": False,
                "error": "Instagram posting requires Instagram Business API setup",
                "platform": "instagram",
                "content": content,
                "note": "Implementation ready, needs Instagram Business API credentials"
            }
            
        except Exception as e:
            error_msg = f"Instagram posting failed: {str(e)}"
            print(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}
    
    async def post_via_webhook(self, webhook_url: str, content: str, platform: str, image_path: Optional[str] = None) -> Dict[str, Any]:
        """Post via custom webhook (e.g., Zapier, IFTTT)"""
        try:
            payload = {
                "platform": platform,
                "content": content,
                "timestamp": datetime.utcnow().isoformat(),
                "source": "AutoFlow"
            }
            
            if image_path and os.path.exists(image_path):
                # Convert image to base64 for webhook
                import base64
                try:
                    with open(image_path, "rb") as image_file:
                        encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
                        payload["image"] = {
                            "data": encoded_image,
                            "filename": os.path.basename(image_path),
                            "mime_type": "image/png"
                        }
                except Exception as e:
                    print(f"⚠️ Could not encode image for webhook: {str(e)}")
            
            timeout = aiohttp.ClientTimeout(total=30)
            
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(
                    webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    
                    if response.status == 200:
                        response_data = await response.text()
                        print(f"📱 Posted via webhook to {platform}")
                        return {
                            "success": True,
                            "platform": platform,
                            "method": "webhook",
                            "webhook_url": webhook_url,
                            "content": content,
                            "response": response_data[:200] if response_data else "Success"
                        }
                    else:
                        error_msg = f"Webhook returned status {response.status}"
                        return {"success": False, "error": error_msg}
                        
        except Exception as e:
            error_msg = f"Webhook posting failed: {str(e)}"
            print(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}

async def run_social_media_node(node_data: Dict[str, Any]) -> str:
    """Main function for social media posting node"""
    try:
        platform = node_data.get("platform", "twitter").lower()
        content = node_data.get("content", "")
        image_path = node_data.get("image_path", "")
        webhook_url = node_data.get("webhook_url", "")
        
        if not content.strip():
            return "Error: Social media content is required"
        
        print(f"📱 Posting to {platform}: {content[:50]}...")
        
        # Initialize poster
        poster = SocialMediaPoster()
        
        # Validate image path if provided
        if image_path and not os.path.exists(image_path):
            print(f"⚠️ Image file not found: {image_path}")
            image_path = None
        
        # Route to appropriate platform
        result = None
        
        if platform == "twitter":
            result = await poster.post_to_twitter(content, image_path)
        elif platform == "linkedin":
            result = await poster.post_to_linkedin(content, image_path)
        elif platform == "instagram":
            result = await poster.post_to_instagram(content, image_path)
        elif platform == "webhook" and webhook_url:
            result = await poster.post_via_webhook(webhook_url, content, "custom", image_path)
        else:
            # Try webhook if platform not supported directly
            if webhook_url:
                result = await poster.post_via_webhook(webhook_url, content, platform, image_path)
            else:
                return f"Error: Platform '{platform}' not supported. Supported: twitter, linkedin, instagram, webhook"
        
        # Process result
        if result and result.get("success"):
            success_msg = f"Posted to {platform} successfully"
            if result.get("post_id"):
                success_msg += f" (ID: {result['post_id']})"
            if result.get("url"):
                success_msg += f" - {result['url']}"
            if result.get("note"):
                success_msg += f" - Note: {result['note']}"
            
            print(f"✅ {success_msg}")
            return success_msg
        else:
            error_msg = result.get("error", "Unknown error") if result else "Posting failed"
            print(f"❌ Social media posting failed: {error_msg}")
            return f"Social media posting failed: {error_msg}"
            
    except Exception as e:
        error_msg = f"Social media node execution failed: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg

# Helper function to check social media credentials
def check_social_media_credentials():
    """Check which social media platforms are configured"""
    status = {
        "twitter": {
            "configured": all([
                os.getenv("TWITTER_API_KEY"),
                os.getenv("TWITTER_API_SECRET"),
                os.getenv("TWITTER_ACCESS_TOKEN"),
                os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
            ]),
            "library": "tweepy" if TWEEPY_AVAILABLE else "missing"
        },
        "linkedin": {
            "configured": bool(os.getenv("LINKEDIN_ACCESS_TOKEN")),
            "library": "requests" if REQUESTS_AVAILABLE else "missing"
        },
        "instagram": {
            "configured": bool(os.getenv("INSTAGRAM_ACCESS_TOKEN")),
            "library": "requests" if REQUESTS_AVAILABLE else "missing"
        }
    }
    
    return status

# Test function
async def test_social_media_posting():
    """Test social media posting capabilities"""
    print("🧪 Testing social media posting capabilities...")
    
    credentials = check_social_media_credentials()
    
    for platform, status in credentials.items():
        config_status = "✅" if status["configured"] else "❌"
        lib_status = "✅" if status["library"] != "missing" else "❌"
        print(f"{config_status} {platform.title()}: Credentials {config_status}, Library {lib_status}")
    
    # Test with sample data
    test_data = {
        "platform": "twitter",
        "content": "🧪 Test post from AutoFlow! This is an automated test of the social media posting feature. #AutoFlow #TestPost",
        "image_path": "",
        "webhook_url": ""
    }
    
    print(f"\n🔬 Running test post...")
    result = await run_social_media_node(test_data)
    print(f"Test result: {result}")

if __name__ == "__main__":
    # For testing purposes
    import asyncio
    asyncio.run(test_social_media_posting())
