import uuid
from datetime import timedelta

import pytest

from app.core.exceptions import UnauthorizedException, ValidationException
from app.core.security import (
    create_access_token,
    create_email_token,
    create_pre_registration_token,
    decode_access_token,
    decode_email_token,
    decode_pre_registration_token,
    generate_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)


def test_password_hashing_and_verification():
    raw = "SuperSecretPassword123!"
    hashed = hash_password(raw)

    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False
    assert verify_password("", hashed) is False


def test_access_token_creation_and_decoding():
    user_id = uuid.uuid4()
    token = create_access_token(user_id)

    assert token is not None
    payload = decode_access_token(token)
    assert payload["sub"] == str(user_id)
    assert payload["type"] == "access"
    assert "exp" in payload
    assert "iat" in payload


def test_expired_access_token_raises():
    user_id = uuid.uuid4()
    expired_token = create_access_token(user_id, expires_delta=timedelta(seconds=-10))

    with pytest.raises(UnauthorizedException) as exc_info:
        decode_access_token(expired_token)
    assert "expired" in str(exc_info.value.message).lower()


def test_opaque_refresh_token_generation_and_hashing():
    token_1 = generate_refresh_token()
    token_2 = generate_refresh_token()

    assert len(token_1) >= 64
    assert token_1 != token_2

    hash_1 = hash_token(token_1)
    hash_2 = hash_token(token_2)

    assert hash_1 != token_1
    assert hash_1 != hash_2
    assert hash_1 == hash_token(token_1)


def test_email_token_creation_and_verification():
    user_id = uuid.uuid4()
    token = create_email_token(user_id, purpose="password_reset")

    payload = decode_email_token(token, expected_purpose="password_reset")
    assert payload["sub"] == str(user_id)
    assert payload["purpose"] == "password_reset"

    # Purpose mismatch should raise ValidationException
    with pytest.raises(ValidationException):
        decode_email_token(token, expected_purpose="email_verify")


def test_pre_registration_token_creation_and_decoding():
    email = "newuser@example.com"
    name = "New User"
    pw_hash = "$2b$12$somevalidfakehashvaluefortestingpurpose123"

    token = create_pre_registration_token(email=email, display_name=name, password_hash=pw_hash, phone_number="+919876543210")
    assert token is not None

    payload = decode_pre_registration_token(token)
    assert payload["sub"] == email
    assert payload["name"] == name
    assert payload["pw"] == pw_hash
    assert payload["phone"] == "+919876543210"
    assert payload["purpose"] == "pre_registration"


def test_firebase_id_token_empty_raises():
    from app.core.firebase import verify_firebase_id_token

    with pytest.raises(UnauthorizedException) as exc_info:
        verify_firebase_id_token("")
    assert "required" in str(exc_info.value.message).lower()
