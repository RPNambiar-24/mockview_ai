from typing import List, Dict, Any
from sqlalchemy.orm import Session as DBSession
from app.models.answer import Answer
from app.models.embedding import Embedding
from app.core.config import settings

def index_session(session_obj, db: DBSession) -> int:
    answers = db.query(Answer).filter(Answer.session_id == session_obj.id).all()
    count = 0
    for ans in answers:
        if not ans.transcript:
            continue
        chunks = _chunk(ans.transcript)
        for i, chunk in enumerate(chunks):
            vec_id = None
            emb_vec = _embed(chunk)
            if emb_vec and settings.PINECONE_API_KEY:
                vec_id = _pinecone_upsert(chunk, emb_vec, session_obj.user_id, session_obj.id, ans.id, i)
            emb = Embedding(
                user_id=session_obj.user_id,
                session_id=session_obj.id,
                chunk_text=chunk,
                chunk_index=i,
                vector_id=vec_id,
                metadata_={"session_id": session_obj.id, "answer_id": ans.id}
            )
            db.add(emb)
            count += 1
    db.commit()
    return count

def query_rag(query: str, user_id: int, top_k: int = 5) -> List[Dict[str, Any]]:
    if not settings.GROQ_API_KEY:
        return [{"text": "RAG unavailable — configure GROQ_API_KEY", "score": 0}]
    emb = _embed(query)
    if emb and settings.PINECONE_API_KEY:
        return _pinecone_query(emb, user_id, top_k)
    return [{"text": "Vector DB not configured — add PINECONE_API_KEY for semantic search", "score": 0}]

def _chunk(text: str, size=400, overlap=40) -> List[str]:
    words = text.split()
    chunks = []
    for i in range(0, len(words), size - overlap):
        c = " ".join(words[i:i+size])
        if c.strip():
            chunks.append(c)
    return chunks

def _embed(text: str):
    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        r = client.embeddings.create(input=text, model="text-embedding-3-small")
        return r.data[0].embedding
    except Exception:
        return None

def _pinecone_upsert(text, vec, user_id, session_id, answer_id, idx):
    try:
        import pinecone
        pc = pinecone.Pinecone(api_key=settings.PINECONE_API_KEY)
        index = pc.Index(settings.PINECONE_INDEX)
        vid = f"u{user_id}_s{session_id}_a{answer_id}_c{idx}"
        index.upsert(vectors=[{"id": vid, "values": vec, "metadata": {"text": text, "user_id": user_id}}])
        return vid
    except Exception as e:
        print(f"[Pinecone upsert] {e}")
        return None

def _pinecone_query(vec, user_id, top_k):
    try:
        import pinecone
        pc = pinecone.Pinecone(api_key=settings.PINECONE_API_KEY)
        index = pc.Index(settings.PINECONE_INDEX)
        res = index.query(vector=vec, top_k=top_k, filter={"user_id": user_id}, include_metadata=True)
        return [{"text": m.metadata.get("text",""), "score": round(m.score, 3)} for m in res.matches]
    except Exception as e:
        print(f"[Pinecone query] {e}")
        return []
