from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Answer(Base):
    __tablename__ = "answers"

    id           = Column(Integer, primary_key=True, index=True)
    session_id   = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    question_id  = Column(Integer, ForeignKey("questions.id"), nullable=False)
    audio_path   = Column(String)
    transcript   = Column(Text)
    duration_sec = Column(Float)

    # Dimension scores (0-100)
    relevance_score   = Column(Float)
    clarity_score     = Column(Float)
    confidence_score  = Column(Float)
    fluency_score     = Column(Float)
    depth_score       = Column(Float)    # technical depth
    star_score        = Column(Float)    # STAR structure (behavioral)
    total_score       = Column(Float)

    # Analysis details
    filler_count      = Column(Integer, default=0)
    filler_words      = Column(JSON)     # [{word, count}]
    feedback          = Column(Text)
    expected_coverage = Column(Text)     # what the ideal answer would include
    improvement_tips  = Column(JSON)     # list[str]

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session  = relationship("InterviewSession", back_populates="answers")
    question = relationship("Question",         back_populates="answer")
