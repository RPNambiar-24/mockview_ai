import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sessionSvc } from '@/services/interviewService'

const STEPS = [
  { icon: '', label: 'Analyzing Resume…', duration: 1200 },
  { icon: '', label: 'Parsing Job Description…', duration: 1000 },
  { icon: '', label: 'Generating Custom Questions…', duration: 1500 },
  { icon: '', label: 'Tagging Difficulty & Skills…', duration: 900 },
  { icon: '✅', label: 'Interview Ready!', duration: 600 },
]

export default function ThinkingScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [stepIdx, setStepIdx] = useState(0)
  const [done, setDone] = useState(false)

  // Animate through steps
  useEffect(() => {
    let idx = 0
    const tick = () => {
      if (idx < STEPS.length - 1) {
        idx++
        setStepIdx(idx)
        setTimeout(tick, STEPS[idx].duration)
      } else {
        setDone(true)
      }
    }
    setTimeout(tick, STEPS[0].duration)
  }, [])

  // Poll backend until status = 'ready'
  useEffect(() => {
    if (!id) return
    const poll = setInterval(async () => {
      try {
        const r = await sessionSvc.status(parseInt(id))
        if (r.data.status === 'ready' || r.data.status === 'in_progress') {
          clearInterval(poll)
          setTimeout(() => navigate(`/interview/${id}/live`), 600)
        }
      } catch { /* keep polling */ }
    }, 2000)
    return () => clearInterval(poll)
  }, [id, navigate])

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-8 max-w-sm w-full">
        {/* Animated orb */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 rounded-full bg-indigo-600/30 animate-ping-slow" />
          <div className="absolute inset-3 rounded-full bg-indigo-600/50 animate-pulse" />
          <div className="absolute inset-6 rounded-full bg-indigo-600 flex items-center justify-center text-2xl">
            {STEPS[stepIdx].icon}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-1">Building Your Interview</h2>
          <p className="text-slate-400 text-sm">AI is crafting personalized questions…</p>
        </div>

        {/* Steps list */}
        <div className="text-left space-y-3">
          {STEPS.map((step, i) => (
            <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${i > stepIdx ? 'opacity-20' : 'opacity-100'}`}>
              <span className="text-lg w-7 text-center">{i < stepIdx ? '✅' : step.icon}</span>
              <span className={`text-sm font-medium ${i === stepIdx ? 'text-white' : i < stepIdx ? 'text-green-400' : 'text-slate-500'}`}>
                {step.label}
              </span>
              {i === stepIdx && !done && (
                <span className="ml-auto flex gap-0.5">
                  {[0, 1, 2].map(j => (
                    <span key={j} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
                  ))}
                </span>
              )}
            </div>
          ))}
        </div>

        {done && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
            <p className="text-green-400 text-sm font-medium">🚀 Questions ready — loading interview…</p>
          </div>
        )}
      </div>
    </div>
  )
}
