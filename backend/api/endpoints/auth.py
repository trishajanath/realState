import urllib.parse
from fastapi import APIRouter, Request, status
from fastapi.responses import RedirectResponse
import httpx

from core.config import settings
from core.logging import logger

router = APIRouter()

@router.get("/google/config")
async def get_google_config():
    """
    Returns Google OAuth Client and Maps configurations to the frontend.
    """
    return {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "callback_url": settings.GOOGLE_CALLBACK_URL,
        "maps_api_key": settings.GOOGLE_GEOCODING_API_KEY
    }

async def handle_oauth_callback(request: Request):
    """
    Exchanges the authorization code for access tokens, fetches user profile,
    and redirects user back to the frontend with token credentials.
    """
    code = request.query_params.get("code")
    error = request.query_params.get("error")

    frontend_login_url = "http://localhost:5173/login"

    if error:
        logger.error("OAuth Authorization failed from Google Consent Screen", error=error)
        err_msg = urllib.parse.quote(f"Google authentication failed: {error}")
        return RedirectResponse(url=f"{frontend_login_url}?error={err_msg}")

    if not code:
        logger.error("OAuth Callback invoked without authorization code")
        err_msg = urllib.parse.quote("Authentication failed: No authorization code was returned.")
        return RedirectResponse(url=f"{frontend_login_url}?error={err_msg}")

    # Exchange code for tokens
    try:
        async with httpx.AsyncClient() as client:
            token_url = "https://oauth2.googleapis.com/token"
            data = {
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_CALLBACK_URL,
                "grant_type": "authorization_code"
            }
            logger.info("Exchanging code for Google access token", redirect_uri=settings.GOOGLE_CALLBACK_URL)
            token_res = await client.post(token_url, data=data)
            
            if token_res.status_code != 200:
                logger.error(
                    "Google token exchange failed", 
                    status_code=token_res.status_code, 
                    resp_body=token_res.text
                )
                err_msg = urllib.parse.quote("Failed to retrieve authentication tokens from Google.")
                return RedirectResponse(url=f"{frontend_login_url}?error={err_msg}")
            
            tokens = token_res.json()
            access_token = tokens.get("access_token")
            
            if not access_token:
                logger.error("No access token present in token exchange response")
                err_msg = urllib.parse.quote("Authentication tokens are missing from response.")
                return RedirectResponse(url=f"{frontend_login_url}?error={err_msg}")
                
            # Fetch user profile details
            user_info_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            headers = {"Authorization": f"Bearer {access_token}"}
            user_res = await client.get(user_info_url, headers=headers)
            
            if user_res.status_code != 200:
                logger.error("Failed to fetch Google user profile details", status_code=user_res.status_code)
                err_msg = urllib.parse.quote("Failed to fetch user details from Google.")
                return RedirectResponse(url=f"{frontend_login_url}?error={err_msg}")
                
            user_info = user_res.json()
            email = user_info.get("email")
            name = user_info.get("name") or email.split("@")[0]
            
            logger.info("Successfully authenticated Google user", email=email)
            
            # Generate a mock JWT for the session and redirect back to frontend
            mock_jwt = f"mock_google_oauth_token_{urllib.parse.quote(email)}"
            url_params = urllib.parse.urlencode({
                "token": mock_jwt,
                "username": name,
                "email": email
            })
            
            return RedirectResponse(url=f"{frontend_login_url}?{url_params}")
            
    except Exception as e:
        logger.exception("Unexpected error during Google OAuth callback processing")
        err_msg = urllib.parse.quote("An unexpected error occurred during Google sign in.")
        return RedirectResponse(url=f"{frontend_login_url}?error={err_msg}")
