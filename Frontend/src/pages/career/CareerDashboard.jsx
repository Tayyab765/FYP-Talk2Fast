import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchProfile } from '../../api/career'
import './CareerDashboard.css'

const circumference = 2 * Math.PI * 38

const quickCards = [
  {
    title: 'Aptitude Questionnaire',
    desc: 'Complete your assessment to unlock personalised career recommendations.',
    icon: 'questionnaire',
    to: '/dashboard/career/questionnaire',
    accent: '#CD2B40',
    iconBg: '#fef2f2',
    cta: 'Continue',
  },
  {
    title: 'View Recommendations',
    desc: 'Explore degrees matched to your profile with fit scores and reasoning.',
    icon: 'recommend',
    to: '/dashboard/career/recommendations',
    accent: '#0d9488',
    iconBg: '#f0fdfa',
    cta: 'Explore',
  },
  {
    title: 'Profile Insight Chat',
    desc: 'Ask our AI why certain careers suit you and what skills to build.',
    icon: 'chat',
    to: '/dashboard/career/chat',
    accent: '#7c3aed',
    iconBg: '#f5f3ff',
    cta: 'Chat Now',
  },
  {
    title: 'Salary Insights',
    desc: 'Browse local and international pay scales, demand trends, and top roles.',
    icon: 'salary',
    to: '/dashboard/career/payscale',
    accent: '#d97706',
    iconBg: '#fffbeb',
    cta: 'View Data',
  },
]

/* ── Required keys used to compute completion ────────────────────────────── */
const REQUIRED_KEYS = [
  'qualification_type', 'study_stream', 'academic_performance', 'favorite_subjects',
  'enjoy_solving_logical_problems', 'like_working_with_computers', 'enjoy_creative_tasks',
  'like_analyzing_data', 'enjoy_understanding_systems', 'prefer_planning_over_execution',
  'enjoy_helping_people', 'curious_about_business', 'enjoy_research', 'like_learning_new_tools',
  'mathematical_skills', 'learn_programming_quickly', 'communicate_ideas_clearly',
  'problem_solving_under_pressure', 'comfortable_with_data', 'lead_team_effectively',
  'logical_reasoning', 'adapt_to_challenges', 'attention_to_detail', 'creative_problem_solving',
  'learning_preference', 'prefer_working_independently', 'enjoy_taking_responsibility',
  'remain_calm_under_pressure', 'like_structured_environments', 'comfortable_taking_risks',
  'prefer_routine', 'enjoy_interacting_with_people', 'motivated_by_long_term_goals',
  'like_abstract_problems', 'enjoy_practical_work', 'preferred_work_environment',
  'problem_solving_approach', 'career_motivation', 'exciting_work_type', 'continuous_learning_attitude',
]

/* ── Icons ──────────────────────────────────────────────────────────────── */
function CardIcon({ icon, color }) {
  const icons = {
    questionnaire: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    recommend: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    chat: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    salary: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  }
  return icons[icon] || null
}

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function CareerDashboard() {
  const [completionPct, setCompletionPct] = useState(0)
  const [hasProfile, setHasProfile] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
      .then(data => {
        const answers = data?.data?.answers
        if (answers) {
          const answered = REQUIRED_KEYS.filter(k => answers[k] !== undefined && answers[k] !== null).length
          const pct = Math.round((answered / REQUIRED_KEYS.length) * 100)
          setCompletionPct(pct)
          setHasProfile(true)
        }
        setProfileLoading(false)
      })
      .catch(() => {
        // No profile or error — show 0%
        setCompletionPct(0)
        setProfileLoading(false)
      })
  }, [])

  const dashOffset = circumference * (1 - completionPct / 100)

  return (
    <div className="career-dashboard">
      {/* Welcome Banner */}
      <div className="career-banner">
        <div className="career-banner-text">
          <h1>Welcome back, Student 👋</h1>
          <p>
            {hasProfile
              ? `Your profile is ${completionPct}% complete. Keep going to unlock better recommendations!`
              : 'Start your career journey by completing the aptitude questionnaire.'}
          </p>
        </div>
        <div className="career-banner-progress">
          <div className="progress-ring-wrap">
            <svg className="progress-ring-svg" viewBox="0 0 90 90">
              <circle className="progress-ring-bg" cx="45" cy="45" r="38" fill="none" strokeWidth="8" />
              <circle
                className="progress-ring-fill"
                cx="45" cy="45" r="38" fill="none" strokeWidth="8"
                strokeDasharray={`${circumference * (completionPct / 100)} ${circumference}`}
                strokeDashoffset="0"
              />
            </svg>
            <div className="progress-ring-label">
              <span className="progress-ring-pct">
                {profileLoading ? '…' : `${completionPct}%`}
              </span>
              <span className="progress-ring-sub">Done</span>
            </div>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>Profile Completed</span>
        </div>
      </div>

      {/* No profile CTA */}
      {!profileLoading && !hasProfile && (
        <div className="career-no-profile-banner">
          <span>📋</span>
          <span>You haven't completed the assessment yet.</span>
          <Link to="/dashboard/career/questionnaire" className="career-start-btn">
            Start Assessment →
          </Link>
        </div>
      )}

      {/* Quick Action Cards */}
      <p className="career-section-title">Quick Actions</p>
      <div className="career-cards-grid">
        {quickCards.map(card => (
          <Link
            key={card.title}
            to={card.to}
            className="career-card"
            style={{ '--card-accent': card.accent, '--card-icon-bg': card.iconBg }}
          >
            <div className="career-card-icon">
              <CardIcon icon={card.icon} color={card.accent} />
            </div>
            <div className="career-card-title">{card.title}</div>
            <div className="career-card-desc">{card.desc}</div>
            <div className="career-card-arrow">
              {card.cta} <ArrowIcon />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
