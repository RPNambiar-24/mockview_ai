import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Mic, Loader2 } from 'lucide-react'

export default function Signup() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [f, setF] = useState({ name: '', email: '', pass: '', confirm: '' })
  const [err, setErr] = useState(''); const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (f.pass !== f.confirm) { setErr('Passwords do not match'); return }
    if (f.pass.length < 6)    { setErr('Password must be at least 6 characters'); return }
    setErr(''); setLoading(true)
    try { await register(f.email, f.name, f.pass); navigate('/dashboard') }
    catch (e: any) { setErr(e.response?.data?.detail || 'Registration failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/30">
            <Mic size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Start your interview practice</p>
        </div>
        <form onSubmit={submit} className="card space-y-4">
          {err && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{err}</div>}
          {[['Full Name','name','text','Jane Doe'],['Email','email','email','you@example.com'],['Password','pass','password','••••••••'],['Confirm','confirm','password','••••••••']].map(([label, key, type, ph]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input type={type} className="input" placeholder={ph} value={f[key as keyof typeof f]} onChange={e => setF({...f, [key]: e.target.value})} required />
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
            {loading ? <><Loader2 size={15} className="animate-spin" />Creating…</> : 'Create Account'}
          </button>
          <p className="text-center text-sm text-slate-400">Already have an account? <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link></p>
        </form>
      </div>
    </div>
  )
}
