from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Resume(Base):
    __tablename__ = "resumes"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename    = Column(String, nullable=False)
    file_path   = Column(String, nullable=False)
    raw_text    = Column(Text)
    parsed_data = Column(JSON)   # {skills, experience, education, contact}
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    user     = relationship("User",             back_populates="resumes")
    sessions = relationship("InterviewSession", back_populates="resume")
