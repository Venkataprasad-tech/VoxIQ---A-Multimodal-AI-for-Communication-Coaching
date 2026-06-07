from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import Base, engine
from app.api.routes import auth, chatbot

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VoxIQ API",
    description="Multimodal AI for Smarter Communication",
    version="1.0.0",
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(auth.router)
app.include_router(chatbot.router)

@app.get("/")
def root():
    return {"message": "VoxIQ API is running 🚀", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}