from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.interview_session import InterviewSession
from app.services.rag_pipeline import query_rag, index_session

router = APIRouter()

class QueryIn(BaseModel):
    query: str
    top_k: int = 5

@router.post("/query")
def rag_query(body: QueryIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return {"results": query_rag(body.query, user.id, body.top_k), "query": body.query}

@router.post("/index/{session_id}")
def rag_index(session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sess = db.query(InterviewSession).filter(InterviewSession.id == session_id, InterviewSession.user_id == user.id).first()
    if not sess: raise HTTPException(404, "Session not found")
    count = index_session(sess, db)
    return {"indexed_chunks": count}
