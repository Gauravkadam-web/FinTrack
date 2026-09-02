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
        """Send transactional email exclusively via Resend HTTP REST API (Port 443)."""
        if not self.resend_api_key:
            logger.error("❌ [Resend Error] RESEND_API_KEY is not configured in environment variables.")
            return False

        from_sender = self.email_from.strip()
        # If no sender or if an unverified public mailbox (like @gmail.com) is passed, default to onboarding@resend.dev
        if not from_sender or any(prov in from_sender.lower() for prov in ["@gmail.com", "@yahoo.com", "@outlook.com", "@hotmail.com"]):
            from_sender = "FinTrack <onboarding@resend.dev>"
        elif "@" in from_sender and "<" not in from_sender:
            from_sender = f"FinTrack <{from_sender}>"

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {self.resend_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": from_sender,
                        "to": [to_email],
                        "subject": subject,
                        "html": html_content,
                        "text": text_content,
                    },
                )
                if response.status_code in (200, 201):
                    res_json = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
                    logger.info(f"✅ Email '{subject}' delivered to {to_email} via Resend. (ID: {res_json.get('id', 'ok')})")
                    return True
                else:
                    logger.error(
                        f"❌ Resend API Error [HTTP {response.status_code}]: {response.text}\n"
                        f"   From: '{from_sender}' | To: '{to_email}'"
                    )
                    return False
        except Exception as e:
            logger.error(f"❌ Exception connecting to Resend API for {to_email}: {e}")
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
            logger.info(f"✅ Email '{subject}' sent successfully to {to_email} via SMTP")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to send email via SMTP to {to_email}: {e}")
            return False

    async def _send_email(self, to_email: str, subject: str, html_content: str, text_content: str) -> bool:
        """Send email via SMTP (in dev) or strictly Resend (in prod)."""
        sent = False

        if settings.APP_ENV == "development":
            # In local development: Try SMTP first (or Resend if configured)
            if self.smtp_host and self.smtp_user:
                sent = await self._send_via_smtp(to_email, subject, html_content, text_content)
            elif self.resend_api_key:
                sent = await self._send_via_resend(to_email, subject, html_content, text_content)
        else:
            # In production: EXCLUSIVELY use Resend API
            sent = await self._send_via_resend(to_email, subject, html_content, text_content)

        # Always print in server logs if delivery failed or in dev mode so verification is never blocked
        if not sent or settings.APP_ENV == "development":
            logger.warning(
                f"\n📧 ==================== [EMAIL VERIFICATION LINK BACKUP] ====================\n"
                f"To: {to_email}\n"
                f"Subject: {subject}\n"
                f"{text_content}\n"
                f"===============================================================================\n"
            )

        return True

    def _render_email_layout(
        self,
        title: str,
        badge_text: str,
        badge_color: str,
        headline: str,
        subheadline: str,
        main_message_html: str,
        button_text: str,
        button_url: str,
        security_note: str,
    ) -> str:
        """Render a bulletproof, responsive, premium HTML email layout compatible with all mail clients."""
        return f"""<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{title}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        body, table, td, a {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
        table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; }}
        img {{ -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }}
        table {{ border-collapse: collapse !important; }}
        body {{ height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }}
        a[x-apple-data-detectors] {{ color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }}
        @media screen and (max-width: 600px) {{
            .email-container {{ width: 100% !important; margin: auto !important; }}
            .fluid-padding {{ padding: 24px 20px !important; }}
            .hero-title {{ font-size: 22px !important; line-height: 28px !important; }}
        }}
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; color: #0f172a;">
    <!-- Preheader preview text -->
    <div style="display: none; font-size: 1px; color: #f1f5f9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        {subheadline}
    </div>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; table-layout: fixed;">
        <tr>
            <td align="center" style="padding: 40px 16px;">
                <!-- Main Container -->
                <table border="0" cellpadding="0" cellspacing="0" width="560" class="email-container" style="max-width: 560px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                    
                    <!-- Header with FinTrack Brand -->
                    <tr>
                        <td align="center" style="padding: 32px 32px 24px 32px; background: #0f172a;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <!-- Logo Icon & Text -->
                                        <table border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 10px; width: 36px; height: 36px; text-align: center; vertical-align: middle;">
                                                    <span style="color: #ffffff; font-size: 20px; font-weight: bold; line-height: 36px; display: block;">⚡</span>
                                                </td>
                                                <td style="padding-left: 12px; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                                                    FinTrack
                                                </td>
                                            </tr>
                                        </table>
                                        <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 12px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;">Personal Expense & Budget Tracker</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td class="fluid-padding" style="padding: 36px 36px 28px 36px;">
                            
                            <!-- Badge -->
                            <div style="margin-bottom: 16px;">
                                <span style="display: inline-block; padding: 4px 12px; background-color: {badge_color}; color: #0f172a; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; border-radius: 9999px;">
                                    {badge_text}
                                </span>
                            </div>

                            <!-- Headline -->
                            <h1 class="hero-title" style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: #0f172a; line-height: 32px; letter-spacing: -0.5px;">
                                {headline}
                            </h1>

                            <!-- Subheadline -->
                            <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #475569;">
                                {subheadline}
                            </p>

                            <!-- Custom Message HTML -->
                            {main_message_html}

                            <!-- Primary Action Button -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0 24px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{button_url}" target="_blank" style="display: inline-block; padding: 14px 36px; background-color: #2563eb; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); text-align: center; letter-spacing: 0.2px;">
                                            {button_text} &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Alternative Link Box -->
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin: 24px 0 20px 0;">
                                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748b;">
                                    Or copy and paste this link in your browser:
                                </p>
                                <a href="{button_url}" target="_blank" style="font-size: 12px; color: #2563eb; text-decoration: underline; word-break: break-all; line-height: 18px;">
                                    {button_url}
                                </a>
                            </div>

                            <!-- Security / Expiry Notice -->
                            <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px;">
                                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8; text-align: center;">
                                    🔒 {security_note}
                                </p>
                            </div>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 36px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748b;">
                                FinTrack — Smart Personal Finance
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 16px;">
                                This is an automated security email. If you did not make this request, no action is needed.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""

    async def send_verification_email(self, to_email: str, token: str, display_name: str) -> bool:
        """Send account email verification link with premium email layout."""
        verify_url = f"{self.frontend_url}/verify-email?token={token}"
        subject = "Verify your FinTrack account 🚀"

        text_content = (
            f"Hi {display_name},\n\n"
            f"Welcome to FinTrack! Please click the link below to verify your email address and activate your account:\n"
            f"{verify_url}\n\n"
            f"This verification link is valid for 1 hour.\n\n"
            f"Happy tracking!\n"
            f"The FinTrack Team"
        )

        message_html = f"""
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px 16px; margin-bottom: 8px;">
            <p style="margin: 0; font-size: 13px; color: #166534; line-height: 20px;">
                🎉 <strong>Welcome aboard, {display_name}!</strong> You're just one step away from tracking your daily expenses, managing category budgets, and taking control of your financial goals.
            </p>
        </div>
        """

        html_content = self._render_email_layout(
            title="Verify your FinTrack account",
            badge_text="Account Verification",
            badge_color="#dbeafe",
            headline=f"Welcome to FinTrack, {display_name}! 🚀",
            subheadline="Please verify your email address to secure your account and access your personal dashboard.",
            main_message_html=message_html,
            button_text="Verify Email & Activate Account",
            button_url=verify_url,
            security_note="This verification link will expire in 1 hour. If you did not create a FinTrack account, please ignore this email.",
        )

        return await self._send_email(to_email, subject, html_content, text_content)

    async def send_password_reset_email(self, to_email: str, token: str, display_name: str) -> bool:
        """Send password reset instructions with premium email layout."""
        reset_url = f"{self.frontend_url}/reset-password?token={token}"
        subject = "Reset your FinTrack password 🔒"

        text_content = (
            f"Hi {display_name},\n\n"
            f"We received a request to reset your FinTrack password. Click the link below to set a new password:\n"
            f"{reset_url}\n\n"
            f"This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.\n\n"
            f"The FinTrack Team"
        )

        message_html = f"""
        <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 16px; margin-bottom: 8px;">
            <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 20px;">
                🔒 <strong>Password Reset Request:</strong> A password reset request was initiated for your FinTrack account ({to_email}). Click the button below to choose a secure new password.
            </p>
        </div>
        """

        html_content = self._render_email_layout(
            title="Reset your FinTrack password",
            badge_text="Security Notice",
            badge_color="#fee2e2",
            headline="Reset Your Password 🔒",
            subheadline=f"Hi {display_name}, click below to create a new password for your FinTrack account.",
            main_message_html=message_html,
            button_text="Reset Your Password",
            button_url=reset_url,
            security_note="This password reset link will expire in 1 hour. If you did not request a password reset, your account is still completely safe and you can ignore this email.",
        )

        return await self._send_email(to_email, subject, html_content, text_content)
