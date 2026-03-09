import re
from typing import Dict, Any

TECH_SKILLS = [
    "python","javascript","typescript","java","c++","c#","go","rust","swift","kotlin",
    "react","vue","angular","next.js","node.js","fastapi","django","flask","spring","express",
    "kubernetes","docker","terraform","aws","gcp","azure","postgresql","mysql","mongodb",
    "redis","elasticsearch","kafka","spark","tensorflow","pytorch","scikit-learn",
    "machine learning","deep learning","nlp","llm","sql","graphql","rest api",
    "microservices","ci/cd","git","linux","system design","data structures","algorithms"
]

def parse_resume(file_path: str, content_type: str) -> Dict[str, Any]:
    raw = ""
    try:
        if "pdf" in content_type:
            raw = _pdf(file_path)
        else:
            raw = _docx(file_path)
    except Exception as e:
        raw = f"[parse error: {e}]"

    return {
        "raw_text":   raw,
        "skills":     _skills(raw),
        "experience": _experience(raw),
        "education":  _education(raw),
        "contact":    _contact(raw),
        "projects":   _projects(raw),
    }

def _pdf(path):
    try:
        import pdfplumber
        with pdfplumber.open(path) as pdf:
            return "\n".join(p.extract_text() or "" for p in pdf.pages)
    except Exception:
        import PyPDF2
        with open(path, "rb") as f:
            r = PyPDF2.PdfReader(f)
            return " ".join(p.extract_text() or "" for p in r.pages)

def _docx(path):
    from docx import Document
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs)

def _skills(text):
    t = text.lower()
    return [s for s in TECH_SKILLS if s in t]

def _experience(text):
    lines = text.split("\n")
    out = []
    for line in lines:
        if any(k in line.lower() for k in ["engineer","developer","intern","analyst","manager","lead","architect","scientist"]):
            if 10 < len(line.strip()) < 200:
                out.append(line.strip())
    return out[:8]

def _education(text):
    lines = text.split("\n")
    out = []
    for line in lines:
        if any(k in line.lower() for k in ["university","college","b.tech","m.tech","bachelor","master","phd","degree","institute"]):
            if len(line.strip()) > 5:
                out.append(line.strip())
    return out[:4]

def _contact(text):
    email = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
    phone = re.search(r'[\+\(]?[1-9][0-9 .\-\(\)]{8,}[0-9]', text)
    return {"email": email.group() if email else None, "phone": phone.group() if phone else None}

def _projects(text):
    lines = text.split("\n")
    out = []
    capture = False
    for line in lines:
        if "project" in line.lower() and len(line) < 30:
            capture = True
            continue
        if capture and len(line.strip()) > 15:
            out.append(line.strip())
        if capture and len(out) >= 5:
            break
    return out
