"""
Resend Email Service Diagnostic Script
"""

import asyncio
import os
import sys

import httpx

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import get_settings


async def test_resend(recipient: str):
    settings = get_settings()
    api_key = settings.RESEND_API_KEY.strip()

    print("\n----------------- RESEND DIAGNOSTIC REPORT -----------------")
    print(f"APP_ENV:        {settings.APP_ENV}")
    print(f"EMAIL_FROM:     {settings.EMAIL_FROM}")
    print(f"FRONTEND_URL:   {settings.FRONTEND_URL}")
    print(f"RESEND_API_KEY: {'*' * (len(api_key) - 6) + api_key[-6:] if len(api_key) > 6 else ('[EMPTY/NOT SET]' if not api_key else '[SHORT]')}")
    print(f"Recipient:      {recipient}")
    print("------------------------------------------------------------\n")

    if not api_key:
        print("[ERROR] RESEND_API_KEY is not set in your .env / environment variables.")
        return

    from_sender = "FinTrack <onboarding@resend.dev>"
    print(f"Sending test email via Resend API to {recipient} from {from_sender}...")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
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
                    "html": "<h3>Resend API is working!</h3><p>Your FinTrack email configuration is successful.</p>",
                    "text": "Resend API is working! Your FinTrack email configuration is successful.",
                },
            )

            print(f"\nResend HTTP Response Status: {response.status_code}")
            print(f"Resend Response Body: {response.text}\n")

            if response.status_code in (200, 201):
                print("[SUCCESS] Email was accepted by Resend.")
            elif response.status_code == 403:
                print("[ERROR 403 Forbidden] Resend Free Tier restriction:")
                print("Reason: When using onboarding@resend.dev, Resend ONLY permits sending emails to the email address of the Resend account owner.")
            elif response.status_code == 401:
                print("[ERROR 401 Unauthorized] Invalid or expired RESEND_API_KEY.")
            else:
                print(f"[ERROR] Unexpected status code {response.status_code}.")

    except Exception as e:
        print(f"[EXCEPTION] Connection error: {e}")


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "test@example.com"
    asyncio.run(test_resend(target))
