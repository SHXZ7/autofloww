import aiohttp
import asyncio
import json
import os
from typing import Dict, Any, Optional
from datetime import datetime

async def run_webhook_node(webhook_data: Dict[str, Any]) -> str:
    """Execute webhook request with enhanced error handling and validation"""
    try:
        webhook_url = webhook_data.get("webhook_url", "").strip()
        method = webhook_data.get("method", "POST").upper()
        description = webhook_data.get("description", "")
        webhook_payload = webhook_data.get("webhook_payload", {})
        body = webhook_data.get("body", "")
        headers = webhook_data.get("headers", {})
        auth_token = webhook_data.get("auth_token", "")
        timeout = webhook_data.get("timeout", 30)
        
        # Enhanced validation
        if not webhook_url:
            # For local/test workflows, just return a dummy result so the workflow continues
            print("⚠️ Webhook node triggered (no URL provided), returning dummy result.")
            return "Webhook triggered (no URL provided)"
        
        # Validate URL format
        if not webhook_url.startswith(('http://', 'https://')):
            return f"Error: Invalid webhook URL format: {webhook_url}"
        
        # Validate HTTP method
        valid_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]
        if method not in valid_methods:
            return f"Error: Unsupported HTTP method '{method}'. Supported: {', '.join(valid_methods)}"
        
        # Parse body if it's a JSON string
        if body and isinstance(body, str):
            try:
                webhook_payload = json.loads(body)
            except json.JSONDecodeError as e:
                print(f"⚠️ Invalid JSON in webhook body: {body[:100]}...")
                print(f"⚠️ JSON Error: {str(e)}")
                # Use body as plain text data instead of failing
                webhook_payload = {"data": body}
        
        # Prepare headers with authentication
        request_headers = {
            "Content-Type": "application/json",
            "User-Agent": "AutoFlow-Webhook/1.0",
            "X-AutoFlow-Timestamp": datetime.utcnow().isoformat(),
            **headers  # Merge any custom headers
        }
        
        # Add authentication if provided
        if auth_token:
            if auth_token.startswith("Bearer "):
                request_headers["Authorization"] = auth_token
            else:
                request_headers["Authorization"] = f"Bearer {auth_token}"
        
        print(f"🔗 Webhook Details:")
        print(f"   Method: {method}")
        print(f"   URL: {webhook_url}")
        print(f"   Timeout: {timeout}s")
        print(f"   Headers: {len(request_headers)} custom headers")
        print(f"   Payload size: {len(str(webhook_payload))} characters")
        if description:
            print(f"   Description: {description}")
        
        # Use aiohttp for async requests with proper timeout and error handling
        timeout_config = aiohttp.ClientTimeout(total=timeout)
        
        async with aiohttp.ClientSession(timeout=timeout_config) as session:
            try:
                if method == "GET":
                    # For GET requests, add payload as query parameters if provided
                    params = webhook_payload if isinstance(webhook_payload, dict) else None
                    async with session.get(webhook_url, headers=request_headers, params=params) as response:
                        status = response.status
                        response_text = await response.text()
                        response_headers = dict(response.headers)
                        
                elif method in ["POST", "PUT", "PATCH"]:
                    async with session.request(
                        method, 
                        webhook_url, 
                        json=webhook_payload,
                        headers=request_headers
                    ) as response:
                        status = response.status
                        response_text = await response.text()
                        response_headers = dict(response.headers)
                        
                elif method == "DELETE":
                    async with session.delete(webhook_url, headers=request_headers) as response:
                        status = response.status
                        response_text = await response.text()
                        response_headers = dict(response.headers)
                        
                elif method == "HEAD":
                    async with session.head(webhook_url, headers=request_headers) as response:
                        status = response.status
                        response_text = ""  # HEAD responses don't have body
                        response_headers = dict(response.headers)
                        
                elif method == "OPTIONS":
                    async with session.options(webhook_url, headers=request_headers) as response:
                        status = response.status
                        response_text = await response.text()
                        response_headers = dict(response.headers)
                        
                else:
                    return f"Error: Unsupported HTTP method {method}"
                
                # Enhanced response handling
                print(f"✅ Webhook response received:")
                print(f"   Status: {status}")
                print(f"   Response size: {len(response_text)} characters")
                print(f"   Content-Type: {response_headers.get('content-type', 'Unknown')}")
                
                # Determine success based on status code
                if 200 <= status < 300:
                    success_msg = f"Webhook {description or 'request'} executed successfully"
                    
                    # Include response data if available and not too large
                    if response_text and len(response_text) < 500:
                        try:
                            # Try to parse JSON response
                            response_json = json.loads(response_text)
                            success_msg += f" | Response: {response_json}"
                        except json.JSONDecodeError:
                            # Use plain text response
                            success_msg += f" | Response: {response_text[:200]}..."
                    
                    success_msg += f" | Status: {status}"
                    return success_msg
                    
                elif 400 <= status < 500:
                    error_msg = f"Webhook client error: {status}"
                    if response_text:
                        error_msg += f" | {response_text[:200]}"
                    return error_msg
                    
                elif 500 <= status < 600:
                    error_msg = f"Webhook server error: {status}"
                    if response_text:
                        error_msg += f" | {response_text[:200]}"
                    return error_msg
                    
                else:
                    return f"Webhook request completed with status: {status}"
                    
            except aiohttp.ClientResponseError as e:
                error_msg = f"Webhook HTTP error: {e.status} - {e.message}"
                print(f"❌ {error_msg}")
                return error_msg
                
            except aiohttp.ClientConnectorError as e:
                error_msg = f"Webhook connection error: Unable to connect to {webhook_url}"
                print(f"❌ {error_msg}")
                return error_msg

    except asyncio.TimeoutError:
        error_msg = f"Webhook request timed out after {timeout} seconds"
        print(f"❌ {error_msg}")
        return error_msg
        
    except aiohttp.ClientError as e:
        error_msg = f"Webhook client error: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg
        
    except json.JSONDecodeError as e:
        error_msg = f"Webhook JSON error: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg
        
    except Exception as e:
        error_msg = f"Webhook failed: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg

