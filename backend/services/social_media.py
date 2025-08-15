import os
import httpx
import json
from typing import Dict, Any, Optional
from datetime import datetime
import base64

# Twitter API (requires tweepy)
try:
    import tweepy
    TWITTER_AVAILABLE = True
except ImportError:
    TWITTER_AVAILABLE = False

# LinkedIn API (using httpx for direct API calls)
# Instagram API (using httpx for Facebook Graph API)

class SocialMediaPoster:
    """Unified social media posting service"""
    
    def __init__(self):
        self.platforms = {
            'twitter': self.post_to_twitter,
            'linkedin': self.post_to_linkedin,
            'instagram': self.post_to_instagram,
            'discord_webhook': self.post_to_discord_webhook  # For testing
        }
    
    async def post_to_twitter(self, content: str, image_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Post to Twitter using API v2"""
        try:
            if not TWITTER_AVAILABLE:
                return {"error": "Twitter integration requires tweepy: pip install tweepy"}
            
            # Get Twitter credentials from environment
            api_key = os.getenv("TWITTER_API_KEY")
            api_secret = os.getenv("TWITTER_API_SECRET")
            access_token = os.getenv("TWITTER_ACCESS_TOKEN")
            access_token_secret = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
            bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
            
            if not all([api_key, api_secret, access_token, access_token_secret]):
                return {"error": "Twitter credentials not configured. Please set TWITTER_* environment variables."}
            
            # Initialize Twitter API client
            client = tweepy.Client(
                bearer_token=bearer_token,
                consumer_key=api_key,
                consumer_secret=api_secret,
                access_token=access_token,
                access_token_secret=access_token_secret,
                wait_on_rate_limit=True
            )
            
            # Initialize API v1.1 for media upload
            auth = tweepy.OAuth1UserHandler(api_key, api_secret, access_token, access_token_secret)
            api_v1 = tweepy.API(auth)
            
            media_ids = []
            
            # Upload image if provided
            if image_path and os.path.exists(image_path):
                try:
                    media = api_v1.media_upload(image_path)
                    media_ids.append(media.media_id)
                    print(f"📸 Uploaded image to Twitter: {media.media_id}")
                except Exception as e:
                    print(f"⚠️ Image upload failed: {str(e)}")
            
            # Post tweet
            tweet_params = {"text": content[:280]}  # Twitter character limit
            if media_ids:
                tweet_params["media_ids"] = media_ids
            
            response = client.create_tweet(**tweet_params)
            
            tweet_id = response.data['id']
            tweet_url = f"https://twitter.com/user/status/{tweet_id}"
            
            return {
                "success": True,
                "platform": "twitter",
                "post_id": tweet_id,
                "post_url": tweet_url,
                "message": f"Posted to Twitter successfully: {tweet_url}"
            }
            
        except Exception as e:
            return {"error": f"Twitter posting failed: {str(e)}"}
    
    async def post_to_linkedin(self, content: str, image_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Post to LinkedIn using LinkedIn API"""
        try:
            access_token = os.getenv("LINKEDIN_ACCESS_TOKEN")
            user_id = os.getenv("LINKEDIN_USER_ID")  # LinkedIn person URN
            
            if not access_token or not user_id:
                return {"error": "LinkedIn credentials not configured. Please set LINKEDIN_ACCESS_TOKEN and LINKEDIN_USER_ID."}
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0"
            }
            
            # Prepare post data
            post_data = {
                "author": f"urn:li:person:{user_id}",
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
            
            # Handle image upload if provided
            if image_path and os.path.exists(image_path):
                try:
                    # LinkedIn image upload is complex, simplified for demo
                    post_data["specificContent"]["com.linkedin.ugc.ShareContent"]["shareMediaCategory"] = "IMAGE"
                    # In real implementation, you'd need to upload the image first using LinkedIn's media upload API
                    print(f"📸 Image upload to LinkedIn not fully implemented in demo")
                except Exception as e:
                    print(f"⚠️ LinkedIn image upload failed: {str(e)}")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.linkedin.com/v2/ugcPosts",
                    json=post_data,
                    headers=headers,
                    timeout=30.0
                )
                response.raise_for_status()
            
            post_id = response.headers.get('x-restli-id', 'unknown')
            
            return {
                "success": True,
                "platform": "linkedin",
                "post_id": post_id,
                "message": f"Posted to LinkedIn successfully"
            }
            
        except Exception as e:
            return {"error": f"LinkedIn posting failed: {str(e)}"}
    
    async def post_to_instagram(self, content: str, image_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Post to Instagram using Instagram Graph API"""
        try:
            access_token = os.getenv("INSTAGRAM_ACCESS_TOKEN")
            instagram_account_id = os.getenv("INSTAGRAM_ACCOUNT_ID")
            
            if not access_token or not instagram_account_id:
                return {"error": "Instagram credentials not configured. Please set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID."}
            
            if not image_path or not os.path.exists(image_path):
                return {"error": "Instagram requires an image. Please provide a valid image path."}
            
            # Instagram posting requires image upload to a public URL first
            # This is a simplified version - in production, you'd upload to your own server
            # or use Facebook's media upload endpoints
            
            headers = {"Authorization": f"Bearer {access_token}"}
            
            # Step 1: Create media container (simplified)
            media_data = {
                "image_url": f"https://your-server.com/images/{os.path.basename(image_path)}",  # Placeholder
                "caption": content,
                "access_token": access_token
            }
            
            async with httpx.AsyncClient() as client:
                # Create media container
                response = await client.post(
                    f"https://graph.facebook.com/v18.0/{instagram_account_id}/media",
                    data=media_data,
                    timeout=30.0
                )
                response.raise_for_status()
                
                container_id = response.json().get("id")
                
                # Publish media
                publish_data = {
                    "creation_id": container_id,
                    "access_token": access_token
                }
                
                publish_response = await client.post(
                    f"https://graph.facebook.com/v18.0/{instagram_account_id}/media_publish",
                    data=publish_data,
                    timeout=30.0
                )
                publish_response.raise_for_status()
                
                post_id = publish_response.json().get("id")
            
            return {
                "success": True,
                "platform": "instagram",
                "post_id": post_id,
                "message": f"Posted to Instagram successfully"
            }
            
        except Exception as e:
            return {"error": f"Instagram posting failed: {str(e)}. Note: Instagram API requires proper media hosting."}
    
    async def post_to_discord_webhook(self, content: str, image_path: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Post to Discord webhook for testing social media functionality"""
        try:
            webhook_url = kwargs.get("webhook_url") or os.getenv("SOCIAL_MEDIA_TEST_WEBHOOK")
            
            if not webhook_url:
                return {"error": "Discord webhook URL required for testing. Set SOCIAL_MEDIA_TEST_WEBHOOK or provide webhook_url."}
            
            # Create rich embed for social media preview
            embed = {
                "title": "🚀 Social Media Post (Test Mode)",
                "description": content,
                "color": 5814783,
                "fields": [
                    {"name": "Platform", "value": kwargs.get("target_platform", "Unknown"), "inline": True},
                    {"name": "Content Length", "value": f"{len(content)} characters", "inline": True},
                    {"name": "Image", "value": "Yes" if image_path else "No", "inline": True}
                ],
                "footer": {"text": "AutoFlow Social Media Test"},
                "timestamp": datetime.now().isoformat()
            }
            
            if image_path and os.path.exists(image_path):
                # In a real implementation, you'd upload the image and set embed.image.url
                embed["fields"].append({
                    "name": "Image File", 
                    "value": os.path.basename(image_path), 
                    "inline": False
                })
            
            payload = {
                "embeds": [embed],
                "username": "AutoFlow Social Media Bot"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    webhook_url,
                    json=payload,
                    timeout=30.0
                )
                response.raise_for_status()
            
            return {
                "success": True,
                "platform": "discord_webhook",
                "message": f"Posted to Discord webhook successfully (simulating {kwargs.get('target_platform', 'social media')})"
            }
            
        except Exception as e:
            return {"error": f"Discord webhook posting failed: {str(e)}"}

async def run_social_media_node(node_data: Dict[str, Any]) -> str:
    """Main function for social media node"""
    try:
        platform = node_data.get("platform", "twitter").lower()
        content = node_data.get("content", "")
        image_path = node_data.get("image_path", "")
        webhook_url = node_data.get("webhook_url", "")  # For Discord testing
        
        if not content:
            return "Error: Social media content is required"
        
        print(f"📱 Posting to {platform}: {content[:50]}...")
        
        poster = SocialMediaPoster()
        
        # Determine which platform to use
        if platform in ["discord", "test"] or webhook_url:
            # Use Discord webhook for testing
            result = await poster.post_to_discord_webhook(
                content, 
                image_path if image_path and os.path.exists(image_path) else None,
                webhook_url=webhook_url,
                target_platform=platform
            )
        elif platform in poster.platforms:
            # Use real platform API
            post_func = poster.platforms[platform]
            result = await post_func(
                content, 
                image_path if image_path and os.path.exists(image_path) else None
            )
        else:
            return f"Error: Unsupported platform '{platform}'. Supported: {list(poster.platforms.keys())}"
        
        if result.get("success"):
            print(f"✅ {result['message']}")
            return result["message"]
        else:
            error_msg = result.get("error", "Unknown error")
            print(f"❌ Social media posting failed: {error_msg}")
            return f"Error: {error_msg}"
            
    except Exception as e:
        return f"Social media posting failed: {str(e)}"
