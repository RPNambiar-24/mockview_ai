import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'

import Layout           from '@/components/layout/Layout'
import Login            from '@/pages/auth/Login'
import Signup           from '@/pages/auth/Signup'
import Dashboard        from '@/pages/dashboard/Dashboard'
import InterviewHistory from '@/pages/dashboard/InterviewHistory'
import ResumeManager    from '@/pages/resume/ResumeManager'
import SetupPage        from '@/pages/setup/SetupPage'
import ThinkingScreen   from '@/pages/setup/ThinkingScreen'
import LiveInterview    from '@/pages/interview/LiveInterview'
import ProcessingScreen from '@/pages/interview/ProcessingScreen'
import ResultsPage      from '@/pages/results/ResultsPage'
import MemoryPage       from '@/pages/memory/MemoryPage'
import AnalyticsPage    from '@/pages/analytics/AnalyticsPage'
import ProfilePage      from '@/pages/settings/ProfilePage'

function Guard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-400" size={32} />
    </div>
  )
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"  element={<Login  />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"                  element={<Dashboard />} />
        <Route path="history"                    element={<InterviewHistory />} />
        <Route path="resumes"                    element={<ResumeManager />} />
        <Route path="interview/setup"            element={<SetupPage />} />
        <Route path="interview/:id/thinking"     element={<ThinkingScreen />} />
        <Route path="interview/:id/live"         element={<LiveInterview />} />
        <Route path="interview/:id/processing"   element={<ProcessingScreen />} />
        <Route path="interview/:id/results"      element={<ResultsPage />} />
        <Route path="memory"                     element={<MemoryPage />} />
        <Route path="analytics"                  element={<AnalyticsPage />} />
        <Route path="settings"                   element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