async def validate_webhook_url(url: str) -> Dict[str, Any]:
    """Validate if webhook URL is reachable"""
    try:
        if not url.startswith(('http://', 'https://')):
            return {"valid": False, "error": "URL must start with http:// or https://"}
        
        timeout_config = aiohttp.ClientTimeout(total=10)
        
        async with aiohttp.ClientSession(timeout=timeout_config) as session:
            async with session.head(url) as response:
                return {
                    "valid": True,
                    "status": response.status,
                    "headers": dict(response.headers),
                    "message": "URL is reachable"
                }
                
    except asyncio.TimeoutError:
        return {"valid": False, "error": "URL validation timeout"}
    except aiohttp.ClientError as e:
        return {"valid": False, "error": f"Connection error: {str(e)}"}
    except Exception as e:
        return {"valid": False, "error": f"Validation error: {str(e)}"}

async def test_webhook_node(webhook_url: str) -> Dict[str, Any]:
    """Test a webhook with a simple ping payload"""
    test_data = {
        "webhook_url": webhook_url,
        "method": "POST",
        "description": "AutoFlow webhook test",
        "webhook_payload": {
            "test": True,
            "message": "Hello from AutoFlow!",
            "timestamp": datetime.utcnow().isoformat(),
            "source": "AutoFlow Webhook Test"
        },
        "timeout": 10
    }
    
    print(f"🧪 Testing webhook: {webhook_url}")
    result = await run_webhook_node(test_data)
    
    return {
        "success": "successfully" in result.lower(),
        "result": result,
        "url": webhook_url
    }

