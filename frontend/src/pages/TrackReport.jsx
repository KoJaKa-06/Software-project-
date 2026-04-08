import { useState } from 'react'
import { lookupReport } from '../api'
import SceneBg from '../components/SceneBg'

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function TrackReport() {
  const [cin, setCin] = useState('')
  const [reference, setReference] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    setError('')
    setResult(null)
    if (!cin || !reference) {
      setError('Please enter both CIN and report reference.')
      return
    }
    setLoading(true)
    try {
      const data = await lookupReport(cin, reference)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page-with-scene" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="scene-bg"><SceneBg variant="lake" /></div>
      <div className="page-header">
        <h1>Track Your Report</h1>
        <p>Enter the report reference and CIN to view the current verification, resolution status, urgency, and public-facing information.</p>
      </div>

      <form className="card" onSubmit={handleSearch} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>CIN</label>
            <input placeholder="Enter your CIN" value={cin} onChange={e => setCin(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Report Reference</label>
            <input placeholder="e.g. ECO-1001" value={reference} onChange={e => setReference(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginBottom: '0.35rem' }}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {result && (
        <div className="card lookup-result fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Report Status</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className={`badge badge-verification ${result.verification}`}>{result.verification}</span>
              {result.verification === 'Approved' && (
                <span className={`badge badge-resolution ${result.resolution.replace(/ /g, '-')}`}>{result.resolution}</span>
              )}
            </div>
          </div>

          <div className="result-grid">
            <div className="result-item">
              <label>Category</label>
              <div className="value">{result.category}</div>
            </div>
            <div className="result-item">
              <label>Location</label>
              <div className="value">{result.location}</div>
            </div>
            <div className="result-item">
              <label>Submission Date</label>
              <div className="value">{formatDate(result.created_at)}</div>
            </div>
            <div className="result-item">
              <label>Reference</label>
              <div className="value">{result.reference}</div>
            </div>
            <div className="result-item">
              <label>Visibility</label>
              <div className="value">{result.is_public ? 'Public' : 'Not public'}</div>
            </div>
            <div className="result-item">
              <label>Urgency</label>
              <div className="value">
                <span className={`badge badge-urgency ${result.urgency || 'Unassigned'}`}>
                  {result.urgency || 'Unassigned'}
                </span>
              </div>
            </div>
          </div>

          {result.public_note && (
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <label style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Public-facing Information</label>
              <p style={{ marginTop: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>{result.public_note}</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-card">
          <div className="icon">&#9888;</div>
          <div style={{ flex: 1 }}>
            <h4>No matching report found</h4>
            <p>Check the entered CIN and report reference.</p>
          </div>
          <button className="btn btn-secondary" onClick={() => { setError(''); setResult(null) }}>Search Again</button>
        </div>
      )}

      {!result && !error && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>What appears after search</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              ['Verification status', 'Whether the report is approved, pending, or rejected.'],
              ['Resolution status', 'Is the issue open, in progress, or resolved.'],
              ['Urgency & location', 'Assigned severity and where it was submitted.'],
              ['Public information', 'Visible note published by authorities.'],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', marginTop: 6, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
