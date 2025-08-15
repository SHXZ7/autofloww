import aiohttp
import asyncio
import json

async def run_webhook_node(webhook_data):
    try:
        webhook_url = webhook_data.get("webhook_url", "")
        method = webhook_data.get("method", "POST").upper()
        description = webhook_data.get("description", "")
        webhook_payload = webhook_data.get("webhook_payload", {})
        body = webhook_data.get("body", "")

        if not webhook_url:
            # For local/test workflows, just return a dummy result so the workflow continues
            print("Webhook node triggered (no URL provided), returning dummy result.")
            return "Webhook triggered (no URL provided)"

        # Parse body if it's a JSON string
        if body and isinstance(body, str):
            try:
                webhook_payload = json.loads(body)
            except json.JSONDecodeError:
                print(f"Warning: Invalid JSON in webhook body: {body}")
                webhook_payload = {"data": body}

        print(f"Making {method} request to {webhook_url}")
        
        # Use aiohttp for async requests with timeout
        timeout = aiohttp.ClientTimeout(total=10)  # 10 second timeout
        
        async with aiohttp.ClientSession(timeout=timeout) as session:
            if method == "GET":
                async with session.get(webhook_url) as response:
                    status = response.status
                    response_text = await response.text()
            elif method == "POST":
                async with session.post(webhook_url, json=webhook_payload) as response:
                    status = response.status
                    response_text = await response.text()
            elif method == "PUT":
                async with session.put(webhook_url, json=webhook_payload) as response:
                    status = response.status
                    response_text = await response.text()
            elif method == "DELETE":
                async with session.delete(webhook_url) as response:
                    status = response.status
                    response_text = await response.text()
            else:
                return f"Error: Unsupported HTTP method {method}"

        print(f"Webhook response status: {status}")
        return f"Webhook {description or 'request'} executed successfully. Status: {status}"

    except asyncio.TimeoutError:
        print(f"Webhook request timed out for URL: {webhook_url}")
        return f"Webhook timeout: Request to {webhook_url} timed out after 10 seconds"
    except aiohttp.ClientError as e:
        print(f"Webhook client error: {str(e)}")
        return f"Webhook client error: {str(e)}"
    except Exception as e:
        print(f"Webhook failed: {str(e)}")
        return f"Webhook failed: {str(e)}"
