import os
from dotenv import load_dotenv

# Try to import Twilio
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False

load_dotenv()

async def run_twilio_node(node_data):
    """Send SMS or WhatsApp message using Twilio"""
    if not TWILIO_AVAILABLE:
        return "Error: Twilio library not available. Install with: pip install twilio"
    
    try:
        # Get Twilio credentials from environment
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        twilio_phone = os.getenv("TWILIO_PHONE_NUMBER")
        
        if not all([account_sid, auth_token, twilio_phone]):
            return "Error: Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER"
        
        # Get message details
        to_number = node_data.get("to", "").strip()
        message = node_data.get("message", "")
        mode = node_data.get("mode", "sms")
        
        # Validate inputs
        if not to_number:
            return "Error: Phone number is required"
        if not message:
            return "Error: Message content is required"
        
        # Ensure phone number has country code
        if not to_number.startswith("+"):
            return f"Error: Phone number must include country code (e.g., +1234567890), got: {to_number}"
        
        # Initialize Twilio client
        client = Client(account_sid, auth_token)
        
        # Configure sender based on mode
        if mode.lower() == "whatsapp":
            from_number = f"whatsapp:{twilio_phone}"
            to_number = f"whatsapp:{to_number}"
            print(f"📱 Sending WhatsApp message from {from_number} to {to_number}")
        else:
            from_number = twilio_phone
            print(f"📱 Sending SMS from {from_number} to {to_number}")
        
        # Send message
        message_instance = client.messages.create(
            body=message,
            from_=from_number,
            to=to_number
        )
        
        print(f"✅ Message sent successfully. SID: {message_instance.sid}")
        
        return f"{mode.upper()} sent successfully to {to_number.replace('whatsapp:', '')}"
        
    except Exception as e:
        print(f"❌ Twilio error: {str(e)}")
        return f"Message failed: {str(e)}"
