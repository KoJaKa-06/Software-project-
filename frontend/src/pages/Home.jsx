import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchPublicReports, fetchNotices, fetchConfig } from '../api'
import MapView from '../components/MapView'
import Legend from '../components/Legend'
import SceneBg from '../components/SceneBg'

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function Home() {
  const [reports, setReports] = useState([])
  const [notices, setNotices] = useState([])
  const [config, setConfig] = useState(null)
  const [filters, setFilters] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([fetchConfig(), fetchPublicReports(), fetchNotices()])
      .then(([c, r, n]) => { setConfig(c); setReports(r); setNotices(n); setLoaded(true) })
  }, [])

  function applyFilters() { fetchPublicReports(filters).then(setReports) }

  const criticalHigh = reports.filter(r => r.urgency === 'Critical' || r.urgency === 'High').length
  const resolvedCount = reports.filter(r => r.resolution === 'Resolved').length
  const primaryImage = (r) => r.images?.find(i => i.is_primary)?.file_path || r.images?.[0]?.file_path
  const latestPublicNote = (r) => r.public_notes?.[0]?.content

  return (
    <div className={`page page-with-scene ${loaded ? 'fade-in' : ''}`}>
      <div className="scene-bg"><SceneBg variant="mountains" /></div>
      {/* Hero */}
      <div className="hero slide-up">
        <div className="hero-text">
          <h1>Environmental Alerts & Reports</h1>
          <p>EcoGuard provides a public map of active environmental reports for the Ifrane region, plus access to guest submissions and report tracking.</p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Link to="/submit" className="btn btn-primary btn-hover-lift" style={{ padding: '0.7rem 1.5rem', fontSize: '0.95rem' }}>Submit a Report</Link>
            <Link to="/track" className="btn btn-secondary btn-hover-lift" style={{ padding: '0.7rem 1.5rem', fontSize: '0.95rem' }}>Track Your Report</Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row slide-up" style={{ animationDelay: '0.1s' }}>
        {[
          { n: criticalHigh, l: 'Critical / High', c: '#f59e0b' },
          { n: resolvedCount, l: 'Resolved', c: '#22c55e' },
          { n: reports.length - resolvedCount, l: 'Active', c: '#3b82f6' },
        ].map((s, i) => (
          <div key={i} className="stat-card hover-lift">
            <div className={`stat-dot ${s.pulse ? 'pulse-dot' : ''}`} style={{ background: s.c }} />
            <div><div className="number">{s.n}</div><div className="label">{s.l}</div></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      {config && (
        <div className="filters-bar card slide-up" style={{ padding: '1rem 1.25rem', animationDelay: '0.15s' }}>
          {[
            { label: 'Category', key: 'category', opts: config.categories },
            { label: 'Resolution', key: 'resolution', opts: config.resolution_statuses },
            { label: 'Urgency', key: 'urgency', opts: config.urgency_levels },
            { label: 'Location', key: 'location', opts: config.locations },
          ].map(f => (
            <div key={f.key} className="filter-group">
              <label>{f.label}</label>
              <select value={filters[f.key] || ''} onChange={e => setFilters({ ...filters, [f.key]: e.target.value })}>
                <option value="">Any</option>
                {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <button className="btn btn-primary btn-hover-lift" onClick={applyFilters}>Apply</button>
        </div>
      )}

      {/* Main grid */}
      <div className="home-grid" style={{ marginTop: '1.5rem' }}>
        <div className="slide-up" style={{ animationDelay: '0.2s' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Ifrane Region Map</h3>
          <div className="map-container hover-glow">
            <MapView reports={reports} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
          <div style={{ marginTop: '0.75rem' }}><Legend /></div>
        </div>

        <div className="slide-up" style={{ animationDelay: '0.25s' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Latest Reports</h3>
          <div className="reports-list">
            {reports.map((r, i) => {
              const img = primaryImage(r)
              const selected = selectedId === r.id
              return (
                <div
                  key={r.id}
                  className={`report-card-rich cat-${r.category.split(' ')[0]} hover-lift stagger-in`}
                  style={{ animationDelay: `${0.25 + i * 0.04}s`, ...(selected ? { boxShadow: '0 0 0 2px #0d9488, 0 8px 24px rgba(13,148,136,0.15)' } : {}) }}
                  onClick={() => setSelectedId(selected ? null : r.id)}
                >
                  {img && <div className="report-thumb"><img src={img} alt="" /></div>}
                  <div className="report-body">
                    <div className="report-top">
                      <div>
                        <h4>{r.category}</h4>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                          <span style={{ fontStyle: 'italic', color: '#0d9488', fontWeight: 500 }}>{r.location}</span>
                          <span style={{ color: '#cbd5e1', margin: '0 0.35rem' }}>/</span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{timeAgo(r.created_at)}</span>
                        </div>
                      </div>
                      <div className="report-badges">
                        <span className={`badge badge-resolution ${r.resolution.replace(/ /g, '-')}`}>{r.resolution}</span>
                        {r.urgency && <span className={`badge badge-urgency ${r.urgency}`}>{r.urgency}</span>}
                      </div>
                    </div>
                    {selected && latestPublicNote(r) && (
                      <div className="note fade-in" style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: '#f8fafc', borderRadius: '6px', borderLeft: '3px solid #0d9488', fontSize: '0.8rem' }}>
                        {latestPublicNote(r)}
                        {r.public_notes?.length > 1 && <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>+{r.public_notes.length - 1} more update(s)</div>}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {reports.length === 0 && (
              <div className="card fade-in" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                No approved reports match the current filters.
              </div>
            )}
          </div>

          {/* Notices */}
          <div className="notices-section" style={{ marginTop: '2rem' }}>
            <h3>Recent Notices</h3>
            {notices.map((n, i) => (
              <div key={n.id} className="notice-item hover-lift stagger-in" style={{ animationDelay: `${0.3 + i * 0.04}s`, borderRadius: '8px', padding: '0.75rem' }}>
                <div className="notice-date">{formatDate(n.created_at)}</div>
                <div>
                  <div className="notice-title">{n.title}</div>
                  <div className="notice-content">{n.content}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom spacer so content doesn't overlap the fixed bg */}
      <div style={{ height: '4rem' }} />
    </div>
  )
}
