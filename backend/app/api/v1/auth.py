from typing import Optional

from fastapi import APIRouter, Cookie, Depends, Header, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.middleware.rate_limiter import limiter
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    GoogleAuthRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    RegisterResponse,
    RegisterWithPhoneRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
    VerifyEmailRequest,
    VerifyOtpRequest,
)
from app.services.auth_service import AuthService

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["Authentication"])
auth_service = AuthService()


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """Set Secure, HttpOnly refresh token cookie on response."""
    max_age_seconds = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    samesite_policy = "none" if settings.COOKIE_SECURE else "lax"

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=max_age_seconds,
        expires=max_age_seconds,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=samesite_policy,
        domain=settings.COOKIE_DOMAIN,
        path=f"{settings.API_V1_PREFIX}/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    """Clear refresh token cookie on response."""
    samesite_policy = "none" if settings.COOKIE_SECURE else "lax"
    response.delete_cookie(
        key="refresh_token",
        path=f"{settings.API_V1_PREFIX}/auth",
        domain=settings.COOKIE_DOMAIN,
        secure=settings.COOKIE_SECURE,
        samesite=samesite_policy,
    )


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user account",
)
async def register(
    data: RegisterRequest,
    session: AsyncSession = Depends(get_db),
):
    return await auth_service.register(session=session, data=data)


@router.post(
    "/register-with-phone",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user account verified via Firebase Phone SMS OTP",
)
async def register_with_phone(
    request: Request,
    response: Response,
    data: RegisterWithPhoneRequest,
    user_agent: Optional[str] = Header(None),
    session: AsyncSession = Depends(get_db),
):
    token_response, refresh_token = await auth_service.register_with_phone(
        session=session,
        data=data,
        device_info=user_agent,
    )
    _set_refresh_cookie(response, refresh_token)
    return token_response


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate with email and password",
)
@limiter.limit(settings.RATE_LIMIT_LOGIN)
async def login(
    request: Request,
    data: LoginRequest,
    response: Response,
    user_agent: Optional[str] = Header(None),
    session: AsyncSession = Depends(get_db),
):
    token_response, refresh_token = await auth_service.login(
        session=session,
        data=data,
        device_info=user_agent,
    )
    _set_refresh_cookie(response, refresh_token)
    return token_response


@router.post(
    "/google",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Sign in or register with Google OAuth ID token",
)
async def google_auth(
    data: GoogleAuthRequest,
    response: Response,
    request: Request,
    user_agent: Optional[str] = Header(None),
    session: AsyncSession = Depends(get_db),
):
    token_response, refresh_token = await auth_service.google_auth(
        session=session,
        data=data,
        device_info=user_agent,
    )
    _set_refresh_cookie(response, refresh_token)
    return token_response


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Rotate refresh token and issue new access token",
)
async def refresh_token(
    response: Response,
    request: Request,
    refresh_token: Optional[str] = Cookie(None),
    user_agent: Optional[str] = Header(None),
    session: AsyncSession = Depends(get_db),
):
    token_response, new_refresh_token = await auth_service.refresh_tokens(
        session=session,
        raw_refresh_token=refresh_token or "",
        device_info=user_agent,
    )
    _set_refresh_cookie(response, new_refresh_token)
    return token_response


@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Log out and revoke current refresh token",
)
async def logout(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    session: AsyncSession = Depends(get_db),
):
    await auth_service.logout(session=session, raw_refresh_token=refresh_token)
    _clear_refresh_cookie(response)
    return MessageResponse(message="Logged out successfully")


@router.post(
    "/logout-all",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Log out from all devices (revoke all refresh tokens)",
)
async def logout_all(
    response: Response,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    count = await auth_service.logout_all(session=session, user_id=current_user.id)
    _clear_refresh_cookie(response)
    return MessageResponse(message=f"Logged out from all {count} active sessions successfully")


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Request password reset email",
)
@limiter.limit(settings.RATE_LIMIT_FORGOT_PASSWORD)
async def forgot_password(
    request: Request,
    data: ForgotPasswordRequest,
    session: AsyncSession = Depends(get_db),
):
    await auth_service.forgot_password(session=session, email=data.email)
    return MessageResponse(
        message="If an account with that email exists, password reset instructions have been sent."
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset password with email action token",
)
async def reset_password(
    data: ResetPasswordRequest,
    session: AsyncSession = Depends(get_db),
):
    await auth_service.reset_password(session=session, data=data)
    return MessageResponse(message="Password reset successfully. You can now log in with your new password.")


@router.put(
    "/change-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Change password for authenticated user",
)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    await auth_service.change_password(
        session=session,
        user_id=current_user.id,
        data=data,
    )
    return MessageResponse(message="Password changed successfully")


@router.post(
    "/verify-email",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify email address with action token",
)
async def verify_email(
    data: VerifyEmailRequest,
    session: AsyncSession = Depends(get_db),
):
    await auth_service.verify_email(session=session, token=data.token)
    return MessageResponse(message="Email address verified successfully!")


@router.post(
    "/verify-otp",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify 6-digit email OTP and auto-login user",
)
async def verify_otp(
    request: Request,
    response: Response,
    data: VerifyOtpRequest,
    session: AsyncSession = Depends(get_db),
):
    device_info = request.headers.get("user-agent")
    token_response, refresh_token = await auth_service.verify_otp(
        session=session,
        data=data,
        device_info=device_info,
    )
    _set_refresh_cookie(response, refresh_token)
    return token_response


@router.post(
    "/resend-verification",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Resend verification email to user by email address",
)
@limiter.limit(settings.RATE_LIMIT_RESEND_VERIFICATION)
async def resend_verification(
    request: Request,
    data: ResendVerificationRequest,
    session: AsyncSession = Depends(get_db),
):
    await auth_service.resend_verification(session=session, email=data.email)
    return MessageResponse(
        message="If an account with that email exists and is unverified, a verification link has been sent."
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
)
async def get_me(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    return await auth_service.get_me(session=session, user_id=current_user.id)
