import { useState, useEffect } from 'react'
import { fetchCareers, fetchCareerStats } from '../../api/career'
import './Payscale.css'

/* ── Static chart data (Local market context) ─────────────────────────── */
const STATIC_CHART_DATA = {
  bars: [
    { label: 'CS / SE',    value: 140, max: 200, color: '#CD2B40' },
    { label: 'Data Sci',   value: 160, max: 200, color: '#7c3aed' },
    { label: 'AI / ML',    value: 180, max: 200, color: '#0d9488' },
    { label: 'Cyber Sec',  value: 155, max: 200, color: '#d97706' },
    { label: 'Elect Eng',  value: 110, max: 200, color: '#6366f1' },
    { label: 'BBA',        value:  85, max: 200, color: '#ec4899' },
  ],
  demand: [
    { field: 'AI / Machine Learning', pct: 94, color: '#0d9488' },
    { field: 'Cybersecurity',         pct: 88, color: '#CD2B40' },
    { field: 'Data Science',          pct: 82, color: '#7c3aed' },
    { field: 'Cloud Engineering',     pct: 79, color: '#d97706' },
    { field: 'Software Engineering',  pct: 91, color: '#6366f1' },
  ],
  salaryDist: [
    { range: '0–300K',    count: 19 },
    { range: '300k–600k', count: 25 },
    { range: '600k–1M',   count: 36 },
    { range: '1M–2M',     count: 14 },
    { range: '2M+',       count:  3 },
  ],
  genderSplit: { male: 78, female: 22 },
  benefits: [
    { name: 'Medical', pct: 62 },
    { name: 'Dental',  pct: 18 },
    { name: 'Vision',  pct: 14 },
    { name: 'None',    pct: 35 },
  ],
  summaryCards: [
    { label: 'Avg Starting Salary', sub: 'per month',  color: '#CD2B40', growth: '+12%' },
    { label: 'Mid-Level Avg',       sub: 'per month',  color: '#7c3aed', growth: '+18%' },
    { label: 'Senior Avg',          sub: 'per month',  color: '#0d9488', growth: '+22%' },
    { label: 'Freelance Potential', sub: 'per month',  color: '#d97706', growth: '+35%' },
  ],
}

/* ── Field colour map ─────────────────────────────────────────────────── */
const FIELD_COLOURS = {
  Technology: '#CD2B40', Business: '#7c3aed', Engineering: '#0d9488',
  Healthcare: '#d97706', Design: '#6366f1', Finance: '#ec4899',
}
function fieldOf(job) {
  const t = (job.job_title || '').toLowerCase()
  if (/software|engineer|developer|it|computer|data\s+sci|ai|ml|cloud|cyber|tech/.test(t)) return 'Technology'
  if (/doctor|nurse|medical|health|pharma|dental/.test(t)) return 'Healthcare'
  if (/architect|design|ux|ui|creative/.test(t))           return 'Design'
  if (/account|financ|bank|audit|tax|invest/.test(t))       return 'Finance'
  if (/electrical|mechanical|civil|chemical|struct/.test(t)) return 'Engineering'
  return 'Business'
}

const ALL_FIELDS = ['All Fields', 'Technology', 'Business', 'Engineering', 'Healthcare', 'Design', 'Finance']
const CAREERS_PER_PAGE = 6

