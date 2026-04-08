import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-logo">
        <img src="/logo.svg" alt="EcoGuard" style={{ height: 36 }} />
      </NavLink>
      <div className="navbar-links">
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>Home</NavLink>
        <NavLink to="/login" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>Authority Login</NavLink>
      </div>
    </nav>
  )
}
