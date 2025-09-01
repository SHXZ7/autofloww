import httpx
import json
import re
import aiohttp
import asyncio
import os
from typing import Dict, Any, Optional, List

async def send_discord_message(webhook_url: str, content: str, embeds: Optional[list] = None, files: Optional[list] = None):
    """Send a message to Discord via webhook"""
    try:
        # Prepare the payload
        payload = {
            "content": content[:2000] if content else ""  # Discord has 2000 char limit
        }
        
        # Add embeds if provided
        if embeds:
            payload["embeds"] = embeds
        
        headers = {
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                webhook_url,
                json=payload,
                headers=headers,
                timeout=30.0
            )
            response.raise_for_status()
        
        return {"success": True, "message": "Message sent to Discord successfully"}
    
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return {"error": "Discord webhook not found. Please check the webhook URL."}
        elif e.response.status_code == 400:
            return {"error": "Invalid message format or content too long."}
        else:
            return {"error": f"Discord API error: {e.response.status_code}"}
    except Exception as e:
        return {"error": f"Failed to send Discord message: {str(e)}"}

async def run_discord_node(discord_data: Dict[str, Any]) -> str:
    """Send message to Discord via webhook"""
    try:
        webhook_url = discord_data.get("webhook_url", "")
        message = discord_data.get("message", "")
        username = discord_data.get("username", "AutoFlow Bot")
        embeds = discord_data.get("embeds", [])
        
        # Use environment webhook if none provided
        if not webhook_url:
            webhook_url = os.getenv("SOCIAL_MEDIA_TEST_WEBHOOK", "")
        
        if not webhook_url:
            return "Error: Discord webhook URL not configured"
        
        print(f"🎮 Sending Discord message to webhook")
        print(f"📝 Message: {message[:100]}..." if message else "📝 Message: (embeds only)")
        print(f"🔗 Webhook: {webhook_url[:50]}...")
        
        # Prepare payload
        payload = {
            "username": username,
            "avatar_url": "https://i.imgur.com/4M34hi2.png"  # AutoFlow bot avatar
        }
        
        # Add message content if provided
        if message:
            payload["content"] = message
        
        # Add embeds if provided
        if embeds:
            payload["embeds"] = embeds[:10]  # Discord limit is 10 embeds
            print(f"📊 Sending {len(embeds)} embed(s)")
        
        # If no message and no embeds, send default message
        if not message and not embeds:
            payload["content"] = "🤖 AutoFlow workflow completed successfully!"
        
        # Use aiohttp for async request with timeout
        timeout = aiohttp.ClientTimeout(total=10)
        
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(webhook_url, json=payload) as response:
                if response.status == 204:
                    print("✅ Discord message sent successfully!")
                    return "Discord message sent successfully"
                else:
                    error_text = await response.text()
                    print(f"❌ Discord webhook failed: {response.status} - {error_text}")
                    return f"Discord webhook failed: {response.status}"
    
    except asyncio.TimeoutError:
        print(f"❌ Discord webhook timeout")
        return "Discord webhook timeout: Request timed out after 10 seconds"
    except aiohttp.ClientError as e:
        print(f"❌ Discord client error: {str(e)}")
        return f"Discord client error: {str(e)}"
    except Exception as e:
        print(f"❌ Discord webhook failed: {str(e)}")
        return f"Discord webhook failed: {str(e)}"

def validate_discord_webhook(webhook_url: str) -> bool:
    """Validate if the URL is a valid Discord webhook URL"""
    discord_webhook_pattern = r'^https://discord(?:app)?\.com/api/webhooks/\d+/[\w-]+$'
    return bool(re.match(discord_webhook_pattern, webhook_url))

async def test_discord_webhook(webhook_url: str) -> Dict[str, Any]:
    """Test if Discord webhook is working"""
    if not validate_discord_webhook(webhook_url):
        return {"success": False, "error": "Invalid Discord webhook URL format"}
    
    test_message = "🎉 AutoFlow Discord integration test - This webhook is working!"
    
    result = await send_discord_message(
        webhook_url=webhook_url,
        content=test_message
    )
    
    return result

async def quick_discord_test(webhook_url: str = None):
    """Quick test function for development - pass your webhook URL"""
    if not webhook_url:
        print("❌ Please provide a Discord webhook URL")
        print("Usage: await quick_discord_test('YOUR_WEBHOOK_URL')")
        return
    
    print("🧪 Testing Discord webhook...")
    
    # Test 1: Validate URL format
    if not validate_discord_webhook(webhook_url):
        print("❌ Invalid Discord webhook URL format")
        return
    
    print("✅ Webhook URL format is valid")
    
    # Test 2: Send test message
    result = await test_discord_webhook(webhook_url)
    
    if result.get("success"):
        print("✅ Discord webhook is working! Check your Discord channel.")
    else:
        print(f"❌ Test failed: {result.get('error', 'Unknown error')}")
    
    return result

# HOW TO USE AND TEST DISCORD SERVICE:
"""
📋 DISCORD SETUP GUIDE:

1. GET DISCORD WEBHOOK:
   - Go to your Discord server
   - Right-click channel → Edit Channel → Integrations → Webhooks
   - Create New Webhook or copy existing URL
   - Format: https://discord.com/api/webhooks/ID/TOKEN

2. BASIC TESTING:
   ```python
   # Quick test in Python console
   import asyncio
   from services.discord import quick_discord_test
   
   webhook_url = "https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN"
   asyncio.run(quick_discord_test(webhook_url))
   ```

3. BASIC USAGE:
   ```python
   # Simple message
   result = await send_discord_message(
       webhook_url="YOUR_WEBHOOK_URL",
       content="Hello from AutoFlow!"
   )
   
   # With embeds
   embed = {
       "title": "🚨 Alert",
       "description": "Something important happened",
       "color": 16711680,  # Red
       "fields": [
           {"name": "Status", "value": "Error", "inline": True},
           {"name": "Time", "value": "2024-01-01", "inline": True}
       ]
   }
   result = await send_discord_message(
       webhook_url="YOUR_WEBHOOK_URL",
       content="",
       embeds=[embed]
   )
   ```

4. NODE USAGE (in workflows):
   ```python
   node_data = {
       "webhook_url": "YOUR_WEBHOOK_URL",
       "message": "Workflow completed successfully!",
       "username": "AutoFlow Bot",
       "avatar_url": "https://example.com/bot-avatar.png"
   }
   result = await run_discord_node(node_data)
   ```

5. TESTING CHECKLIST:
   ✅ Webhook URL format is correct
   ✅ Discord server permissions allow webhooks
   ✅ Message sends successfully
   ✅ Embeds display correctly
   ✅ Custom username/avatar works

6. COMMON ISSUES:
   - 404 Error: Webhook URL is wrong or deleted
   - 400 Error: Message too long (>2000 chars) or invalid format
   - 401 Error: Invalid webhook token
   - Network Error: Check internet connection

7. EMBED COLORS:
   - Red: 16711680 (errors)
   - Green: 65280 (success)
   - Blue: 255 (info)
   - Yellow: 16776960 (warnings)
   - Purple: 8388736 (notifications)
"""

if __name__ == "__main__":
    # For testing purposes
    print("Discord Service Test Module")
    print("Use: await quick_discord_test('YOUR_WEBHOOK_URL')")
    print("Use: await quick_discord_test('YOUR_WEBHOOK_URL')")
