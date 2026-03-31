import './DashboardHeader.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { clearAccessToken } from '../utils/tokenStorage'

function getInitials(name) {
  if (!name) return 'ST'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last || first).toUpperCase()
}

export default function DashboardHeader() {
  const navigate = useNavigate()
  const { userName, setUserName } = useAuth()
  const displayName = userName || 'Student'
  const initials = getInitials(displayName)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    clearAccessToken()
    setUserName('')
    setMenuOpen(false)
    navigate('/login')
  }

  return (
    <header className="dashboard-header">
      <span className="intake-tag">Fall 2024 Intake</span>
      <div className="dashboard-header-right">
        <button type="button" className="icon-btn" aria-label="Notifications">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
        <div
          className="user-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            <span className="user-role">Student</span>
          </div>
          <div className="user-avatar">{initials}</div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          {menuOpen && (
            <div className="user-menu-dropdown">
              <button type="button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
