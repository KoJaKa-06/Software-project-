import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'
import SceneBg from '../components/SceneBg'

export default function AuthLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    try {
      const data = await login(email, password)
      localStorage.setItem('ecoguard_token', data.access_token)
      localStorage.setItem('ecoguard_officer', data.officer_name)
      navigate('/authority')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="login-page page-with-scene">
      <div className="scene-bg"><SceneBg variant="snow" /></div>
      <div className="login-info">
        <h2>Authority Login</h2>
        <p>Secure access for authority officers to review reports, assign urgency, manage visibility, and publish public notes.</p>
        <ul>
          <li>Review all reports</li>
          <li>Approve or reject submissions</li>
          <li>Assign urgency and public notes</li>
          <li>Control public visibility</li>
        </ul>
      </div>

      <div className="card login-form">
        <h3>Officer Sign In</h3>
        {error && <div style={{ background: '#fef2f2', color: '#991b1b', padding: '0.6rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Officer ID or Email</label>
            <input type="email" placeholder="authority@ifrane.ma" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary">Login</button>
        </form>

        <div className="hint">Authorized regional staff only</div>
        <div className="hint" style={{ marginTop: '0.5rem', background: '#f0fdf4', padding: '0.5rem', borderRadius: '6px' }}>
          <strong>Demo credentials:</strong><br />
          authority@ifrane.ma / admin123
        </div>
      </div>
    </div>
  )
}
