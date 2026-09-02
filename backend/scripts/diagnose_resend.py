"""
Resend Email Service Diagnostic Script
Run this script to test your Resend API configuration:
    python scripts/diagnose_resend.py <recipient_email>
"""

import sys
import os
import asyncio
import httpx

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import get_settings


async def test_resend(recipient: str):
    settings = get_settings()
    api_key = settings.RESEND_API_KEY.strip()

    print("\n🔍 ----------------- RESEND DIAGNOSTIC REPORT -----------------")
    print(f"• APP_ENV:        {settings.APP_ENV}")
    print(f"• EMAIL_FROM:     {settings.EMAIL_FROM}")
    print(f"• FRONTEND_URL:   {settings.FRONTEND_URL}")
    print(f"• RESEND_API_KEY: {'*' * (len(api_key) - 6) + api_key[-6:] if len(api_key) > 6 else ('[EMPTY/NOT SET]' if not api_key else '[SHORT]')}")
    print(f"• Recipient:      {recipient}")
    print("----------------------------------------------------------------\n")

    if not api_key:
        print("❌ ERROR: RESEND_API_KEY is not set in your .env / environment variables.")
        print("👉 Solution: Add RESEND_API_KEY=re_xxxx... to your .env or Render/Railway dashboard.\n")
        return

    from_sender = "FinTrack <onboarding@resend.dev>"
    print(f"🚀 Sending test email via Resend API to {recipient} from {from_sender}...")

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
                    "subject": "FinTrack — Resend API Test Email",
                    "html": "<h3>Resend API is working! 🚀</h3><p>Your FinTrack email configuration is successful.</p>",
                    "text": "Resend API is working! Your FinTrack email configuration is successful.",
                },
            )

            print(f"\n📡 Resend HTTP Response Status: {response.status_code}")
            print(f"📄 Resend Response Body: {response.text}\n")

            if response.status_code in (200, 201):
                print("✅ SUCCESS! Email was delivered by Resend.")
                print(f"👉 Check the inbox/spam of: {recipient}\n")
            elif response.status_code == 403:
                print("❌ ERROR 403 Forbidden (Resend Free Tier Restriction):")
                print("👉 Reason: In Resend test mode (using onboarding@resend.dev), you can ONLY send emails to the single email address you used to register your Resend account.")
                print("👉 Solution 1: Test by registering with the exact email address of your Resend account.")
                print("👉 Solution 2: Add and verify your custom domain at https://resend.com/domains to send to any user.")
            elif response.status_code == 401:
                print("❌ ERROR 401 Unauthorized:")
                print("👉 Reason: Invalid or expired RESEND_API_KEY.")
                print("👉 Solution: Create a new API Key on https://resend.com/api-keys with 'Full Access' or 'Sending Access'.")
            else:
                print(f"❌ ERROR: Unexpected status code {response.status_code}.")

    except Exception as e:
        print(f"❌ Connection Exception: {e}")


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "test@example.com"
    asyncio.run(test_resend(target))
