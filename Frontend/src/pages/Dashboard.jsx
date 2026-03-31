import { Link } from 'react-router-dom'
import './Dashboard.css'

const featureCards = [
  {
    title: 'Ask AI Assistant',
    description: 'Get instant answers about university requirements, essay prompts, and campus life using our trained AI model.',
    buttonText: 'Start Conversation',
    icon: 'sparkle',
    to: '/dashboard/chat',
  },
  {
    title: 'Start Mock Test',
    description: 'Practice with simulated SAT, ACT, or institutional entrance exams tailored to your target universities.',
    buttonText: 'Take Practice Exam',
    icon: 'play',
    to: '/dashboard/mock-tests',
  },
  {
    title: 'View Recommendations',
    description: 'Analyze your profile to see top-matching universities based on your grades, interests, and budget.',
    buttonText: 'Browse Matches',
    icon: 'target',
    to: '/dashboard/analytics',
  },
]

const weekData = [
  { day: 'Mon', value: 65 },
  { day: 'Tue', value: 72 },
  { day: 'Wed', value: 68 },
  { day: 'Thu', value: 85 },
  { day: 'Fri', value: 78 },
  { day: 'Sat', value: 90 },
  { day: 'Sun', value: 85 },
]

export default function Dashboard() {
  const maxVal = Math.max(...weekData.map((d) => d.value))

  return (
    <div className="dashboard-page">
      <section className="welcome-section">
        <h1 className="welcome-title">Welcome back, Student</h1>
        <p className="welcome-subtitle">Manage your admission preparation from one place.</p>

        <div className="feature-cards">
          {featureCards.map((card) => (
            <div key={card.title} className="feature-card">
              <div className={`feature-icon feature-icon-${card.icon}`}>
                {card.icon === 'sparkle' && (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 3 14 9 21 9 16 13 18 19 12 15 6 19 8 13 3 9 10 9 12 3"/>
                  </svg>
                )}
                {card.icon === 'play' && (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
                  </svg>
                )}
                {card.icon === 'target' && (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="6"/>
                    <circle cx="12" cy="12" r="2"/>
                  </svg>
                )}
              </div>
              <h3 className="feature-card-title">{card.title}</h3>
              <p className="feature-card-desc">{card.description}</p>
              <Link to={card.to} className="feature-card-btn">
                {card.buttonText}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="performance-section">
        <div className="section-header">
          <h2 className="section-title">Performance Summary</h2>
          <Link to="/dashboard/analytics" className="section-link">View Detailed Report</Link>
        </div>

        <div className="performance-grid">
          <div className="chart-card">
            <h3 className="chart-title">Preparation Consistency</h3>
            <p className="chart-subtitle">Daily accuracy scores across all practice sessions this week</p>
            <div className="bar-chart">
              {weekData.map(({ day, value }) => (
                <div key={day} className="bar-group">
                  <div
                    className="bar"
                    style={{ height: `${(value / maxVal) * 100}%` }}
                    title={`${value}%`}
                  />
                  <span className="bar-label">{day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="readiness-card">
            <h3 className="chart-title">Overall Readiness</h3>
            <p className="chart-subtitle">Estimated admission probability</p>
            <div className="readiness-circle-wrap">
              <svg className="readiness-circle" viewBox="0 0 120 120">
                <circle
                  className="readiness-bg"
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="12"
                />
                <circle
                  className="readiness-fill"
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="12"
                  strokeDasharray={`${78 * (327 / 100)} 327`}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="readiness-value">
                <span className="readiness-num">78%</span>
                <span className="readiness-label">READY</span>
              </div>
            </div>
            <div className="readiness-meta">
              <span><strong>TARGET</strong> 90%</span>
              <span className="readiness-current"><strong>CURRENT</strong> 78%</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
