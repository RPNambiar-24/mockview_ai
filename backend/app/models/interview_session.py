from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class InterviewSession(Base):
    """
    Represents a complete mock interview session.

    States:
        setup       → user configuring (before generation)
        generating  → LLM building question bank
        ready       → questions ready, interview not started
        in_progress → user actively answering
        processing  → post-session AI analysis running
        completed   → all analysis done, report ready
    """
    __tablename__ = "interview_sessions"

    id                    = Column(Integer, primary_key=True, index=True)
    user_id               = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_id             = Column(Integer, ForeignKey("resumes.id"), nullable=True)

    # Setup config
    job_title             = Column(String, nullable=False)
    company_name          = Column(String)
    job_description       = Column(Text, nullable=False)
    interview_style       = Column(String, default="mixed")   # technical|behavioral|philosophical|sarcastic|mixed|scenario
    difficulty            = Column(String, default="medium")  # easy|medium|hard|adaptive

    # State machine
    status                = Column(String, default="setup")

    # Computed scores (populated after processing)
    overall_score         = Column(Float)
    technical_score       = Column(Float)
    behavioral_score      = Column(Float)
    communication_score   = Column(Float)
    confidence_score      = Column(Float)
    selection_probability = Column(Float)

    # Rich feedback blobs
    summary_feedback      = Column(Text)
    strengths             = Column(JSON)   # list[str]
    weaknesses            = Column(JSON)   # list[str]
    resume_feedback       = Column(JSON)   # {missing_keywords, weak_bullets, suggestions}
    improvement_plan      = Column(Text)

    # Timing
    started_at            = Column(DateTime(timezone=True))
    finished_at           = Column(DateTime(timezone=True))
    created_at            = Column(DateTime(timezone=True), server_default=func.now())

    user      = relationship("User",     back_populates="sessions")
    resume    = relationship("Resume",   back_populates="sessions")
    questions = relationship("Question", back_populates="session", order_by="Question.order_index")
    answers   = relationship("Answer",   back_populates="session")
