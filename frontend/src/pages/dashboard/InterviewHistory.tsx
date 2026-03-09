import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { sessionSvc } from '@/services/interviewService'
import { Loader2, Mic, ChevronRight, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

const STATUS_COLOR: Record<string, string> = {
  completed:  'bg-green-500/15 text-green-400',
  processing: 'bg-yellow-500/15 text-yellow-400',
  in_progress:'bg-blue-500/15 text-blue-400',
  ready:      'bg-indigo-500/15 text-indigo-400',
}
const STYLE_COLOR: Record<string, string> = {
  technical:   'bg-blue-500/10 text-blue-400',
  behavioral:  'bg-green-500/10 text-green-400',
  mixed:       'bg-purple-500/10 text-purple-400',
  philosophical:'bg-yellow-500/10 text-yellow-400',
  sarcastic:   'bg-red-500/10 text-red-400',
  scenario:    'bg-orange-500/10 text-orange-400',
}

export default function InterviewHistory() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sessionSvc.list().then(r => setSessions(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const remove = async (id: number, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!confirm('Delete this session?')) return
    await sessionSvc.delete(id)
    setSessions(s => s.filter(x => x.id !== id))
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Interview History</h1>
        <Link to="/interview/setup" className="btn-primary text-sm">+ New</Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-indigo-400" size={32} /></div>
      ) : sessions.length === 0 ? (
        <div className="card text-center py-14">
          <Mic size={36} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400">No sessions yet. <Link to="/interview/setup" className="text-indigo-400 hover:underline">Start one.</Link></p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <Link key={s.id} to={`/interview/${s.id}/results`}
              className="card flex items-center gap-4 hover:border-indigo-600/40 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/15 flex items-center justify-center shrink-0">
                <Mic size={16} className="text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white text-sm">{s.job_title}</p>
                  {s.company_name && <span className="text-xs text-slate-500">@ {s.company_name}</span>}
                  <span className={clsx('badge', STATUS_COLOR[s.status] || 'bg-slate-700 text-slate-400')}>{s.status}</span>
                  <span className={clsx('badge', STYLE_COLOR[s.interview_style] || 'bg-slate-700 text-slate-400')}>{s.interview_style}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{format(new Date(s.created_at), 'MMM d, yyyy · h:mm a')}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {s.overall_score != null && <span className="text-lg font-bold text-indigo-400">{s.overall_score}%</span>}
                <button onClick={e => remove(s.id, e)} className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={14} />
                </button>
                <ChevronRight size={16} className="text-slate-600" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
