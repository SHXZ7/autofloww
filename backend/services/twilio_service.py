from twilio.rest import Client
import os

def get_twilio_client():
    """Get Twilio client with proper error handling"""
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
    
    print(f"Debug - TWILIO_ACCOUNT_SID: {TWILIO_ACCOUNT_SID}")
    print(f"Debug - TWILIO_AUTH_TOKEN: {'***' if TWILIO_AUTH_TOKEN else 'None'}")
    
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        raise ValueError("Twilio credentials not found. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.")
    
    return Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

def send_sms(to_number: str, message: str):
    try:
        TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
        
        if not TWILIO_PHONE_NUMBER:
            raise ValueError("TWILIO_PHONE_NUMBER environment variable not set")
        
        client = get_twilio_client()
        
        msg = client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=to_number
        )
        return f"SMS sent successfully to {to_number}, SID: {msg.sid}"
    except Exception as e:
        return f"SMS failed: {str(e)}"

def send_whatsapp(to_number: str, message: str):
    try:
        # Use Twilio's WhatsApp Sandbox number
        TWILIO_WHATSAPP_NUMBER = "whatsapp:+14155238886"  # Twilio Sandbox number
        
        client = get_twilio_client()
        
        # Make sure the 'to' number is properly formatted
        if not to_number.startswith("whatsapp:"):
            to_number = f"whatsapp:{to_number}"
        
        print(f"Debug - Sending WhatsApp from: {TWILIO_WHATSAPP_NUMBER}")
        print(f"Debug - Sending WhatsApp to: {to_number}")
        
        msg = client.messages.create(
            body=message,
            from_=TWILIO_WHATSAPP_NUMBER,
            to=to_number
        )
        return f"WhatsApp message sent successfully to {to_number}, SID: {msg.sid}"
    except Exception as e:
        return f"WhatsApp failed: {str(e)}"
