import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { generateRecommendations } from '../../api/career'
import './Recommendations.css'

const circumference = 2 * Math.PI * 24

/* ── Icons ──────────────────────────────────────────────────────────────── */
function ChevronIcon({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

/* ── Match ring ─────────────────────────────────────────────────────────── */
function MatchRing({ pct, color }) {
  const dash = circumference * (pct / 100)
  return (
    <div className="rec-ring-wrap">
      <svg className="rec-ring-svg" viewBox="0 0 58 58">
        <circle className="rec-ring-bg" cx="29" cy="29" r="24" fill="none" strokeWidth="5" />
        <circle className="rec-ring-fill" cx="29" cy="29" r="24" fill="none" strokeWidth="5"
          stroke={color} strokeDasharray={`${dash} ${circumference}`} />
      </svg>
      <div className="rec-ring-label">
        <span className="rec-ring-pct">{pct}%</span>
        <span className="rec-ring-sub">Match</span>
      </div>
    </div>
  )
}

/* ── Eligibility badge ─────────────────────────────────────────────────── */
function EligBadge({ status }) {
  const map = {
    eligible:    { label: '✓ Eligible',      cls: 'eligible' },
    conditional: { label: '⚠ Conditional',   cls: 'conditional' },
    ineligible:  { label: '✗ Not Eligible',  cls: 'ineligible' },
  }
  const { label, cls } = map[status] || map.eligible
  return <span className={`rec-eligibility ${cls}`}>{label}</span>
}

/* ── Colour palette (cycles through for cards) ─────────────────────────── */
const COLOURS = ['#CD2B40', '#7c3aed', '#0d9488', '#d97706', '#6366f1', '#ec4899']

/* ── Recommendation card ────────────────────────────────────────────────── */
function RecCard({ item, idx }) {
  const [expanded, setExpanded] = useState(false)
  const color = item.color || COLOURS[idx % COLOURS.length]

  // Normalise response fields — backend may use different key names
  const degree     = item.degree || item.program || item.title || 'Program'
  const field      = item.field  || item.category || item.domain || ''
  const matchPct   = item.match_percentage ?? item.match ?? item.matchScore ?? item.score ?? 80
  const reasoning  = item.reasoning || item.rationale || item.explanation || ''
  const eligibility = item.eligibility || 'eligible'
  const details    = item.details || {}

  return (
    <div className="rec-card">
      <div className="rec-card-top">
        <div className="rec-card-left">
          <div className="rec-degree-name">{degree}</div>
          {field && <span className="rec-field-tag">{field}</span>}
        </div>
        <MatchRing pct={Math.round(Number(matchPct))} color={color} />
      </div>
      <div className="rec-card-body">
        {reasoning && <p className="rec-reasoning">{reasoning}</p>}
        <EligBadge status={eligibility} />
      </div>
      {Object.keys(details).length > 0 && (
        <>
          <button className="rec-expand-btn" onClick={() => setExpanded(v => !v)} type="button">
            {expanded ? 'Hide Details' : 'View Details'} <ChevronIcon open={expanded} />
          </button>
          {expanded && (
            <div className="rec-detail">
              <div className="rec-detail-grid">
                {Object.entries(details).map(([k, v]) => (
                  <div key={k} className="rec-detail-item">
                    <span className="rec-detail-key">{k}</span>
                    <span className="rec-detail-val">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── Skeleton ───────────────────────────────────────────────────────────── */
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

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function Recommendations() {
  const [recs, setRecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [errorType, setErrorType] = useState(null) // 'no_profile' | 'llm_unavailable' | 'generic'

  const [activeFilter, setActiveFilter] = useState('All Fields')

  function load() {
    setLoading(true)
    setError(null)
    setErrorType(null)
    generateRecommendations()
      .then(data => {
        const list = data?.data?.recommendations || []
        setRecs(Array.isArray(list) ? list : [])
        setLoading(false)
      })
      .catch(err => {
        const msg = err.message || ''
        if (msg.toLowerCase().includes('profile') || msg.toLowerCase().includes('not found') || msg.includes('404')) {
          setErrorType('no_profile')
        } else if (
          msg.toLowerCase().includes('ollama') ||
          msg.toLowerCase().includes('llm') ||
          msg.toLowerCase().includes('connect') ||
          msg.toLowerCase().includes('econnrefused') ||
          msg.toLowerCase().includes('unavailable') ||
          msg.includes('503') || msg.includes('502')
        ) {
          setErrorType('llm_unavailable')
        } else {
          setErrorType('generic')
        }
        setError(msg || 'Something went wrong.')
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [])

  /* ── Dynamic filter list from real data ─────────────────────────────────── */
  const fields = ['All Fields', ...new Set(recs.map(r => r.field || r.category || r.domain).filter(Boolean))]
  const filtered = activeFilter === 'All Fields'
    ? recs
    : recs.filter(r => (r.field || r.category || r.domain) === activeFilter)

  /* ── Error States ───────────────────────────────────────────────────────── */
  if (!loading && errorType === 'no_profile') {
    return (
      <div className="recommendations-page">
        <div className="rec-header">
          <div className="rec-title">Career Recommendations</div>
          <div className="rec-subtitle">AI-matched degrees based on your profile and assessment results.</div>
        </div>
        <div className="rec-empty" style={{ marginTop: '2rem' }}>
          <div className="rec-empty-icon">📋</div>
          <div className="rec-empty-title">Complete Your Assessment First</div>
          <div className="rec-empty-desc">
            You haven't submitted a career profile yet. Complete the aptitude questionnaire so our AI can generate personalised recommendations for you.
          </div>
          <Link to="/dashboard/career/questionnaire" className="rec-cta-btn">
            Start Questionnaire →
          </Link>
        </div>
      </div>
    )
  }

  if (!loading && errorType === 'llm_unavailable') {
    return (
      <div className="recommendations-page">
        <div className="rec-header">
          <div className="rec-title">Career Recommendations</div>
          <div className="rec-subtitle">AI-matched degrees based on your profile and assessment results.</div>
        </div>
        <div className="rec-empty rec-llm-error" style={{ marginTop: '2rem' }}>
          <div className="rec-empty-icon">🤖</div>
          <div className="rec-empty-title">AI Service Temporarily Unavailable</div>
          <div className="rec-empty-desc">
            The recommendation engine (Ollama / LLM) is currently offline or unreachable. Please make sure Ollama is running locally, then try again.
          </div>
          <button className="rec-cta-btn" onClick={load} type="button">
            <RefreshIcon /> Retry
          </button>
        </div>
      </div>
    )
  }

  if (!loading && errorType === 'generic') {
    return (
      <div className="recommendations-page">
        <div className="rec-header">
          <div className="rec-title">Career Recommendations</div>
        </div>
        <div className="rec-empty" style={{ marginTop: '2rem' }}>
          <div className="rec-empty-icon">⚠️</div>
          <div className="rec-empty-title">Something Went Wrong</div>
          <div className="rec-empty-desc">{error}</div>
          <button className="rec-cta-btn" onClick={load} type="button">
            <RefreshIcon /> Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="recommendations-page">
      <div className="rec-header">
        <div className="rec-title">Career Recommendations</div>
        <div className="rec-subtitle">AI-matched degrees based on your profile and assessment results.</div>
        {!loading && (
          <button className="rec-refresh-btn" onClick={load} type="button" title="Regenerate">
            <RefreshIcon /> Regenerate
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <>
          <div className="rec-loading-notice">
            <span className="rec-loading-dot" />
            AI is analysing your profile… this may take up to 30 seconds.
          </div>
          <div className="rec-cards-grid">
            <SkeletonCards />
          </div>
        </>
      )}

      {/* Filters — only show once we have data */}
      {!loading && recs.length > 0 && (
        <div className="rec-filter-bar">
          <span className="rec-filter-label">Filter by:</span>
          {fields.map(f => (
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
      )}

      {/* Cards */}
      {!loading && (
        <div className="rec-cards-grid">
          {filtered.length > 0
            ? filtered.map((item, i) => <RecCard key={i} item={item} idx={i} />)
            : (
              <div className="rec-empty" style={{ gridColumn: '1/-1' }}>
                <div className="rec-empty-icon">🎓</div>
                <div className="rec-empty-title">No results for this filter</div>
                <div className="rec-empty-desc">Try selecting a different field.</div>
              </div>
            )
          }
        </div>
      )}
    </div>
  )
}
