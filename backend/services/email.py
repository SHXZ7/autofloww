import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from email.mime.application import MIMEApplication
from email.mime.base import MIMEBase
from email import encoders
import mimetypes
from typing import List, Dict, Any

async def run_email_node(email_data):
    try:
        # Get email configuration from environment variables
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        email_user = os.getenv("EMAIL_USER")
        email_password = os.getenv("EMAIL_PASSWORD")
        
        if not email_user or not email_password:
            return "Error: Email credentials not configured. Please set EMAIL_USER and EMAIL_PASSWORD environment variables"
        
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
                    # Attach actual file (like generated images, reports, or JSON files)
                    file_path = attachment["path"]
                    if os.path.exists(file_path):
                        file_name = attachment.get("name", os.path.basename(file_path))
                        file_ext = os.path.splitext(file_path)[1].lower()
                        
                        # Determine MIME type
                        mime_type, _ = mimetypes.guess_type(file_path)
                        
                        print(f"📎 Processing attachment: {file_name}")
                        print(f"   Path: {file_path}")
                        print(f"   Extension: {file_ext}")
                        print(f"   MIME type: {mime_type}")
                        print(f"   File size: {os.path.getsize(file_path) / 1024:.1f} KB")
                        
                        if file_ext in ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']:
    # Image attachment - Enhanced handling
                            try:
                                print(f"🖼️ Processing image attachment: {file_name}")
                                print(f"   📂 Full path: {file_path}")
        
        # Verify file exists and is readable
                                if not os.path.exists(file_path):
                                    print(f"❌ Image file not found: {file_path}")
                                    continue
            
                                if not os.access(file_path, os.R_OK):
                                    print(f"❌ Permission denied accessing image: {file_path}")
                                    continue
        
                                file_size = os.path.getsize(file_path)
                                print(f"   📏 File size: {file_size} bytes")
        
                                if file_size == 0:
                                    print(f"❌ Image file is empty: {file_path}")
                                    continue
        
                                with open(file_path, "rb") as f:
                                    img_data = f.read()
        
                                if not img_data:
                                    print(f"❌ No data read from image file: {file_path}")
                                    continue
        
                                print(f"   ✅ Read {len(img_data)} bytes from image file")
        
        # Determine the correct MIME subtype
                                subtype_map = {
                                    '.png': 'png',
                                    '.jpg': 'jpeg',
                                    '.jpeg': 'jpeg',
                                    '.gif': 'gif',
                                    '.bmp': 'bmp',
                                    '.webp': 'webp'
                                    }
                                subtype = subtype_map.get(file_ext.lower(), 'png')
        
                                image = MIMEImage(img_data, _subtype=subtype)
                                image.add_header("Content-Disposition", f"attachment; filename={file_name}")
                                image.add_header('Content-ID', f'<{file_name}>')
        
                                message.attach(image)
                                attachment_count += 1
                                print(f"✅ Successfully attached image: {file_name} (type: {subtype}, size: {len(img_data)} bytes)")
        
                            except Exception as img_error:
                                print(f"❌ Failed to attach image {file_name}: {str(img_error)}")
                                print(f"   File path: {file_path}")
                                print(f"   File exists: {os.path.exists(file_path)}")
                                continue

                        elif file_ext in ['.pdf', '.docx', '.xlsx', '.json', '.txt', '.csv']:
                            # Document attachments
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
                            # Generic file attachment
                            try:
                                with open(file_path, "rb") as f:
                                    file_data = f.read()
                                
                                part = MIMEApplication(file_data)
                                part.add_header("Content-Disposition", f"attachment; filename={file_name}")
                                message.attach(part)
                                print(f"✅ Successfully attached file: {file_name}")
                                attachment_count += 1
                                
                            except Exception as file_error:
                                print(f"❌ Failed to attach file {file_name}: {str(file_error)}")
                                continue
                        
                    else:
                        print(f"⚠️ Attachment file not found: {file_path}")
                        
                elif attachment.get("type") == "url" and attachment.get("url"):
                    # For URL attachments, just mention in body (already added above)
                    print(f"🔗 URL attachment referenced in body: {attachment.get('url')}")
                    
            except Exception as e:
                print(f"⚠️ Failed to process attachment {attachment.get('name', 'unknown')}: {str(e)}")
                continue
        
        # Prepare recipient list for SMTP
        recipients = [to_email]
        if cc_email:
            recipients.append(cc_email)
        if bcc_email:
            recipients.append(bcc_email)
        
        # Send email with enhanced error handling
        print("🔌 Connecting to SMTP server...")
        try:
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                print("🔐 Starting TLS...")
                server.starttls()
                print("🔐 Logging in...")
                server.login(email_user, email_password)
                print("📤 Sending message...")
                server.send_message(message, to_addrs=recipients)
                print("✅ Email sent successfully!")
                
        except smtplib.SMTPAuthenticationError:
            return "Error: Email authentication failed. Please check your email credentials"
        except smtplib.SMTPRecipientsRefused:
            return f"Error: Email recipient '{to_email}' was refused by the server"
        except smtplib.SMTPServerDisconnected:
            return "Error: SMTP server disconnected unexpectedly"
        except smtplib.SMTPException as e:
            return f"Error: SMTP error occurred: {str(e)}"
        
        # Build success message
        success_msg = f"Email sent successfully to {to_email}"
        if cc_email:
            success_msg += f" (CC: {cc_email})"
        if bcc_email:
            success_msg += f" (BCC: {bcc_email})"
        if attachment_count > 0:
            success_msg += f" with {attachment_count} attachment(s)"
        
        return success_msg
        
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
