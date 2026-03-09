from app.db.base_class import Base

# Import all models so SQLAlchemy can build the schema
from app.models.user import User
from app.models.resume import Resume
from app.models.interview_session import InterviewSession
from app.models.question import Question
from app.models.answer import Answer
from app.models.embedding import Embedding
