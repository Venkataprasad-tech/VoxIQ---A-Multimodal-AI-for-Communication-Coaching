from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import requests

from app.db.database import get_db
from app.db.models import User
from app.db.schemas import RegisterRequest, LoginResponse, UserOut
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import settings
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ──────────────────────────────────────────
# REGISTER
# ──────────────────────────────────────────
@router.post("/register", response_model=LoginResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    # check duplicate
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer", "user": user}


# ──────────────────────────────────────────
# LOGIN  (email + password)
# ──────────────────────────────────────────
@router.post("/login", response_model=LoginResponse)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer", "user": user}


# ──────────────────────────────────────────
# GET CURRENT USER
# ──────────────────────────────────────────
@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ──────────────────────────────────────────
# GOOGLE OAUTH — Step 1: redirect to Google
# ──────────────────────────────────────────
@router.get("/google")
def google_login():
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        "&response_type=code"
        "&scope=openid%20email%20profile"
        "&access_type=offline"
    )
    return RedirectResponse(url=google_auth_url)


# ──────────────────────────────────────────
# GOOGLE OAUTH — Step 2: callback
# ──────────────────────────────────────────
@router.get("/google/callback")
def google_callback(code: str, db: Session = Depends(get_db)):
    # Exchange code for tokens
    token_res = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get Google token.")

    google_tokens = token_res.json()
    id_token = google_tokens.get("id_token")

    # Get user info from Google
    userinfo_res = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {google_tokens['access_token']}"},
    )
    if userinfo_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get Google user info.")

    guser = userinfo_res.json()
    google_id  = guser["sub"]
    email      = guser["email"]
    name       = guser.get("name", email.split("@")[0])
    avatar_url = guser.get("picture")

    # Find or create user
    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()
        if user:
            # link google to existing email account
            user.google_id  = google_id
            user.avatar_url = avatar_url
        else:
            user = User(
                name=name,
                email=email,
                google_id=google_id,
                avatar_url=avatar_url,
            )
            db.add(user)
    db.commit()
    db.refresh(user)

    # Issue JWT and redirect to frontend
    jwt_token = create_access_token({"sub": user.id})
    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}"
    )