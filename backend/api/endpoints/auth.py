import urllib.parse
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse, RedirectResponse
import httpx
from pydantic import BaseModel, EmailStr, field_validator

from core.config import settings
from core.logging import logger

router = APIRouter()


# ── JWT helpers ──────────────────────────────────────────────────────────────

def create_access_token(email: str, name: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRE_HOURS)
    payload = {
        "sub": email,
        "name": name,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


# ── Email/Password login ──────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def email_must_be_valid(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email address")
        return v

    @field_validator("password")
    @classmethod
    def password_not_empty(cls, v: str) -> str:
        if not v or len(v) < 1:
            raise ValueError("Password is required")
        return v


@router.post("/login")
async def login(body: LoginRequest):
    """
    Email/password login. Accepts any valid email with a non-empty password
    and issues a signed JWT. Replace with real user DB check when ready.
    """
    name = body.email.split("@")[0]
    token = create_access_token(email=body.email, name=name)
    logger.info("User logged in", email=body.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"email": body.email, "name": name},
    }


# ── Google OAuth ──────────────────────────────────────────────────────────────

@router.get("/google/config")
async def get_google_config():
    return {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "callback_url": settings.GOOGLE_CALLBACK_URL,
        "maps_api_key": settings.GOOGLE_GEOCODING_API_KEY,
    }


async def handle_oauth_callback(request: Request):
    code = request.query_params.get("code")
    error = request.query_params.get("error")
    frontend_login_url = f"{settings.FRONTEND_URL}/login"

    if error:
        logger.error("OAuth Authorization failed", error=error)
        err_msg = urllib.parse.quote(f"Google authentication failed: {error}")
        return RedirectResponse(url=f"{frontend_login_url}?error={err_msg}")

    if not code:
        logger.error("OAuth Callback missing authorization code")
        err_msg = urllib.parse.quote("Authentication failed: No authorization code was returned.")
        return RedirectResponse(url=f"{frontend_login_url}?error={err_msg}")

    try:
        async with httpx.AsyncClient() as client:
            token_res = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_CALLBACK_URL,
                    "grant_type": "authorization_code",
                },
            )
            if token_res.status_code != 200:
                logger.error("Google token exchange failed", status_code=token_res.status_code)
                err_msg = urllib.parse.quote("Failed to retrieve authentication tokens from Google.")
                return RedirectResponse(url=f"{frontend_login_url}?error={err_msg}")

            tokens = token_res.json()
            access_token = tokens.get("access_token")
            if not access_token:
                err_msg = urllib.parse.quote("Authentication tokens are missing from response.")
                return RedirectResponse(url=f"{frontend_login_url}?error={err_msg}")

            user_res = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if user_res.status_code != 200:
                err_msg = urllib.parse.quote("Failed to fetch user details from Google.")
                return RedirectResponse(url=f"{frontend_login_url}?error={err_msg}")

            user_info = user_res.json()
            email = user_info.get("email", "")
            name = user_info.get("name") or email.split("@")[0]

            logger.info("Google OAuth successful", email=email)
            signed_jwt = create_access_token(email=email, name=name)

            url_params = urllib.parse.urlencode({"token": signed_jwt, "username": name, "email": email})
            return RedirectResponse(url=f"{frontend_login_url}?{url_params}")

    except Exception:
        logger.exception("Unexpected error during Google OAuth callback")
        err_msg = urllib.parse.quote("An unexpected error occurred during Google sign in.")
        return RedirectResponse(url=f"{frontend_login_url}?error={err_msg}")