/* ── PKR formatter ─────────────────────────────────────────────────────── */
function formatPKR(num) {
  if (!num || isNaN(num)) return 'N/A'
  if (num >= 1_000_000) return `PKR ${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000)     return `PKR ${Math.round(num / 1_000)}k`
  return `PKR ${num}`
}

/* ── Icons ─────────────────────────────────────────────────────────────── */
const TrendIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
)
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const FilterIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
)
const SalaryIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
)
const ChevronIcon = ({ dir }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'left' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
  </svg>
)
const ViewIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)

/* ── Pie Chart ──────────────────────────────────────────────────────────── */
function PieChart({ male, female }) {
  const r = 60; const cx = 80; const cy = 80
  const total = male + female
  const maleDeg = (male / total) * 360
  const rad = d => (d * Math.PI) / 180
  const x1 = cx + r * Math.sin(0);  const y1 = cy - r * Math.cos(0)
  const x2 = cx + r * Math.sin(rad(maleDeg)); const y2 = cy - r * Math.cos(rad(maleDeg))
  const large = maleDeg > 180 ? 1 : 0
  return (
    <div className="pie-chart-wrap">
      <svg viewBox="0 0 160 160" className="pie-svg">
        <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`} fill="#3b82f6" />
        <path d={`M ${cx} ${cy} L ${x2} ${y2} A ${r} ${r} 0 ${1 - large} 1 ${x1} ${y1} Z`} fill="#f97316" />
      </svg>
      <div className="pie-legend">
        <span className="pie-legend-dot" style={{ background: '#3b82f6' }} /> Male {male}%
        <span className="pie-legend-dot" style={{ background: '#f97316', marginLeft: '0.75rem' }} /> Female {female}%
      </div>
    </div>
  )
}

/* ── Career Card ───────────────────────────────────────────────────────── */
function CareerCard({ career }) {
  const field = fieldOf(career)
  const colour = FIELD_COLOURS[field] || '#6366f1'
  const salary = career.average_salary || career.avgSalary || '—'
  const title  = career.job_title      || career.title || '—'

  return (
    <div className="career-card-item">
      <div className="career-card-item-header">
        <div className="career-card-item-title">{title}</div>
        <span className="career-salary-badge" style={{ background: `${colour}18`, color: colour }}>
          {salary}
        </span>
      </div>
      <div className="career-card-stats">
        <div className="career-stat-row">
          <SalaryIcon />
          <div>
            <div className="career-stat-label">Average Salary</div>
            <div className="career-stat-value">{salary} / year</div>
          </div>
        </div>
        <div className="career-stat-row">
          <span style={{ fontSize: '0.8rem' }}>🏷️</span>
          <div>
            <div className="career-stat-label">Field</div>
            <div className="career-stat-value">{field}</div>
          </div>
        </div>
      </div>
      <button className="career-view-btn" type="button">
        <ViewIcon /> View Details
      </button>
    </div>
  )
}

/* ── Careers skeleton ────────────────────────────────────────────────────── */
function CareersSkeleton() {
  return Array.from({ length: 6 }).map((_, i) => (
    <div key={i} className="career-card-item" style={{ opacity: 0.7 }}>
      <div className="skeleton-line" style={{ width: '70%', height: '18px', marginBottom: '0.75rem' }} />
      <div className="skeleton-line" style={{ width: '40%', height: '14px', marginBottom: '0.5rem' }} />
      <div className="skeleton-line" style={{ width: '55%', height: '14px' }} />
    </div>
  ))
}

