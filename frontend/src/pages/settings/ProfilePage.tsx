import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { authSvc } from '@/services/interviewService'
import { Settings, Loader2, CheckCircle } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.full_name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try { await authSvc.update({ full_name: name, email }); setSaved(true); setTimeout(() => setSaved(false), 3000) }
    catch { /* ignore */ }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <Settings size={22} className="text-indigo-400" />
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>
      <form onSubmit={save} className="card space-y-4">
        <h2 className="font-semibold text-white">Profile</h2>
        {saved && <div className="flex items-center gap-2 text-green-400 text-sm"><CheckCircle size={14} /> Saved!</div>}
        <div><label className="label">Full Name</label><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
        <div><label className="label">Email</label><input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <><Loader2 size={14} className="animate-spin" />Saving…</> : 'Save Changes'}
        </button>
      </form>
      <div className="card space-y-3">
        <h2 className="font-semibold text-white">API Configuration</h2>
        <p className="text-sm text-slate-400">To enable AI features, set these in your backend <code className="text-indigo-400 bg-slate-800 px-1 rounded">.env</code> file:</p>
        <div className="bg-slate-800 rounded-xl p-3 space-y-1 font-mono text-xs text-slate-300">
          <p>GROQ_API_KEY=gsk_…</p>
          <p>GROQ_MODEL=qwen/qwen3-32b</p>
          <p>WHISPER_MODEL=whisper-large-v3</p>
        </div>
      </div>
    </div>
  )
}
