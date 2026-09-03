import re
import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RegisterRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")
    display_name: str = Field(..., min_length=1, max_length=100, description="Display name")
    phone_number: Optional[str] = Field(None, description="Optional mobile phone number with country code")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", clean):
            raise ValueError("Invalid email format")
        return clean

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Display name cannot be empty")
        if len(clean) > 100:
            raise ValueError("Display name cannot exceed 100 characters")
        return clean


class RegisterWithPhoneRequest(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=100, description="Display name")
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")
    firebase_id_token: str = Field(..., min_length=10, description="Firebase Phone Auth ID Token")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", clean):
            raise ValueError("Invalid email format")
        return clean

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Display name cannot be empty")
        if len(clean) > 100:
            raise ValueError("Display name cannot exceed 100 characters")
        return clean


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not clean:
            raise ValueError("Email cannot be empty")
        return clean


class GoogleAuthRequest(BaseModel):
    id_token: str = Field(..., min_length=1, description="Google OAuth ID Token from frontend")


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    display_name: str
    phone_number: Optional[str] = None
    phone_verified: bool = False
    email_verified: bool
    auth_provider: Literal["local", "google", "phone"] = "local"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., description="Account email to send reset instructions to")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not clean:
            raise ValueError("Email cannot be empty")
        return clean


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1, description="Password reset verification token")
    new_password: str = Field(..., min_length=8, description="New password (min 8 characters)")


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, description="Current password")
    new_password: str = Field(..., min_length=8, description="New password (min 8 characters)")


class VerifyEmailRequest(BaseModel):
    token: str = Field(..., min_length=1, description="Email verification token")


class ResendVerificationRequest(BaseModel):
    email: str = Field(..., description="Account email to resend verification link to")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not clean:
            raise ValueError("Email cannot be empty")
        return clean


class RegisterResponse(BaseModel):
    email: str
    display_name: str
    message: str
    pre_reg_session: Optional[str] = None


class VerifyOtpRequest(BaseModel):
    pre_reg_session: str = Field(..., min_length=1, description="Pre-registration session token")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit numeric verification OTP")

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        clean = v.strip()
        if not re.match(r"^\d{6}$", clean):
            raise ValueError("OTP must be exactly 6 numeric digits")
        return clean


class MessageResponse(BaseModel):
    message: str

