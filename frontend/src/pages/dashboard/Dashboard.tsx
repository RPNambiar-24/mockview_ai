import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { analyticsSvc } from '@/services/interviewService'
import { BarChart2, Mic, TrendingUp, History, Plus, Loader2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import clsx from 'clsx'

const STATUS_STYLE: Record<string, string> = {
  completed:  'bg-green-500/15 text-green-400',
  processing: 'bg-yellow-500/15 text-yellow-400',
  in_progress:'bg-blue-500/15 text-blue-400',
  ready:      'bg-indigo-500/15 text-indigo-400',
  generating: 'bg-purple-500/15 text-purple-400',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats]   = useState<any>(null)
  const [trends, setTrends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([analyticsSvc.dashboard(), analyticsSvc.trends()])
      .then(([s, t]) => {
        setStats(s.data)
        setTrends((t.data.trends || []).map((x: any) => ({ ...x, date: format(new Date(x.date), 'MMM d') })))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-400" size={32} /></div>

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good day, <span className="gradient-text">{user?.full_name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your interview performance at a glance.</p>
        </div>
        <Link to="/interview/setup" className="btn-primary">
          <Plus size={15} /> Start Interview
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Sessions',  value: stats?.total_interviews || 0,       icon: Mic,        color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Completed',       value: stats?.completed_interviews || 0,   icon: History,    color: 'text-green-400',  bg: 'bg-green-500/10' },
          { label: 'Avg Score',       value: `${stats?.average_score || 0}%`,    icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`p-3 rounded-xl ${bg}`}><Icon size={20} className={color} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      {trends.length > 1 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Score Trend</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12, color: '#f1f5f9' }}
                formatter={(v: any) => [`${v}%`, 'Score']} />
              <Line type="monotone" dataKey="overall" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent sessions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Recent Sessions</h2>
          <Link to="/history" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
        </div>
        {stats?.recent_sessions?.length ? (
          <div className="space-y-2">
            {stats.recent_sessions.map((s: any) => (
              <Link key={s.id} to={`/interview/${s.id}/results`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3">
                  <Mic size={14} className="text-indigo-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{s.job_title}</p>
                    <p className="text-xs text-slate-500">{format(new Date(s.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  <span className={clsx('badge', STATUS_STYLE[s.status] || 'bg-slate-700 text-slate-400')}>{s.status}</span>
                </div>
                {s.overall_score != null && <span className="text-sm font-bold text-indigo-400">{s.overall_score}%</span>}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Mic size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No interviews yet.</p>
            <Link to="/interview/setup" className="btn-primary mt-4 mx-auto text-sm"><Plus size={14} /> Start your first</Link>
          </div>
        )}
      </div>
    </div>
  )
}
