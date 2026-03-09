import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { sessionSvc } from '@/services/interviewService'
import { Loader2, TrendingUp, TrendingDown, FileText, ChevronDown, ChevronUp, Download, RefreshCw } from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import clsx from 'clsx'

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="score-bar-track">
      <div className={`score-bar-fill ${color}`} style={{ width: `${Math.max(value || 0, 0)}%` }} />
    </div>
  )
}

function ScoreCircle({ score, label }: { score: number | null; label: string }) {
  const v = score || 0
  const color = v >= 75 ? '#22d3ee' : v >= 50 ? '#f59e0b' : '#f87171'
  const circumference = 2 * Math.PI * 30
  const offset = circumference - (v / 100) * circumference
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[72px] h-[72px]">
        <svg className="-rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="30" fill="none" stroke="#1e293b" strokeWidth="6" />
          <circle cx="36" cy="36" r="30" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color }}>
          {v > 0 ? `${v.toFixed(0)}` : '—'}
        </span>
      </div>
      <span className="text-[11px] text-slate-400 text-center leading-tight">{label}</span>
    </div>
  )
}

function AnswerCard({ answer, index }: { answer: any; index: number }) {
  const [open, setOpen] = useState(false)
  const score = answer.total_score || 0
  const scoreColor = score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="card border-slate-800 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 text-left">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0">{index + 1}</span>
          <p className="text-sm text-slate-200 truncate">{answer.question?.question_text || `Question ${index + 1}`}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={clsx('text-base font-bold', scoreColor)}>{score.toFixed(0)}%</span>
          {open ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
        </div>
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
          {/* Dimension bars */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {[
              ['Relevance',   answer.relevance_score,   'bg-indigo-500'],
              ['Clarity',     answer.clarity_score,     'bg-cyan-500'],
              ['Confidence',  answer.confidence_score,  'bg-purple-500'],
              ['Fluency',     answer.fluency_score,     'bg-emerald-500'],
              ['Depth',       answer.depth_score,       'bg-orange-500'],
              answer.star_score != null ? ['STAR Structure', answer.star_score, 'bg-yellow-500'] : null,
            ].filter(Boolean).map(([label, val, color]) => (
              <div key={label as string}>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{label as string}</span>
                  <span>{val != null ? `${(val as number).toFixed(0)}` : '—'}</span>
                </div>
                <ScoreBar value={val as number} color={color as string} />
              </div>
            ))}
          </div>

          {/* Transcript */}
          {answer.transcript && (
            <div className="bg-slate-800/60 rounded-xl p-3">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Your Answer</p>
              <p className="text-sm text-slate-300 leading-relaxed">{answer.transcript}</p>
            </div>
          )}

          {/* Expected coverage */}
          {answer.expected_coverage && (
            <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-xl p-3">
              <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-1.5">What a Strong Answer Covers</p>
              <p className="text-sm text-slate-400 leading-relaxed">{answer.expected_coverage}</p>
            </div>
          )}

          {/* Feedback + tips */}
          {answer.feedback && <p className="text-sm text-slate-300">{answer.feedback}</p>}

          {answer.improvement_tips?.length > 0 && (
            <div className="space-y-1">
              {answer.improvement_tips.map((t: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <span className="text-indigo-400 shrink-0">💡</span>{t}
                </div>
              ))}
            </div>
          )}

          {/* Filler words */}
          {answer.filler_count > 0 && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-400">
              ⚠️ {answer.filler_count} filler word{answer.filler_count > 1 ? 's' : ''} detected:
              {' '}{answer.filler_words?.map((f: any) => `"${f.word}" ×${f.count}`).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ResultsPage() {
  const { id }   = useParams<{ id: string }>()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)

  const load = () => sessionSvc.get(parseInt(id!)).then(r => setSession(r.data)).catch(console.error).finally(() => setLoading(false))

  useEffect(() => { load() }, [id])

  // If still processing, poll
  useEffect(() => {
    if (!session || session.status === 'completed') return
    if (session.status !== 'processing') return
    setPolling(true)
    const t = setInterval(() => sessionSvc.get(parseInt(id!)).then(r => { setSession(r.data); if (r.data.status === 'completed') { clearInterval(t); setPolling(false) } }).catch(() => {}), 4000)
    return () => clearInterval(t)
  }, [session?.status])

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-400" size={32} /></div>
  if (!session) return <p className="text-slate-400">Session not found.</p>

  if (session.status === 'processing' || session.status === 'in_progress') return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <Loader2 className="animate-spin text-indigo-400" size={36} />
      <p className="text-lg font-semibold text-white">Analyzing your interview…</p>
      <p className="text-slate-400 text-sm">This takes 15–30 seconds. The page will update automatically.</p>
    </div>
  )

  const scores = [
    { label: 'Technical',     value: session.technical_score },
    { label: 'Behavioral',    value: session.behavioral_score },
    { label: 'Communication', value: session.communication_score },
    { label: 'Confidence',    value: session.confidence_score },
  ].filter(s => s.value != null)

  const radarData = scores.map(s => ({ subject: s.label, score: s.value }))

  const barData = session.questions?.map((q: any, i: number) => {
    const ans = session.answers?.find((a: any) => a.question_id === q.id)
    return { name: `Q${i+1}`, total: ans?.total_score, relevance: ans?.relevance_score, clarity: ans?.clarity_score }
  }).filter((d: any) => d.total != null) || []

  const overallColor = (session.overall_score || 0) >= 75 ? 'text-green-400' : (session.overall_score || 0) >= 50 ? 'text-yellow-400' : 'text-red-400'

  const answersWithQuestions = (session.answers || []).map((a: any) => ({
    ...a,
    question: session.questions?.find((q: any) => q.id === a.question_id)
  })).sort((a: any, b: any) => (a.question?.order_index || 0) - (b.question?.order_index || 0))

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{session.job_title} — Results</h1>
          {session.company_name && <p className="text-slate-400 text-sm mt-0.5">{session.company_name}</p>}
          <div className="flex items-center gap-2 mt-2">
            <span className="badge bg-slate-700/50 text-slate-400 border border-slate-600">{session.interview_style}</span>
            <span className="badge bg-slate-700/50 text-slate-400 border border-slate-600">{session.difficulty}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost text-sm"><RefreshCw size={14} /></button>
          <button onClick={() => window.print()} className="btn-ghost text-sm"><Download size={14} /> Export</button>
        </div>
      </div>

      {/* Overall + probability */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center col-span-1 sm:col-span-1">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Overall Score</p>
          <p className={`text-5xl font-black ${overallColor}`}>{session.overall_score?.toFixed(0) || '—'}%</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Selection Probability</p>
          <p className={`text-5xl font-black ${overallColor}`}>{session.selection_probability?.toFixed(0) || '—'}%</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Dimension Scores</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <ScoreCircle score={session.technical_score}     label="Technical" />
            <ScoreCircle score={session.behavioral_score}    label="Behavioral" />
            <ScoreCircle score={session.communication_score} label="Comms" />
            <ScoreCircle score={session.confidence_score}    label="Confidence" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {radarData.length >= 3 && (
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Skill Radar</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {barData.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Score by Question</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, fontSize: 12, color: '#f1f5f9' }} />
                <Bar dataKey="total"     fill="#6366f1" name="Total"     radius={[3,3,0,0]} />
                <Bar dataKey="clarity"   fill="#22d3ee" name="Clarity"   radius={[3,3,0,0]} />
                <Bar dataKey="relevance" fill="#a78bfa" name="Relevance" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Summary + strengths/weaknesses */}
      {session.summary_feedback && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">AI Summary</h3>
          <p className="text-slate-300 text-sm leading-relaxed">{session.summary_feedback}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {session.strengths?.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-green-400" />
              <h3 className="font-semibold text-white text-sm">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {session.strengths.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-green-400 shrink-0">✓</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {session.weaknesses?.length > 0 && (
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown size={16} className="text-red-400" />
              <h3 className="font-semibold text-white text-sm">Areas to Improve</h3>
            </div>
            <ul className="space-y-2">
              {session.weaknesses.map((w: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-red-400 shrink-0">→</span>{w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Improvement plan */}
      {session.improvement_plan && (
        <div className="card bg-indigo-600/5 border-indigo-500/20">
          <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-3">📋 Improvement Plan</h3>
          <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{session.improvement_plan}</p>
        </div>
      )}

      {/* Resume feedback */}
      {session.resume_feedback && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FileText size={14} /> Resume Feedback
          </h3>
          <div className="space-y-3">
            {session.resume_feedback.missing_keywords?.length > 0 && (
              <div>
                <p className="text-xs text-red-400 font-semibold mb-1.5">Missing Keywords from JD</p>
                <div className="flex flex-wrap gap-1.5">
                  {session.resume_feedback.missing_keywords.map((k: string) => (
                    <span key={k} className="badge bg-red-500/10 text-red-400 border border-red-500/20">{k}</span>
                  ))}
                </div>
              </div>
            )}
            {session.resume_feedback.suggestions?.length > 0 && (
              <ul className="space-y-1">
                {session.resume_feedback.suggestions.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2"><span className="text-indigo-400">→</span>{s}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Per-question breakdown */}
      {answersWithQuestions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Question-by-Question Breakdown</h2>
          {answersWithQuestions.map((a: any, i: number) => <AnswerCard key={a.id} answer={a} index={i} />)}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Link to="/interview/setup" className="btn-primary">Start Another Interview</Link>
        <Link to="/history"         className="btn-ghost">View All History</Link>
      </div>
    </div>
  )
}
