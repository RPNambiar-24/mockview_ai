import json
from typing import List, Dict, Any
from app.core.config import settings

STYLE_PROMPTS = {
    "technical": "Focus heavily on DSA, system design, coding, architecture, and domain-specific technical depth.",
    "behavioral": "Focus on STAR-format questions about past experience, teamwork, conflict, leadership, and growth.",
    "philosophical": "Ask thought-provoking questions about engineering philosophy, trade-offs, ethics in tech, and big-picture thinking.",
    "sarcastic": "Ask challenging questions with a slightly provocative, skeptical tone — push the candidate to defend their choices.",
    "mixed": "Balanced mix: 4 technical, 3 behavioral, 2 problem-solving, 1 personality/culture-fit.",
    "scenario": "Real-world scenario heavy: give complex situations and ask how the candidate would handle them end-to-end.",
}

DIFFICULTY_PROMPTS = {
    "easy":     "Keep questions straightforward. Junior-level concepts. Avoid trick questions.",
    "medium":   "Mid-level difficulty. Candidates should have 2-4 years of experience to answer well.",
    "hard":     "Senior-level depth. Expect nuanced answers, trade-off discussions, and architectural thinking.",
    "adaptive": "Start easy and progressively increase difficulty. Tag each question with its actual difficulty.",
}

def generate_questions(
    resume_data: Dict[str, Any],
    job_description: str,
    job_title: str,
    interview_style: str = "mixed",
    difficulty: str = "medium",
    count: int = 15
) -> List[Dict[str, Any]]:
    if not settings.GROQ_API_KEY:
        return _fallback_questions(resume_data, job_title, interview_style, count)
    try:
        return _llm_generate(resume_data, job_description, job_title, interview_style, difficulty, count)
    except Exception as e:
        print(f"[QuestionGen] LLM failed ({e}), using fallback")
        return _fallback_questions(resume_data, job_title, interview_style, count)

def _llm_generate(resume_data, job_description, job_title, style, difficulty, count):
    from groq import Groq
    client = Groq(api_key=settings.GROQ_API_KEY)
    model_name = settings.GROQ_MODEL

    skills       = resume_data.get("skills", [])
    experience   = resume_data.get("experience", [])
    education    = resume_data.get("education", [])

    style_hint = STYLE_PROMPTS.get(style, STYLE_PROMPTS["mixed"])
    diff_hint  = DIFFICULTY_PROMPTS.get(difficulty, DIFFICULTY_PROMPTS["medium"])

    system_prompt = f"""You are an expert technical interviewer at a top-tier tech company.
Your job is to generate a highly personalized, rigorous interview question bank.

{style_hint}
{diff_hint}

You must return ONLY a valid JSON array — no markdown, no explanation, just the array."""

    user_prompt = f"""Generate exactly {count} interview questions for:

ROLE: {job_title}

CANDIDATE RESUME SUMMARY:
- Skills: {', '.join(skills[:15])}
- Experience: {chr(10).join(experience[:4])}
- Education: {chr(10).join(education[:2])}

JOB DESCRIPTION:
{job_description[:1500]}

Return a JSON array where each element is:
{{
  "question": "<full question text>",
  "type": "technical|behavioral|personality|scenario",
  "difficulty": "easy|medium|hard",
  "expected_skills": ["skill1", "skill2"],
  "expected_answer_hints": "<brief description of what an ideal answer covers>",
  "follow_up_logic": {{"condition": "if answer is shallow", "follow_up": "follow-up question text"}},
  "recommended_time_secs": 120
}}"""

    resp = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        temperature=0.8,
        max_tokens=4000,
    )

    content = resp.choices[0].message.content.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    return json.loads(content)


