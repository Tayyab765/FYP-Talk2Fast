import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchProfile } from '../../api/career'
import './CareerProfile.css'

/* ── Icon Components ─────────────────────────────────────────────────────── */
function AcadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  )
}
function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}
function WorkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}
function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

/* ── Label Maps (readable labels for coded values) ──────────────────────── */
const QUALIFICATION_LABELS = {
  local_board: 'Matric + Intermediate (FSc/FA/ICS/ICom)',
  alevels: 'O-Levels + A-Levels',
  other: 'Other Equivalent Qualification',
}
const STREAM_LABELS = {
  pre_engineering: 'Pre-Engineering (Physics, Chemistry, Math)',
  pre_medical: 'Pre-Medical (Biology, Physics, Chemistry)',
  ics: 'ICS (Computer Science)',
  icom: 'ICom (Commerce)',
  fa: 'FA (Arts / Humanities)',
  alevel_science: 'A-Levels (Sciences)',
  alevel_business: 'A-Levels (Business / Commerce)',
  other: 'Other',
}
const PERFORMANCE_LABELS = {
  excellent: 'Excellent (85%+ / A & A*)',
  good: 'Good (70–84% / B)',
  average: 'Average (55–69% / C)',
  below_average: 'Below Average (<55% / D or below)',
}
const SUBJECT_LABELS = {
  mathematics: 'Mathematics', physics: 'Physics', computer_science: 'Computer Science / IT',
  biology: 'Biology', chemistry: 'Chemistry', business_studies: 'Business Studies',
  economics: 'Economics', accounting: 'Accounting', english: 'English', arts_design: 'Arts / Design',
}
const SCALE_LABELS_INTEREST = { 1: 'Strongly Disagree', 2: 'Disagree', 3: 'Neutral', 4: 'Agree', 5: 'Strongly Agree' }
const SCALE_LABELS_SKILL = { 1: 'Very Weak', 2: 'Weak', 3: 'Average', 4: 'Strong', 5: 'Very Strong' }
const ENV_LABELS = { office: 'Office-based', lab: 'Lab / Technical', remote: 'Flexible / Remote', field: 'Field / Hands-on' }
const MOTIVATION_LABELS = { high_salary: 'High Salary', job_stability: 'Job Stability', learning_growth: 'Learning & Growth', leadership: 'Leadership & Influence' }
const ATTITUDE_LABELS = { enjoy_pursue: 'Actively pursue continuous learning', accept_if_required: 'Accept it if required', prefer_stable: 'Prefer stable skill requirements' }
const ROLE_LABELS = {
  software_engineer: 'Software Engineer', data_analyst: 'Data Analyst', ai_engineer: 'AI Engineer',
  electrical_engineer: 'Electrical Engineer', business_manager: 'Business Manager',
  entrepreneur: 'Entrepreneur', researcher: 'Researcher',
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function getScaleBar(value, max = 5) {
  return (
    <div className="cp-scale-bar-wrap">
      {[1, 2, 3, 4, 5].map(n => (
        <div key={n} className={`cp-scale-dot${n <= value ? ' active' : ''}`} />
      ))}
      <span className="cp-scale-num">{value}/{max}</span>
    </div>
  )
}

function SectionSkeleton() {
  return (
    <div className="profile-card">
      <div className="profile-card-header">
        <div className="skeleton-line" style={{ width: '40%', height: '18px' }} />
      </div>
      <div className="profile-card-body">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-line" style={{ width: `${70 - i * 10}%`, height: '14px', marginBottom: '0.75rem' }} />
        ))}
      </div>
    </div>
  )
}

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function CareerProfile() {
  const [profile, setProfile] = useState(null)    // answers object
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProfile()
      .then(data => {
        // Backend: { success, data: { answers: {...}, ... } }  OR  { success, data: null }
        setProfile(data?.data?.answers || data?.data?.profile || data?.data || null)
        setLoading(false)
      })
      .catch(err => {
        // 404 = no profile yet — not a real error
        if (err.message?.includes('404') || err.message?.toLowerCase().includes('not found')) {
          setProfile(null)
        } else {
          setError(err.message || 'Failed to load profile.')
        }
        setLoading(false)
      })
  }, [])

  /* ── Compute completion % ───────────────────────────────────────────────── */
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
  const completionPct = profile
    ? Math.round((REQUIRED_KEYS.filter(k => profile[k] !== undefined && profile[k] !== null).length / REQUIRED_KEYS.length) * 100)
    : 0

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="career-profile-page">
      {/* Header */}
      <div className="profile-page-header">
        <div>
          <div className="profile-page-title">My Career Profile</div>
          <div className="profile-page-subtitle">Your saved assessment answers — retake to update.</div>
        </div>
        <div className="profile-completion-bar">
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Profile</span>
          <div className="profile-completion-track">
            <div className="profile-completion-fill" style={{ width: `${completionPct}%` }} />
          </div>
          <span className="profile-completion-text">{completionPct}% complete</span>
        </div>
      </div>

      {/* Edit CTA */}
      <div className="profile-cta-row">
        <Link to="/dashboard/career/questionnaire" className="profile-edit-cta">
          <EditIcon /> Retake Assessment
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="profile-grid">
          <SectionSkeleton />
          <SectionSkeleton />
          <SectionSkeleton />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="profile-error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* No profile */}
      {!loading && !error && !profile && (
        <div className="profile-empty-state">
          <div className="profile-empty-icon">📋</div>
          <div className="profile-empty-title">No Profile Yet</div>
          <div className="profile-empty-desc">
            Complete the aptitude questionnaire to build your career profile and unlock AI-powered recommendations.
          </div>
          <Link to="/dashboard/career/questionnaire" className="q-btn q-btn-next" style={{ textDecoration: 'none', marginTop: '1rem' }}>
            Start Assessment
          </Link>
        </div>
      )}

      {/* Profile summary */}
      {!loading && !error && profile && (
        <div className="profile-grid">

          {/* ── Academic Background ─────────────────────────────────────────── */}
          <div className="profile-card">
            <div className="profile-card-header">
              <div className="profile-card-title">
                <div className="profile-card-icon"><AcadIcon /></div>
                Academic Background
              </div>
            </div>
            <div className="profile-card-body">
              <div className="profile-summary-grid">
                <div className="cp-summary-item">
                  <span className="cp-item-label">Qualification</span>
                  <span className="cp-item-value">{QUALIFICATION_LABELS[profile.qualification_type] || profile.qualification_type || '—'}</span>
                </div>
                <div className="cp-summary-item">
                  <span className="cp-item-label">Study Stream</span>
                  <span className="cp-item-value">{STREAM_LABELS[profile.study_stream] || profile.study_stream || '—'}</span>
                </div>
                <div className="cp-summary-item">
                  <span className="cp-item-label">Academic Performance</span>
                  <span className="cp-item-value">{PERFORMANCE_LABELS[profile.academic_performance] || profile.academic_performance || '—'}</span>
                </div>
                {profile.favorite_subjects?.length > 0 && (
                  <div className="cp-summary-item cp-full-width">
                    <span className="cp-item-label">Favourite Subjects</span>
                    <div className="cp-chip-row">
                      {profile.favorite_subjects.map(s => (
                        <span key={s} className="cp-chip">{SUBJECT_LABELS[s] || s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Interests ──────────────────────────────────────────────────── */}
          <div className="profile-card">
            <div className="profile-card-header">
              <div className="profile-card-title">
                <div className="profile-card-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}><StarIcon /></div>
                Interests
              </div>
            </div>
            <div className="profile-card-body">
              <div className="cp-scale-list">
                {[
                  ['enjoy_solving_logical_problems', 'Logical / Mathematical problems'],
                  ['like_working_with_computers', 'Working with computers & technology'],
                  ['enjoy_creative_tasks', 'Creative tasks (design, writing, ideation)'],
                  ['like_analyzing_data', 'Analyzing data for patterns'],
                  ['enjoy_understanding_systems', 'Understanding how systems work'],
                  ['enjoy_helping_people', 'Helping / guiding people'],
                  ['curious_about_business', 'Business growth & strategy'],
                  ['enjoy_research', 'Research & deep exploration'],
                ].map(([key, label]) => profile[key] !== undefined && (
                  <div key={key} className="cp-scale-row">
                    <span className="cp-scale-label">{label}</span>
                    {getScaleBar(profile[key])}
                  </div>
                ))}
              </div>
              {profile.hobbies?.length > 0 && (
                <div className="cp-summary-item cp-full-width" style={{ marginTop: '1rem' }}>
                  <span className="cp-item-label">Hobbies</span>
                  <div className="cp-chip-row">
                    {profile.hobbies.map(h => <span key={h} className="cp-chip">{h}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Skills ─────────────────────────────────────────────────────── */}
          <div className="profile-card">
            <div className="profile-card-header">
              <div className="profile-card-title">
                <div className="profile-card-icon" style={{ background: '#f0fdfa', color: '#0d9488' }}><BoltIcon /></div>
                Skills & Strengths
              </div>
            </div>
            <div className="profile-card-body">
              <div className="cp-scale-list">
                {[
                  ['mathematical_skills', 'Mathematical Skills'],
                  ['learn_programming_quickly', 'Learn Programming / Tech Quickly'],
                  ['communicate_ideas_clearly', 'Clear Communication'],
                  ['problem_solving_under_pressure', 'Problem-Solving Under Pressure'],
                  ['comfortable_with_data', 'Data & Statistics'],
                  ['lead_team_effectively', 'Team Leadership'],
                  ['logical_reasoning', 'Logical Reasoning'],
                  ['adapt_to_challenges', 'Adaptability'],
                  ['attention_to_detail', 'Attention to Detail'],
                  ['creative_problem_solving', 'Creative Problem-Solving'],
                ].map(([key, label]) => profile[key] !== undefined && (
                  <div key={key} className="cp-scale-row">
                    <span className="cp-scale-label">{label}</span>
                    {getScaleBar(profile[key])}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Work Style & Preferences ────────────────────────────────────── */}
          <div className="profile-card">
            <div className="profile-card-header">
              <div className="profile-card-title">
                <div className="profile-card-icon" style={{ background: '#fffbeb', color: '#d97706' }}><WorkIcon /></div>
                Work Style & Preferences
              </div>
            </div>
            <div className="profile-card-body">
              <div className="profile-summary-grid">
                {profile.preferred_work_environment && (
                  <div className="cp-summary-item">
                    <span className="cp-item-label">Work Environment</span>
                    <span className="cp-item-value">{ENV_LABELS[profile.preferred_work_environment] || profile.preferred_work_environment}</span>
                  </div>
                )}
                {profile.career_motivation && (
                  <div className="cp-summary-item">
                    <span className="cp-item-label">Career Motivation</span>
                    <span className="cp-item-value">{MOTIVATION_LABELS[profile.career_motivation] || profile.career_motivation}</span>
                  </div>
                )}
                {profile.continuous_learning_attitude && (
                  <div className="cp-summary-item cp-full-width">
                    <span className="cp-item-label">Continuous Learning</span>
                    <span className="cp-item-value">{ATTITUDE_LABELS[profile.continuous_learning_attitude] || profile.continuous_learning_attitude}</span>
                  </div>
                )}
                {profile.appealing_role && (
                  <div className="cp-summary-item">
                    <span className="cp-item-label">Dream Role</span>
                    <span className="cp-item-value">{ROLE_LABELS[profile.appealing_role] || profile.appealing_role}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
