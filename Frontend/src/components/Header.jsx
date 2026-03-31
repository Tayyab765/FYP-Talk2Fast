import { Link, useLocation } from 'react-router-dom'
import './Header.css'

const LOGO_ICON = (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-icon">
    <path d="M16 4L4 10v12l12 6 12-6V10L16 4z" fill="var(--primary)"/>
    <path d="M16 8l-6 3v8l6 3 6-3v-8l-6-3z" fill="white"/>
  </svg>
)

export default function Header() {
  const location = useLocation()
  const isSignup = location.pathname === '/signup'

  return (
    <header className="header">
      <Link to="/login" className="logo">
        {LOGO_ICON}
        <div className="logo-text">
          <span className="logo-name">Talk2FAST</span>
          <span className="logo-tagline">ADMISSION ASSISTANT</span>
        </div>
      </Link>
      <nav className="nav-links">
        {isSignup ? (
          <>
            <Link to="/login">Home</Link>
            <Link to="/login">Admissions</Link>
            <Link to="/login">Contact</Link>
          </>
        ) : (
          <>
            <Link to="/login">How it works</Link>
            <Link to="/login">Programs</Link>
            <Link to="/login">Support</Link>
          </>
        )}
      </nav>
      <Link
        to={isSignup ? '/login' : '/signup'}
        className="header-cta"
      >
        {isSignup ? 'Login' : 'Apply Now'}
      </Link>
    </header>
  )
}
