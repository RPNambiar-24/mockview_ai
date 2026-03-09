import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Mic, Loader2, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [email, setEmail]   = useState('')
  const [pass,  setPass]    = useState('')
  const [show,  setShow]    = useState(false)
  const [err,   setErr]     = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setLoading(true)
    try { await login(email, pass); navigate('/dashboard') }
    catch (e: any) { setErr(e.response?.data?.detail || 'Login failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/30">
            <Mic size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">MockView AI</h1>
          <p className="text-slate-400 text-sm mt-1">Your AI interview coach</p>
        </div>

        <form onSubmit={submit} className="card space-y-4">
          {err && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{err}</div>}

          <div>
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input type={show ? 'text' : 'password'} className="input pr-10" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} required />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
            {loading ? <><Loader2 size={15} className="animate-spin" />Signing in…</> : 'Sign In'}
          </button>
          <p className="text-center text-sm text-slate-400">
            No account? <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign up free</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
