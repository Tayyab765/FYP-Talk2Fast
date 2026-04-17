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
    title: 'Career Counseling',
    description: 'Get personalized career recommendations based on your interests, skills, and academic performance.',
    buttonText: 'Explore Careers',
    icon: 'target',
    to: '/dashboard/career',
  },
]

// Helper function to calculate study streak
function calculateStudyStreak(attempts) {
  if (!attempts || attempts.length === 0) {
    return { currentStreak: 0, longestStreak: 0 }
  }

  const sortedAttempts = [...attempts].sort((a, b) => 
    new Date(b.completedAt) - new Date(a.completedAt)
  )

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  let lastDate = null

  for (const attempt of sortedAttempts) {
    const attemptDate = new Date(attempt.completedAt)
    attemptDate.setHours(0, 0, 0, 0)

    if (!lastDate) {
      tempStreak = 1
      currentStreak = 1
    } else {
      const daysDiff = Math.floor((lastDate - attemptDate) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === 1) {
        tempStreak++
        if (currentStreak > 0) currentStreak++
      } else if (daysDiff > 1) {
        currentStreak = 0
        tempStreak = 1
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak)
    lastDate = attemptDate
  }

  // Check if streak is still active (last test within 1 day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const lastTestDate = new Date(sortedAttempts[0].completedAt)
  lastTestDate.setHours(0, 0, 0, 0)
  const daysSinceLastTest = Math.floor((today - lastTestDate) / (1000 * 60 * 60 * 24))
  
  if (daysSinceLastTest > 1) {
    currentStreak = 0
  }

  return { currentStreak, longestStreak }
}

// Helper function to generate recommended actions
function generateRecommendedActions(attempts, weakTopics, daysSinceLastTest, overallStats) {
  const actions = []

  // Action based on days since last test
  if (daysSinceLastTest === 0) {
    actions.push({
      icon: '🎉',
      text: 'Great job testing today! Review your results to identify areas for improvement.',
      action: 'View Results',
      link: '/dashboard/mock-tests/analytics'
    })
  } else if (daysSinceLastTest >= 3) {
    actions.push({
      icon: '⏰',
      text: `It's been ${daysSinceLastTest} days since your last test. Time to practice!`,
      action: 'Take Test',
      link: '/dashboard/mock-tests'
    })
  } else if (daysSinceLastTest === 1) {
    actions.push({
      icon: '🔥',
      text: 'Keep your streak alive! Take another test today.',
      action: 'Start Test',
      link: '/dashboard/mock-tests'
    })
  }

  // Action based on weak topics
  if (weakTopics.length > 0) {
    actions.push({
      icon: '📚',
      text: `Focus on ${weakTopics[0].topic} - your accuracy is ${weakTopics[0].accuracy.toFixed(0)}%`,
      action: 'Practice',
      link: '/dashboard/mock-tests'
    })
  }

  // Action based on performance
  if (overallStats?.averageScore < 60) {
    actions.push({
      icon: '💪',
      text: 'Start with Easy tests to build confidence and fundamentals.',
      action: 'Take Easy Test',
      link: '/dashboard/mock-tests'
    })
  } else if (overallStats?.averageScore >= 60 && overallStats?.averageScore < 80) {
    actions.push({
      icon: '🎯',
      text: 'You\'re doing well! Try Medium tests to challenge yourself.',
      action: 'Take Medium Test',
      link: '/dashboard/mock-tests'
    })
  } else if (overallStats?.averageScore >= 80) {
    actions.push({
      icon: '🚀',
      text: 'Excellent progress! Ready for Hard tests?',
      action: 'Take Hard Test',
      link: '/dashboard/mock-tests'
    })
  }

  // Action to view analytics
  if (attempts.length >= 3) {
    actions.push({
      icon: '📊',
      text: 'Check your detailed analytics to track improvement trends.',
      action: 'View Analytics',
      link: '/dashboard/mock-tests/analytics'
    })
  }

  return actions.slice(0, 3) // Return top 3 actions
}

// Helper function to generate activity feed
function generateActivityFeed(attempts) {
  if (!attempts || attempts.length === 0) return []

  const activities = attempts.slice(0, 5).map(attempt => {
    const date = new Date(attempt.completedAt)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    let timeAgo
    if (diffMins < 60) {
      timeAgo = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else if (diffDays === 1) {
      timeAgo = 'Yesterday'
    } else if (diffDays < 7) {
      timeAgo = `${diffDays} days ago`
    } else {
      timeAgo = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const emoji = attempt.percentage >= 80 ? '🎉' : 
                  attempt.percentage >= 60 ? '📝' : '📚'

    return {
      icon: emoji,
      text: `Completed ${attempt.testTitle} - ${attempt.percentage.toFixed(0)}%`,
      timeAgo,
      attemptId: attempt.attemptId
    }
  })

  return activities
}

export default function Dashboard() {
  const { userName } = useAuth()
  const [dashboardData, setDashboardData] = useState({
    recentScores: [],
    overallReadiness: 0,
    totalAttempts: 0,
    averageScore: 0,
    highestScore: 0,
    lastAttemptDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    weakTopics: [],
    recommendedActions: [],
    activityFeed: [],
    progressToGoal: 0,
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

      // Calculate study streak
      const { currentStreak, longestStreak } = calculateStudyStreak(historyData.attempts)

      // Get weak topics (top 3)
      const weakTopics = performanceData?.topicWisePerformance
        ?.filter(t => t.category === 'weak')
        .slice(0, 3) || []

      // Generate recommended actions
      const recommendedActions = generateRecommendedActions(
        historyData.attempts,
        weakTopics,
        lastAttemptDays,
        performanceData?.overallStats
      )

      // Generate activity feed (last 5 activities)
      const activityFeed = generateActivityFeed(historyData.attempts)

      // Calculate progress towards 90% goal
      const targetScore = 90
      const currentAvg = performanceData?.overallStats?.averageScore || 0
      const progressToGoal = Math.min(Math.round((currentAvg / targetScore) * 100), 100)

      const newData = {
        recentScores: recentScores.length > 0 ? recentScores : [{ day: 'No Data', value: 0 }],
        overallReadiness: Math.round(overallReadiness),
        totalAttempts: performanceData?.overallStats?.totalAttempts || 0,
        averageScore: performanceData?.overallStats?.averageScore || 0,
        highestScore: performanceData?.overallStats?.highestScore || 0,
        lastAttemptDays: lastAttemptDays,
        currentStreak,
        longestStreak,
        weakTopics,
        recommendedActions,
        activityFeed,
        progressToGoal,
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
        currentStreak: 0,
        longestStreak: 0,
        weakTopics: [],
        recommendedActions: [],
        activityFeed: [],
        progressToGoal: 0,
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

            <div className="quick-stat-card">
              <div className="quick-stat-icon quick-stat-icon-fire">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2c1.5 4 4 6 7 7-3 1-5.5 3-7 7-1.5-4-4-6-7-7 3-1 5.5-3 7-7z" />
                </svg>
              </div>
              <div className="quick-stat-content">
                <div className="quick-stat-value">{dashboardData.currentStreak} 🔥</div>
                <div className="quick-stat-label">Day Streak</div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Feed */}
        {!dashboardData.isLoading && dashboardData.activityFeed.length > 0 && (
          <div className="activity-feed-section">
            <h3 className="section-subtitle">Recent Activity</h3>
            <div className="activity-feed">
              {dashboardData.activityFeed.map((activity, index) => (
                <div key={index} className="activity-item">
                  <span className="activity-icon">{activity.icon}</span>
                  <div className="activity-content">
                    <p className="activity-text">{activity.text}</p>
                    <span className="activity-time">{activity.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weak Topics Alert */}
        {!dashboardData.isLoading && dashboardData.weakTopics.length > 0 && (
          <div className="weak-topics-alert">
            <div className="alert-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3>Topics Needing Attention</h3>
            </div>
            <div className="weak-topics-list">
              {dashboardData.weakTopics.map((topic, index) => (
                <div key={index} className="weak-topic-item">
                  <div className="topic-info">
                    <span className="topic-rank">{index + 1}</span>
                    <span className="topic-name">{topic.topic}</span>
                  </div>
                  <span className="topic-accuracy">{topic.accuracy.toFixed(0)}% accuracy</span>
                </div>
              ))}
            </div>
            <Link to="/dashboard/mock-tests" className="alert-action-btn">
              Practice These Topics
            </Link>
          </div>
        )}

        {/* Recommended Actions */}
        {!dashboardData.isLoading && dashboardData.recommendedActions.length > 0 && (
          <div className="recommended-actions-section">
            <h3 className="section-subtitle">Recommended for You</h3>
            <div className="recommended-actions">
              {dashboardData.recommendedActions.map((action, index) => (
                <div key={index} className="action-card">
                  <span className="action-icon">{action.icon}</span>
                  <p className="action-text">{action.text}</p>
                  <Link to={action.link} className="action-btn">
                    {action.action}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Towards Goal */}
        {!dashboardData.isLoading && dashboardData.totalAttempts > 0 && (
          <div className="progress-goal-section">
            <h3 className="section-subtitle">Progress Towards Goal</h3>
            <div className="progress-goal-card">
              <div className="progress-info">
                <div className="progress-labels">
                  <span className="progress-label">Target: 90%</span>
                  <span className="progress-label">Current: {dashboardData.averageScore.toFixed(0)}%</span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${dashboardData.progressToGoal}%` }}
                  />
                </div>
                <p className="progress-message">
                  {dashboardData.progressToGoal >= 100 
                    ? '🎉 Goal achieved! Set a new target!' 
                    : `You're ${dashboardData.progressToGoal}% of the way there! Keep going! 💪`}
                </p>
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
