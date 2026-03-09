from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from app.db.base_class import Base

class Embedding(Base):
    __tablename__ = "embeddings"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id  = Column(Integer, ForeignKey("interview_sessions.id"), nullable=True)
    chunk_text  = Column(Text, nullable=False)
    chunk_index = Column(Integer, default=0)
    vector_id   = Column(String)
    metadata_   = Column(JSON)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
