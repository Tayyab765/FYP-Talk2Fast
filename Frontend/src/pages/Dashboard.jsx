import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getHistory, getPerformance } from '../api/mockTestApi'
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

export default function Dashboard() {
  const { userName } = useAuth()
  const [dashboardData, setDashboardData] = useState({
    recentScores: [],
    overallReadiness: 0,
    totalAttempts: 0,
    averageScore: 0,
    isLoading: true
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      console.log('🔄 Fetching dashboard data...')
      
      const [historyData, performanceData] = await Promise.all([
        getHistory(),
        getPerformance()
      ])

      console.log('📊 History Data:', historyData)
      console.log('📈 Performance Data:', performanceData)

      // Check if we have attempts
      if (!historyData || !historyData.attempts || historyData.attempts.length === 0) {
        console.log('⚠️ No test attempts found')
        setDashboardData({
          recentScores: [{ day: 'No Data', value: 0 }],
          overallReadiness: 0,
          totalAttempts: 0,
          averageScore: 0,
          highestScore: 0,
          lastAttemptDays: 0,
          isLoading: false
        })
        return
      }

      // Get last 7 attempts for the chart
      const recentAttempts = historyData.attempts.slice(0, 7).reverse()
      const recentScores = recentAttempts.map((attempt, index) => ({
        day: `Test ${index + 1}`,
        value: attempt.percentage || 0
      }))

      console.log('📊 Recent Scores:', recentScores)

      // Calculate overall readiness (average of recent performance)
      const overallReadiness = performanceData?.overallStats?.averageScore || 0

      // Calculate days since last test
      let lastAttemptDays = 0
      if (historyData.attempts.length > 0) {
        const lastAttempt = new Date(historyData.attempts[0].completedAt)
        const today = new Date()
        lastAttemptDays = Math.floor((today - lastAttempt) / (1000 * 60 * 60 * 24))
      }

      const newData = {
        recentScores: recentScores.length > 0 ? recentScores : [{ day: 'No Data', value: 0 }],
        overallReadiness: Math.round(overallReadiness),
        totalAttempts: performanceData?.overallStats?.totalAttempts || 0,
        averageScore: performanceData?.overallStats?.averageScore || 0,
        highestScore: performanceData?.overallStats?.highestScore || 0,
        lastAttemptDays: lastAttemptDays,
        isLoading: false
      }

      console.log('✅ Setting dashboard data:', newData)
      setDashboardData(newData)
    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error)
      console.error('Error details:', error.message, error.stack)
      // Set default empty data on error
      setDashboardData({
        recentScores: [{ day: 'No Data', value: 0 }],
        overallReadiness: 0,
        totalAttempts: 0,
        averageScore: 0,
        highestScore: 0,
        lastAttemptDays: 0,
        isLoading: false
      })
    }
  }

  const maxVal = dashboardData.recentScores.length > 0 
    ? Math.max(...dashboardData.recentScores.map((d) => d.value), 1)
    : 100

  return (
    <div className="dashboard-page">
      <section className="welcome-section">
        <h1 className="welcome-title">Welcome back, {userName || 'Student'}</h1>
        <p className="welcome-subtitle">
          {dashboardData.totalAttempts > 0 
            ? `You've completed ${dashboardData.totalAttempts} test${dashboardData.totalAttempts > 1 ? 's' : ''} with an average score of ${dashboardData.averageScore.toFixed(1)}%`
            : 'Manage your admission preparation from one place.'}
        </p>

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
          <Link to="/dashboard/mock-tests/analytics" className="section-link">View Detailed Report</Link>
        </div>

        {/* Loading State */}
        {dashboardData.isLoading && (
          <div className="dashboard-loading">
            <div className="spinner"></div>
            <p>Loading your performance data...</p>
          </div>
        )}

        {/* Quick Stats Cards */}
        {!dashboardData.isLoading && dashboardData.totalAttempts > 0 && (
          <div className="quick-stats">
            <div className="quick-stat-card">
              <div className="quick-stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{dashboardData.totalAttempts}</div>
                <div className="quick-stat-label">Tests Completed</div>
              </div>
            </div>

            <div className="quick-stat-card">
              <div className="quick-stat-icon quick-stat-icon-success">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{dashboardData.highestScore}</div>
                <div className="quick-stat-label">Highest Score</div>
              </div>
            </div>

            <div className="quick-stat-card">
              <div className="quick-stat-icon quick-stat-icon-warning">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{dashboardData.averageScore.toFixed(0)}%</div>
                <div className="quick-stat-label">Average Score</div>
              </div>
            </div>

            <div className="quick-stat-card">
              <div className="quick-stat-icon quick-stat-icon-info">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{dashboardData.lastAttemptDays}</div>
                <div className="quick-stat-label">Days Since Last Test</div>
              </div>
            </div>
          </div>
        )}

        {!dashboardData.isLoading && (
          <div className="performance-grid">
          <div className="chart-card">
            <h3 className="chart-title">Recent Test Performance</h3>
            <p className="chart-subtitle">
              {dashboardData.totalAttempts > 0 
                ? `Your last ${Math.min(dashboardData.recentScores.length, 7)} test scores`
                : 'Take tests to see your performance'}
            </p>
            <div className="bar-chart">
              {dashboardData.recentScores.map(({ day, value }) => (
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
            <h3 className="chart-title">Overall Performance</h3>
            <p className="chart-subtitle">
              {dashboardData.totalAttempts > 0 
                ? 'Your average test score'
                : 'Take tests to track progress'}
            </p>
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
                  strokeDasharray={`${dashboardData.overallReadiness * (327 / 100)} 327`}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="readiness-value">
                <span className="readiness-num">{dashboardData.overallReadiness}%</span>
                <span className="readiness-label">
                  {dashboardData.overallReadiness >= 80 ? 'EXCELLENT' : 
                   dashboardData.overallReadiness >= 60 ? 'GOOD' : 
                   dashboardData.overallReadiness > 0 ? 'IMPROVING' : 'START'}
                </span>
              </div>
            </div>
            <div className="readiness-meta">
              <span><strong>TARGET</strong> 90%</span>
              <span className="readiness-current"><strong>CURRENT</strong> {dashboardData.overallReadiness}%</span>
            </div>
          </div>
        </div>
        )}
      </section>
    </div>
  )
}
