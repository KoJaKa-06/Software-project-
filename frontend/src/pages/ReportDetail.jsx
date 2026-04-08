import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchReportDetail, updateReport, addNote, fetchConfig } from '../api'

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatTime(d) {
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function ReportDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [config, setConfig] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState('internal')
  const [selectedImg, setSelectedImg] = useState(null)

  useEffect(() => {
    loadReport()
    fetchConfig().then(setConfig)
  }, [id])

  function loadReport() {
    fetchReportDetail(id).then(r => {
      setReport(r)
      setForm({
        verification: r.verification,
        resolution: r.resolution,
        urgency: r.urgency || '',
        is_public: r.is_public,
      })
    }).catch(() => navigate('/login'))
  }

  async function handleSave() {
    setSaving(true); setMessage('')
    try {
      await updateReport(id, form)
      setMessage('Report updated successfully')
      loadReport()
    } catch (err) { setMessage('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return
    try {
      await addNote(id, noteType, noteText)
      setNoteText('')
      loadReport()
    } catch (err) { setMessage('Error: ' + err.message) }
  }

  if (!report) return <div className="page">Loading...</div>
  const isApproved = form.verification === 'Approved'

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.svg" alt="EcoGuard" style={{ height: 30, marginBottom: 4 }} />
          <span>Authority Console</span>
        </div>
        <div className="sidebar-nav">
          <Link to="/authority">Dashboard</Link>
          <a className="active">Reports</a>
          <a onClick={() => { localStorage.removeItem('ecoguard_token'); navigate('/login') }}>Logout</a>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h2>Review Report</h2>
            <Link to="/authority" style={{ fontSize: '0.85rem', color: '#0d9488' }}>&larr; Back: {report.reference}</Link>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className={`badge badge-verification ${report.verification}`}>{report.verification}</span>
            {report.verification === 'Approved' && <span className={`badge badge-resolution ${report.resolution.replace(/ /g, '-')}`}>{report.resolution}</span>}
            {report.urgency && <span className={`badge badge-urgency ${report.urgency}`}>{report.urgency}</span>}
          </div>
        </div>

        {message && <div className="fade-in" style={{ background: message.startsWith('Error') ? '#fef2f2' : '#f0fdf4', color: message.startsWith('Error') ? '#991b1b' : '#166534', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>{message}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Left: metadata + images */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Report Metadata</h3>
              <div className="detail-grid">
                {[
                  ['Reference', report.reference], ['Reporter CIN', report.cin],
                  ['Date', formatDate(report.created_at)], ['Category', report.category],
                  ['Location', report.location], ['Coords', report.latitude ? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}` : '—'],
                ].map(([label, value]) => (
                  <div key={label} className="detail-field">
                    <label>{label}</label>
                    <div className="value">{value}</div>
                  </div>
                ))}
              </div>
              <label style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Description</label>
              <p style={{ marginTop: '0.25rem', fontSize: '0.9rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', lineHeight: 1.5 }}>{report.description}</p>
              {report.road_details && <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>Road: {report.road_details}</p>}
            </div>

            {/* Image gallery */}
            {report.images?.length > 0 && (
              <div className="card">
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Photos ({report.images.length})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
                  {report.images.map(img => (
                    <div key={img.id} onClick={() => setSelectedImg(img.file_path)} style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: '2px solid transparent', transition: 'all 0.2s' }} className="hover-lift">
                      <img src={img.file_path} alt="" style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                      {img.is_primary && <div style={{ fontSize: '0.6rem', textAlign: 'center', background: '#0d9488', color: 'white', padding: '2px' }}>Primary</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status history */}
            {report.history?.length > 0 && (
              <div className="card">
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Activity Log</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {report.history.map(h => (
                    <div key={h.id} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', padding: '0.5rem', background: '#f8fafc', borderRadius: 6 }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{formatTime(h.changed_at)}</div>
                      <div>
                        <strong>{h.officer_name || 'System'}</strong> changed <em>{h.field_changed}</em>
                        {h.old_value && <> from <span className="badge" style={{ fontSize: '0.65rem' }}>{h.old_value}</span></>}
                        {' '}to <span className="badge" style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#166534' }}>{h.new_value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: controls + notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Review Controls</h3>

              <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>VERIFICATION</label>
              <div className="review-actions" style={{ marginTop: '0.35rem' }}>
                <button className="btn btn-success" onClick={() => setForm({ ...form, verification: 'Approved' })} style={form.verification === 'Approved' ? { outline: '2px solid #166534' } : {}}>Approve</button>
                <button className="btn btn-danger" onClick={() => setForm({ ...form, verification: 'Rejected', is_public: false })} style={form.verification === 'Rejected' ? { outline: '2px solid #991b1b' } : {}}>Reject</button>
                <select value={form.verification} onChange={e => { const v = e.target.value; setForm({ ...form, verification: v, is_public: v !== 'Approved' ? false : form.is_public }) }} style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: '1.5px solid #e2e8f0' }}>
                  {config?.verification_statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ marginTop: '1rem', opacity: isApproved ? 1 : 0.4, pointerEvents: isApproved ? 'auto' : 'none' }}>
                <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>RESOLUTION {!isApproved && '(approve first)'}</label>
                <select value={form.resolution} onChange={e => setForm({ ...form, resolution: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1.5px solid #e2e8f0', marginTop: '0.35rem' }}>
                  {config?.resolution_statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Urgency</label>
                <select value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })}>
                  <option value="">Unassigned</option>
                  {config?.urgency_levels.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div className="toggle-container" style={{ marginTop: '1rem', opacity: isApproved ? 1 : 0.4 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Public Visibility</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Show on public map</div>
                </div>
                <div className={`toggle ${form.is_public && isApproved ? 'on' : ''}`} onClick={() => { if (isApproved) setForm({ ...form, is_public: !form.is_public }) }} />
              </div>

              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ width: '100%', marginTop: '1rem', padding: '0.7rem' }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Notes */}
            <div className="card">
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Notes</h3>

              {/* Add note */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <select value={noteType} onChange={e => setNoteType(e.target.value)} style={{ padding: '0.5rem', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.8rem' }}>
                  <option value="internal">Internal</option>
                  <option value="public">Public</option>
                </select>
                <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.85rem' }} onKeyDown={e => e.key === 'Enter' && handleAddNote()} />
                <button className="btn btn-primary" onClick={handleAddNote} style={{ padding: '0.5rem 1rem' }}>Add</button>
              </div>

              {/* Notes timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 400, overflowY: 'auto' }}>
                {[...(report.public_notes || []), ...(report.internal_notes || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(n => (
                  <div key={n.id} style={{
                    padding: '0.6rem 0.75rem', borderRadius: 8, fontSize: '0.8rem', lineHeight: 1.5,
                    background: n.note_type === 'public' ? '#f0fdf4' : '#f8fafc',
                    borderLeft: `3px solid ${n.note_type === 'public' ? '#22c55e' : '#94a3b8'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>{n.author_name || 'System'}</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        <span className={`badge ${n.note_type === 'public' ? 'badge-resolution Resolved' : ''}`} style={{ fontSize: '0.6rem', marginRight: 4 }}>{n.note_type}</span>
                        {formatTime(n.created_at)}
                      </span>
                    </div>
                    {n.content}
                  </div>
                ))}
                {(report.public_notes?.length || 0) + (report.internal_notes?.length || 0) === 0 && (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>No notes yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image lightbox */}
      {selectedImg && (
        <div onClick={() => setSelectedImg(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out',
          animation: 'fadeIn 0.2s',
        }}>
          <img src={selectedImg} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
        </div>
      )}
    </div>
  )
}
