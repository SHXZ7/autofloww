import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from email.mime.application import MIMEApplication
from email.mime.base import MIMEBase
from email import encoders
import mimetypes
import socket
import ssl
import json
from typing import List, Dict, Any, Optional
import asyncio


def _is_truthy(value: Optional[str]) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _require_user_owned_keys() -> bool:
    explicit = os.getenv("ALLOW_SERVER_KEY_FALLBACK")
    if explicit is not None:
        return not _is_truthy(explicit)

    app_env = os.getenv("APP_ENV", "development").strip().lower()
    return app_env in {"prod", "production"}

async def run_email_node(email_data):
    try:
        # Get email configuration from environment variables
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        email_user = os.getenv("EMAIL_USER")
        email_password = os.getenv("EMAIL_PASSWORD")
        
        print(f"📧 Email Configuration Check:")
        print(f"   SMTP Server: {smtp_server}")
        print(f"   SMTP Port: {smtp_port}")
        print(f"   Email User: {email_user[:10]}..." if email_user else "   Email User: Not configured")
        print(f"   Password: {'*' * len(email_password) if email_password else 'Not configured'}")

        strict_mode = _require_user_owned_keys()
        user_google_token_json = email_data.get("google_token_json") or email_data.get("gmail_token_json")

        if strict_mode and not user_google_token_json:
            return "Error: Missing user Google token. Add google_token_json in Settings > API Keys."
        
        # Get email details with better validation
        to_email = email_data.get("to", "").strip()
        subject = email_data.get("subject", "AutoFlow Notification")
        body = email_data.get("body", "")
        attachments = email_data.get("attachments", [])
        cc_email = email_data.get("cc", "").strip()
        bcc_email = email_data.get("bcc", "").strip()
        
        # Enhanced validation
        if not to_email:
            return "Error: Email recipient (to) field is required"
        
        # Validate email format (simple check)
        if "@" not in to_email or "." not in to_email.split("@")[-1]:
            return f"Error: Invalid email address format: {to_email}"
        
        # Validate CC and BCC if provided
        if cc_email and ("@" not in cc_email or "." not in cc_email.split("@")[-1]):
            return f"Error: Invalid CC email address format: {cc_email}"
        
        if bcc_email and ("@" not in bcc_email or "." not in bcc_email.split("@")[-1]):
            return f"Error: Invalid BCC email address format: {bcc_email}"
        
        # Ensure body has content
        if not body.strip():
            body = "This is an automated email from AutoFlow."
        
        # Add attachment info to body if attachments exist
        if attachments:
            body += "\n\n--- Workflow Attachments ---\n"
            for i, attachment in enumerate(attachments, 1):
                if attachment.get("type") == "file" and attachment.get("path"):
                    body += f"{i}. {attachment.get('name', 'File')}: Local file attached\n"
                elif attachment.get("type") == "url" and attachment.get("url"):
                    body += f"{i}. {attachment.get('name', 'File')}: {attachment.get('url', '')}\n"
        
        print(f"📧 Email details:")
        print(f"   From: {email_user}")
        print(f"   To: {to_email}")
        if cc_email:
            print(f"   CC: {cc_email}")
        if bcc_email:
            print(f"   BCC: {bcc_email}")
        print(f"   Subject: {subject}")
        print(f"   Body length: {len(body)} characters")
        print(f"   Attachments: {len(attachments)}")
        
        # Create message
        message = MIMEMultipart()
        message["From"] = email_user
        message["To"] = to_email
        message["Subject"] = subject
        
        # Add CC and BCC if provided
        if cc_email:
            message["Cc"] = cc_email
        if bcc_email:
            message["Bcc"] = bcc_email
        
        # Add body with HTML support for better AI content formatting
        if "<html>" in body.lower() or "<p>" in body.lower() or "**" in body:
            # Format the body for HTML if it contains AI content
            html_body = body
            
            # Convert markdown-style formatting to HTML
            html_body = html_body.replace("**", "<strong>").replace("**", "</strong>")
            html_body = html_body.replace("--- AI Generated Content ---", 
                                        "<h3 style='color: #00D4FF; border-bottom: 2px solid #00D4FF;'>🤖 AI Generated Content</h3>")
            html_body = html_body.replace("--- Parsed Document Content ---", 
                                        "<h3 style='color: #FF6B35; border-bottom: 2px solid #FF6B35;'>📄 Parsed Document Content</h3>")
            
            # Add line breaks
            html_body = html_body.replace("\n", "<br>")
            
            # Wrap in basic HTML
            html_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                {html_body}
                <br><br>
                <hr style="border: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                    This email was sent automatically by AutoFlow.
                </p>
            </body>
            </html>
            """
            
            message.attach(MIMEText(html_body, "html"))
        else:
            # Plain text email
            message.attach(MIMEText(body, "plain"))
        
        # Enhanced attachment handling
        attachment_count = 0
        for attachment in attachments:
            try:
                if attachment.get("type") == "file" and "path" in attachment:
                    file_path = attachment["path"]
                    if os.path.exists(file_path):
                        file_name = attachment.get("name", os.path.basename(file_path))
                        file_ext = os.path.splitext(file_path)[1].lower()
                        
                        # Determine MIME type
                        mime_type, _ = mimetypes.guess_type(file_path)
                        
                        print(f"📎 Processing attachment: {file_name}")
                        
                        if file_ext in ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']:
                            try:
                                with open(file_path, "rb") as f:
                                    img_data = f.read()
                                
                                subtype_map = {
                                    '.png': 'png', '.jpg': 'jpeg', '.jpeg': 'jpeg',
                                    '.gif': 'gif', '.bmp': 'bmp', '.webp': 'webp'
                                }
                                subtype = subtype_map.get(file_ext.lower(), 'png')
                                
                                image = MIMEImage(img_data, _subtype=subtype)
                                image.add_header("Content-Disposition", f"attachment; filename={file_name}")
                                message.attach(image)
                                attachment_count += 1
                                print(f"✅ Successfully attached image: {file_name}")
                            except Exception as img_error:
                                print(f"❌ Failed to attach image {file_name}: {str(img_error)}")
                                continue
                        
                        elif file_ext in ['.pdf', '.docx', '.xlsx', '.json', '.txt', '.csv']:
                            try:
                                with open(file_path, "rb") as f:
                                    file_data = f.read()
                                
                                if mime_type:
                                    part = MIMEBase(*mime_type.split('/'))
                                    part.set_payload(file_data)
                                    encoders.encode_base64(part)
                                else:
                                    part = MIMEApplication(file_data)
                                
                                part.add_header("Content-Disposition", f"attachment; filename={file_name}")
                                message.attach(part)
                                attachment_count += 1
                                print(f"📎 Attached document: {file_name}")
                            except Exception as doc_error:
                                print(f"❌ Failed to attach document {file_name}: {str(doc_error)}")
                                continue
                        
                    else:
                        print(f"⚠️ Attachment file not found: {file_path}")
                        
            except Exception as e:
                print(f"⚠️ Failed to process attachment: {str(e)}")
                continue
        
        # Prepare recipient list for SMTP
        recipients = [to_email]
        if cc_email:
            recipients.append(cc_email)
        if bcc_email:
            recipients.append(bcc_email)
        
        # Build success message helper
        def _success_msg(via: str) -> str:
            msg = f"Email sent successfully to {to_email}"
            if cc_email:
                msg += f" (CC: {cc_email})"
            if bcc_email:
                msg += f" (BCC: {bcc_email})"
            if attachment_count > 0:
                msg += f" with {attachment_count} attachment(s)"
            msg += f" via {via}"
            return msg

        # Extract built body from the MIME message object
        def _get_body_content():
            for part in message.walk():
                ct = part.get_content_type()
                if ct in ("text/html", "text/plain") and not part.get_filename():
                    return part.get_payload(decode=True).decode("utf-8", errors="replace"), ct == "text/html"
            return body, False

        email_body_content, is_html = _get_body_content()

        import aiohttp

        # 1. Gmail API (per-user token in production)
        try:
            from googleapiclient.discovery import build
            from google.oauth2.credentials import Credentials
            from google.auth.transport.requests import Request
            import base64

            GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.send']
            gcreds = None
            if user_google_token_json:
                token_data = json.loads(user_google_token_json) if isinstance(user_google_token_json, str) else user_google_token_json
                gcreds = Credentials.from_authorized_user_info(token_data, GMAIL_SCOPES)
            elif not strict_mode:
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                gmail_token = os.path.join(base_dir, 'gmail_token.json')
                if os.path.exists(gmail_token):
                    gcreds = Credentials.from_authorized_user_file(gmail_token, GMAIL_SCOPES)

            if gcreds and not gcreds.valid:
                if gcreds.expired and gcreds.refresh_token:
                    gcreds.refresh(Request())
                    if not user_google_token_json and not strict_mode:
                        with open(gmail_token, 'w') as f:
                            f.write(gcreds.to_json())
                else:
                    gcreds = None

            if gcreds and gcreds.valid:
                print("📤 Sending via Gmail API...")
                service = build('gmail', 'v1', credentials=gcreds)
                raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
                result = service.users().messages().send(
                    userId='me', body={'raw': raw}
                ).execute()
                print(f"✅ Email sent via Gmail API! ID: {result.get('id')}")
                return _success_msg("Gmail API")
            else:
                print("⚠️ Google token unavailable or invalid — skipping Gmail API")
        except Exception as e:
            print(f"⚠️ Gmail API unavailable: {e}")

        if strict_mode:
            return "Error: Unable to send via user Gmail token. Reconnect Google account and grant gmail.send scope."

        # ── 2. Resend (works if to == account owner email, or domain verified) ─
        resend_key = os.getenv("RESEND_API_KEY")
        if resend_key:
            print("📤 Sending via Resend API...")
            try:
                resend_payload = {
                    "from": "AutoFlow <onboarding@resend.dev>",
                    "to": [to_email],
                    "subject": subject,
                }
                resend_payload["html" if is_html else "text"] = email_body_content
                if cc_email:
                    resend_payload["cc"] = [cc_email]
                if bcc_email:
                    resend_payload["bcc"] = [bcc_email]

                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        "https://api.resend.com/emails",
                        json=resend_payload,
                        headers={"Authorization": f"Bearer {resend_key}",
                                 "Content-Type": "application/json"},
                        timeout=aiohttp.ClientTimeout(total=30)
                    ) as resp:
                        resp_json = await resp.json()
                        if resp.status in (200, 201):
                            print("✅ Email sent via Resend!")
                            return _success_msg("Resend")
                        else:
                            err = resp_json.get("message", str(resp_json))
                            print(f"❌ Resend error {resp.status}: {err}")
            except Exception as e:
                print(f"❌ Resend exception: {e}")

        # ── 3. SMTP fallback (local dev) ──────────────────────────────────────
        print("🔌 Connecting via SMTP...")
        if not email_user or not email_password:
            return "Error: Email credentials not configured. Please set EMAIL_USER and EMAIL_PASSWORD environment variables"
        try:
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE

            with smtplib.SMTP(smtp_server, smtp_port, timeout=60) as server:
                server.starttls(context=context)
                server.login(email_user, email_password)
                server.send_message(message, to_addrs=recipients)
                print("✅ Email sent via SMTP!")
                return _success_msg("SMTP")

        except smtplib.SMTPAuthenticationError as e:
            return f"Error: Gmail authentication failed - check your App Password: {str(e)}"
        except smtplib.SMTPRecipientsRefused as e:
            return f"Error: Recipient '{to_email}' refused: {str(e)}"
        except smtplib.SMTPServerDisconnected as e:
            return f"Error: SMTP server disconnected: {str(e)}"
        except smtplib.SMTPConnectError as e:
            return f"Error: Cannot connect to SMTP server: {str(e)}"
        except socket.timeout:
            return "Error: SMTP connection timed out."
        except OSError as e:
            if e.errno == 101:
                return ("Error: Network unreachable — SMTP is blocked on this server. "
                        "Set RESEND_API_KEY as a secret in your HF Space settings.")
            return f"Error: OS error - {str(e)}"
        except Exception as e:
            return f"Error: Unexpected SMTP error - {str(e)}"
        
    except Exception as e:
        error_msg = f"Email failed: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg

# Helper function to validate email format
def is_valid_email(email: str) -> bool:
    """Basic email validation"""
    if not email or "@" not in email:
        return False
    
    parts = email.split("@")
    if len(parts) != 2:
        return False
    
    local, domain = parts
    if not local or not domain or "." not in domain:
        return False
    
    return True

# Helper function to get email configuration status
def get_email_config_status():
    """Check email configuration status"""
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = os.getenv("SMTP_PORT", "587")
    email_user = os.getenv("EMAIL_USER")
    email_password = os.getenv("EMAIL_PASSWORD")
    
    return {
        "smtp_server": smtp_server,
        "smtp_port": smtp_port,
        "email_configured": bool(email_user and email_password),
        "email_user": email_user if email_user else "Not configured"
    }

# Test function for email service
async def test_email_service(to_email: str = None):
    """Test email service with a simple message"""
    if not to_email:
        print("❌ Please provide a test email address")
        return False
    
    test_data = {
        "to": to_email,
        "subject": "AutoFlow Email Service Test",
        "body": """
        🎉 Email Service Test

        This is a test email from AutoFlow to verify that the email service is working correctly.

        If you receive this email, the service is configured properly!

        Best regards,
        AutoFlow Team
        """,
        "attachments": []
    }
    
    print(f"🧪 Testing email service with recipient: {to_email}")
    result = await run_email_node(test_data)
    
    if "successfully" in result:
        print("✅ Email service test passed!")
        return True
    else:
        print(f"❌ Email service test failed: {result}")
        return False

# Helper function to validate email format
def is_valid_email(email: str) -> bool:
    """Basic email validation"""
    if not email or "@" not in email:
        return False
    
    parts = email.split("@")
    if len(parts) != 2:
        return False
    
    local, domain = parts
    if not local or not domain or "." not in domain:
        return False
    
    return True

# Helper function to get email configuration status
def get_email_config_status():
    """Check email configuration status"""
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = os.getenv("SMTP_PORT", "587")
    email_user = os.getenv("EMAIL_USER")
    email_password = os.getenv("EMAIL_PASSWORD")
    
    return {
        "smtp_server": smtp_server,
        "smtp_port": smtp_port,
        "email_configured": bool(email_user and email_password),
        "email_user": email_user if email_user else "Not configured"
    }

# Test function for email service
async def test_email_service(to_email: str = None):
    """Test email service with a simple message"""
    if not to_email:
        print("❌ Please provide a test email address")
        return False
    
    test_data = {
        "to": to_email,
        "subject": "AutoFlow Email Service Test",
        "body": """
        🎉 Email Service Test

        This is a test email from AutoFlow to verify that the email service is working correctly.

        If you receive this email, the service is configured properly!

        Best regards,
        AutoFlow Team
        """,
        "attachments": []
    }
    
    print(f"🧪 Testing email service with recipient: {to_email}")
    result = await run_email_node(test_data)
    
    if "successfully" in result:
        print("✅ Email service test passed!")
        return True
    else:
        print(f"❌ Email service test failed: {result}")
        return False