/* ── Main Component ──────────────────────────────────────────────────────── */
export default function Payscale() {
  const [careers, setCareers] = useState([])
  const [stats, setStats] = useState(null)
  const [careersLoading, setCareersLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [careersError, setCareersError] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [activeField, setActiveField] = useState('All Fields')
  const [careerPage, setCareerPage] = useState(1)

  /* Fetch on mount */
  useEffect(() => {
    fetchCareers()
      .then(data => {
        setCareers(data?.careers || [])
        setCareersLoading(false)
      })
      .catch(err => {
        setCareersError(err.message || 'Failed to load careers.')
        setCareersLoading(false)
      })

    fetchCareerStats()
      .then(data => {
        setStats(data?.stats || null)
        setStatsLoading(false)
      })
      .catch(() => { setStatsLoading(false) })
  }, [])

  /* Derived stats */
  const totalCareers = stats?.total_jobs ?? careers.length
  const avgSalary    = stats?.avg_salary    ? formatPKR(stats.avg_salary)    : '—'
  const minSalary    = stats?.min_salary    ? formatPKR(stats.min_salary)    : '—'
  const maxSalary    = stats?.max_salary    ? formatPKR(stats.max_salary)    : '—'

  /* Filter careers */
  const filtered = careers.filter(c => {
    const title = (c.job_title || c.title || '').toLowerCase()
    const f = fieldOf(c)
    return title.includes(searchQuery.toLowerCase()) &&
      (activeField === 'All Fields' || f === activeField)
  })

  const totalPages  = Math.max(1, Math.ceil(filtered.length / CAREERS_PER_PAGE))
  const pagedCareers = filtered.slice((careerPage - 1) * CAREERS_PER_PAGE, careerPage * CAREERS_PER_PAGE)

  const maxBar  = Math.max(...STATIC_CHART_DATA.bars.map(b => b.value))
  const maxDist = Math.max(...STATIC_CHART_DATA.salaryDist.map(d => d.count))

  return (
    <div className="payscale-page">
      {/* ── Header ── */}
      <div className="pay-header">
        <div className="pay-title">Salary &amp; Market Insights</div>
        <div className="pay-subtitle">
          Real salary data from {statsLoading ? '…' : totalCareers} careers. Explore earning potential and industry demand.
        </div>
      </div>

      {/* ── Aggregate Stats Row ── */}
      <div className="pay-agg-row">
        {[
          { label: 'Total Careers', value: statsLoading ? '…' : totalCareers, highlight: '#3b82f6', icon: '📊' },
          { label: 'Avg Salary',    value: statsLoading ? '…' : avgSalary,    highlight: '#16a34a', icon: '💰' },
          { label: 'Min Salary',    value: statsLoading ? '…' : minSalary,    highlight: '#CD2B40', icon: '📉' },
          { label: 'Max Salary',    value: statsLoading ? '…' : maxSalary,    highlight: '#7c3aed', icon: '📈' },
        ].map(s => (
          <div key={s.label} className="pay-agg-card">
            <div className="pay-agg-label">{s.label} <span className="pay-agg-icon">{s.icon}</span></div>
            <div className="pay-agg-value" style={{ color: s.highlight }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Summary Cards ── */}
      <div className="pay-summary-cards">
        {STATIC_CHART_DATA.summaryCards.map(s => (
          <div key={s.label} className="pay-summary-card" style={{ '--card-color': s.color }}>
            <div className="pay-summary-label">{s.label}</div>
            <div className="pay-summary-value">—</div>
            <div className="pay-summary-sub">{s.sub}</div>
            <div className="pay-growth-badge"><TrendIcon /> {s.growth} YoY</div>
          </div>
        ))}
      </div>

      {/* ── 3-Panel Charts ── */}
      <div className="pay-three-charts">
        {/* Salary Distribution */}
        <div className="pay-card pay-card-dist">
          <div className="pay-card-title">Salary Distribution</div>
          <div className="pay-card-sub">Number of jobs by salary range</div>
          <div className="pay-dist-chart">
            {STATIC_CHART_DATA.salaryDist.map(d => (
              <div key={d.range} className="pay-dist-col">
                <div className="pay-dist-count">{d.count}</div>
                <div className="pay-dist-fill" style={{ height: `${(d.count / maxDist) * 140}px` }} />
                <div className="pay-dist-label">{d.range}</div>
              </div>
            ))}
          </div>
          <div className="pay-dist-yaxis">
            {[36, 27, 18, 9, 0].map(v => <span key={v} className="pay-dist-ytick">{v}</span>)}
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="pay-card pay-card-gender">
          <div className="pay-card-title">Gender Distribution</div>
          <div className="pay-card-sub">Average across all careers</div>
          <PieChart male={STATIC_CHART_DATA.genderSplit.male} female={STATIC_CHART_DATA.genderSplit.female} />
        </div>

        {/* Benefits Coverage */}
        <div className="pay-card pay-card-benefits">
          <div className="pay-card-title">Benefits Coverage</div>
          <div className="pay-card-sub">Average benefits offered</div>
          <div className="pay-benefits-list">
            {STATIC_CHART_DATA.benefits.map(b => (
              <div key={b.name} className="pay-benefit-row">
                <div className="pay-benefit-name">{b.name}</div>
                <div className="pay-benefit-bar-wrap">
                  <div className="pay-benefit-fill" style={{ width: `${b.pct}%` }} />
                </div>
                <span className="pay-benefit-pct">{b.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Salary Comparison by Degree + Demand ── */}
      <div className="pay-charts-grid">
        <div className="pay-card">
          <div className="pay-card-title">Salary Comparison by Degree</div>
          <div className="pay-card-sub">Average mid-career (PKR 000s/mo)</div>
          <div className="pay-bar-chart">
            {STATIC_CHART_DATA.bars.map(bar => (
              <div key={bar.label} className="pay-bar-col">
                <div className="pay-bar-val">{bar.value}k</div>
                <div className="pay-bar-fill" style={{ height: `${(bar.value / maxBar) * 100}%`, background: bar.color }} title={`${bar.label}: ${bar.value}k`} />
                <div className="pay-bar-label">{bar.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="pay-card">
          <div className="pay-card-title">Demand Trends</div>
          <div className="pay-card-sub">Job market demand index (0–100)</div>
          <div className="pay-demand-list">
            {STATIC_CHART_DATA.demand.map(item => (
              <div key={item.field} className="pay-demand-item">
                <div className="pay-demand-row">
                  <span className="pay-demand-name">{item.field}</span>
                  <span className="pay-demand-pct">{item.pct}%</span>
                </div>
                <div className="pay-demand-track">
                  <div className="pay-demand-fill" style={{ width: `${item.pct}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── All Careers Section (Live from Backend) ── */}
      <div className="careers-section">
        <div className="careers-search-row">
          <div className="careers-search-wrap">
            <SearchIcon />
            <input
              className="careers-search-input"
              placeholder="Search careers (e.g., Software Engineer, Nurse, Accountant)…"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCareerPage(1) }}
            />
          </div>
          <div className="careers-filter-wrap">
            <FilterIcon />
            <select className="careers-filter-select" value={activeField} onChange={e => { setActiveField(e.target.value); setCareerPage(1) }}>
              {ALL_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <div className="careers-list-header">
          <span className="careers-list-title">
            {careersLoading ? 'Loading careers…' : `${filtered.length} Careers (${totalCareers} total)`}
          </span>
          {!careersLoading && <span className="careers-page-label">Page {careerPage} of {totalPages}</span>}
        </div>

        {/* Error */}
        {careersError && (
          <div className="careers-error-banner">⚠️ {careersError}</div>
        )}

        {/* Grid */}
        {careersLoading ? (
          <div className="careers-grid"><CareersSkeleton /></div>
        ) : pagedCareers.length > 0 ? (
          <div className="careers-grid">
            {pagedCareers.map((career, i) => (
              <CareerCard key={career.job_title + i} career={career} />
            ))}
          </div>
        ) : (
          <div className="careers-empty">
            <div style={{ fontSize: '2.5rem' }}>🔍</div>
            <div style={{ fontWeight: 600, color: 'var(--text-dark)', marginTop: '0.5rem' }}>No careers found</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Try a different search term or filter.</div>
          </div>
        )}

        {/* Pagination */}
        {!careersLoading && totalPages > 1 && (
          <div className="careers-pagination">
            <button className="pag-btn" onClick={() => setCareerPage(p => Math.max(1, p - 1))} disabled={careerPage === 1} type="button">
              <ChevronIcon dir="left" /> Prev
            </button>
            <div className="pag-dots">
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => (
                <button key={i} className={`pag-dot${careerPage === i + 1 ? ' active' : ''}`} onClick={() => setCareerPage(i + 1)} type="button">
                  {i + 1}
                </button>
              ))}
            </div>
            <button className="pag-btn" onClick={() => setCareerPage(p => Math.min(totalPages, p + 1))} disabled={careerPage === totalPages} type="button">
              Next <ChevronIcon dir="right" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
