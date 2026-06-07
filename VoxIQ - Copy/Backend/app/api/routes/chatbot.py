from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import httpx

from app.core.config import settings
from app.api.deps import get_current_user
from app.db.models import User

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama-3.1-8b-instant"  


# ── Schemas ──
class Message(BaseModel):
    role: str    # "user" or "model"
    text: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []

    # Session scores — sent from the result page
    emotion_label:    Optional[str]   = None   # e.g. "nervous", "happy", "neutral"
    emotion_score:    Optional[float] = None   # 0.0 – 1.0
    fluency_score:    Optional[float] = None   # 0.0 – 1.0
    lip_sync_mse:     Optional[float] = None   # lower = better (0.0 – 0.2+)
    confidence_score: Optional[float] = None   # 0.0 – 1.0
    cefr_level:       Optional[str]   = None   # A1, A2, B1, B2, C1, C2
    feedback_text:    Optional[str]   = None   # system generated feedback string

class ChatResponse(BaseModel):
    reply: str


def map_fluency(score: float) -> str:
    if score >= 0.85: return "Excellent"
    if score >= 0.70: return "Good"
    if score >= 0.55: return "Moderate"
    return "Needs significant improvement"

def map_confidence(score: float) -> str:
    if score >= 0.80: return "High"
    if score >= 0.60: return "Moderate"
    if score >= 0.40: return "Low"
    return "Very low"

def map_lipsync(mse: float) -> str:
    if mse <= 0.03: return "Excellent lip-speech sync"
    if mse <= 0.07: return "Good lip-speech sync"
    if mse <= 0.12: return "Fair lip-speech sync"
    return "Poor lip-speech sync — visible mismatch"


