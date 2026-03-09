import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '@/utils/api'

interface User { id: number; email: string; full_name: string }
interface AuthCtx {
  user: User | null; token: string | null; isLoading: boolean
  login: (e: string, p: string) => Promise<void>
  register: (e: string, name: string, p: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [token, setToken]     = useState<string | null>(null)
  const [isLoading, setLoad]  = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('mv_token')
    const u = localStorage.getItem('mv_user')
    if (t && u) { setToken(t); setUser(JSON.parse(u)) }
    setLoad(false)
  }, [])

  const _save = (data: any) => {
    setToken(data.access_token); setUser(data.user)
    localStorage.setItem('mv_token', data.access_token)
    localStorage.setItem('mv_user', JSON.stringify(data.user))
  }

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    _save(data)
  }

  const register = async (email: string, full_name: string, password: string) => {
    const { data } = await api.post('/auth/register', { email, full_name, password })
    _save(data)
  }

  const logout = () => {
    setUser(null); setToken(null)
    localStorage.removeItem('mv_token')
    localStorage.removeItem('mv_user')
  }

  return <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}
