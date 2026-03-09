"""
Stateful Interview Session API

POST /api/interview/create           → create session + generate questions
POST /api/interview/{id}/start       → mark session in_progress
POST /api/interview/{id}/answer      → submit audio for one question
POST /api/interview/{id}/finish      → trigger full AI analysis pipeline
GET  /api/interview/{id}/results     → fetch completed report
GET  /api/interview/{id}/status      → lightweight status poll
GET  /api/interview/                 → list all sessions for user
DELETE /api/interview/{id}           → delete session
"""
import os, uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.models.interview_session import InterviewSession
from app.models.question import Question
from app.models.answer import Answer
from app.services.question_generator import generate_questions
from app.services.whisper_service import transcribe_audio
from app.services.scoring_engine import score_answer, compute_session_scores
from app.services.report_generator import generate_session_report
from app.services.rag_pipeline import index_session
from app.core.config import settings

router = APIRouter()

AUDIO_DIR = os.path.join(settings.STORAGE_PATH, "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)


# ─── Pydantic I/O ─────────────────────────────────────────────────────────────

class CreateSessionRequest(BaseModel):
    resume_id:        Optional[int] = None
    job_title:        str
    company_name:     Optional[str] = ""
    job_description:  str
    interview_style:  str = "mixed"   # technical|behavioral|philosophical|sarcastic|mixed|scenario
    difficulty:       str = "medium"  # easy|medium|hard|adaptive
    question_count:   int = 15

class QuestionOut(BaseModel):
    id: int
    order_index: int
    question_text: str
    question_type: Optional[str]
    difficulty: Optional[str]
    expected_skills: Optional[list]
    recommended_time_secs: int

    class Config:
        from_attributes = True

class SessionOut(BaseModel):
    id: int
    status: str
    job_title: str
    company_name: Optional[str]
    interview_style: str
    difficulty: str
    overall_score: Optional[float]
    technical_score: Optional[float]
    behavioral_score: Optional[float]
    communication_score: Optional[float]
    confidence_score: Optional[float]
    selection_probability: Optional[float]
    summary_feedback: Optional[str]
    strengths: Optional[list]
    weaknesses: Optional[list]
    improvement_plan: Optional[str]
    resume_feedback: Optional[dict]
    created_at: datetime
    questions: Optional[List[QuestionOut]] = []

    class Config:
        from_attributes = True


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/create", response_model=SessionOut, status_code=201)
def create_session(
    body: CreateSessionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    resume_data = {}
    resume = None
    if body.resume_id:
        resume = db.query(Resume).filter(Resume.id == body.resume_id, Resume.user_id == user.id).first()
        if resume and resume.parsed_data:
            resume_data = resume.parsed_data

    # Build session
    sess = InterviewSession(
        user_id=user.id,
        resume_id=body.resume_id,
        job_title=body.job_title,
        company_name=body.company_name,
        job_description=body.job_description,
        interview_style=body.interview_style,
        difficulty=body.difficulty,
        status="generating",
    )
    db.add(sess)
    db.commit()
    db.refresh(sess)

    # Generate questions (may call Groq)
    raw_qs = generate_questions(
        resume_data=resume_data,
        job_description=body.job_description,
        job_title=body.job_title,
        interview_style=body.interview_style,
        difficulty=body.difficulty,
        count=body.question_count,
    )

    for i, q in enumerate(raw_qs):
        question = Question(
            session_id=sess.id,
            order_index=i,
            question_text=q.get("question", ""),
            question_type=q.get("type", "general"),
            difficulty=q.get("difficulty", "medium"),
            expected_skills=q.get("expected_skills", []),
            expected_answer_hints=q.get("expected_answer_hints", ""),
            follow_up_logic=q.get("follow_up_logic", {}),
            recommended_time_secs=q.get("recommended_time_secs", 120),
        )
        db.add(question)

    sess.status = "ready"
    db.commit()
    db.refresh(sess)
    return sess


@router.post("/{session_id}/start")
def start_session(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sess = _get_session(session_id, user.id, db)
    if sess.status not in ("ready", "in_progress"):
        raise HTTPException(400, f"Cannot start session with status '{sess.status}'")
    sess.status = "in_progress"
    sess.started_at = datetime.utcnow()
    db.commit()
    return {"session_id": session_id, "status": "in_progress"}


@router.post("/{session_id}/answer")
async def submit_answer(
    session_id: int,
    question_id: int,
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sess = _get_session(session_id, user.id, db)
    question = db.query(Question).filter(
        Question.id == session_id or Question.session_id == session_id,
        Question.id == question_id
    ).first()

    # Accept any question belonging to this session
    question = db.query(Question).filter(
        Question.id == question_id,
        Question.session_id == session_id
    ).first()

    if not question:
        raise HTTPException(404, "Question not found in this session")

    # Save audio
    ext = (audio.filename or "audio.webm").rsplit(".", 1)[-1]
    fname = f"s{session_id}_q{question_id}_{uuid.uuid4().hex[:8]}.{ext}"
    audio_path = os.path.join(AUDIO_DIR, fname)
    content = await audio.read()
    with open(audio_path, "wb") as f:
        f.write(content)

    # Transcribe
    transcript = transcribe_audio(audio_path)

    # Upsert answer record
    existing = db.query(Answer).filter(
        Answer.session_id == session_id,
        Answer.question_id == question_id
    ).first()

    if existing:
        existing.audio_path = audio_path
        existing.transcript = transcript
        answer = existing
    else:
        answer = Answer(
            session_id=session_id,
            question_id=question_id,
            audio_path=audio_path,
            transcript=transcript,
            duration_sec=len(content) / 16000 if content else 0,
        )
        db.add(answer)

    db.commit()
    db.refresh(answer)
    return {"question_id": question_id, "transcript": transcript, "answer_id": answer.id}


@router.post("/{session_id}/finish")
def finish_session(
    session_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sess = _get_session(session_id, user.id, db)
    sess.status = "processing"
    sess.finished_at = datetime.utcnow()
    db.commit()

    # Run analysis in background so client gets immediate response
    background_tasks.add_task(_run_analysis_pipeline, session_id)
    return {"session_id": session_id, "status": "processing", "message": "Analysis started — poll /status"}


@router.get("/{session_id}/status")
def get_status(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sess = _get_session(session_id, user.id, db)
    return {"session_id": session_id, "status": sess.status}


@router.get("/{session_id}/results", response_model=SessionOut)
def get_results(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sess = _get_session(session_id, user.id, db)
    return sess


@router.get("/", response_model=List[SessionOut])
def list_sessions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == user.id)
        .order_by(InterviewSession.created_at.desc())
        .all()
    )


@router.delete("/{session_id}", status_code=204)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sess = _get_session(session_id, user.id, db)
    db.query(Answer).filter(Answer.session_id == session_id).delete()
    db.query(Question).filter(Question.session_id == session_id).delete()
    db.delete(sess)
    db.commit()


# ─── Internal helpers ─────────────────────────────────────────────────────────

def _get_session(session_id: int, user_id: int, db: Session) -> InterviewSession:
    sess = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == user_id
    ).first()
    if not sess:
        raise HTTPException(404, "Interview session not found")
    return sess


def _run_analysis_pipeline(session_id: int):
    """Background task: score all answers → compute aggregates → build report."""
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        sess = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
        if not sess:
            return

        answers = db.query(Answer).filter(Answer.session_id == session_id).all()

        # Score each answer
        for answer in answers:
            if not answer.transcript or answer.transcript.startswith("["):
                continue
            question = db.query(Question).filter(Question.id == answer.question_id).first()
            if not question:
                continue

            scores = score_answer(
                transcript=answer.transcript,
                question_text=question.question_text,
                question_type=question.question_type or "general",
                expected_skills=question.expected_skills or [],
                expected_answer_hints=question.expected_answer_hints or "",
            )
            answer.relevance_score  = scores.get("relevance")
            answer.clarity_score    = scores.get("clarity")
            answer.confidence_score = scores.get("confidence")
            answer.fluency_score    = scores.get("fluency")
            answer.depth_score      = scores.get("depth")
            answer.star_score       = scores.get("star_score")
            answer.total_score      = scores.get("total")
            answer.filler_count     = scores.get("filler_count", 0)
            answer.filler_words     = scores.get("filler_words", [])
            answer.feedback         = scores.get("feedback")
            answer.expected_coverage= scores.get("expected_coverage")
            answer.improvement_tips = scores.get("improvement_tips", [])

        db.commit()

        # Reload to compute session-level aggregates
        answers_fresh = db.query(Answer).filter(Answer.session_id == session_id).all()
        agg = compute_session_scores(answers_fresh)

        sess.overall_score       = agg.get("overall_score")
        sess.technical_score     = agg.get("technical_score")
        sess.behavioral_score    = agg.get("behavioral_score")
        sess.communication_score = agg.get("communication_score")
        sess.confidence_score    = agg.get("confidence_score")

        # Generate narrative report
        report = generate_session_report(sess, answers_fresh)
        sess.summary_feedback     = report.get("summary_feedback")
        sess.strengths            = report.get("strengths")
        sess.weaknesses           = report.get("weaknesses")
        sess.improvement_plan     = report.get("improvement_plan")
        sess.resume_feedback      = report.get("resume_feedback")
        sess.selection_probability= report.get("selection_probability")

        sess.status = "completed"
        db.commit()

        # Index into RAG
        try:
            index_session(sess, db)
        except Exception as e:
            print(f"[RAG indexing] {e}")

    except Exception as e:
        print(f"[Analysis pipeline] ERROR: {e}")
        try:
            sess = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
            if sess:
                sess.status = "completed"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()
