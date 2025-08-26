import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

async def send_password_reset_email(email: str, reset_token: str, user_name: str = "User") -> bool:
    """Send password reset email to user"""
    try:
        # Email configuration from environment variables
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        email_user = os.getenv("EMAIL_USER")
        email_password = os.getenv("EMAIL_PASSWORD")
        
        if not email_user or not email_password:
            print("❌ Email configuration missing")
            return False
        
        # Create reset URL
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        reset_url = f"{frontend_url}/auth/reset-password?token={reset_token}"
        
        # Create email content
        subject = "Reset Your AutoFlow Password"
        
        # HTML email template
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; overflow: hidden; }}
                .header {{ background: linear-gradient(135deg, #00D4FF 0%, #FF6B35 100%); padding: 40px 20px; text-align: center; }}
                .header h1 {{ color: white; margin: 0; font-size: 28px; font-weight: bold; }}
                .content {{ padding: 40px 30px; color: #ffffff; }}
                .content h2 {{ color: #00D4FF; margin-bottom: 20px; font-size: 24px; }}
                .content p {{ line-height: 1.6; margin-bottom: 20px; color: #cccccc; }}
                .button {{ display: inline-block; background: linear-gradient(135deg, #00D4FF 0%, #FF6B35 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
                .button:hover {{ opacity: 0.9; }}
                .footer {{ background-color: #0f0f0f; padding: 20px; text-align: center; color: #666666; font-size: 12px; }}
                .warning {{ background-color: #FF6B35; background-color: rgba(255, 107, 53, 0.1); border: 1px solid rgba(255, 107, 53, 0.3); border-radius: 8px; padding: 15px; margin: 20px 0; }}
                .warning p {{ color: #FF6B35; margin: 0; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 AutoFlow</h1>
                </div>
                <div class="content">
                    <h2>Reset Your Password</h2>
                    <p>Hi {user_name},</p>
                    <p>We received a request to reset your AutoFlow account password. If you made this request, click the button below to reset your password:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_url}" class="button">Reset Password</a>
                    </div>
                    
                    <div class="warning">
                        <p><strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.</p>
                    </div>
                    
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="background-color: #0f0f0f; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; font-size: 12px;">{reset_url}</p>
                    
                    <p><strong>Didn't request this?</strong> You can safely ignore this email. Your password will not be changed.</p>
                    
                    <p>Best regards,<br>The AutoFlow Team</p>
                </div>
                <div class="footer">
                    <p>This email was sent from AutoFlow. If you have questions, please contact our support team.</p>
                    <p>&copy; {2024} AutoFlow. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        text_body = f"""
        Reset Your AutoFlow Password
        
        Hi {user_name},
        
        We received a request to reset your AutoFlow account password.
        
        Click this link to reset your password:
        {reset_url}
        
        This link will expire in 1 hour for security reasons.
        
        If you didn't request this, you can safely ignore this email.
        
        Best regards,
        The AutoFlow Team
        """
        
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"AutoFlow <{email_user}>"
        message["To"] = email
        
        # Attach both versions
        text_part = MIMEText(text_body, "plain")
        html_part = MIMEText(html_body, "html")
        
        message.attach(text_part)
        message.attach(html_part)
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(email_user, email_password)
            server.send_message(message)
        
        print(f"✅ Password reset email sent to {email}")
        return True
        
    except Exception as e:
        print(f"❌ Failed to send password reset email: {str(e)}")
        return False
