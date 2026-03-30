import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <p className="footer-copy">
        © 2024 Talk2FAST. National University of Computer and Emerging Sciences. All Rights Reserved.
      </p>
      <div className="footer-links">
        <Link to="/login">Privacy Policy</Link>
        <span className="dot">·</span>
        <Link to="/login">Terms of Service</Link>
        <span className="dot">·</span>
        <Link to="/login">Contact FAST</Link>
      </div>
    </footer>
  )
}
