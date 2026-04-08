import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchConfig, submitReport } from '../api'
import LocationPicker from '../components/LocationPicker'
import SceneBg from '../components/SceneBg'

export default function SubmitReport() {
  const [config, setConfig] = useState(null)
  const [form, setForm] = useState({ cin: '', category: '', location: '', description: '', road_details: '' })
  const [coords, setCoords] = useState({ lat: null, lng: null })
  const [images, setImages] = useState([])
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchConfig().then(setConfig) }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleMapPick(lat, lng) {
    setCoords({ lat, lng })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.cin || !form.category || !form.location || !form.description) {
      setError('Please fill in all required fields.')
      return
    }
    if (!coords.lat || !coords.lng) {
      setError('Please click on the map to mark the exact report location.')
      return
    }
    if (form.category === 'Snow Closure' && !form.road_details) {
      setError('Road details are required for snow closure reports.')
      return
    }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('cin', form.cin)
      fd.append('category', form.category)
      fd.append('location', form.location)
      fd.append('description', form.description)
      fd.append('latitude', coords.lat)
      fd.append('longitude', coords.lng)
      if (form.road_details) fd.append('road_details', form.road_details)
      images.forEach(img => fd.append('images', img))

      const res = await submitReport(fd)
      setResult(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="page">
        <div className="success-card card fade-in">
          <div className="checkmark bounce-in">&#10003;</div>
          <h2>Report Submitted Successfully</h2>
          <p style={{ color: '#64748b' }}>
            Your report was created and assigned a unique reference. Use your CIN together with this number on the tracking page.
          </p>
          <div className="reference-box">
            <div>REFERENCE NUMBER</div>
            <div className="ref-number">{result.reference}</div>
          </div>
          <div className="btn-row">
            <Link to="/" className="btn btn-secondary">Return Home</Link>
            <Link to="/track" className="btn btn-primary">Track Report</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page page-with-scene fade-in">
      <div className="scene-bg"><SceneBg variant="forest" /></div>
      <div className="page-header">
        <h1>Submit an Environmental Report</h1>
        <p>Guest submission is available without login. Required fields are validated before a report is created and assigned a unique reference.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="card slide-up">
          <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#64748b' }}>Public report form</h3>

          {error && (
            <div className="shake" style={{ background: '#fef2f2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>CIN *</label>
                <input name="cin" placeholder="Enter national ID" value={form.cin} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  <option value="">Select category</option>
                  {config?.categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Location (area) *</label>
                <select name="location" value={form.location} onChange={handleChange}>
                  <option value="">Select area</option>
                  {config?.locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              {form.category === 'Snow Closure' && (
                <div className="form-group">
                  <label>Road Details *</label>
                  <input name="road_details" placeholder="e.g., Intersection of Hassan II and Mohammed V" value={form.road_details} onChange={handleChange} />
                </div>
              )}

              <div className="form-group full">
                <label>Exact Location on Map *</label>
                <LocationPicker lat={coords.lat} lng={coords.lng} onPick={handleMapPick} />
                {coords.lat && (
                  <div className="coord-display fade-in" style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#0d9488', fontWeight: 600 }}>
                    Pinned at {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </div>
                )}
              </div>

              <div className="form-group full">
                <label>Description *</label>
                <textarea name="description" placeholder="Describe the environmental issue..." value={form.description} onChange={handleChange} />
              </div>
              <div className="form-group full">
                <label>Image Attachments (up to 5)</label>
                <div className="image-upload" onClick={() => document.getElementById('file-input').click()}>
                  <input id="file-input" type="file" accept="image/jpeg,image/png" multiple style={{ display: 'none' }}
                    onChange={e => { const files = Array.from(e.target.files).slice(0, 5); setImages(files) }} />
                  {images.length > 0 ? (
                    <div className="fade-in" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {images.map((img, i) => (
                        <div key={i} style={{ width: 80, textAlign: 'center' }}>
                          <img src={URL.createObjectURL(img)} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.name}</div>
                        </div>
                      ))}
                      <p style={{ width: '100%', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Click to change</p>
                    </div>
                  ) : (
                    <p>Click to add photos<br /><small>Optional - up to 5 files (JPG/PNG, max 5MB each)</small></p>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <Link to="/" className="btn btn-secondary">Cancel</Link>
              <button type="submit" className="btn btn-primary btn-pulse" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>

        <div className="card slide-up" style={{ alignSelf: 'flex-start', animationDelay: '0.1s' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Submission rules</h3>
          <ul style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'disc', paddingLeft: '1.25rem' }}>
            <li>CIN is required.</li>
            <li>Category and location use predefined values.</li>
            <li>Pin the exact location on the map.</li>
            <li>Image is optional and limited to one file.</li>
            <li>Snow closure reports require road details.</li>
            <li>New reports start as Pending Review and remain non-public.</li>
          </ul>

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div><strong>Category</strong><br />{form.category || '—'}</div>
              <div><strong>Images</strong><br />{images.length || 'Optional'}</div>
              <div><strong>Reference</strong><br />Generated on submit</div>
              <div><strong>Visibility</strong><br />Off by default</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
