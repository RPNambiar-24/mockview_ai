import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sessionSvc } from '@/services/interviewService'

const STEPS = [
  { icon: '', label: 'Transcribing Audio…', ms: 1800 },
  { icon: '', label: 'Evaluating Technical Depth…', ms: 1500 },
  { icon: '', label: 'Analyzing Behavioral Structure…', ms: 1600 },
  { icon: '', label: 'Checking Confidence & Fluency…', ms: 1200 },
  { icon: '', label: 'Computing Selection Probability…', ms: 1000 },
  { icon: '', label: 'Generating Resume Feedback…', ms: 1100 },
  { icon: '', label: 'Report Ready!', ms: 500 },
]

export default function ProcessingScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const sid = parseInt(id!)

  const [stepIdx, setStepIdx] = useState(0)

  // Step animation
  useEffect(() => {
    let i = 0
    const tick = () => {
      if (i < STEPS.length - 1) {
        i++; setStepIdx(i)
        setTimeout(tick, STEPS[i].ms)
      }
    }
    setTimeout(tick, STEPS[0].ms)
  }, [])

  // Poll for completion
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const r = await sessionSvc.status(sid)
        if (r.data.status === 'completed') {
          clearInterval(poll)
          setTimeout(() => navigate(`/interview/${sid}/results`), 800)
        }
      } catch { /* keep polling */ }
    }, 3000)
    return () => clearInterval(poll)
  }, [sid, navigate])

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-sm w-full text-center space-y-8">
        {/* Animated rings */}
        <div className="relative w-28 h-28 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="absolute inset-3 rounded-full border-4 border-purple-500/30 animate-spin" style={{ animationDuration: '5s', animationDirection: 'reverse' }} />
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-2xl shadow-xl shadow-indigo-500/30">
            {STEPS[stepIdx].icon}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-1">AI is Analyzing</h2>
          <p className="text-slate-400 text-sm">Evaluating every dimension of your performance…</p>
        </div>

        {/* Steps */}
        <div className="text-left space-y-3">
          {STEPS.map((step, i) => (
            <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${i > stepIdx ? 'opacity-20' : 'opacity-100'}`}>
              <span className="w-6 text-center text-base">{i < stepIdx ? '✅' : step.icon}</span>
              <span className={`text-sm font-medium flex-1 ${i === stepIdx ? 'text-white' : i < stepIdx ? 'text-green-400' : 'text-slate-500'}`}>
                {step.label}
              </span>
              {i === stepIdx && (
                <span className="flex gap-0.5">
                  {[0, 1, 2].map(j => <span key={j} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />)}
                </span>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-600">This usually takes 15–30 seconds…</p>
      </div>
    </div>
  )
}
