import logging
from typing import Any, Dict

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.core.config import get_settings
from app.core.exceptions import UnauthorizedException

logger = logging.getLogger(__name__)
settings = get_settings()


def verify_firebase_id_token(token: str) -> Dict[str, Any]:
    """
    Verify a Firebase ID token issued after phone number verification.
    Returns the decoded token claims dictionary containing 'phone_number', 'sub', etc.
    """
    if not token or not token.strip():
        raise UnauthorizedException("Firebase ID token is required")

    try:
        req = google_requests.Request()
        audience = settings.FIREBASE_PROJECT_ID.strip() if settings.FIREBASE_PROJECT_ID else None
        claims = google_id_token.verify_firebase_token(token.strip(), req, audience=audience)
        return claims
    except Exception as e:
        logger.warning(f"Firebase token verification failed: {e}")
        raise UnauthorizedException(f"Invalid or expired Firebase phone token: {str(e)}")
