import { useEffect, useState } from 'react'
import { analyticsSvc } from '@/services/interviewService'
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'

export default function AnalyticsPage() {
  const [trends, setTrends] = useState<any[]>([])
  const [sw,     setSW]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([analyticsSvc.trends(), analyticsSvc.sw()])
      .then(([t, s]) => {
        setTrends((t.data.trends || []).map((x: any) => ({ ...x, date: format(new Date(x.date), 'MMM d') })))
        setSW(s.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-400" size={28} /></div>

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>

      {trends.length > 1 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Performance Over Time</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, fontSize: 12, color: '#f1f5f9' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              <Line type="monotone" dataKey="overall"       stroke="#6366f1" strokeWidth={2.5} dot={false} name="Overall" />
              <Line type="monotone" dataKey="communication" stroke="#22d3ee" strokeWidth={2}   dot={false} name="Communication" />
              <Line type="monotone" dataKey="technical"     stroke="#f59e0b" strokeWidth={2}   dot={false} name="Technical" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-4"><TrendingUp size={16} className="text-green-400" /><h2 className="font-semibold text-white text-sm">Strengths</h2></div>
          {sw?.strengths?.length ? sw.strengths.map((s: string, i: number) => <p key={i} className="text-sm text-slate-300 border-l-2 border-green-600 pl-3 mb-2">{s}</p>)
            : <p className="text-slate-500 text-sm">Complete more interviews to see patterns.</p>}
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-4"><TrendingDown size={16} className="text-red-400" /><h2 className="font-semibold text-white text-sm">Improvement Areas</h2></div>
          {sw?.weaknesses?.length ? sw.weaknesses.map((w: string, i: number) => <p key={i} className="text-sm text-slate-300 border-l-2 border-red-600 pl-3 mb-2">{w}</p>)
            : <p className="text-slate-500 text-sm">No patterns identified yet.</p>}
        </div>
      </div>
    </div>
  )
}
