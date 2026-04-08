import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { fetchAuthorityReports, fetchStats, fetchConfig } from '../api'
import MapView from '../components/MapView'

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Dashboard() {
  const [reports, setReports] = useState([])
  const [stats, setStats] = useState(null)
  const [config, setConfig] = useState(null)
  const [filters, setFilters] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [view, setView] = useState('dashboard')
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
    fetchConfig().then(setConfig)
  }, [])

  async function loadData() {
    try {
      const [r, s] = await Promise.all([fetchAuthorityReports(filters), fetchStats()])
      setReports(r)
      setStats(s)
    } catch {
      navigate('/login')
    }
  }

  function applyFilters() {
    fetchAuthorityReports(filters).then(setReports).catch(() => navigate('/login'))
  }

  function logout() {
    localStorage.removeItem('ecoguard_token')
    localStorage.removeItem('ecoguard_officer')
    navigate('/login')
  }

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.svg" alt="EcoGuard" style={{ height: 30, marginBottom: 4 }} />
          <span>Authority Console</span>
        </div>
        <div className="sidebar-nav">
          <a href="#" className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</a>
          <a href="#" className={view === 'reports' ? 'active' : ''} onClick={() => setView('reports')}>Reports</a>
          <a href="#" onClick={logout}>Logout</a>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>Operational Dashboard</h2>
          <span className="shift-badge">Current Shift 08:00-17:00</span>
        </div>

        {stats && (
          <>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600, textTransform: 'uppercase' }}>Verification</div>
            <div className="stats-row">
              <div className="stat-card hover-lift">
                <div className="stat-dot" style={{ background: '#3b82f6' }} />
                <div><div className="number">{stats.total}</div><div className="label">Total</div></div>
              </div>
              <div className="stat-card hover-lift">
                <div className="stat-dot" style={{ background: '#f59e0b' }} />
                <div><div className="number">{stats.pending}</div><div className="label">Pending</div></div>
              </div>
              <div className="stat-card hover-lift">
                <div className="stat-dot" style={{ background: '#22c55e' }} />
                <div><div className="number">{stats.approved}</div><div className="label">Approved</div></div>
              </div>
              <div className="stat-card hover-lift">
                <div className="stat-dot" style={{ background: '#ef4444' }} />
                <div><div className="number">{stats.rejected}</div><div className="label">Rejected</div></div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600, textTransform: 'uppercase' }}>Resolution (approved only)</div>
            <div className="stats-row">
              <div className="stat-card hover-lift">
                <div className="stat-dot" style={{ background: '#f59e0b' }} />
                <div><div className="number">{stats.ongoing}</div><div className="label">Ongoing</div></div>
              </div>
              <div className="stat-card hover-lift">
                <div className="stat-dot" style={{ background: '#3b82f6' }} />
                <div><div className="number">{stats.in_progress}</div><div className="label">In Progress</div></div>
              </div>
              <div className="stat-card hover-lift">
                <div className="stat-dot" style={{ background: '#22c55e' }} />
                <div><div className="number">{stats.resolved}</div><div className="label">Resolved</div></div>
              </div>
            </div>
          </>
        )}

        {config && (
          <div className="filters-bar">
            <div className="filter-group">
              <label>Search</label>
              <input placeholder="Reference or location" value={filters.search || ''} onChange={e => setFilters({ ...filters, search: e.target.value })} />
            </div>
            <div className="filter-group">
              <label>Category</label>
              <select value={filters.category || ''} onChange={e => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All</option>
                {config.categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Verification</label>
              <select value={filters.verification || ''} onChange={e => setFilters({ ...filters, verification: e.target.value })}>
                <option value="">All</option>
                {config.verification_statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Resolution</label>
              <select value={filters.resolution || ''} onChange={e => setFilters({ ...filters, resolution: e.target.value })}>
                <option value="">All</option>
                {config.resolution_statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Urgency</label>
              <select value={filters.urgency || ''} onChange={e => setFilters({ ...filters, urgency: e.target.value })}>
                <option value="">All</option>
                {config.urgency_levels.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={applyFilters}>Filter</button>
          </div>
        )}

        {view === 'dashboard' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="map-container" style={{ height: 300, marginBottom: '1rem' }}>
              <MapView reports={reports} selectedId={selectedId} onSelect={setSelectedId} />
            </div>
          </div>
        )}

        <table className="report-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Category</th>
              <th>Location</th>
              <th>Date</th>
              <th>Verification</th>
              <th>Resolution</th>
              <th>Urgency</th>
              <th>Public</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr
                key={r.id}
                style={selectedId === r.id ? { background: '#f0fdf4' } : {}}
                onClick={() => setSelectedId(r.id)}
              >
                <td style={{ fontWeight: 600 }}>{r.reference}</td>
                <td>{r.category}</td>
                <td>{r.location}</td>
                <td>{formatDate(r.created_at)}</td>
                <td><span className={`badge badge-verification ${r.verification}`}>{r.verification}</span></td>
                <td><span className={`badge badge-resolution ${r.resolution.replace(/ /g, '-')}`}>{r.resolution}</span></td>
                <td><span className={`badge badge-urgency ${r.urgency || 'Unassigned'}`}>{r.urgency || '—'}</span></td>
                <td><span className={`badge ${r.is_public ? 'badge-verification Approved' : 'badge-verification'}`}>{r.is_public ? 'On' : 'Off'}</span></td>
                <td><Link to={`/authority/reports/${r.id}`} className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
