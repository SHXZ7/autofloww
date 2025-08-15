import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from email.mime.application import MIMEApplication

async def run_email_node(email_data):
    try:
        # Get email configuration from environment variables
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        email_user = os.getenv("EMAIL_USER")
        email_password = os.getenv("EMAIL_PASSWORD")
        
        if not email_user or not email_password:
            return "Error: Email credentials not configured"
        
        # Get email details
        to_email = email_data.get("to", "").strip()
        subject = email_data.get("subject", "AutoFlow Notification")
        body = email_data.get("body", "")
        attachments = email_data.get("attachments", [])
        
        # Validate required fields
        if not to_email:
            return "Error: Email recipient (to) field is required"
        
        if "@" not in to_email:
            return f"Error: Invalid email address: {to_email}"
        
        # Add attachment info to body if attachments exist
        if attachments:
            body += "\n\n--- File Links from Workflow ---\n"
            for i, attachment in enumerate(attachments, 1):
                body += f"{i}. {attachment.get('name', 'File')}: {attachment.get('url', '')}\n"
        
        print(f"📧 Email details:")
        print(f"   From: {email_user}")
        print(f"   To: {to_email}")
        print(f"   Subject: {subject}")
        print(f"   Attachments: {len(attachments)}")
        
        # Create message
        message = MIMEMultipart()
        message["From"] = email_user
        message["To"] = to_email
        message["Subject"] = subject
        
        # Add body
        message.attach(MIMEText(body, "plain"))
        
        # Add attachments
        for attachment in attachments:
            if attachment.get("type") == "file" and "path" in attachment:
                # Attach actual file (like generated images or JSON files)
                file_path = attachment["path"]
                if os.path.exists(file_path):
                    file_ext = os.path.splitext(file_path)[1].lower()
                    
                    if file_ext in ['.png', '.jpg', '.jpeg', '.gif']:
                        # Image attachment
                        with open(file_path, "rb") as f:
                            img_data = f.read()
                        image = MIMEImage(img_data)
                        image.add_header("Content-Disposition", f"attachment; filename={attachment['name']}")
                        message.attach(image)
                    else:
                        # Other file types (JSON, etc.)
                        with open(file_path, "rb") as f:
                            file_data = f.read()
                        part = MIMEApplication(file_data)
                        part.add_header("Content-Disposition", f"attachment; filename={attachment['name']}")
                        message.attach(part)
                    
                    print(f"📎 Attached file: {file_path}")
        
        # Send email
        print("🔌 Connecting to SMTP server...")
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            print("🔐 Logging in...")
            server.login(email_user, email_password)
            server.send_message(message)
            print("✅ Email sent successfully!")
        
        attachment_count = len(attachments)
        success_msg = f"Email sent successfully to {to_email}"
        if attachment_count > 0:
            success_msg += f" with {attachment_count} attachment(s)"
        
        return success_msg
        
    except Exception as e:
        print(f"❌ Email error: {str(e)}")
        return f"Email failed: {str(e)}"
