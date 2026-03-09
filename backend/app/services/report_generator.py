import json
from typing import Dict, Any
from app.core.config import settings

def generate_session_report(session, answers) -> Dict[str, Any]:
    """Generate final rich report. Uses LLM if available."""
    if settings.GROQ_API_KEY and answers:
        try:
            return _llm_report(session, answers)
        except Exception as e:
            print(f"[Report] LLM failed ({e}), using basic report")
    return _basic_report(session, answers)


def _llm_report(session, answers):
    from groq import Groq
    client = Groq(api_key=settings.GROQ_API_KEY)
    model_name = settings.GROQ_MODEL

    qa_pairs = []
    for ans in answers:
        if ans.question and ans.transcript:
            qa_pairs.append({
                "q": ans.question.question_text,
                "a": ans.transcript[:400],
                "score": ans.total_score,
                "feedback": ans.feedback,
            })

    resume_skills = []
    if session.resume and session.resume.parsed_data:
        resume_skills = session.resume.parsed_data.get("skills", [])

    prompt = f"""You are a senior hiring manager reviewing a mock interview.

ROLE: {session.job_title}
INTERVIEW STYLE: {session.interview_style}
OVERALL SCORE: {session.overall_score}%

Q&A PAIRS (sample):
{json.dumps(qa_pairs[:8], indent=2)}

CANDIDATE RESUME SKILLS: {', '.join(resume_skills[:12])}

JOB DESCRIPTION (excerpt): {session.job_description[:600]}

Provide a JSON report (no markdown):
{{
  "summary_feedback": "<3-4 sentence holistic review>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "improvement_plan": "<concrete 3-step improvement plan>",
  "resume_feedback": {{
    "missing_keywords": ["<keyword missing from resume vs JD>"],
    "weak_bullets": ["<example weak bullet and how to improve>"],
    "suggestions": ["<resume improvement suggestion>"]
  }},
  "selection_probability": <0-100 integer>
}}"""

    resp = client.chat.completions.create(
        model=model_name,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1000,
        response_format={"type": "json_object"}
    )
    raw = resp.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


def _basic_report(session, answers):
    feedbacks = [a.feedback for a in answers if a.feedback]
    tips_all  = []
    for a in answers:
        if a.improvement_tips:
            tips_all.extend(a.improvement_tips)

    score = session.overall_score or 0
    prob  = min(score * 1.05, 95)

    return {
        "summary_feedback":     f"You completed a {session.interview_style} interview for {session.job_title}. Note: Groq API was unreachable, using heuristic profile.",
        "strengths":            feedbacks[:3] or ["Completed all questions", "Engaged with the interview"],
        "weaknesses":           tips_all[:3] or ["Practice structuring answers", "Add more specific examples"],
        "improvement_plan":     "1. Practice STAR method for behavioral questions.\n2. Study system design fundamentals.\n3. Record yourself and review for filler words.",
        "resume_feedback": {
            "missing_keywords": [],
            "weak_bullets":     [],
            "suggestions":      ["Ensure network access to Groq for AI-powered feedback."],
        },
        "selection_probability": round(prob, 1),
    }
