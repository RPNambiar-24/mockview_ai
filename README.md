# MockView AI v2 — Stateful Interview Engine 🎤

A full-stack AI mock interview platform with a proper stateful session model,
split-panel live interview UI, animated thinking/processing screens,
multi-dimension scoring, and comprehensive reports.

---

## Product Flow

```
Login → Dashboard → Setup Interview
                         ↓
            (resume upload, JD paste, style, difficulty)
                         ↓
               🧠 Thinking Screen (animated)
                         ↓
              Split-Panel Live Interview
              ┌─────────────┬──────────────┐
              │  Question   │  Mic Panel   │
              │  Queue      │  Waveform    │
              │  (sidebar)  │  Timer       │
              │             │  Transcript  │
              └─────────────┴──────────────┘
                         ↓
           ⚡ Processing Screen (AI analysis)
                         ↓
              Detailed Results Report
         (radar chart, per-Q scores, resume feedback)
```

---

## API Endpoints

```
POST /api/interview/create              Create session + generate questions
POST /api/interview/{id}/start          Begin interview
POST /api/interview/{id}/answer         Submit audio answer (multipart)
POST /api/interview/{id}/finish         Trigger AI analysis pipeline
GET  /api/interview/{id}/status         Poll analysis status
GET  /api/interview/{id}/results        Fetch full report
GET  /api/interview/                    List all sessions
DELETE /api/interview/{id}              Delete session
```

---

## Quick Start

```bash
# 1. Backend
cd backend
pip install -r requirements.txt
cp .env.example .env     # add OPENAI_API_KEY
uvicorn app.main:app --reload

# 2. Frontend
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

**Docker:**
```bash
OPENAI_API_KEY=sk-xxx docker-compose up --build
```

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18 + TypeScript + Vite        |
| Styling    | TailwindCSS + custom CSS animations |
| Charts     | Recharts (Radar + Bar + Line)       |
| Backend    | FastAPI + SQLAlchemy + PostgreSQL   |
| AI         | OpenAI GPT-4o + Whisper             |
| Auth       | JWT + bcrypt                        |
| Vector DB  | Pinecone (optional)                 |

---

## Graceful Degradation

All AI features degrade gracefully without API keys:
- **No OPENAI_API_KEY** → 15 hand-crafted fallback questions, heuristic scoring
- **No PINECONE_API_KEY** → RAG search returns placeholder
- App is fully usable end-to-end in offline/demo mode
