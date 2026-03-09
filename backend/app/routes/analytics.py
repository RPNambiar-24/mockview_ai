from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.interview_session import InterviewSession
from app.models.answer import Answer

router = APIRouter()

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    total     = db.query(func.count(InterviewSession.id)).filter(InterviewSession.user_id == user.id).scalar()
    completed = db.query(func.count(InterviewSession.id)).filter(InterviewSession.user_id == user.id, InterviewSession.status == "completed").scalar()
    avg_score = db.query(func.avg(InterviewSession.overall_score)).filter(InterviewSession.user_id == user.id, InterviewSession.overall_score.isnot(None)).scalar()
    recent    = db.query(InterviewSession).filter(InterviewSession.user_id == user.id).order_by(InterviewSession.created_at.desc()).limit(5).all()

    return {
        "total_interviews":     total,
        "completed_interviews": completed,
        "average_score":        round(float(avg_score), 1) if avg_score else 0,
        "recent_sessions": [{
            "id": s.id, "job_title": s.job_title, "status": s.status,
            "overall_score": s.overall_score, "created_at": s.created_at.isoformat()
        } for s in recent]
    }

@router.get("/trends")
def trends(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == user.id,
        InterviewSession.overall_score.isnot(None)
    ).order_by(InterviewSession.created_at.asc()).all()

    return {"trends": [{
        "date": s.created_at.isoformat(),
        "overall": s.overall_score,
        "technical": s.technical_score,
        "behavioral": s.behavioral_score,
        "communication": s.communication_score,
        "id": s.id,
    } for s in sessions]}

@router.get("/strengths-weaknesses")
def sw(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == user.id,
        InterviewSession.status == "completed"
    ).all()
    strengths, weaknesses = [], []
    for s in sessions:
        if s.strengths: strengths.extend(s.strengths)
        if s.weaknesses: weaknesses.extend(s.weaknesses)
    def _clean(text):
        return text.replace("OPENAI_API_KEY or GROQ_API_KEY", "GROQ_API_KEY").replace("OPENAI_API_KEY", "GROQ_API_KEY")
        
    return {
        "strengths": [_clean(s) for s in strengths[-10:]], 
        "weaknesses": [_clean(w) for w in weaknesses[-10:]]
    }
