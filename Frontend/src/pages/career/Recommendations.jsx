import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchStoredRecommendations, generateRecommendations } from '../../api/career'
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
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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

function formatKey(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, ch => ch.toUpperCase())
}

function renderTextValue(value) {
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).map(([k, v]) => `${formatKey(k)}: ${v}`).join(', ')
  }
  return String(value)
}

function normalizeRecommendation(item, idx) {
  const color = item.color || COLOURS[idx % COLOURS.length]
  const degree = item.degree_name || item.degree || item.program || item.title || 'Program'
  const field = item.field || item.category || item.domain || ''
  const matchPct = item.match_percentage ?? item.match ?? item.matchScore ?? item.score ?? 80
  const reasoning = item.reasoning || item.rationale || item.explanation || ''
  const eligibility = item.eligibility || 'eligible'
  const details = item.details || {}
  const degreeLevel = item.degree_level || item.level || ''
  const careerPaths = Array.isArray(item.career_paths) ? item.career_paths : []
  const careerOutlook = item.career_outlook || {}
  const universities = Array.isArray(item.recommended_universities) ? item.recommended_universities : []
  const skillGap = item.skill_gap_analysis || {}

  return {
    color,
    degree,
    field,
    matchPct,
    reasoning,
    eligibility,
    details,
    degreeLevel,
    careerPaths,
    careerOutlook,
    universities,
    skillGap,
  }
}

/* ── Recommendation card ────────────────────────────────────────────────── */
function RecCard({ item, idx, onOpen }) {
  const normalized = normalizeRecommendation(item, idx)
  const {
    color,
    degree,
    field,
    matchPct,
    reasoning,
    eligibility,
  } = normalized

  return (
    <div
      className="rec-card rec-card-clickable"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(normalized)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen(normalized)
        }
      }}
    >
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
      <div className="rec-card-footer">
        <span className="rec-preview-link">Preview Full Details <ChevronIcon /></span>
      </div>
    </div>
  )
}

