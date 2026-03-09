import os, shutil, uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.services.resume_parser import parse_resume
from app.core.config import settings

router = APIRouter()
RESUME_DIR = os.path.join(settings.STORAGE_PATH, "resumes")
os.makedirs(RESUME_DIR, exist_ok=True)
ALLOWED = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}

class ResumeOut(BaseModel):
    id: int; user_id: int; filename: str; parsed_data: dict | None; created_at: datetime
    class Config:
        from_attributes = True

@router.post("/upload", response_model=ResumeOut, status_code=201)
async def upload(file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if file.content_type not in ALLOWED:
        raise HTTPException(400, "Only PDF or DOCX allowed")
    ext  = file.filename.rsplit(".", 1)[-1]
    path = os.path.join(RESUME_DIR, f"{uuid.uuid4()}.{ext}")
    with open(path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)
    parsed = parse_resume(path, file.content_type or "")
    resume = Resume(user_id=user.id, filename=file.filename, file_path=path,
                    raw_text=parsed.get("raw_text",""), parsed_data=parsed)
    db.add(resume); db.commit(); db.refresh(resume)
    return resume

@router.get("/", response_model=List[ResumeOut])
def list_resumes(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Resume).filter(Resume.user_id == user.id).all()

@router.get("/{rid}", response_model=ResumeOut)
def get_resume(rid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    r = db.query(Resume).filter(Resume.id == rid, Resume.user_id == user.id).first()
    if not r: raise HTTPException(404, "Not found")
    return r

@router.delete("/{rid}", status_code=204)
def delete_resume(rid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    r = db.query(Resume).filter(Resume.id == rid, Resume.user_id == user.id).first()
    if not r: raise HTTPException(404, "Not found")
    db.delete(r); db.commit()
