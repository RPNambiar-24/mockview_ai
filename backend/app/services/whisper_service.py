from app.core.config import settings

def transcribe_audio(audio_path: str) -> str:
    if not settings.GROQ_API_KEY:
        return "[Transcription unavailable — configure GROQ_API_KEY]"
    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        with open(audio_path, "rb") as f:
            result = client.audio.transcriptions.create(
                model=settings.WHISPER_MODEL,
                file=f,
                response_format="text"
            )
        return result
    except Exception as e:
        print(f"[Whisper] failed: {e}")
        return f"[Transcription failed: {e}]"
