import { useEffect, useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { resumeSvc } from '@/services/interviewService'
import { FileText, Trash2, Upload, Loader2, Plus } from 'lucide-react'
import { format } from 'date-fns'

export default function ResumeManager() {
  const [resumes, setResumes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => { resumeSvc.list().then(r => setResumes(r.data)).finally(() => setLoading(false)) }, [])

  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return
    setUploading(true)
    try {
      const r = await resumeSvc.upload(files[0])
      setResumes(prev => [r.data, ...prev])
      setSelected(r.data)
    } catch { alert('Upload failed') }
    finally { setUploading(false) }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }, maxFiles: 1
  })

  const del = async (id: number) => {
    if (!confirm('Delete?')) return
    await resumeSvc.delete(id)
    setResumes(r => r.filter(x => x.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-white">Resumes</h1>

      <div {...getRootProps()} className={`card border-2 border-dashed cursor-pointer text-center py-8 transition-colors ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-600'}`}>
        <input {...getInputProps()} />
        {uploading ? <div className="flex items-center justify-center gap-2 text-indigo-400"><Loader2 size={18} className="animate-spin" />Uploading…</div>
          : <><Upload size={24} className="text-slate-500 mx-auto mb-2" /><p className="text-sm text-slate-400">Drop PDF/DOCX or click to upload</p></>}
      </div>

      {loading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-400" size={28} /></div>
        : resumes.length === 0 ? <div className="card text-center py-10"><p className="text-slate-500">No resumes yet.</p></div>
        : <div className="grid gap-3">
          {resumes.map(r => (
            <div key={r.id} onClick={() => setSelected(r === selected ? null : r)}
              className={`card cursor-pointer transition-all border ${selected?.id === r.id ? 'border-indigo-500 bg-indigo-600/5' : 'border-slate-800 hover:border-slate-700'}`}>
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-indigo-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{r.filename}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{format(new Date(r.created_at), 'MMM d, yyyy')}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); del(r.id) }} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
              </div>
              {selected?.id === r.id && r.parsed_data && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                  {r.parsed_data.skills?.length > 0 && <div className="flex flex-wrap gap-1">{r.parsed_data.skills.slice(0,12).map((s: string) => <span key={s} className="badge bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs">{s}</span>)}</div>}
                  {r.parsed_data.education?.length > 0 && r.parsed_data.education.map((e: string, i: number) => <p key={i} className="text-xs text-slate-400 border-l-2 border-green-600 pl-2">{e}</p>)}
                </div>
              )}
            </div>
          ))}
        </div>}
    </div>
  )
}
