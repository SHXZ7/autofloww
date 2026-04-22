import os
import re
import httpx


def _normalize_phone_number(phone_number: str) -> str:
    cleaned = re.sub(r"[^\d+]", "", phone_number or "")
    if not cleaned:
        return ""
    if cleaned.startswith("+"):
        return cleaned[1:]
    return cleaned


async def run_whatsapp_node(node_data: dict) -> str:
    """Send WhatsApp message using Meta WhatsApp Cloud API."""
    access_token = (node_data.get("access_token") or os.getenv("WHATSAPP_ACCESS_TOKEN") or "").strip()
    phone_number_id = (node_data.get("phone_number_id") or os.getenv("WHATSAPP_PHONE_NUMBER_ID") or "").strip()

    to_number = (node_data.get("to") or "").strip()
    message = (node_data.get("message") or "").strip()

    if not access_token:
        return "Error: WhatsApp access token not configured"
    if not phone_number_id:
        return "Error: WhatsApp phone number ID not configured"
    if not to_number:
        return "Error: Recipient phone number is required"
    if not message:
        return "Error: Message content is required"

    normalized_to = _normalize_phone_number(to_number)
    if not normalized_to:
        return f"Error: Invalid phone number format: {to_number}"

    endpoint = f"https://graph.facebook.com/v22.0/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": normalized_to,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": message,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(endpoint, headers=headers, json=payload)

        if response.status_code >= 400:
            detail = response.text[:400]
            return f"Error: WhatsApp API request failed ({response.status_code}): {detail}"

        data = response.json() if response.content else {}
        message_id = ""
        if isinstance(data, dict):
            messages = data.get("messages") or []
            if isinstance(messages, list) and messages:
                message_id = messages[0].get("id", "")

        if message_id:
            return f"WhatsApp message sent successfully to +{normalized_to} (id: {message_id})"
        return f"WhatsApp message sent successfully to +{normalized_to}"
    except Exception as e:
        return f"Error: WhatsApp message failed: {str(e)}"