function RecommendationModal({ item, onClose }) {
  if (!item) return null

  const {
    color,
    degree,
    field,
    matchPct,
    reasoning,
    eligibility,
    details,
    degreeLevel,
    careerPaths,
    careerOutlook,
    universities,
    skillGap,
  } = item

  return (
    <div className="rec-modal-backdrop" onClick={onClose}>
      <div className="rec-modal" onClick={event => event.stopPropagation()}>
        <div className="rec-modal-header">
          <div>
            <div className="rec-degree-name">{degree}</div>
            {field && <span className="rec-field-tag">{field}</span>}
          </div>
          <div className="rec-modal-header-right">
            <MatchRing pct={Math.round(Number(matchPct))} color={color} />
            <button className="rec-modal-close" type="button" onClick={onClose} aria-label="Close details">
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="rec-modal-body">
          {reasoning && <p className="rec-reasoning">{reasoning}</p>}
          <EligBadge status={eligibility} />

          {degreeLevel && (
            <div className="rec-detail-section">
              <div className="rec-detail-section-title">Degree Level</div>
              <div className="rec-detail-val">{degreeLevel}</div>
            </div>
          )}

          {careerPaths.length > 0 && (
            <div className="rec-detail-section">
              <div className="rec-detail-section-title">Career Paths</div>
              <div className="rec-chip-list">
                {careerPaths.map(path => (
                  <span key={path} className="rec-chip">{path}</span>
                ))}
              </div>
            </div>
          )}

          {Object.keys(careerOutlook).length > 0 && (
            <div className="rec-detail-section">
              <div className="rec-detail-section-title">Career Outlook</div>
              <div className="rec-detail-grid">
                {Object.entries(careerOutlook).map(([k, v]) => (
                  <div key={k} className="rec-detail-item">
                    <span className="rec-detail-key">{formatKey(k)}</span>
                    <span className="rec-detail-val">{renderTextValue(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {universities.length > 0 && (
            <div className="rec-detail-section">
              <div className="rec-detail-section-title">Recommended Universities</div>
              <div className="rec-universities-list">
                {universities.map((uni, index) => (
                  <div className="rec-university-item" key={`${uni.name || 'uni'}-${index}`}>
                    <div className="rec-detail-val">{uni.name || 'University'}</div>
                    <div className="rec-university-sub">
                      {[uni.location, uni.specialization].filter(Boolean).join(' • ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(skillGap).length > 0 && (
            <div className="rec-detail-section">
              <div className="rec-detail-section-title">Skill Gap Analysis</div>
              {Object.entries(skillGap).map(([k, v]) => (
                <div key={k} className="rec-skill-gap-block">
                  <div className="rec-detail-key">{formatKey(k)}</div>
                  {Array.isArray(v)
                    ? (
                      <div className="rec-chip-list">
                        {v.map(value => (
                          <span key={value} className="rec-chip">{value}</span>
                        ))}
                      </div>
                    )
                    : <div className="rec-detail-val">{renderTextValue(v)}</div>
                  }
                </div>
              ))}
            </div>
          )}

          {Object.keys(details).length > 0 && (
            <div className="rec-detail-section">
              <div className="rec-detail-section-title">Additional Details</div>
              <div className="rec-detail-grid">
                {Object.entries(details).map(([k, v]) => (
                  <div key={k} className="rec-detail-item">
                    <span className="rec-detail-key">{formatKey(k)}</span>
                    <span className="rec-detail-val">{renderTextValue(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
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
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState(null)
  const [errorType, setErrorType] = useState(null) // 'no_profile' | 'llm_unavailable' | 'no_saved_recommendations' | 'generic'
  const [selectedRec, setSelectedRec] = useState(null)

  const [activeFilter, setActiveFilter] = useState('All Fields')

  function normalizeRecommendationList(payload) {
    const recommendationData = payload?.data?.recommendations
      || payload?.data?.recommendationJSON
      || payload?.recommendations
      || payload?.recommendationJSON

    if (Array.isArray(recommendationData)) {
      return recommendationData
    }

    if (Array.isArray(recommendationData?.top_3_degrees)) {
      return recommendationData.top_3_degrees
    }

    return []
  }

  function loadStored() {
    setLoading(true)
    setError(null)
    setErrorType(null)

    fetchStoredRecommendations()
      .then(data => {
        const list = normalizeRecommendationList(data)
        setRecs(Array.isArray(list) ? list : [])

        if (!list.length) {
          setErrorType('no_saved_recommendations')
        }

        setLoading(false)
      })
      .catch(err => {
        const msg = err.message || ''
        if (msg.toLowerCase().includes('no active session') || msg.includes('404')) {
          setErrorType('no_saved_recommendations')
          setRecs([])
          setError(null)
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
        if (!msg.toLowerCase().includes('no active session') && !msg.includes('404')) {
          setError(msg || 'Something went wrong.')
        }
        setLoading(false)
      })
  }

  function regenerateWithOllama() {
    setRegenerating(true)
    setError(null)
    setErrorType(null)

    generateRecommendations()
      .then(data => {
        const list = normalizeRecommendationList(data)
        setRecs(Array.isArray(list) ? list : [])
        setRegenerating(false)
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
        setRegenerating(false)
      })
  }

  useEffect(() => { loadStored() }, [])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setSelectedRec(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

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
          <button className="rec-cta-btn" onClick={regenerateWithOllama} type="button" disabled={regenerating}>
            <RefreshIcon /> {regenerating ? 'Requesting...' : 'Try Re-recommendation'}
          </button>
        </div>
      </div>
    )
  }

  if (!loading && errorType === 'no_saved_recommendations') {
    return (
      <div className="recommendations-page">
        <div className="rec-header">
          <div className="rec-title">Career Recommendations</div>
          <div className="rec-subtitle">Load saved recommendations instantly, then request fresh AI recommendations only when needed.</div>
        </div>
        <div className="rec-empty" style={{ marginTop: '2rem' }}>
          <div className="rec-empty-icon">💾</div>
          <div className="rec-empty-title">No Saved Recommendations Yet</div>
          <div className="rec-empty-desc">
            We couldn't find a stored recommendation session for your account. You can request one now from Ollama.
          </div>
          <button className="rec-cta-btn" onClick={regenerateWithOllama} type="button" disabled={regenerating}>
            <RefreshIcon /> {regenerating ? 'Requesting from Ollama...' : 'Get Recommendations from Ollama'}
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
          <button className="rec-cta-btn" onClick={loadStored} type="button">
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
        <div className="rec-subtitle">Showing your stored recommendations. Request fresh AI output only when you need it.</div>
        {!loading && (
          <button
            className="rec-refresh-btn"
            onClick={regenerateWithOllama}
            type="button"
            title="Re-recommend with Ollama"
            disabled={regenerating}
          >
            <RefreshIcon /> {regenerating ? 'Requesting...' : 'Re-recommend with Ollama'}
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <>
          <div className="rec-loading-notice">
            <span className="rec-loading-dot" />
            Loading saved recommendations from backend...
          </div>
          <div className="rec-cards-grid">
            <SkeletonCards />
          </div>
        </>
      )}

      {!loading && regenerating && (
        <div className="rec-loading-notice" style={{ marginBottom: '1rem' }}>
          <span className="rec-loading-dot" />
          Requesting fresh recommendations from Ollama... this may take up to 30 seconds.
        </div>
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
            ? filtered.map((item, i) => (
              <RecCard
                key={i}
                item={item}
                idx={i}
                onOpen={(normalized) => setSelectedRec(normalized)}
              />
            ))
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

      <RecommendationModal item={selectedRec} onClose={() => setSelectedRec(null)} />
    </div>
  )
}
