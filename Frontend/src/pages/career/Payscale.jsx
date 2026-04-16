import { useState, useEffect, useMemo } from 'react'
import { fetchCareers, fetchCareerStats } from '../../api/career'
import './Payscale.css'

/* ── Field colour map ─────────────────────────────────────────────────── */
const FIELD_COLOURS = {
  Technology: '#CD2B40', Business: '#7c3aed', Engineering: '#0d9488',
  Healthcare: '#d97706', Design: '#6366f1', Finance: '#ec4899',
}
function fieldOf(job) {
  const t = (job.job_title || '').toLowerCase()
  if (/software|engineer|developer|it|computer|data\s+sci|ai|ml|cloud|cyber|tech/.test(t)) return 'Technology'
  if (/doctor|nurse|medical|health|pharma|dental|physi|psycho/.test(t)) return 'Healthcare'
  if (/architect|design|ux|ui|creative|graphic/.test(t)) return 'Design'
  if (/account|financ|bank|audit|tax|invest/.test(t)) return 'Finance'
  if (/electrical|mechanical|civil|chemical|struct/.test(t)) return 'Engineering'
  return 'Business'
}

const ALL_FIELDS = ['All Fields', 'Technology', 'Business', 'Engineering', 'Healthcare', 'Design', 'Finance']
const CAREERS_PER_PAGE = 6

/* ── PKR formatter ─────────────────────────────────────────────────────── */
function formatPKR(num) {
  if (!num || isNaN(num)) return 'N/A'
  if (num >= 1_000_000) return `PKR ${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `PKR ${Math.round(num / 1_000)}k`
  return `PKR ${Math.round(num)}`
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
  const [hoverData, setHoverData] = useState(null)

  const r = 60; const cx = 80; const cy = 80
  const total = male + female || 1
  const maleDeg = (male / total) * 360
  const rad = d => (d * Math.PI) / 180
  const x1 = cx + r * Math.sin(0); const y1 = cy - r * Math.cos(0)
  const x2 = cx + r * Math.sin(rad(maleDeg)); const y2 = cy - r * Math.cos(rad(maleDeg))
  const large = maleDeg > 180 ? 1 : 0

  const handleHover = (label, pct, color) => setHoverData({ label, pct, color })
  const clearHover = () => setHoverData(null)

  // Handle 100% case edge logic
  if (maleDeg === 360 || maleDeg === 0) {
    const isMale = maleDeg === 360
    const label = isMale ? "Male" : "Female"
    const pct = isMale ? male : female
    const color = isMale ? "#3b82f6" : "#f97316"

    return (
      <div className="pie-chart-wrap" style={{ position: 'relative' }}>
        <svg viewBox="0 0 160 160" className="pie-svg">
          <circle cx={cx} cy={cy} r={r} fill={color} style={{ outline: 'none', cursor: 'pointer' }}
            onMouseEnter={() => handleHover(label, pct, color)}
            onMouseLeave={clearHover}
          />
        </svg>
        {hoverData && (
          <div className="chart-tooltip" style={{ borderColor: hoverData.color, opacity: 1, visibility: 'visible', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
            <div style={{ fontWeight: 600 }}>{hoverData.label}</div>
            <div style={{ color: hoverData.color, marginTop: '0.2rem' }}>percentage : {Math.round(hoverData.pct)}%</div>
          </div>
        )}
        <div className="pie-legend">
          <span className="pie-legend-dot" style={{ background: '#3b82f6' }} /> Male {Math.round(male)}%
          <span className="pie-legend-dot" style={{ background: '#f97316', marginLeft: '0.75rem' }} /> Female {Math.round(female)}%
        </div>
      </div>
    )
  }

  return (
    <div className="pie-chart-wrap" style={{ position: 'relative' }}>
      <svg viewBox="0 0 160 160" className="pie-svg">
        <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`} fill="#3b82f6" style={{ outline: 'none', cursor: 'pointer' }}
          onMouseEnter={() => handleHover("Male", male, "#3b82f6")}
          onMouseLeave={clearHover}
        />
        <path d={`M ${cx} ${cy} L ${x2} ${y2} A ${r} ${r} 0 ${1 - large} 1 ${x1} ${y1} Z`} fill="#f97316" style={{ outline: 'none', cursor: 'pointer' }}
          onMouseEnter={() => handleHover("Female", female, "#f97316")}
          onMouseLeave={clearHover}
        />
      </svg>
      {hoverData && (
        <div className="chart-tooltip" style={{ borderColor: hoverData.color, opacity: 1, visibility: 'visible', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
          <div style={{ fontWeight: 600 }}>{hoverData.label}</div>
          <div style={{ color: hoverData.color, marginTop: '0.2rem' }}>percentage : {Math.round(hoverData.pct)}%</div>
        </div>
      )}
      <div className="pie-legend">
        <span className="pie-legend-dot" style={{ background: '#3b82f6' }} /> Male {Math.round(male)}%
        <span className="pie-legend-dot" style={{ background: '#f97316', marginLeft: '0.75rem' }} /> Female {Math.round(female)}%
      </div>
    </div>
  )
}