def build_system_prompt(req: ChatRequest) -> str:
    """
    Build a system prompt that includes the user's actual session scores.
    This is the critical part — ARIA gives advice BASED ON specific numbers,
    not generic tips.
    """

    has_scores = any([
        req.emotion_label, req.fluency_score is not None,
        req.lip_sync_mse is not None, req.confidence_score is not None,
        req.cefr_level
    ])

    # ── Score analysis block ──
    score_block = ""
    if has_scores:
        lines = ["=== USER SESSION RESULTS ==="]

        if req.emotion_label and req.emotion_score is not None:
            pct = req.emotion_score * 100
            lines.append(f"Dominant Emotion : {req.emotion_label.upper()} ({pct:.1f}%)")

        if req.fluency_score is not None:
            label = map_fluency(req.fluency_score)
            lines.append(f"Fluency Score    : {req.fluency_score:.2f}/1.0  → {label}")

        if req.lip_sync_mse is not None:
            label = map_lipsync(req.lip_sync_mse)
            lines.append(f"Lip Sync MSE     : {req.lip_sync_mse:.3f}       → {label}")

        if req.confidence_score is not None:
            pct   = req.confidence_score * 100
            label = map_confidence(req.confidence_score)
            lines.append(f"Confidence Score : {pct:.1f}%             → {label}")

        if req.cefr_level:
            lines.append(f"CEFR Level       : {req.cefr_level}")

        if req.feedback_text:
            lines.append(f"System Feedback  : {req.feedback_text}")

        lines.append("=== END OF RESULTS ===")
        score_block = "\n".join(lines)

    # ── Advice rules based on scores ──
    advice_rules = ""
    if has_scores:
        rules = []

        # Fluency rules
        if req.fluency_score is not None:
            if req.fluency_score < 0.55:
                rules.append("FLUENCY is poor — focus advice on reducing pauses, filler words (um, uh), and speaking rate exercises.")
            elif req.fluency_score < 0.70:
                rules.append("FLUENCY is moderate — advise on rhythm, sentence stress, and reading aloud practice.")
            else:
                rules.append("FLUENCY is good — advise on maintaining consistency under pressure.")

        # Emotion rules
        if req.emotion_label and req.emotion_score is not None:
            em = req.emotion_label.lower()
            if em in ["nervous", "fear", "angry", "disgust"] and req.emotion_score > 0.5:
                rules.append(f"EMOTION shows {req.emotion_label} ({req.emotion_score*100:.0f}%) — give specific techniques to manage nervousness: breathing, pausing, power poses.")
            elif em in ["neutral"] and req.emotion_score > 0.6:
                rules.append("EMOTION is mostly neutral/flat — advise on being more expressive, storytelling, varying pitch and tone.")
            elif em in ["happy", "surprise"] and req.emotion_score > 0.5:
                rules.append("EMOTION shows positive engagement — reinforce this and advise on channelling it appropriately.")

        # Confidence rules
        if req.confidence_score is not None:
            if req.confidence_score < 0.50:
                rules.append("CONFIDENCE is low — advise on posture, eye contact, voice projection, and daily mirror practice.")
            elif req.confidence_score < 0.70:
                rules.append("CONFIDENCE is moderate — advise on interview rehearsal and recording themselves.")

        # Lip sync rules
        if req.lip_sync_mse is not None and req.lip_sync_mse > 0.10:
            rules.append("LIP SYNC is poor — advise on clear articulation, slowing down, and mouth movement exercises.")

        # CEFR rules
        if req.cefr_level:
            lvl = req.cefr_level.upper()
            if lvl in ["A1", "A2"]:
                rules.append("CEFR level is beginner — use simple vocabulary, basic sentence structures, suggest shadowing exercises.")
            elif lvl in ["B1", "B2"]:
                rules.append("CEFR level is intermediate — focus on complex sentence construction, idiomatic expressions, interview-specific vocabulary.")
            elif lvl in ["C1", "C2"]:
                rules.append("CEFR level is advanced — focus on nuance, persuasion, professional vocabulary, and subtle emotional control.")

        if rules:
            advice_rules = "\nADVICE RULES FOR THIS USER:\n" + "\n".join(f"- {r}" for r in rules)

    
    prompt = f"""You are ARIA (Adaptive Response & Interview Advisor), the AI coaching assistant for VoxIQ.

VoxIQ is a multimodal AI platform that analyses:
- Facial emotion recognition (CNN-based, 7 emotion classes: happy, sad, angry, fear, disgust, surprise, neutral)
- Lip articulation synchronization (RNN-based, scored by MSE — lower is better)
- Speech fluency and prosody (Wav2Vec-based, scored 0.0–1.0)
- Bayesian confidence estimation (fusing all three modalities, scored 0.0–1.0)
- CEFR level assessment (A1 to C2 English proficiency)

{score_block}
{advice_rules}

YOUR COACHING RULES:
1. If session results are provided above, ALWAYS reference the specific scores in your response.
   - Say things like "Your fluency score of 0.62 indicates..." or "Since your confidence is at 58%..."
   - Never give generic advice when you have specific data. Data-driven advice = valuable advice.
2. Give 2–4 specific, actionable improvement techniques based on the weak areas shown in scores.
3. Be encouraging but honest. Don't sugarcoat poor scores, but frame them constructively.
4. Keep responses clear, structured, and practical. Use bullet points for exercises.
5. If no session results are provided, still give excellent communication coaching advice.

DOMAIN RESTRICTION — STRICT:
You ONLY answer questions about:
✅ Communication skills, fluency, pronunciation, grammar coaching
✅ Interview preparation and professional speaking
✅ Emotion control, body language, confidence building
✅ CEFR levels and English proficiency
✅ The user's session scores and how to improve them
✅ Vocal exercises, articulation, public speaking techniques

❌ Refuse ANYTHING outside communication/interview coaching:
- Coding, math, science, news, politics, entertainment, personal life advice
- If asked off-topic, respond ONLY with:
  "I'm ARIA, your VoxIQ communication coach. I can only help with communication skills and interview coaching. What would you like to improve?"

TONE: Like a professional coach — warm, direct, specific, encouraging.
"""
    return prompt


@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "your-groq-api-key-here":
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY not set. Add it to your .env file."
        )

    try:
        system_prompt = build_system_prompt(req)

        # Build messages list for Groq (OpenAI-compatible format)
        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history
        for m in req.history:
            messages.append({
                "role":    "user"      if m.role == "user" else "assistant",
                "content": m.text
            })

        # Add current user message
        messages.append({"role": "user", "content": req.message})

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type":  "application/json",
                },
                json={
                    "model":       GROQ_MODEL,
                    "messages":    messages,
                    "max_tokens":  1024,
                    "temperature": 0.7,
                }
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"ARIA error: {response.text}"
            )

        data  = response.json()
        reply = data["choices"][0]["message"]["content"]
        return ChatResponse(reply=reply)

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="ARIA took too long to respond. Please try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ARIA error: {str(e)}")