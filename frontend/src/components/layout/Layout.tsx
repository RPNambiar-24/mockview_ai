import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { LayoutDashboard, Mic, FileText, History, Brain, BarChart2, Settings, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const nav = [
  { to: '/dashboard',       label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/interview/setup', label: 'New Interview',icon: Mic },
  { to: '/history',         label: 'History',     icon: History },
  { to: '/resumes',         label: 'Resumes',     icon: FileText },
  { to: '/memory',          label: 'Memory',      icon: Brain },
  { to: '/analytics',       label: 'Analytics',   icon: BarChart2 },
  { to: '/settings',        label: 'Settings',    icon: Settings },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-30 w-60 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Mic size={15} className="text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">MockView AI</span>
          <button onClick={() => setOpen(false)} className="ml-auto lg:hidden text-slate-500 hover:text-white"><X size={18} /></button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              )}>
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => navigate('/settings')}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
            <button onClick={e => { e.stopPropagation(); logout(); navigate('/login') }} className="text-slate-500 hover:text-red-400 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800">
          <button onClick={() => setOpen(true)} className="text-slate-400 hover:text-white"><Menu size={20} /></button>
          <span className="font-bold text-white text-sm">MockView AI</span>
        </header>
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
