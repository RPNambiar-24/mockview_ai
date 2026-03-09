import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { resumeSvc, sessionSvc } from '@/services/interviewService'
import { FileText, Upload, Loader2, ChevronRight, Zap } from 'lucide-react'
import clsx from 'clsx'

const STYLES = [
  { id: 'technical', label: ' Technical', desc: 'DSA, system design, coding' },
  { id: 'behavioral', label: ' Behavioral', desc: 'STAR-format past experience' },
  { id: 'philosophical', label: ' Philosophical', desc: 'Engineering philosophy & trade-offs' },
  { id: 'sarcastic', label: ' Sarcastic', desc: 'Challenging & provocative' },
  { id: 'mixed', label: ' Mixed', desc: 'Balanced across all types' },
  { id: 'scenario', label: ' Scenario-heavy', desc: 'Real-world situation problems' },
]

const DIFFS = [
  { id: 'easy', label: 'Easy', desc: 'Junior level' },
  { id: 'medium', label: 'Medium', desc: 'Mid-level (2–4 yrs)' },
  { id: 'hard', label: 'Hard', desc: 'Senior depth' },
  { id: 'adaptive', label: 'Adaptive', desc: 'Escalates with you' },
]

export default function SetupPage() {
  const navigate = useNavigate()
  const [resumes, setResumes] = useState<any[]>([])
  const [selectedResume, setResume] = useState<number | null>(null)
  const [uploadingResume, setUploadRes] = useState(false)
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jd, setJD] = useState('')
  const [style, setStyle] = useState('mixed')
  const [difficulty, setDiff] = useState('medium')
  const [count, setCount] = useState(15)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { resumeSvc.list().then(r => setResumes(r.data)).catch(console.error) }, [])

  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return
    setUploadRes(true)
    try {
      const r = await resumeSvc.upload(files[0])
      setResumes(prev => [r.data, ...prev])
      setResume(r.data.id)
    } catch { setError('Resume upload failed') }
    finally { setUploadRes(false) }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }, maxFiles: 1
  })

  const handleGenerate = async () => {
    if (!jobTitle.trim()) { setError('Job title is required'); return }
    if (!jd.trim()) { setError('Job description is required'); return }
    setCreating(true); setError('')
    try {
      const r = await sessionSvc.create({
        resume_id: selectedResume || undefined,
        job_title: jobTitle, company_name: company,
        job_description: jd, interview_style: style,
        difficulty, question_count: count,
      })
      navigate(`/interview/${r.data.id}/thinking`)
    } catch (e: any) { setError(e.response?.data?.detail || 'Failed to create session') }
    finally { setCreating(false) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configure Your Interview</h1>
        <p className="text-slate-400 text-sm mt-1">Tell the AI about the role and how you want to be interviewed.</p>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}

      {/* Step 1: Resume */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-white flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-indigo-600 text-xs flex items-center justify-center text-white font-bold">1</span> Resume <span className="text-slate-500 text-xs font-normal">(optional but recommended)</span></h2>
        <div {...getRootProps()} className={clsx('border-2 border-dashed rounded-xl p-5 cursor-pointer text-center transition-colors',
          isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-800/30')}>
          <input {...getInputProps()} />
          {uploadingResume ? (
            <div className="flex items-center justify-center gap-2 text-indigo-400"><Loader2 size={18} className="animate-spin" /><span className="text-sm">Uploading & parsing…</span></div>
          ) : (
            <>
              <Upload size={22} className="text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Drop PDF/DOCX here or click to upload</p>
            </>
          )}
        </div>
        {resumes.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-slate-500">Or choose an existing resume:</p>
            {resumes.map(r => (
              <div key={r.id} onClick={() => setResume(selectedResume === r.id ? null : r.id)}
                className={clsx('flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border',
                  selectedResume === r.id ? 'border-indigo-500 bg-indigo-600/10' : 'border-slate-700 bg-slate-800/40 hover:border-slate-600')}>
                <FileText size={14} className={selectedResume === r.id ? 'text-indigo-400' : 'text-slate-500'} />
                <span className="text-sm text-slate-300 truncate">{r.filename}</span>
                {selectedResume === r.id && <span className="ml-auto text-xs text-indigo-400">✓ selected</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Job info */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-white flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-indigo-600 text-xs flex items-center justify-center text-white font-bold">2</span> Job Details</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Job Title *</label>
            <input className="input" placeholder="Software Engineer" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Company</label>
            <input className="input" placeholder="Google" value={company} onChange={e => setCompany(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Job Description *</label>
          <textarea className="input min-h-[140px] resize-none" placeholder="Paste the full job description here…" value={jd} onChange={e => setJD(e.target.value)} />
        </div>
      </div>

      {/* Step 3: Style */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-white flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-indigo-600 text-xs flex items-center justify-center text-white font-bold">3</span> Interview Style</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {STYLES.map(s => (
            <div key={s.id} onClick={() => setStyle(s.id)}
              className={clsx('p-3 rounded-xl cursor-pointer border transition-all',
                style === s.id ? 'border-indigo-500 bg-indigo-600/10' : 'border-slate-700 bg-slate-800/40 hover:border-slate-600')}>
              <p className="text-sm font-medium text-white">{s.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step 4: Difficulty + count */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-indigo-600 text-xs flex items-center justify-center text-white font-bold">4</span> Difficulty</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DIFFS.map(d => (
            <div key={d.id} onClick={() => setDiff(d.id)}
              className={clsx('p-3 rounded-xl cursor-pointer border text-center transition-all',
                difficulty === d.id ? 'border-indigo-500 bg-indigo-600/10' : 'border-slate-700 bg-slate-800/40 hover:border-slate-600')}>
              <p className="text-sm font-semibold text-white">{d.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{d.desc}</p>
            </div>
          ))}
        </div>
        <div>
          <label className="label">Questions: <span className="text-indigo-400 font-bold">{count}</span></label>
          <input type="range" min={10} max={30} value={count} onChange={e => setCount(+e.target.value)}
            className="w-full accent-indigo-500" />
          <div className="flex justify-between text-xs text-slate-500 mt-1"><span>10</span><span>30</span></div>
        </div>
      </div>

      <button onClick={handleGenerate} disabled={creating || !jobTitle || !jd} className="btn-primary w-full justify-center py-3 text-base">
        {creating ? <><Loader2 size={16} className="animate-spin" />Generating Interview…</> : <><Zap size={16} />Generate Interview</>}
      </button>
    </div>
  )
}
