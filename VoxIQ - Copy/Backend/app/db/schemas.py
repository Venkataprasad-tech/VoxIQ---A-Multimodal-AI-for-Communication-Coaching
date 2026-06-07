from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# ── Auth ──
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

# ── User ──
class UserOut(BaseModel):
    id: str
    name: str
    email: str
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ── Session ──
class SessionOut(BaseModel):
    id: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# ── Analysis Result ──
class AnalysisResultOut(BaseModel):
    id: str
    session_id: str
    emotion_scores: Optional[dict] = None
    lip_sync_mse: Optional[float] = None
    fluency_score: Optional[float] = None
    confidence_score: Optional[float] = None
    feedback_text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

LoginResponse.model_rebuild()