# ── Fallback question bank (used when no API key) ──────────────────────────────
def _fallback_questions(resume_data, job_title, style, count) -> List[Dict]:
    skills = resume_data.get("skills", ["Python", "JavaScript"])[:3]
    s = skills[0] if skills else "software engineering"

    bank = [
        {
            "question": f"Walk me through the most complex {s} project you've built. What were the hardest technical decisions?",
            "type": "technical", "difficulty": "medium",
            "expected_skills": [s, "architecture"],
            "expected_answer_hints": "Should cover design choices, trade-offs, and lessons learned.",
            "follow_up_logic": {"condition": "shallow", "follow_up": "What would you do differently now?"},
            "recommended_time_secs": 150
        },
        {
            "question": "Design a URL shortener that handles 1 billion URLs. Walk me through your architecture.",
            "type": "technical", "difficulty": "hard",
            "expected_skills": ["system design", "scalability", "databases"],
            "expected_answer_hints": "Hashing strategy, DB choice, caching, CDN, rate limiting.",
            "follow_up_logic": {"condition": "no caching mentioned", "follow_up": "How would you handle 10x traffic spikes?"},
            "recommended_time_secs": 180
        },
        {
            "question": "Tell me about a time you disagreed with your tech lead's architectural decision. What happened?",
            "type": "behavioral", "difficulty": "medium",
            "expected_skills": ["communication", "conflict resolution", "influence"],
            "expected_answer_hints": "Should follow STAR structure. Show empathy and professional approach.",
            "follow_up_logic": {"condition": "vague", "follow_up": "What would you do if the decision still went against you?"},
            "recommended_time_secs": 120
        },
        {
            "question": "Explain the difference between horizontal and vertical scaling. When would you choose each?",
            "type": "technical", "difficulty": "medium",
            "expected_skills": ["system design", "cloud", "scalability"],
            "expected_answer_hints": "Cost, bottlenecks, stateless vs stateful services.",
            "follow_up_logic": {},
            "recommended_time_secs": 90
        },
        {
            "question": "Describe a production incident you caused or resolved. What was the blast radius and what did you learn?",
            "type": "behavioral", "difficulty": "hard",
            "expected_skills": ["ownership", "debugging", "incident management"],
            "expected_answer_hints": "Should show accountability, systematic debugging, and process improvement.",
            "follow_up_logic": {"condition": "no process change mentioned", "follow_up": "Did you introduce any guardrails after?"},
            "recommended_time_secs": 150
        },
        {
            "question": f"How does {skills[1] if len(skills) > 1 else 'your primary language'}'s memory management work? What pitfalls have you hit?",
            "type": "technical", "difficulty": "medium",
            "expected_skills": [skills[1] if len(skills) > 1 else "programming"],
            "expected_answer_hints": "GC, memory leaks, reference counting depending on language.",
            "follow_up_logic": {},
            "recommended_time_secs": 90
        },
        {
            "question": "You're given a 3-month deadline to migrate a monolith to microservices with zero downtime. How do you approach it?",
            "type": "scenario", "difficulty": "hard",
            "expected_skills": ["system design", "project management", "microservices"],
            "expected_answer_hints": "Strangler fig pattern, feature flags, incremental migration, rollback plan.",
            "follow_up_logic": {"condition": "big bang migration mentioned", "follow_up": "What's your rollback strategy?"},
            "recommended_time_secs": 180
        },
        {
            "question": "Tell me about your biggest professional failure. What did you take away from it?",
            "type": "behavioral", "difficulty": "easy",
            "expected_skills": ["self-awareness", "growth mindset"],
            "expected_answer_hints": "Genuine reflection, concrete outcome, and what changed afterward.",
            "follow_up_logic": {},
            "recommended_time_secs": 90
        },
        {
            "question": "What's your philosophy on code reviews? What makes a great PR reviewer?",
            "type": "personality", "difficulty": "easy",
            "expected_skills": ["code quality", "collaboration", "mentorship"],
            "expected_answer_hints": "Balance thoroughness with respect. Focus on code not person.",
            "follow_up_logic": {},
            "recommended_time_secs": 90
        },
        {
            "question": "Given an array of integers, return the indices of two numbers that sum to a target. Optimize beyond O(n²).",
            "type": "technical", "difficulty": "easy",
            "expected_skills": ["algorithms", "hash maps"],
            "expected_answer_hints": "Hash map O(n) solution. Discuss edge cases.",
            "follow_up_logic": {"condition": "brute force only", "follow_up": "Can you do it in a single pass?"},
            "recommended_time_secs": 120
        },
        {
            "question": "How do you stay current with fast-moving tech? Give a recent example of something you learned.",
            "type": "personality", "difficulty": "easy",
            "expected_skills": ["learning", "adaptability"],
            "expected_answer_hints": "Concrete example. Shows intellectual curiosity.",
            "follow_up_logic": {},
            "recommended_time_secs": 60
        },
        {
            "question": "Describe how you would implement rate limiting for a public API at scale.",
            "type": "technical", "difficulty": "hard",
            "expected_skills": ["system design", "redis", "algorithms"],
            "expected_answer_hints": "Token bucket, sliding window, Redis INCR, distributed concerns.",
            "follow_up_logic": {},
            "recommended_time_secs": 150
        },
        {
            "question": "Your manager asks you to ship a feature with known security vulnerabilities by Friday. How do you handle it?",
            "type": "scenario", "difficulty": "medium",
            "expected_skills": ["ethics", "communication", "risk management"],
            "expected_answer_hints": "Quantify the risk, escalate properly, propose alternatives, document decision.",
            "follow_up_logic": {"condition": "just says no", "follow_up": "What if your manager overrules you?"},
            "recommended_time_secs": 120
        },
        {
            "question": "What's the difference between a process and a thread? When would you use each?",
            "type": "technical", "difficulty": "medium",
            "expected_skills": ["systems programming", "concurrency"],
            "expected_answer_hints": "Memory isolation, IPC, context switching overhead, GIL if Python.",
            "follow_up_logic": {},
            "recommended_time_secs": 90
        },
        {
            "question": f"Where do you see yourself in 5 years, and why is the {job_title} role at this company a step toward that goal?",
            "type": "personality", "difficulty": "easy",
            "expected_skills": ["self-awareness", "alignment", "ambition"],
            "expected_answer_hints": "Honest, specific, shows research about the company.",
            "follow_up_logic": {},
            "recommended_time_secs": 90
        },
    ]
    return bank[:count]
