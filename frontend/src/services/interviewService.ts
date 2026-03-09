import api from '@/utils/api'

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authSvc = {
  login:    (email: string, password: string)                        => api.post('/auth/login',    { email, password }),
  register: (email: string, full_name: string, password: string)    => api.post('/auth/register', { email, full_name, password }),
  me:       ()                                                       => api.get('/auth/me'),
  update:   (data: any)                                              => api.put('/auth/me', data),
}

// ── Resume ───────────────────────────────────────────────────────────────────
export const resumeSvc = {
  upload: (file: File) => {
    const fd = new FormData(); fd.append('file', file)
    return api.post('/resume/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  list:   ()          => api.get('/resume/'),
  get:    (id: number) => api.get(`/resume/${id}`),
  delete: (id: number) => api.delete(`/resume/${id}`),
}

// ── Interview Session ─────────────────────────────────────────────────────────
export interface CreateSessionPayload {
  resume_id?:       number
  job_title:        string
  company_name?:    string
  job_description:  string
  interview_style:  string
  difficulty:       string
  question_count?:  number
}

export const sessionSvc = {
  create:     (payload: CreateSessionPayload)                    => api.post('/interview/create', payload),
  list:       ()                                                  => api.get('/interview/'),
  get:        (id: number)                                       => api.get(`/interview/${id}/results`),
  status:     (id: number)                                       => api.get(`/interview/${id}/status`),
  start:      (id: number)                                       => api.post(`/interview/${id}/start`),
  submitAudio:(id: number, questionId: number, blob: Blob)      => {
    const fd = new FormData()
    fd.append('audio', blob, `answer_${questionId}.webm`)
    return api.post(`/interview/${id}/answer?question_id=${questionId}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  finish:     (id: number)                                       => api.post(`/interview/${id}/finish`),
  delete:     (id: number)                                       => api.delete(`/interview/${id}`),
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsSvc = {
  dashboard: () => api.get('/analytics/dashboard'),
  trends:    () => api.get('/analytics/trends'),
  sw:        () => api.get('/analytics/strengths-weaknesses'),
}

// ── RAG ───────────────────────────────────────────────────────────────────────
export const ragSvc = {
  query: (query: string, top_k = 5) => api.post('/rag/query', { query, top_k }),
  index: (sessionId: number)        => api.post(`/rag/index/${sessionId}`),
}
