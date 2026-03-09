from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, resume, interview, analytics, rag
from app.db.database import engine
from app.db import base

base.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MockView AI",
    description="Stateful AI Mock Interview Engine",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,       prefix="/api/auth",      tags=["Auth"])
app.include_router(resume.router,     prefix="/api/resume",    tags=["Resume"])
app.include_router(interview.router,  prefix="/api/interview", tags=["Interview"])
app.include_router(analytics.router,  prefix="/api/analytics", tags=["Analytics"])
app.include_router(rag.router,        prefix="/api/rag",       tags=["RAG"])

@app.get("/")
def root():
    return {"message": "MockView AI v2.0 — Stateful Interview Engine"}

@app.get("/health")
def health():
    return {"status": "ok"}