/* ── Career Card ───────────────────────────────────────────────────────── */
function CareerCard({ career, onSelect }) {
  const field = fieldOf(career)
  const colour = FIELD_COLOURS[field] || '#6366f1'
  const salary = career.average_salary || career.avgSalary || '—'
  const title = career.job_title || career.title || '—'

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
            <div className="career-stat-value">{salary} {salary !== '—' && '/ ' + (career.salary_period?.replace('/ ', '') || 'year')}</div>
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
      <button className="career-view-btn" type="button" onClick={() => onSelect(career)}>
        <ViewIcon /> View Details
      </button>
    </div>
  )
}

/* ── Career Modal ──────────────────────────────────────────────────────── */
function CareerModal({ career, onClose }) {
  if (!career) return null;

  const field = fieldOf(career);
  const colour = FIELD_COLOURS[field] || '#6366f1';

  return (
    <div className="career-modal-backdrop" onClick={onClose}>
      <div className="career-modal-cnt" onClick={e => e.stopPropagation()}>
        <button className="career-modal-close" onClick={onClose}>×</button>

        <div className="career-modal-header" style={{ borderBottomColor: `${colour}33` }}>
          <div className="career-modal-field" style={{ color: colour, background: `${colour}18` }}>{field}</div>
          <h2 className="career-modal-title">{career.job_title || 'Career Details'}</h2>
          <p className="career-modal-summary">{career.summary}</p>
        </div>

        <div className="career-modal-grid">
          <div className="cm-box">
            <h4>💰 Salary Information</h4>
            <div className="cm-row">
              <span className="cm-label">Average Salary:</span>
              <span className="cm-val">{career.average_salary || 'N/A'} {career.salary_period || ''}</span>
            </div>
            <div className="cm-row">
              <span className="cm-label">Median Salary:</span>
              <span className="cm-val">{career.median_salary || 'N/A'}</span>
            </div>
          </div>

          <div className="cm-box">
            <h4>👥 Gender Distribution</h4>
            {career.gender ? (
              <div className="cm-list">
                {Object.entries(career.gender).map(([k, v]) => (
                  <div className="cm-row" key={k}>
                    <span className="cm-label">{k}:</span>
                    <span className="cm-val">{v}</span>
                  </div>
                ))}
              </div>
            ) : <p className="cm-empty">No gender data</p>}
          </div>

          <div className="cm-box">
            <h4>📈 Growth by Experience</h4>
            {career.experience_levels && Object.keys(career.experience_levels).length > 0 ? (
              <div className="cm-list">
                {Object.entries(career.experience_levels).map(([k, v]) => (
                  <div className="cm-row" key={k}>
                    <span className="cm-label">{k}:</span>
                    <span className={`cm-val ${String(v).includes('▲') ? 'cm-pos' : String(v).includes('▼') ? 'cm-neg' : ''}`}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            ) : <p className="cm-empty">No experience data</p>}
          </div>

          <div className="cm-box">
            <h4>🏥 Benefits Coverage</h4>
            {career.benefits && Object.keys(career.benefits).length > 0 ? (
              <div className="cm-list">
                {Object.entries(career.benefits).map(([k, v]) => (
                  <div className="cm-row" key={k}>
                    <span className="cm-label">{k}:</span>
                    <span className="cm-val">{v}</span>
                  </div>
                ))}
              </div>
            ) : <p className="cm-empty">No benefits data</p>}
          </div>
        </div>

        {career.url && (
          <div className="career-modal-footer">
            <button className="career-modal-link-btn" onClick={() => window.open(career.url, '_blank')}>
              View Full Index on Payscale <ViewIcon />
            </button>
          </div>
        )}
      </div>
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
  const [selectedCareer, setSelectedCareer] = useState(null)

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

  /* Filter careers */
  const filtered = useMemo(() => {
    return careers.filter(c => {
      const title = (c.job_title || c.title || '').toLowerCase()
      const f = fieldOf(c)
      return title.includes(searchQuery.toLowerCase()) &&
        (activeField === 'All Fields' || f === activeField)
    })
  }, [careers, searchQuery, activeField]);

  /* Dynamic chart data derived from *filtered* 'careers' */
  const chartData = useMemo(() => {
    const defaultData = {
      bars: [], demand: [], salaryDist: [
        { range: '0–300K', count: 0 }, { range: '300k–600k', count: 0 },
        { range: '600k–1M', count: 0 }, { range: '1M–2M', count: 0 }, { range: '2M+', count: 0 }
      ],
      genderSplit: { male: 50, female: 50 },
      benefits: [
        { name: 'Medical', pct: 0 }, { name: 'Dental', pct: 0 },
        { name: 'Vision', pct: 0 }, { name: 'None', pct: 0 }
      ],
      summaryCards: [
        { label: 'Avg Starting Salary', sub: 'per year', color: '#CD2B40', val: '—', growth: '+10% YoY' },
        { label: 'Mid-Level Avg', sub: 'per year', color: '#7c3aed', val: '—', growth: '+15% YoY' },
        { label: 'Senior Avg', sub: 'per year', color: '#0d9488', val: '—', growth: '+18% YoY' },
        { label: 'Freelance Potential', sub: 'per year', color: '#d97706', val: '—', growth: '+25% YoY' }
      ]
    }
    if (!filtered || filtered.length === 0) return defaultData;

    let totalMale = 0, totalFemale = 0, genderCount = 0;
    let bMedical = 0, bDental = 0, bVision = 0, bNone = 0, bCount = 0;

    let dist = { '0–300K': 0, '300k–600k': 0, '600k–1M': 0, '1M–2M': 0, '2M+': 0 };

    let fieldSalaries = {};
    let demandScore = {};
    let totalSalaries = [];

    filtered.forEach(c => {
      // Parse gender
      if (c.gender) {
        if (c.gender.Male) totalMale += parseFloat(c.gender.Male.replace('%', ''));
        if (c.gender.Female) totalFemale += parseFloat(c.gender.Female.replace('%', ''));
        genderCount++;
      }

      // Parse benefits
      if (c.benefits) {
        if (c.benefits.Medical) bMedical += parseFloat(c.benefits.Medical.replace('%', ''));
        if (c.benefits.Dental) bDental += parseFloat(c.benefits.Dental.replace('%', ''));
        if (c.benefits.Vision) bVision += parseFloat(c.benefits.Vision.replace('%', ''));
        if (c.benefits.None) bNone += parseFloat(c.benefits.None.replace('%', ''));
        bCount++;
      }

      // Parse salary
      let rawSalaryStr = c.average_salary || '';
      let num = parseInt(rawSalaryStr.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(num)) {
        let yearly = num;

        if (yearly < 300000) dist['0–300K']++;
        else if (yearly < 600000) dist['300k–600k']++;
        else if (yearly < 1000000) dist['600k–1M']++;
        else if (yearly < 2000000) dist['1M–2M']++;
        else dist['2M+']++;

        totalSalaries.push(yearly);

        // Field average
        let f = fieldOf(c);
        if (!fieldSalaries[f]) fieldSalaries[f] = [];
        fieldSalaries[f].push(yearly);

        // Demand tracking
        if (!demandScore[f]) demandScore[f] = 0;
        demandScore[f] += 1;
      }
    });

    // Compute averages
    let m = genderCount ? (totalMale / genderCount) : 50;
    let f = genderCount ? (totalFemale / genderCount) : 50;
    if (m === 0 && f === 0) { m = 50; f = 50; }

    const bc = Math.max(1, bCount);
    let benefits = [
      { name: 'Medical', pct: Math.round(bMedical / bc) },
      { name: 'Dental', pct: Math.round(bDental / bc) },
      { name: 'Vision', pct: Math.round(bVision / bc) },
      { name: 'None', pct: Math.round(bNone / bc) }
    ];

    let bars = [];
    Object.keys(FIELD_COLOURS).forEach(field => {
      let salaries = fieldSalaries[field] || [];
      if (salaries.length > 0) {
        let avg = salaries.reduce((a, b) => a + b, 0) / salaries.length;
        // The graph max scale should be dynamically matched. Keep relative monthly.
        let mo = Math.round(avg / 12 / 1000); // Thousands/mo
        bars.push({ label: field, value: mo, color: FIELD_COLOURS[field] });
      } else if (activeField === 'All Fields') {
        bars.push({ label: field, value: 0, color: FIELD_COLOURS[field] });
      }
    });

    // Sort bars to assign max correctly for display later
    bars.sort((a, b) => b.value - a.value);

    // Demand computation
    let demandTotal = Math.max(1, filtered.length);
    let demandArr = Object.entries(demandScore).map(([field, score]) => {
      let pct = 40 + Math.floor((score / demandTotal) * 150);
      return { field, pct: Math.min(100, pct), color: FIELD_COLOURS[field] || '#6366f1' };
    }).sort((a, b) => b.pct - a.pct).slice(0, 5);

    if (demandArr.length === 0 && activeField !== 'All Fields') {
      demandArr = [{ field: activeField, pct: 100, color: FIELD_COLOURS[activeField] || '#6366f1' }];
    }

    // Summary Cards (synthesize based on overall average)
    let overallAvg = totalSalaries.length ? totalSalaries.reduce((a, b) => a + b, 0) / totalSalaries.length : 800000;

    defaultData.summaryCards[0].val = formatPKR(overallAvg * 0.65);
    defaultData.summaryCards[1].val = formatPKR(overallAvg);
    defaultData.summaryCards[2].val = formatPKR(overallAvg * 1.55);
    defaultData.summaryCards[3].val = formatPKR(overallAvg * 1.25);

    return {
      bars,
      demand: demandArr,
      salaryDist: [
        { range: '0–300K', count: dist['0–300K'] },
        { range: '300k–600k', count: dist['300k–600k'] },
        { range: '600k–1M', count: dist['600k–1M'] },
        { range: '1M–2M', count: dist['1M–2M'] },
        { range: '2M+', count: dist['2M+'] }
      ],
      genderSplit: { male: m, female: f },
      benefits,
      summaryCards: defaultData.summaryCards
    }
  }, [filtered, activeField]);

  /* Derived aggregate stats over FILTERED subset */
  const currentTotalJobs = filtered.length;


  const totalPages = Math.max(1, Math.ceil(filtered.length / CAREERS_PER_PAGE))
  const pagedCareers = filtered.slice((careerPage - 1) * CAREERS_PER_PAGE, careerPage * CAREERS_PER_PAGE)

  const maxBar = chartData.bars.length ? Math.max(...chartData.bars.map(b => b.value)) : 200
  const maxDist = Math.max(...chartData.salaryDist.map(d => d.count), 1)

  return (
    <div className="payscale-page">
      {/* ── Header ── */}
      <div className="pay-header">
        <div className="pay-title">Salary &amp; Market Insights</div>
        <div className="pay-subtitle">
          Real salary data across multiple industries. Explore earning potential and market demand.
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="pay-summary-cards">
        <div className="pay-summary-card" style={{ '--card-color': '#3b82f6' }}>
          <div className="pay-summary-label">Total Careers</div>
          <div className="pay-summary-value">{careersLoading ? '…' : currentTotalJobs}</div>
          <div className="pay-summary-sub">Across selected filters</div>
          <div className="pay-growth-badge"><TrendIcon /> Live</div>
        </div>
        {chartData.summaryCards.map(s => (
          <div key={s.label} className="pay-summary-card" style={{ '--card-color': s.color }}>
            <div className="pay-summary-label">{s.label}</div>
            <div className="pay-summary-value">{s.val}</div>
            <div className="pay-summary-sub">{s.sub}</div>
            <div className="pay-growth-badge"><TrendIcon /> {s.growth}</div>
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
            {chartData.salaryDist.map(d => (
              <div key={d.range} className="pay-dist-col">
                <div className="pay-dist-count">{d.count}</div>
                <div className="pay-dist-fill has-tooltip" style={{ height: `${(d.count / maxDist) * 140}px` }}>
                  <div className="chart-tooltip" style={{ borderColor: '#3b82f6' }}>
                    <div style={{ fontWeight: 600 }}>{d.range}</div>
                    <div style={{ color: '#3b82f6', marginTop: '0.2rem' }}>count : {d.count}</div>
                  </div>
                </div>
                <div className="pay-dist-label">{d.range}</div>
              </div>
            ))}
          </div>
          <div className="pay-dist-yaxis">
            {[Math.ceil(maxDist), Math.ceil(maxDist * 0.75), Math.ceil(maxDist * 0.5), Math.ceil(maxDist * 0.25), 0].map((v, i) => <span key={i} className="pay-dist-ytick">{v}</span>)}
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="pay-card pay-card-gender">
          <div className="pay-card-title">Gender Distribution</div>
          <div className="pay-card-sub">Average across filtered careers</div>
          <PieChart male={chartData.genderSplit.male} female={chartData.genderSplit.female} />
        </div>

        {/* Benefits Coverage */}
        <div className="pay-card pay-card-benefits">
          <div className="pay-card-title">Benefits Coverage</div>
          <div className="pay-card-sub">Average benefits offered</div>
          <div className="pay-benefits-list">
            {chartData.benefits.map(b => (
              <div key={b.name} className="pay-benefit-row">
                <div className="pay-benefit-name">{b.name}</div>
                <div className="pay-benefit-bar-wrap">
                  <div className="pay-benefit-fill has-tooltip" style={{ width: `${b.pct}%` }}>
                    <div className="chart-tooltip" style={{ borderColor: '#f97316' }}>
                      <div style={{ fontWeight: 600 }}>{b.name}</div>
                      <div style={{ color: '#f97316', marginTop: '0.2rem' }}>percentage : {b.pct}</div>
                    </div>
                  </div>
                </div>
                <span className="pay-benefit-pct">{b.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Salary Comparison by Degree + Demand ── */}
      <div className="pay-charts-grid">
        <div className="pay-card">
          <div className="pay-card-title">Salary Comparison by Field</div>
          <div className="pay-card-sub">Average estimated (PKR 000s/mo)</div>
          <div className="pay-bar-chart">
            {chartData.bars.map(bar => (
              <div key={bar.label} className="pay-bar-col">
                <div className="pay-bar-val">{bar.value}k</div>
                <div className="pay-bar-fill has-tooltip" style={{ height: `${(bar.value / maxBar) * 100}%`, background: bar.color }}>
                  <div className="chart-tooltip" style={{ borderColor: bar.color }}>
                    <div style={{ fontWeight: 600 }}>{bar.label}</div>
                    <div style={{ color: bar.color, marginTop: '0.2rem' }}>value : {bar.value}k</div>
                  </div>
                </div>
                <div className="pay-bar-label">{bar.label}</div>
              </div>
            ))}
            {chartData.bars.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '2rem' }}>Not enough data</div>
            )}
          </div>
        </div>

        <div className="pay-card">
          <div className="pay-card-title">Demand Trends</div>
          <div className="pay-card-sub">Job market demand index (0–100)</div>
          <div className="pay-demand-list">
            {chartData.demand.map(item => (
              <div key={item.field} className="pay-demand-item">
                <div className="pay-demand-row">
                  <span className="pay-demand-name">{item.field}</span>
                  <span className="pay-demand-pct">{item.pct}%</span>
                </div>
                <div className="pay-demand-track">
                  <div className="pay-demand-fill has-tooltip" style={{ width: `${item.pct}%`, background: item.color }}>
                    <div className="chart-tooltip" style={{ borderColor: item.color }}>
                      <div style={{ fontWeight: 600 }}>{item.field}</div>
                      <div style={{ color: item.color, marginTop: '0.2rem' }}>demand : {item.pct}%</div>
                    </div>
                  </div>
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
            {careersLoading ? 'Loading careers…' : `${filtered.length} Careers Found`}
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
              <CareerCard key={career.job_title + i} career={career} onSelect={setSelectedCareer} />
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
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                // Adjust index for dots when page is past 7
                let pageNum = i + 1;
                if (totalPages > 7) {
                  if (careerPage > 4) pageNum = careerPage - 3 + i;
                  if (careerPage > totalPages - 3) pageNum = totalPages - 6 + i;
                }
                return (
                  <button key={i} className={`pag-dot${careerPage === pageNum ? ' active' : ''}`} onClick={() => setCareerPage(pageNum)} type="button">
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button className="pag-btn" onClick={() => setCareerPage(p => Math.min(totalPages, p + 1))} disabled={careerPage === totalPages} type="button">
              Next <ChevronIcon dir="right" />
            </button>
          </div>
        )}
      </div>

      {/* ── Popup Modal ── */}
      <CareerModal career={selectedCareer} onClose={() => setSelectedCareer(null)} />
    </div>
  )
}
