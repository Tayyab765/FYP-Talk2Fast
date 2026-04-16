import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import './Sidebar.css'

const LOGO_ICON = (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="sidebar-logo-icon">
    <path d="M16 4L4 10v12l12 6 12-6V10L16 4z" fill="var(--primary)"/>
    <path d="M16 8l-6 3v8l6 3 6-3v-8l-6-3z" fill="white"/>
  </svg>
)

const careerSubNav = [
  { to: '/dashboard/career', label: 'Overview', exact: true },
  { to: '/dashboard/career/questionnaire', label: 'Questionnaire' },
  { to: '/dashboard/career/profile', label: 'My Profile' },
  { to: '/dashboard/career/recommendations', label: 'Recommendations' },
  { to: '/dashboard/career/chat', label: 'Profile Chatbot' },
  { to: '/dashboard/career/payscale', label: 'Salary Insights' },
]

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'grid', exact: true },
  { to: '/dashboard/chat', label: 'AI Chat Assistant', icon: 'chat' },
  { to: '/dashboard/mock-tests', label: 'Mock Tests', icon: 'doc' },
  { to: '/dashboard/analytics', label: 'Performance Analytics', icon: 'chart' },
  { to: '/dashboard/career', label: 'Career Counseling', icon: 'compass', hasChildren: true },
  { to: '/dashboard/settings', label: 'Settings', icon: 'gear' },
]

function NavIcon({ icon }) {
  const icons = {
    grid: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    chat: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    doc: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    chart: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    compass: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
      </svg>
    ),
    gear: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  }
  return icons[icon] || null
}

const ChevronDown = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', marginLeft: 'auto', opacity: 0.7 }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

export default function Sidebar() {
  const location = useLocation()
  const isCareerActive = location.pathname.startsWith('/dashboard/career')
  const [careerOpen, setCareerOpen] = useState(isCareerActive)

  return (
    <aside className="sidebar">
      <Link to="/dashboard" className="sidebar-logo">
        {LOGO_ICON}
        <span>Talk2FAST</span>
      </Link>
      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon, hasChildren, exact }) => {
          if (hasChildren) {
            return (
              <div key={to}>
                <button
                  className={`sidebar-link sidebar-link-btn${isCareerActive ? ' active' : ''}`}
                  onClick={() => setCareerOpen((v) => !v)}
                  type="button"
                >
                  <span className="sidebar-link-icon"><NavIcon icon={icon} /></span>
                  <span>{label}</span>
                  <ChevronDown open={careerOpen} />
                </button>
                {careerOpen && (
                  <div className="sidebar-subnav">
                    {careerSubNav.map(({ to: subTo, label: subLabel }) => (
                      <NavLink
                        key={subTo}
                        to={subTo}
                        end={subTo === '/dashboard/career'}
                        className={({ isActive }) => `sidebar-sublink${isActive ? ' active' : ''}`}
                      >
                        {subLabel}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          }
          return (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span className="sidebar-link-icon"><NavIcon icon={icon} /></span>
              <span>{label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
