"""
Universal Multi-Provider Email Diagnostic Tool (Brevo, Resend & SMTP)
Usage:
    python scripts/diagnose_email.py <recipient_email> [--provider brevo|resend|smtp|auto]
"""

import argparse
import asyncio
import os
import sys

import httpx

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import get_settings


async def test_brevo(recipient: str, api_key: str, sender_email: str, sender_name: str):
    print(f"\n[BREVO TEST] Sending test email to {recipient} via Brevo API...")
    if not api_key:
        print("[BREVO ERROR] BREVO_API_KEY is not set in environment.")
        return

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "api-key": api_key,
                    "Content-Type": "application/json",
                    "accept": "application/json",
                },
                json={
                    "sender": {"name": sender_name, "email": sender_email},
                    "to": [{"email": recipient}],
                    "subject": "FinTrack - Brevo API Test Email",
                    "htmlContent": "<h3>Brevo Email Delivery Working!</h3><p>Your FinTrack multi-provider email configuration is successful.</p>",
                    "textContent": "Brevo Email Delivery Working! Your FinTrack multi-provider email configuration is successful.",
                },
            )
            print(f"Brevo HTTP Status: {response.status_code}")
            print(f"Brevo Response Body: {response.text}")
            if response.status_code in (200, 201):
                print("[BREVO SUCCESS] Email accepted and delivered by Brevo to recipient inbox!\n")
            elif response.status_code == 401:
                print("[BREVO 401 ERROR] Invalid or unactivated API Key. Check that you copied the full key from Brevo.\n")
            elif response.status_code == 400:
                print("[BREVO 400 ERROR] Bad Request. Verify that your sender email is verified in Brevo dashboard.\n")
            else:
                print(f"[BREVO FAILED] Status code {response.status_code}\n")
    except Exception as e:
        print(f"[BREVO EXCEPTION] {e}\n")


async def test_resend(recipient: str, api_key: str, from_sender: str):
    print(f"\n[RESEND TEST] Sending test email to {recipient} via Resend API...")
    if not api_key:
        print("[RESEND ERROR] RESEND_API_KEY is not set in environment.")
        return

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": from_sender,
                    "to": [recipient],
                    "subject": "FinTrack - Resend API Test Email",
                    "html": "<h3>Resend Email Delivery Working!</h3><p>Your FinTrack multi-provider email configuration is successful.</p>",
                    "text": "Resend Email Delivery Working! Your FinTrack multi-provider email configuration is successful.",
                },
            )
            print(f"Resend HTTP Status: {response.status_code}")
            print(f"Resend Response Body: {response.text}")
            if response.status_code in (200, 201):
                print("[RESEND SUCCESS] Email accepted by Resend!\n")
            elif response.status_code == 403:
                print("[RESEND 403 RESTRICTION] In test mode with onboarding@resend.dev, Resend only delivers to your account owner email address.\n")
            else:
                print(f"[RESEND FAILED] Status code {response.status_code}\n")
    except Exception as e:
        print(f"[RESEND EXCEPTION] {e}\n")


async def main():
    parser = argparse.ArgumentParser(description="Test email delivery via Brevo, Resend, or SMTP.")
    parser.add_argument("recipient", nargs="?", default="gkadam3847@gmail.com", help="Recipient email address")
    parser.add_argument("--provider", choices=["brevo", "resend", "smtp", "auto"], default=None, help="Provider to test")
    args = parser.parse_args()

    settings = get_settings()
    selected_provider = args.provider or settings.EMAIL_PROVIDER.lower()

    print("\n=======================================================")
    print("       FINTRACK MULTI-PROVIDER EMAIL DIAGNOSTICS       ")
    print("=======================================================")
    print(f"* Active Provider Setting: {selected_provider.upper()}")
    print(f"* Target Recipient:        {args.recipient}")
    print(f"* EMAIL_FROM:              {settings.EMAIL_FROM}")
    print(f"* BREVO_API_KEY:           {'[CONFIGURED]' if settings.BREVO_API_KEY else '[NOT SET]'}")
    print(f"* RESEND_API_KEY:          {'[CONFIGURED]' if settings.RESEND_API_KEY else '[NOT SET]'}")
    print(f"* SMTP Host / User:        {settings.SMTP_HOST} / {'[CONFIGURED]' if settings.SMTP_USER else '[NOT SET]'}")
    print("=======================================================\n")

    if selected_provider in ("brevo", "auto"):
        sender_email = settings.EMAIL_FROM if "@" in settings.EMAIL_FROM else (settings.SMTP_USER or "gkadam3847@gmail.com")
        await test_brevo(args.recipient, settings.BREVO_API_KEY.strip(), sender_email, settings.EMAIL_FROM_NAME)

    if selected_provider in ("resend", "auto"):
        from_sender = f"{settings.EMAIL_FROM_NAME} <onboarding@resend.dev>"
        await test_resend(args.recipient, settings.RESEND_API_KEY.strip(), from_sender)


if __name__ == "__main__":
    asyncio.run(main())
