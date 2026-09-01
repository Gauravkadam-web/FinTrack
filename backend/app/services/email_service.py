import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class EmailService:
    def __init__(self):
        self.resend_api_key = settings.RESEND_API_KEY.strip()
        self.smtp_host = settings.SMTP_HOST.strip()
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER.strip()
        self.smtp_password = settings.SMTP_PASSWORD.strip()
        self.email_from = settings.EMAIL_FROM.strip() or "onboarding@resend.dev"
        self.frontend_url = settings.FRONTEND_URL.rstrip("/")

    async def _send_via_resend(self, to_email: str, subject: str, html_content: str, text_content: str) -> bool:
        """Send transactional email via Resend HTTP REST API (Port 443, works seamlessly on Render)."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {self.resend_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": self.email_from,
                        "to": [to_email],
                        "subject": subject,
                        "html": html_content,
                        "text": text_content,
                    },
                )
                if response.status_code in (200, 201):
                    logger.info(f"Email '{subject}' sent successfully to {to_email} via Resend")
                    return True
                else:
                    logger.error(f"Resend email API returned status {response.status_code}: {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Failed to send email via Resend to {to_email}: {e}")
            return False

    async def _send_via_smtp(self, to_email: str, subject: str, html_content: str, text_content: str) -> bool:
        """Send transactional email via standard SMTP."""
        message = MIMEMultipart("alternative")
        message["From"] = self.email_from
        message["To"] = to_email
        message["Subject"] = subject

        message.attach(MIMEText(text_content, "plain", "utf-8"))
        message.attach(MIMEText(html_content, "html", "utf-8"))

        try:
            await aiosmtplib.send(
                message,
                hostname=self.smtp_host,
                port=self.smtp_port,
                username=self.smtp_user,
                password=self.smtp_password,
                start_tls=(self.smtp_port == 587),
                use_tls=(self.smtp_port == 465),
                timeout=10,
            )
            logger.info(f"Email '{subject}' sent successfully to {to_email} via SMTP")
            return True
        except Exception as e:
            logger.error(f"Failed to send email via SMTP to {to_email}: {e}")
            return False

    async def _send_email(self, to_email: str, subject: str, html_content: str, text_content: str) -> bool:
        """Send email via Resend HTTP API (if configured), SMTP (if configured), or fallback to dev console."""
        if self.resend_api_key:
            return await self._send_via_resend(to_email, subject, html_content, text_content)
        elif self.smtp_host and self.smtp_user:
            return await self._send_via_smtp(to_email, subject, html_content, text_content)
        else:
            logger.info(
                f"[DEV EMAIL] To: {to_email} | Subject: {subject}\n"
                f"Content: {text_content}"
            )
            return True

    async def send_verification_email(self, to_email: str, token: str, display_name: str) -> bool:
        """Send account email verification link."""
        verify_url = f"{self.frontend_url}/verify-email?token={token}"
        subject = "Verify your FinTrack account"

        text_content = (
            f"Hi {display_name},\n\n"
            f"Welcome to FinTrack! Please click the link below to verify your email address:\n"
            f"{verify_url}\n\n"
            f"This link is valid for 1 hour.\n\n"
            f"Happy tracking!\n"
            f"The FinTrack Team"
        )

        html_content = f"""
        <div style="font-family: sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0f172a; margin-bottom: 16px;">Welcome to FinTrack, {display_name}! 🚀</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #475569;">
                Thank you for signing up. Please verify your email address to secure your account.
            </p>
            <div style="margin: 28px 0; text-align: center;">
                <a href="{verify_url}" style="background: #2563eb; color: #ffffff; padding: 12px 28px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block;">
                    Verify Email Address
                </a>
            </div>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
                Or copy and paste this link into your browser:<br/>
                <a href="{verify_url}" style="color: #2563eb;">{verify_url}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">This link will expire in 1 hour.</p>
        </div>
        """

        return await self._send_email(to_email, subject, html_content, text_content)

    async def send_password_reset_email(self, to_email: str, token: str, display_name: str) -> bool:
        """Send password reset instructions with secure link."""
        reset_url = f"{self.frontend_url}/reset-password?token={token}"
        subject = "Reset your FinTrack password"

        text_content = (
            f"Hi {display_name},\n\n"
            f"We received a request to reset your FinTrack password. Click the link below to set a new password:\n"
            f"{reset_url}\n\n"
            f"This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.\n\n"
            f"The FinTrack Team"
        )

        html_content = f"""
        <div style="font-family: sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0f172a; margin-bottom: 16px;">Password Reset Request 🔒</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #475569;">
                Hi {display_name}, we received a request to reset your FinTrack account password.
            </p>
            <div style="margin: 28px 0; text-align: center;">
                <a href="{reset_url}" style="background: #2563eb; color: #ffffff; padding: 12px 28px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block;">
                    Reset Password
                </a>
            </div>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
                Or copy and paste this link into your browser:<br/>
                <a href="{reset_url}" style="color: #2563eb;">{reset_url}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
        </div>
        """

        return await self._send_email(to_email, subject, html_content, text_content)
