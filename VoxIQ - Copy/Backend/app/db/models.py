from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.db.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id            = Column(String, primary_key=True, default=gen_uuid)
    name          = Column(String(120), nullable=False)
    email         = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)       # null for Google-only users
    google_id     = Column(String, unique=True, nullable=True)
    avatar_url    = Column(String, nullable=True)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())

    sessions = relationship("Session", back_populates="user", cascade="all, delete")

class Session(Base):
    __tablename__ = "sessions"

    id          = Column(String, primary_key=True, default=gen_uuid)
    user_id     = Column(String, ForeignKey("users.id"), nullable=False)
    video_path  = Column(String, nullable=True)
    status      = Column(String, default="pending")  # pending | processing | done | failed
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    user   = relationship("User", back_populates="sessions")
    result = relationship("AnalysisResult", back_populates="session", uselist=False, cascade="all, delete")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id                = Column(String, primary_key=True, default=gen_uuid)
    session_id        = Column(String, ForeignKey("sessions.id"), nullable=False)
    emotion_scores    = Column(JSON, nullable=True)      # {"happy":0.7,"neutral":0.2,...}
    lip_sync_mse      = Column(Float, nullable=True)
    fluency_score     = Column(Float, nullable=True)
    confidence_score  = Column(Float, nullable=True)
    feedback_text     = Column(Text, nullable=True)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("Session", back_populates="result")