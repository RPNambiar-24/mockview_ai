import re, json
from typing import Dict, Any, List
from app.core.config import settings

FILLER_WORDS = ["um","uh","like","you know","basically","literally","actually","right","ok so","i mean","sort of","kind of"]

def score_answer(
    transcript: str,
    question_text: str,
    question_type: str,
    expected_skills: List[str],
    expected_answer_hints: str = ""
) -> Dict[str, Any]:
    if settings.GROQ_API_KEY:
        try:
            return _llm_score(transcript, question_text, question_type, expected_skills, expected_answer_hints)
        except Exception as e:
            print(f"[Scoring] LLM failed ({e}), falling back")
            return _heuristic_score(transcript, question_text, expected_skills, f"Groq API Error: {type(e).__name__}")
    return _heuristic_score(transcript, question_text, expected_skills, "Add GROQ_API_KEY")


def _llm_score(transcript, question, q_type, skills, hints):
    from groq import Groq
    client = Groq(api_key=settings.GROQ_API_KEY)
    model_name = settings.GROQ_MODEL

    type_criteria = {
        "technical":  "Focus on: technical accuracy, depth, mention of trade-offs, correctness.",
        "behavioral": "Focus on: STAR structure (Situation/Task/Action/Result), specificity, outcome clarity.",
        "scenario":   "Focus on: systematic thinking, stakeholder awareness, risk consideration, pragmatism.",
        "personality":"Focus on: authenticity, self-awareness, alignment with engineering values.",
    }.get(q_type, "Focus on overall quality and relevance.")

    prompt = f"""You are an expert interviewer scoring a candidate's answer. Be honest and critical.
{type_criteria}

QUESTION: {question}
EXPECTED KEY POINTS: {hints or 'Not specified'}
SKILLS BEING EVALUATED: {', '.join(skills or [])}

CANDIDATE'S ANSWER:
\"\"\"{transcript}\"\"\"

Score each dimension 0–100. Be strict — reserve 90+ for truly exceptional answers.
Return ONLY valid JSON (no markdown):
{{
  "relevance": <int>,
  "clarity": <int>,
  "confidence": <int>,
  "fluency": <int>,
  "depth": <int>,
  "star_score": <int or null if not behavioral>,
  "total": <weighted float>,
  "feedback": "<2-3 sentences: what was good, what was missing>",
  "expected_coverage": "<what an ideal answer would have included>",
  "improvement_tips": ["<specific actionable tip 1>", "<tip 2>", "<tip 3>"]
}}"""

    resp = client.chat.completions.create(
        model=model_name,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=600,
        response_format={"type": "json_object"}
    )
    raw = resp.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    result = json.loads(raw)
    fillers = _filler_analysis(transcript)
    result["filler_count"] = fillers["count"]
    result["filler_words"] = fillers["found"]
    return result


def _heuristic_score(transcript, question, skills, error_msg="Network Error"):
    words = transcript.split()
    wc = len(words)

    # Relevance: keyword overlap with question
    q_words = set(re.sub(r'[^\w\s]','',question.lower()).split())
    a_words = set(re.sub(r'[^\w\s]','',transcript.lower()).split())
    overlap = len(q_words & a_words)
    relevance = min(40 + overlap * 4, 88)

    # Skills coverage
    skill_hits = sum(1 for s in (skills or []) if s.lower() in transcript.lower())
    depth = min(40 + skill_hits * 15, 85)

    # Length-based clarity
    sentences = [s for s in re.split(r'[.!?]', transcript) if s.strip()]
    avg_len = wc / max(len(sentences), 1)
    clarity = 70 if 8 < avg_len < 30 else 55

    fluency  = min(55 + wc // 8, 82)
    confidence = 68
    total = round(relevance * 0.3 + clarity * 0.2 + depth * 0.2 + confidence * 0.15 + fluency * 0.15, 1)

    fillers = _filler_analysis(transcript)

    return {
        "relevance": relevance, "clarity": clarity, "confidence": confidence,
        "fluency": fluency, "depth": depth, "star_score": None, "total": total,
        "filler_count": fillers["count"], "filler_words": fillers["found"],
        "feedback": f"Answer analyzed with heuristic scoring ({error_msg}).",
        "expected_coverage": f"AI expected coverage unavailable ({error_msg}).",
        "improvement_tips": [
            "Use concrete examples and numbers to support your points.",
            "Structure your answer with a clear beginning, middle, and conclusion.",
            "Reduce filler words — pause instead of saying 'um' or 'like'.",
        ]
    }


def _filler_analysis(transcript):
    t = transcript.lower()
    found, total = [], 0
    for w in FILLER_WORDS:
        n = len(re.findall(r'\b' + re.escape(w) + r'\b', t))
        if n:
            found.append({"word": w, "count": n})
            total += n
    return {"count": total, "found": found}


def compute_session_scores(answers) -> Dict[str, Any]:
    """Aggregate per-answer scores into session-level scores."""
    if not answers:
        return {}

    scored = [a for a in answers if a.total_score is not None]
    if not scored:
        return {}

    technical  = [a for a in scored if a.question and a.question.question_type == "technical"]
    behavioral = [a for a in scored if a.question and a.question.question_type == "behavioral"]

    def avg(lst, field):
        vals = [getattr(x, field) for x in lst if getattr(x, field) is not None]
        return round(sum(vals) / len(vals), 1) if vals else None

    return {
        "overall_score":       avg(scored, "total_score"),
        "technical_score":     avg(technical, "depth_score") if technical else None,
        "behavioral_score":    avg(behavioral, "star_score") if behavioral else None,
        "communication_score": avg(scored, "clarity_score"),
        "confidence_score":    avg(scored, "confidence_score"),
    }