def get_webhook_examples() -> Dict[str, Dict[str, Any]]:
    """Get example webhook configurations"""
    return {
        "discord": {
            "method": "POST",
            "headers": {"Content-Type": "application/json"},
            "webhook_payload": {
                "content": "Hello from AutoFlow!",
                "username": "AutoFlow Bot",
                "embeds": [
                    {
                        "title": "Workflow Notification",
                        "description": "Your workflow has completed successfully!",
                        "color": 3447003,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                ]
            }
        },
        "slack": {
            "method": "POST",
            "headers": {"Content-Type": "application/json"},
            "webhook_payload": {
                "text": "Hello from AutoFlow!",
                "username": "AutoFlow Bot",
                "channel": "#general",
                "attachments": [
                    {
                        "color": "good",
                        "title": "Workflow Completed",
                        "text": "Your AutoFlow workflow has finished running successfully.",
                        "ts": int(datetime.utcnow().timestamp())
                    }
                ]
            }
        },
        "zapier": {
            "method": "POST",
            "headers": {"Content-Type": "application/json"},
            "webhook_payload": {
                "workflow_id": "autoflow_workflow",
                "status": "completed",
                "data": {
                    "message": "Workflow executed successfully",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        },
        "microsoft_teams": {
            "method": "POST",
            "headers": {"Content-Type": "application/json"},
            "webhook_payload": {
                "@type": "MessageCard",
                "@context": "http://schema.org/extensions",
                "themeColor": "0076D7",
                "summary": "AutoFlow Notification",
                "sections": [
                    {
                        "activityTitle": "Workflow Completed",
                        "activitySubtitle": "AutoFlow",
                        "activityImage": "https://i.imgur.com/4M34hi2.png",
                        "facts": [
                            {"name": "Status", "value": "Success"},
                            {"name": "Time", "value": datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
                        ],
                        "markdown": True
                    }
                ]
            }
        }
    }

# Helper function for webhook security
def generate_webhook_signature(payload: str, secret: str) -> str:
    """Generate HMAC signature for webhook security"""
    import hmac
    import hashlib
    
    return hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

async def secure_webhook_request(webhook_data: Dict[str, Any], secret: str) -> str:
    """Make a secure webhook request with HMAC signature"""
    if not secret:
        return await run_webhook_node(webhook_data)
    
    # Add security headers
    payload_str = json.dumps(webhook_data.get("webhook_payload", {}))
    signature = generate_webhook_signature(payload_str, secret)
    
    headers = webhook_data.get("headers", {})
    headers.update({
        "X-AutoFlow-Signature": f"sha256={signature}",
        "X-AutoFlow-Timestamp": str(int(datetime.utcnow().timestamp()))
    })
    
    webhook_data["headers"] = headers
    return await run_webhook_node(webhook_data)

# Usage examples and documentation
"""
📋 WEBHOOK USAGE GUIDE:

1. BASIC WEBHOOK:
   ```python
   webhook_data = {
       "webhook_url": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
       "method": "POST",
       "webhook_payload": {
           "text": "Hello from AutoFlow!",
           "username": "AutoFlow Bot"
       }
   }
   result = await run_webhook_node(webhook_data)
   ```

2. WITH AUTHENTICATION:
   ```python
   webhook_data = {
       "webhook_url": "https://api.example.com/webhook",
       "method": "POST",
       "auth_token": "your-bearer-token",
       "webhook_payload": {"message": "Hello!"}
   }
   ```

3. CUSTOM HEADERS:
   ```python
   webhook_data = {
       "webhook_url": "https://api.example.com/webhook",
       "method": "POST",
       "headers": {
           "X-Custom-Header": "value",
           "X-API-Key": "your-api-key"
       },
       "webhook_payload": {"data": "value"}
   }
   ```

4. TEST WEBHOOK:
   ```python
   test_result = await test_webhook_node("https://httpbin.org/post")
   print(test_result)
   ```

5. VALIDATE URL:
   ```python
   validation = await validate_webhook_url("https://example.com/webhook")
   if validation["valid"]:
       print("Webhook URL is reachable!")
   ```

6. SECURE WEBHOOK:
   ```python
   result = await secure_webhook_request(webhook_data, "your-secret-key")
   ```
"""

if __name__ == "__main__":
    # For testing purposes
    print("Webhook Service Test Module")
    print("Available functions:")
    print("- run_webhook_node(webhook_data)")
    print("- validate_webhook_url(url)")
    print("- test_webhook_node(url)")
    print("- get_webhook_examples()")
