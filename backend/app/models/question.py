from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Question(Base):
    __tablename__ = "questions"

    id                      = Column(Integer, primary_key=True, index=True)
    session_id              = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    order_index             = Column(Integer, default=0)

    question_text           = Column(Text, nullable=False)
    question_type           = Column(String)    # technical|behavioral|personality|scenario
    difficulty              = Column(String)    # easy|medium|hard
    expected_skills         = Column(JSON)      # list[str]
    expected_answer_hints   = Column(Text)      # what a good answer covers
    follow_up_logic         = Column(JSON)      # conditions for follow-up
    recommended_time_secs   = Column(Integer, default=120)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("InterviewSession", back_populates="questions")
    answer  = relationship("Answer",           back_populates="question", uselist=False)
