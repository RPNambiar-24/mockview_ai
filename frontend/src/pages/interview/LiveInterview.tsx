import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sessionSvc } from '@/services/interviewService'
import { Mic, MicOff, ChevronRight, Clock, Loader2, CheckCircle, Volume2, SkipForward } from 'lucide-react'
import clsx from 'clsx'

type Phase = 'loading' | 'intro' | 'idle' | 'speaking' | 'recording' | 'uploading' | 'done'

const TYPE_COLOR: Record<string, string> = {
  technical:  'bg-blue-500/15 text-blue-400 border-blue-500/20',
  behavioral: 'bg-green-500/15 text-green-400 border-green-500/20',
  scenario:   'bg-orange-500/15 text-orange-400 border-orange-500/20',
  personality:'bg-purple-500/15 text-purple-400 border-purple-500/20',
}

// Waveform animation bars
function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex items-end justify-center gap-1 h-8">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className={clsx('w-1.5 rounded-full transition-all',
          active ? 'bg-indigo-400 waveform-bar' : 'bg-slate-700 h-2')}
          style={active ? { animationDelay: `${i * 0.08}s` } : undefined} />
      ))}
    </div>
  )
}

export default function LiveInterview() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const sid = parseInt(id!)

  const [session,     setSession]    = useState<any>(null)
  const [questions,   setQuestions]  = useState<any[]>([])
  const [currentIdx,  setCurrentIdx] = useState(0)
  const [phase,       setPhase]      = useState<Phase>('loading')
  const [timeLeft,    setTimeLeft]   = useState(120)
  const [transcript,  setTranscript] = useState('')
  const [allTranscripts, setAllTranscripts] = useState<Record<number, string>>({})
  const [error,       setError]      = useState('')

  const mrRef     = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef  = useRef<NodeJS.Timeout | null>(null)

  // Load session
  useEffect(() => {
    sessionSvc.get(sid).then(r => {
      setSession(r.data)
      setQuestions(r.data.questions || [])
      setPhase('intro')
    }).catch(() => { setError('Failed to load session'); setPhase('intro') })
    return () => { timerRef.current && clearInterval(timerRef.current); window.speechSynthesis?.cancel() }
  }, [sid])

  const currentQ = questions[currentIdx]

  // Speak question via TTS
  const speak = useCallback((text: string) => {
    window.speechSynthesis?.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.92; u.pitch = 1.05
    window.speechSynthesis?.speak(u)
  }, [])

  const activateQuestion = useCallback((q: any) => {
    setPhase('speaking')
    setTimeLeft(q.recommended_time_secs || 120)
    setTranscript('')
    speak(q.question_text)
    // After TTS finishes (approx), go to idle
    const est = Math.max(q.question_text.length * 60, 2000)
    setTimeout(() => setPhase('idle'), est)
  }, [speak])

  const startInterview = async () => {
    await sessionSvc.start(sid).catch(console.error)
    if (questions[0]) activateQuestion(questions[0])
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.start(250)
      mrRef.current = mr
      setPhase('recording')

      timerRef.current = setInterval(() => {
        setTimeLeft(t => { if (t <= 1) { stopRecording(); return 0 } return t - 1 })
      }, 1000)
    } catch { setError('Microphone access denied. Please allow mic in browser settings.') }
  }

  const stopRecording = useCallback(() => {
    timerRef.current && clearInterval(timerRef.current)
    const mr = mrRef.current
    if (!mr) { setPhase('idle'); return }
    mr.onstop = async () => {
      mr.stream.getTracks().forEach(t => t.stop())
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setPhase('uploading')
      try {
        const r = await sessionSvc.submitAudio(sid, currentQ.id, blob)
        const tx = r.data.transcript || ''
        setTranscript(tx)
        setAllTranscripts(prev => ({ ...prev, [currentIdx]: tx }))
      } catch { setError('Audio upload failed. You can still continue.') }
      finally { setPhase('idle') }
    }
    mr.stop()
  }, [currentQ, currentIdx, sid])

  const nextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      const next = currentIdx + 1
      setCurrentIdx(next)
      activateQuestion(questions[next])
    } else {
      setPhase('done')
      sessionSvc.finish(sid).then(() => {
        setTimeout(() => navigate(`/interview/${sid}/processing`), 1000)
      }).catch(console.error)
    }
  }

  // ── Render states ──────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
      <Loader2 className="animate-spin text-indigo-400" size={36} />
      <p className="text-slate-400">Loading your interview…</p>
    </div>
  )

  if (phase === 'intro') return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/30">
          <Mic size={36} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{session?.job_title} Interview</h1>
          <p className="text-slate-400 text-sm mt-1">{questions.length} questions · {session?.interview_style} · {session?.difficulty}</p>
        </div>
        <ul className="text-left bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-sm text-slate-400">
          <li>🔊 AI will read each question aloud</li>
          <li>🎤 Click the mic to record your answer</li>
          <li>⏱️ Each question has a suggested time limit</li>
          <li>📝 Your answers are automatically transcribed</li>
        </ul>
        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}
        <button onClick={startInterview} className="btn-primary w-full justify-center py-3 text-base">
          Begin Interview 🚀
        </button>
      </div>
    </div>
  )

  if (phase === 'done') return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-4 text-center">
      <CheckCircle size={52} className="text-green-400" />
      <h2 className="text-2xl font-bold text-white">Interview Complete!</h2>
      <p className="text-slate-400">Submitting your answers for analysis…</p>
      <Loader2 className="animate-spin text-indigo-400 mt-2" size={24} />
    </div>
  )

  // ── Main split layout ──────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-0 -m-5 lg:-m-8">
      {/* Top progress bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center gap-4 shrink-0">
        <span className="text-sm text-slate-400">Question {currentIdx + 1} of {questions.length}</span>
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
        </div>
        <div className={clsx('flex items-center gap-1.5 text-sm font-mono font-bold', timeLeft < 30 ? 'text-red-400' : 'text-slate-300')}>
          <Clock size={14} />
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
      </div>

      {/* Split panel */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT — Question list panel */}
        <div className="w-72 lg:w-80 shrink-0 bg-slate-900 border-r border-slate-800 overflow-y-auto hidden md:flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Question Bank</p>
          </div>
          <div className="flex-1 p-3 space-y-1">
            {questions.map((q, i) => (
              <div key={i} className={clsx(
                'p-3 rounded-xl border transition-all cursor-default',
                i === currentIdx
                  ? 'border-indigo-500/50 bg-indigo-600/10'
                  : i < currentIdx
                    ? 'border-green-500/20 bg-green-500/5 opacity-60'
                    : 'border-slate-800 bg-slate-800/30 opacity-40'
              )}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-400">Q{i + 1}</span>
                  {i < currentIdx && <CheckCircle size={12} className="text-green-400 shrink-0 mt-0.5" />}
                  {i === currentIdx && <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0 mt-1" />}
                </div>
                <p className={clsx('text-xs leading-relaxed', i === currentIdx ? 'text-slate-200' : 'text-slate-500')}>
                  {q.question_text.length > 80 ? q.question_text.slice(0, 80) + '…' : q.question_text}
                </p>
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  <span className={clsx('badge text-[10px] border', TYPE_COLOR[q.question_type] || 'bg-slate-700 text-slate-400 border-slate-600')}>
                    {q.question_type}
                  </span>
                  {allTranscripts[i] && <span className="badge bg-green-500/10 text-green-400 text-[10px]">✓ answered</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Active question + mic panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentQ && (
            <>
              {/* Question display */}
              <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={clsx('badge border', TYPE_COLOR[currentQ.question_type] || 'bg-slate-700 text-slate-400 border-slate-600')}>
                      {currentQ.question_type}
                    </span>
                    <span className="badge bg-slate-700/50 text-slate-400 border border-slate-600">
                      {currentQ.difficulty}
                    </span>
                    {currentQ.expected_skills?.slice(0, 3).map((s: string) => (
                      <span key={s} className="badge bg-slate-800 text-slate-500 border border-slate-700 text-[10px]">{s}</span>
                    ))}
                  </div>

                  <div className="card border-slate-700 bg-slate-900/80">
                    {phase === 'speaking' && (
                      <div className="flex items-center gap-2 mb-3 text-indigo-400 text-sm">
                        <Volume2 size={14} className="animate-pulse" /> Reading question…
                      </div>
                    )}
                    <p className="text-xl font-medium text-white leading-relaxed">{currentQ.question_text}</p>
                    <button onClick={() => speak(currentQ.question_text)} className="mt-3 text-xs text-indigo-400/70 hover:text-indigo-400 flex items-center gap-1">
                      <Volume2 size={12} /> Read again
                    </button>
                  </div>

                  {/* Transcript */}
                  {transcript && (
                    <div className="card bg-slate-800/50 border-slate-700">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">📝 Your Answer</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{transcript}</p>
                    </div>
                  )}

                  {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}
                </div>
              </div>

              {/* Bottom mic controls */}
              <div className="border-t border-slate-800 bg-slate-900 px-6 py-4 shrink-0">
                <div className="max-w-2xl mx-auto flex items-center gap-6">
                  {/* Mic button */}
                  <div className="flex flex-col items-center gap-1">
                    {phase === 'uploading' ? (
                      <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <Loader2 size={22} className="animate-spin text-indigo-400" />
                      </div>
                    ) : phase === 'recording' ? (
                      <button onClick={stopRecording}
                        className="relative w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-lg shadow-red-600/30 transition-all">
                        <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40" />
                        <MicOff size={22} className="text-white relative z-10" />
                      </button>
                    ) : (
                      <button onClick={startRecording} disabled={phase === 'speaking'}
                        className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all">
                        <Mic size={22} className="text-white" />
                      </button>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {phase === 'recording' ? 'Stop' : phase === 'uploading' ? 'Saving…' : 'Record'}
                    </span>
                  </div>

                  {/* Waveform */}
                  <div className="flex-1">
                    <Waveform active={phase === 'recording'} />
                    <p className="text-center text-xs text-slate-500 mt-1">
                      {phase === 'recording' ? 'Recording your answer…' :
                       phase === 'uploading' ? 'Transcribing…' :
                       phase === 'speaking'  ? 'AI is reading the question…' :
                       'Click mic to start recording'}
                    </p>
                  </div>

                  {/* Next button */}
                  <div className="flex flex-col items-center gap-1">
                    <button onClick={nextQuestion} disabled={phase === 'recording' || phase === 'uploading' || phase === 'speaking'}
                      className="w-14 h-14 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-30 flex items-center justify-center transition-all">
                      {currentIdx + 1 < questions.length ? <ChevronRight size={22} className="text-white" /> : <CheckCircle size={22} className="text-green-400" />}
                    </button>
                    <span className="text-[10px] text-slate-500">
                      {currentIdx + 1 < questions.length ? 'Skip/Next' : 'Finish'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
