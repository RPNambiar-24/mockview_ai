import { useState } from 'react'
import { ragSvc } from '@/services/interviewService'
import { Brain, Search, Loader2 } from 'lucide-react'

export default function MemoryPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!q.trim()) return
    setLoading(true)
    try { const r = await ragSvc.query(q); setResults(r.data.results || []) }
    catch { /* ignore */ }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Brain className="text-indigo-400" size={22} />
        <div>
          <h1 className="text-2xl font-bold text-white">Memory</h1>
          <p className="text-slate-400 text-sm">Search across all past interview answers using AI</p>
        </div>
      </div>
      <form onSubmit={search} className="flex gap-2">
        <input className="input flex-1" placeholder='e.g. "my Python answers" or "system design questions"' value={q} onChange={e => setQ(e.target.value)} />
        <button type="submit" disabled={loading} className="btn-primary"><Search size={15} /> Search</button>
      </form>
      {loading && <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-400" size={28} /></div>}
      {results.length > 0 && results.map((r, i) => (
        <div key={i} className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Result {i+1}</span>
            {r.score > 0 && <span className="text-xs text-indigo-400">{(r.score*100).toFixed(0)}% match</span>}
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{r.text}</p>
        </div>
      ))}
    </div>
  )
}
