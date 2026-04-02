import { useState } from 'react'
import './Recommendations.css'

const CATEGORY_DATA = {
  'Top Matches': [
    {
      degree: 'BS Computer Science',
      field: 'Technology',
      match: 92,
      color: '#CD2B40',
      reasoning: 'Your strong analytical skills, interest in technology, and high mathematics scores closely align with this field.',
      eligibility: 'eligible',
      details: { duration: '4 Years', salaryAvg: 'PKR 80k–150k/mo', demand: 'Very High', universities: 'FAST, LUMS, GIKI' },
    },
    {
      degree: 'BS Software Engineering',
      field: 'Technology',
      match: 88,
      color: '#7c3aed',
      reasoning: 'Problem-solving aptitude combined with your logical reasoning profile makes this an excellent fit.',
      eligibility: 'eligible',
      details: { duration: '4 Years', salaryAvg: 'PKR 75k–140k/mo', demand: 'Very High', universities: 'UET, NUST, ITU' },
    },
    {
      degree: 'BS Data Science',
      field: 'Technology',
      match: 84,
      color: '#0d9488',
      reasoning: 'Your quantitative background and research interest make data science a great emerging field for you.',
      eligibility: 'conditional',
      details: { duration: '4 Years', salaryAvg: 'PKR 90k–180k/mo', demand: 'High', universities: 'LUMS, IBA, Habib' },
    },
  ],
  'Alternative Options': [
    {
      degree: 'BS Electrical Engineering',
      field: 'Engineering',
      match: 76,
      color: '#d97706',
      reasoning: 'Strong physics and math results suggest you could excel in EE, though it requires extra dedication.',
      eligibility: 'eligible',
      details: { duration: '4 Years', salaryAvg: 'PKR 70k–130k/mo', demand: 'High', universities: 'UET, NUST, PIEAS' },
    },
    {
      degree: 'BBA Marketing',
      field: 'Business',
      match: 68,
      color: '#7c3aed',
      reasoning: 'Your communication preference score is moderate. Business studies remain a solid alternative.',
      eligibility: 'eligible',
      details: { duration: '4 Years', salaryAvg: 'PKR 50k–100k/mo', demand: 'Moderate', universities: 'IBA, LUMS, CBM' },
    },
  ],
  'Emerging Fields': [
    {
      degree: 'BS Artificial Intelligence',
      field: 'Technology',
      match: 81,
      color: '#0d9488',
      reasoning: 'AI is a rapidly growing field that matches your analytical aptitude and innovation interest.',
      eligibility: 'conditional',
      details: { duration: '4 Years', salaryAvg: 'PKR 100k–200k/mo', demand: 'Very High', universities: 'NUCES, NUST, KICS' },
    },
    {
      degree: 'BS Cybersecurity',
      field: 'Technology',
      match: 77,
      color: '#CD2B40',
      reasoning: 'Growing demand for cybersecurity professionals. Your logical profile fits this niche field well.',
      eligibility: 'eligible',
      details: { duration: '4 Years', salaryAvg: 'PKR 80k–160k/mo', demand: 'High', universities: 'FAST, GIKI, Air Uni' },
    },
  ],
}

const FILTERS = ['All Fields', 'Technology', 'Engineering', 'Business']
const circumference = 2 * Math.PI * 24

function EligBadge({ status }) {
  const map = {
    eligible: { label: '✓ Eligible', cls: 'eligible' },
    conditional: { label: '⚠ Conditional', cls: 'conditional' },
    ineligible: { label: '✗ Not Eligible', cls: 'ineligible' },
  }
  const { label, cls } = map[status] || map.eligible
  return <span className={`rec-eligibility ${cls}`}>{label}</span>
}

function MatchRing({ pct, color }) {
  const dash = circumference * (pct / 100)
  return (
    <div className="rec-ring-wrap">
      <svg className="rec-ring-svg" viewBox="0 0 58 58">
        <circle className="rec-ring-bg" cx="29" cy="29" r="24" fill="none" strokeWidth="5" />
        <circle
          className="rec-ring-fill"
          cx="29" cy="29" r="24" fill="none" strokeWidth="5"
          stroke={color}
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="rec-ring-label">
        <span className="rec-ring-pct">{pct}%</span>
        <span className="rec-ring-sub">Match</span>
      </div>
    </div>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function RecCard({ item }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rec-card">
      <div className="rec-card-top">
        <div className="rec-card-left">
          <div className="rec-degree-name">{item.degree}</div>
          <span className="rec-field-tag">{item.field}</span>
        </div>
        <MatchRing pct={item.match} color={item.color} />
      </div>
      <div className="rec-card-body">
        <p className="rec-reasoning">{item.reasoning}</p>
        <EligBadge status={item.eligibility} />
      </div>
      <button className="rec-expand-btn" onClick={() => setExpanded((v) => !v)} type="button">
        {expanded ? 'Hide Details' : 'View Details'} <ChevronIcon open={expanded} />
      </button>
      {expanded && (
        <div className="rec-detail">
          <div className="rec-detail-grid">
            {Object.entries(item.details).map(([k, v]) => (
              <div key={k} className="rec-detail-item">
                <span className="rec-detail-key">{k}</span>
                <span className="rec-detail-val">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SkeletonCards() {
  return Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className="rec-skeleton-card">
      <div className="skeleton-line" style={{ width: '60%' }} />
      <div className="skeleton-line" style={{ width: '35%', height: '8px' }} />
      <div className="skeleton-line" style={{ width: '100%', height: '8px' }} />
      <div className="skeleton-line" style={{ width: '80%', height: '8px' }} />
    </div>
  ))
}

export default function Recommendations() {
  const [activeTab, setActiveTab] = useState('Top Matches')
  const [activeFilter, setActiveFilter] = useState('All Fields')
  const [loading] = useState(false)

  const allItems = CATEGORY_DATA[activeTab] || []
  const filtered = activeFilter === 'All Fields'
    ? allItems
    : allItems.filter((item) => item.field === activeFilter)

  return (
    <div className="recommendations-page">
      <div className="rec-header">
        <div className="rec-title">Career Recommendations</div>
        <div className="rec-subtitle">AI-matched degrees based on your profile and assessment results.</div>
      </div>

      {/* Category Tabs */}
      <div className="rec-tabs">
        {Object.keys(CATEGORY_DATA).map((tab) => (
          <button
            key={tab}
            className={`rec-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="rec-filter-bar">
        <span className="rec-filter-label">Filter by:</span>
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`rec-filter-btn${activeFilter === f ? ' active' : ''}`}
            onClick={() => setActiveFilter(f)}
            type="button"
          >
            {f}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="rec-cards-grid">
        {loading
          ? <SkeletonCards />
          : filtered.length > 0
            ? filtered.map((item) => <RecCard key={item.degree} item={item} />)
            : (
              <div className="rec-empty" style={{ gridColumn: '1/-1' }}>
                <div className="rec-empty-icon">🎓</div>
                <div className="rec-empty-title">No results found</div>
                <div className="rec-empty-desc">Try a different filter or category.</div>
              </div>
            )
        }
      </div>
    </div>
  )
}
