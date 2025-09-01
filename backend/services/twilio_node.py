from dotenv import load_dotenv
import os
import re

# Try to import Twilio
try:
    from twilio.rest import Client
    from twilio.base.exceptions import TwilioException
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False

load_dotenv()

def validate_phone_number(phone_number: str) -> str:
    """Validate and format phone number"""
    # Remove all non-digit characters except +
    cleaned = re.sub(r'[^\d+]', '', phone_number)
    
    # If no country code, assume US
    if not cleaned.startswith('+'):
        if len(cleaned) == 10:
            cleaned = '+1' + cleaned
        elif len(cleaned) == 11 and cleaned.startswith('1'):
            cleaned = '+' + cleaned
        else:
            cleaned = '+1' + cleaned
    
    return cleaned

async def run_twilio_node(node_data):
    """Send SMS or WhatsApp message using Twilio"""
    if not TWILIO_AVAILABLE:
        return "Error: Twilio library not available. Install with: pip install twilio"
    
    try:
        # Get Twilio credentials from environment
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        twilio_phone = os.getenv("TWILIO_PHONE_NUMBER")
        twilio_whatsapp = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")
        
        if not all([account_sid, auth_token]):
            return "Error: Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN"
        
        # Get message details
        to_number = node_data.get("to", "").strip()
        message = node_data.get("message", "")
        mode = node_data.get("mode", "whatsapp").lower()
        
        # Enhanced validation
        if not to_number:
            return "Error: Recipient phone number is required"
        if not message:
            return "Error: Message content is required"
        
        # Validate and format phone number
        try:
            formatted_number = validate_phone_number(to_number)
        except Exception as e:
            return f"Error: Invalid phone number format: {to_number}"
        
        # Validate message length
        if len(message) > 1600:  # Twilio's limit
            return "Error: Message too long. Maximum length is 1600 characters."
        
        print(f"📱 Twilio service details:")
        print(f"   Account SID: {account_sid[:10]}...")
        print(f"   Mode: {mode}")
        print(f"   To: {formatted_number}")
        print(f"   Message length: {len(message)} characters")
        
        # Initialize Twilio client
        try:
            client = Client(account_sid, auth_token)
        except Exception as e:
            return f"Error: Failed to initialize Twilio client: {str(e)}"
        
        # Determine from number and format based on mode
        if mode == "whatsapp":
            from_number = twilio_whatsapp
            to_number_formatted = f"whatsapp:{formatted_number}"
            print(f"📱 Sending WhatsApp message")
            print(f"   From: {from_number}")
            print(f"   To: {to_number_formatted}")
        elif mode == "sms":
            from_number = twilio_phone
            if not from_number:
                return "Error: Twilio phone number not configured for SMS. Please set TWILIO_PHONE_NUMBER"
            to_number_formatted = formatted_number
            print(f"📱 Sending SMS")
            print(f"   From: {from_number}")
            print(f"   To: {to_number_formatted}")
        else:
            return f"Error: Unsupported mode '{mode}'. Use 'sms' or 'whatsapp'"
        
        # Send message with enhanced error handling
        try:
            message_obj = client.messages.create(
                body=message,
                from_=from_number,
                to=to_number_formatted
            )
            
            # Check message status
            message_status = message_obj.status
            message_sid = message_obj.sid
            
            print(f"✅ Message sent successfully!")
            print(f"   SID: {message_sid}")
            print(f"   Status: {message_status}")
            print(f"   Error Code: {message_obj.error_code or 'None'}")
            print(f"   Error Message: {message_obj.error_message or 'None'}")
            
            # Build success response
            success_msg = f"{mode.upper()} message sent successfully to {formatted_number}"
            
            if message_obj.error_code:
                success_msg += f" (Warning: {message_obj.error_message})"
            
            return success_msg
            
        except TwilioException as e:
            error_msg = f"Twilio API error: {str(e)}"
            
            # Provide specific error messages for common issues
            if "not a valid phone number" in str(e).lower():
                error_msg = f"Invalid phone number: {formatted_number}. Please check the format."
            elif "not verified" in str(e).lower():
                error_msg = f"Phone number {formatted_number} is not verified in your Twilio account."
            elif "insufficient funds" in str(e).lower():
                error_msg = "Insufficient Twilio account balance to send message."
            elif "rate limit" in str(e).lower():
                error_msg = "Rate limit exceeded. Please try again later."
            
            print(f"❌ {error_msg}")
            return error_msg
            
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg

async def test_twilio_service(phone_number: str = None, mode: str = "whatsapp"):
    """Test Twilio service with a simple message"""
    if not phone_number:
        print("❌ Please provide a test phone number")
        return False
    
    test_data = {
        "to": phone_number,
        "message": f"🧪 AutoFlow Twilio Test\n\nThis is a test message to verify that the Twilio {mode.upper()} service is working correctly.\n\nIf you receive this message, the service is configured properly!",
        "mode": mode
    }
    
    print(f"🧪 Testing Twilio {mode.upper()} service...")
    result = await run_twilio_node(test_data)
    
    if "successfully" in result:
        print("✅ Twilio service test passed!")
        return True
    else:
        print(f"❌ Twilio service test failed: {result}")
        return False

def get_twilio_config_status():
    """Check Twilio configuration status"""
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    phone_number = os.getenv("TWILIO_PHONE_NUMBER")
    whatsapp_number = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")
    
    return {
        "twilio_available": TWILIO_AVAILABLE,
        "credentials_configured": bool(account_sid and auth_token),
        "sms_configured": bool(phone_number),
        "whatsapp_configured": True,  # Always available with sandbox
        "account_sid": account_sid[:10] + "..." if account_sid else "Not configured",
        "phone_number": phone_number or "Not configured",
        "whatsapp_number": whatsapp_number
    }

# Usage examples and documentation
"""
📋 TWILIO SETUP GUIDE:

1. GET TWILIO CREDENTIALS:
   - Sign up at https://www.twilio.com/
   - Go to Console Dashboard
   - Find Account SID and Auth Token
   - For SMS: Get a Twilio phone number
   - For WhatsApp: Use the sandbox number

2. ENVIRONMENT VARIABLES:
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890  # For SMS
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Sandbox

3. WHATSAPP SANDBOX SETUP:
   - Go to Console > Messaging > Try it out > Send a WhatsApp message
   - Send "join <sandbox-keyword>" to +1 415 523 8886
   - Your number is now enabled for testing

4. TESTING:
   ```python
   # Test WhatsApp
   await test_twilio_service("+1234567890", "whatsapp")
   
   # Test SMS
   await test_twilio_service("+1234567890", "sms")
   ```

5. PHONE NUMBER FORMATS SUPPORTED:
   - +1234567890 (international format)
   - 1234567890 (will add +1)
   - (123) 456-7890 (will clean and format)

6. COMMON ISSUES:
   - "Not verified": Add number to verified caller IDs in Twilio Console
   - "Invalid number": Check phone number format
   - "Insufficient funds": Add credit to Twilio account
   - WhatsApp not working: Join the sandbox first
"""

if __name__ == "__main__":
    # For testing purposes
    print("Twilio Service Configuration:")
    config = get_twilio_config_status()
    for key, value in config.items():
        status = "✅" if value else "❌"
        print(f"{status} {key}: {value}")
