import { useState } from 'react'
import './Payscale.css'

/* ── Static market data ─────────────────────────────────────────── */
const MARKET_DATA = {
  Local: {
    totalCareers: 97,
    avgSalary: 'PKR 684k',
    minSalary: 'PKR 29k',
    maxSalary: 'PKR 3.5M',
    summary: [
      { label: 'Avg Starting Salary', value: 'PKR 65k', sub: 'per month', color: '#CD2B40', growth: '+12%' },
      { label: 'Mid-Level Avg', value: 'PKR 130k', sub: 'per month', color: '#7c3aed', growth: '+18%' },
      { label: 'Senior Avg', value: 'PKR 250k', sub: 'per month', color: '#0d9488', growth: '+22%' },
      { label: 'Freelance Potential', value: 'PKR 400k', sub: 'per month', color: '#d97706', growth: '+35%' },
    ],
    bars: [
      { label: 'CS / SE', value: 140, max: 200, color: '#CD2B40' },
      { label: 'Data Sci', value: 160, max: 200, color: '#7c3aed' },
      { label: 'AI / ML', value: 180, max: 200, color: '#0d9488' },
      { label: 'Cyber Sec', value: 155, max: 200, color: '#d97706' },
      { label: 'Elect Eng', value: 110, max: 200, color: '#6366f1' },
      { label: 'BBA', value: 85, max: 200, color: '#ec4899' },
    ],
    demand: [
      { field: 'AI / Machine Learning', pct: 94, color: '#0d9488' },
      { field: 'Cybersecurity', pct: 88, color: '#CD2B40' },
      { field: 'Data Science', pct: 82, color: '#7c3aed' },
      { field: 'Cloud Engineering', pct: 79, color: '#d97706' },
      { field: 'Software Engineering', pct: 91, color: '#6366f1' },
    ],
    roles: [
      { name: 'AI / ML Engineer', sub: 'AI & Data Science', salary: 'PKR 180k–300k' },
      { name: 'Full Stack Developer', sub: 'Software Engineering', salary: 'PKR 120k–220k' },
      { name: 'Cybersecurity Analyst', sub: 'Information Security', salary: 'PKR 130k–250k' },
      { name: 'Data Analyst', sub: 'Data Science', salary: 'PKR 100k–180k' },
      { name: 'Cloud Architect', sub: 'Cloud / DevOps', salary: 'PKR 150k–280k' },
    ],
    salaryDist: [
      { range: '0–300K', count: 19 },
      { range: '300k–600k', count: 25 },
      { range: '600k–1M', count: 36 },
      { range: '1M–2M', count: 14 },
      { range: '2M+', count: 3 },
    ],
    genderSplit: { male: 78, female: 22 },
    benefits: [
      { name: 'Medical', pct: 62 },
      { name: 'Dental', pct: 18 },
      { name: 'Vision', pct: 14 },
      { name: 'None', pct: 35 },
    ],
    careers: [
      { title: 'Finance Manager', badge: 'PKR 1m', avgSalary: 'Rs 1,196,663 / year', gender: 'M: 86.9% / F: 13.1%', growth: { entry: '▼44%', early: '▼35%', mid: '▲9%' }, field: 'Business' },
      { title: 'Computer Operator', badge: 'PKR 189k', avgSalary: 'Rs 188,571 / year', gender: 'M: 90.9% / F: 9.1%', growth: { entry: '▲19%', early: '▲13%', mid: '▲245%' }, field: 'Technology' },
      { title: 'Front End Developer / Engineer', badge: 'PKR 650k', avgSalary: 'Rs 650,256 / year', gender: 'M: 90.4% / F: 9.6%', growth: { entry: '▲46%', early: '▲3%', mid: '▲131%' }, field: 'Technology' },
      { title: 'Electrical Engineer', badge: 'PKR 479k', avgSalary: 'Rs 479,200 / year', gender: 'M: 95.1% / F: 4.9%', growth: { entry: '▲22%', early: '▲15%', mid: '▲88%' }, field: 'Engineering' },
      { title: 'Registered Nurse (RN)', badge: 'PKR 121k', avgSalary: 'Rs 121,356 / year', gender: 'M: 28.4% / F: 71.6%', growth: { entry: '▲12%', early: '▲18%', mid: '▲42%' }, field: 'Healthcare' },
      { title: 'Design Architect', badge: 'PKR 614k', avgSalary: 'Rs 614,451 / year', gender: 'M: 72.1% / F: 27.9%', growth: { entry: '▼5%', early: '▲24%', mid: '▲96%' }, field: 'Design' },
      { title: 'Software Engineer', badge: 'PKR 820k', avgSalary: 'Rs 820,000 / year', gender: 'M: 89.2% / F: 10.8%', growth: { entry: '▲32%', early: '▲28%', mid: '▲165%' }, field: 'Technology' },
      { title: 'Data Scientist', badge: 'PKR 950k', avgSalary: 'Rs 950,000 / year', gender: 'M: 82.4% / F: 17.6%', growth: { entry: '▲55%', early: '▲40%', mid: '▲210%' }, field: 'Technology' },
      { title: 'HR Manager', badge: 'PKR 380k', avgSalary: 'Rs 380,000 / year', gender: 'M: 44.6% / F: 55.4%', growth: { entry: '▲8%', early: '▲12%', mid: '▲65%' }, field: 'Business' },
      { title: 'Mechanical Engineer', badge: 'PKR 510k', avgSalary: 'Rs 510,000 / year', gender: 'M: 94.7% / F: 5.3%', growth: { entry: '▲18%', early: '▲22%', mid: '▲74%' }, field: 'Engineering' },
      { title: 'Business Analyst', badge: 'PKR 730k', avgSalary: 'Rs 730,000 / year', gender: 'M: 67.2% / F: 32.8%', growth: { entry: '▲29%', early: '▲35%', mid: '▲120%' }, field: 'Business' },
      { title: 'Graphic Designer', badge: 'PKR 290k', avgSalary: 'Rs 290,000 / year', gender: 'M: 58.3% / F: 41.7%', growth: { entry: '▲10%', early: '▲15%', mid: '▲80%' }, field: 'Design' },
    ],
  },
  International: {
    totalCareers: 97,
    avgSalary: '$95k',
    minSalary: '$28k',
    maxSalary: '$450k',
    summary: [
      { label: 'Avg Starting Salary', value: '$65k', sub: 'per year (USD)', color: '#CD2B40', growth: '+8%' },
      { label: 'Mid-Level Avg', value: '$110k', sub: 'per year (USD)', color: '#7c3aed', growth: '+11%' },
      { label: 'Senior Avg', value: '$160k', sub: 'per year (USD)', color: '#0d9488', growth: '+14%' },
      { label: 'Top Percentile', value: '$250k+', sub: 'per year (USD)', color: '#d97706', growth: '+20%' },
    ],
    bars: [
      { label: 'CS / SE', value: 150, max: 200, color: '#CD2B40' },
      { label: 'Data Sci', value: 175, max: 200, color: '#7c3aed' },
      { label: 'AI / ML', value: 195, max: 200, color: '#0d9488' },
      { label: 'Cyber Sec', value: 165, max: 200, color: '#d97706' },
      { label: 'Elect Eng', value: 130, max: 200, color: '#6366f1' },
      { label: 'BBA', value: 100, max: 200, color: '#ec4899' },
    ],
    demand: [
      { field: 'AI / Machine Learning', pct: 97, color: '#0d9488' },
      { field: 'Cybersecurity', pct: 92, color: '#CD2B40' },
      { field: 'Data Science', pct: 89, color: '#7c3aed' },
      { field: 'Cloud Engineering', pct: 93, color: '#d97706' },
      { field: 'Software Engineering', pct: 95, color: '#6366f1' },
    ],
    roles: [
      { name: 'ML Research Scientist', sub: 'AI & Research (US)', salary: '$150k–$250k' },
      { name: 'Senior SWE (FAANG)', sub: 'Software Engineering (US)', salary: '$180k–$300k' },
      { name: 'Cloud Solutions Architect', sub: 'Cloud / Infrastructure (EU)', salary: '$120k–$200k' },
      { name: 'Data Engineer', sub: 'Data & Analytics (UK)', salary: '£70k–£120k' },
      { name: 'Cybersecurity Lead', sub: 'Info Security (AUS)', salary: 'AUD 140k–200k' },
    ],
    salaryDist: [
      { range: '$0–50K', count: 12 },
      { range: '$50k–100k', count: 28 },
      { range: '$100k–150k', count: 34 },
      { range: '$150k–250k', count: 18 },
      { range: '$250k+', count: 5 },
    ],
    genderSplit: { male: 71, female: 29 },
    benefits: [
      { name: 'Medical', pct: 88 },
      { name: 'Dental', pct: 72 },
      { name: 'Vision', pct: 65 },
      { name: 'None', pct: 5 },
    ],
    careers: [
      { title: 'Software Engineer', badge: '$120k', avgSalary: '$120,000 / year', gender: 'M: 89.2% / F: 10.8%', growth: { entry: '▲32%', early: '▲28%', mid: '▲165%' }, field: 'Technology' },
      { title: 'Data Scientist', badge: '$140k', avgSalary: '$140,000 / year', gender: 'M: 82.4% / F: 17.6%', growth: { entry: '▲55%', early: '▲40%', mid: '▲210%' }, field: 'Technology' },
      { title: 'ML Engineer', badge: '$160k', avgSalary: '$160,000 / year', gender: 'M: 85.1% / F: 14.9%', growth: { entry: '▲60%', early: '▲50%', mid: '▲230%' }, field: 'Technology' },
      { title: 'Finance Manager', badge: '$110k', avgSalary: '$110,000 / year', gender: 'M: 62.4% / F: 37.6%', growth: { entry: '▲15%', early: '▲22%', mid: '▲80%' }, field: 'Business' },
      { title: 'Electrical Engineer', badge: '$95k', avgSalary: '$95,000 / year', gender: 'M: 91.2% / F: 8.8%', growth: { entry: '▲20%', early: '▲18%', mid: '▲75%' }, field: 'Engineering' },
      { title: 'Registered Nurse (RN)', badge: '$75k', avgSalary: '$75,000 / year', gender: 'M: 14.1% / F: 85.9%', growth: { entry: '▲18%', early: '▲22%', mid: '▲55%' }, field: 'Healthcare' },
      { title: 'UX Designer', badge: '$100k', avgSalary: '$100,000 / year', gender: 'M: 48.3% / F: 51.7%', growth: { entry: '▲25%', early: '▲30%', mid: '▲95%' }, field: 'Design' },
      { title: 'Cloud Architect', badge: '$150k', avgSalary: '$150,000 / year', gender: 'M: 87.6% / F: 12.4%', growth: { entry: '▲40%', early: '▲48%', mid: '▲190%' }, field: 'Technology' },
      { title: 'HR Director', badge: '$130k', avgSalary: '$130,000 / year', gender: 'M: 38.4% / F: 61.6%', growth: { entry: '▲10%', early: '▲18%', mid: '▲90%' }, field: 'Business' },
      { title: 'Mechanical Engineer', badge: '$88k', avgSalary: '$88,000 / year', gender: 'M: 88.2% / F: 11.8%', growth: { entry: '▲14%', early: '▲19%', mid: '▲68%' }, field: 'Engineering' },
      { title: 'Product Manager', badge: '$145k', avgSalary: '$145,000 / year', gender: 'M: 64.5% / F: 35.5%', growth: { entry: '▲38%', early: '▲45%', mid: '▲175%' }, field: 'Business' },
      { title: 'Cybersecurity Analyst', badge: '$115k', avgSalary: '$115,000 / year', gender: 'M: 80.3% / F: 19.7%', growth: { entry: '▲28%', early: '▲32%', mid: '▲140%' }, field: 'Technology' },
    ],
  },
}

const ALL_FIELDS = ['All Fields', 'Technology', 'Business', 'Engineering', 'Healthcare', 'Design']
const CAREERS_PER_PAGE = 6

/* ── Icons ──────────────────────────────────────────────────────── */
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
const GenderIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M6 20v-2a6 6 0 0 1 12 0v2" />
  </svg>
)
const ChevronIcon = ({ dir }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'left'
      ? <polyline points="15 18 9 12 15 6" />
      : <polyline points="9 18 15 12 9 6" />}
  </svg>
)
const ViewIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)

/* ── Pie Chart (SVG) ─────────────────────────────────────────────── */
function PieChart({ male, female }) {
  const r = 60
  const cx = 80; const cy = 80
  const total = male + female
  const malePct = male / total
  const maleDeg = malePct * 360
  const rad = (d) => (d * Math.PI) / 180
  const x1 = cx + r * Math.sin(0)
  const y1 = cy - r * Math.cos(0)
  const x2 = cx + r * Math.sin(rad(maleDeg))
  const y2 = cy - r * Math.cos(rad(maleDeg))
  const large = maleDeg > 180 ? 1 : 0

  return (
    <div className="pie-chart-wrap">
      <svg viewBox="0 0 160 160" className="pie-svg">
        {/* Male slice */}
        <path
          d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
          fill="#3b82f6"
        />
        {/* Female slice (rest) */}
        <path
          d={`M ${cx} ${cy} L ${x2} ${y2} A ${r} ${r} 0 ${1 - large} 1 ${x1} ${y1} Z`}
          fill="#f97316"
        />
      </svg>
      <div className="pie-legend">
        <span className="pie-legend-dot" style={{ background: '#3b82f6' }} /> Male {male}%
        <span className="pie-legend-dot" style={{ background: '#f97316', marginLeft: '0.75rem' }} /> Female {female}%
      </div>
    </div>
  )
}

/* ── Growth badge ─────────────────────────────────────────────────── */
function GrowthBadge({ label, value }) {
  const isUp = value.includes('▲')
  return (
    <span className={`career-growth-badge ${isUp ? 'up' : 'down'}`}>
      {label}: <strong>{value}</strong>
    </span>
  )
}

/* ── Career Card ─────────────────────────────────────────────────── */
function CareerCard({ career }) {
  return (
    <div className="career-card-item">
      <div className="career-card-item-header">
        <div className="career-card-item-title">{career.title}</div>
        <span className="career-salary-badge">{career.badge}</span>
      </div>
      <div className="career-card-stats">
        <div className="career-stat-row">
          <SalaryIcon />
          <div>
            <div className="career-stat-label">Average Salary</div>
            <div className="career-stat-value">{career.avgSalary}</div>
          </div>
        </div>
        <div className="career-stat-row">
          <GenderIcon />
          <div>
            <div className="career-stat-label">Gender Split</div>
            <div className="career-stat-value">{career.gender}</div>
          </div>
        </div>
      </div>
      <div className="career-growth-row">
        <span className="career-growth-label">Experience Growth:</span>
        <div className="career-growth-badges">
          <GrowthBadge label="Entry" value={career.growth.entry} />
          <GrowthBadge label="Early" value={career.growth.early} />
          <GrowthBadge label="Mid" value={career.growth.mid} />
        </div>
      </div>
      <button className="career-view-btn" type="button">
        <ViewIcon /> View Details
      </button>
    </div>
  )
}

/* ── Main Component ──────────────────────────────────────────────── */
export default function Payscale() {
  const [activeMarket, setActiveMarket] = useState('Local')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeField, setActiveField] = useState('All Fields')
  const [careerPage, setCareerPage] = useState(1)

  const data = MARKET_DATA[activeMarket]
  const maxBar = Math.max(...data.bars.map((b) => b.value))
  const maxDist = Math.max(...data.salaryDist.map((d) => d.count))

  // Filter careers
  const filteredCareers = data.careers.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesField = activeField === 'All Fields' || c.field === activeField
    return matchesSearch && matchesField
  })

  const totalPages = Math.max(1, Math.ceil(filteredCareers.length / CAREERS_PER_PAGE))
  const pagedCareers = filteredCareers.slice((careerPage - 1) * CAREERS_PER_PAGE, careerPage * CAREERS_PER_PAGE)

  function handleMarketChange(m) {
    setActiveMarket(m)
    setCareerPage(1)
    setSearchQuery('')
    setActiveField('All Fields')
  }

  return (
    <div className="payscale-page">
      {/* ── Page Header ── */}
      <div className="pay-header">
        <div className="pay-title">Salary &amp; Market Insights</div>
        <div className="pay-subtitle">Real salary data from {data.totalCareers} careers. Explore earning potential and industry demand.</div>
      </div>

      {/* ── Market Tabs ── */}
      <div className="pay-tabs">
        {['Local', 'International'].map((m) => (
          <button
            key={m}
            className={`pay-tab${activeMarket === m ? ' active' : ''}`}
            onClick={() => handleMarketChange(m)}
            type="button"
          >
            {m === 'Local' ? '🇵🇰 Local Market' : '🌍 International Market'}
          </button>
        ))}
      </div>

      {/* ── Aggregate Stats Row ── */}
      <div className="pay-agg-row">
        {[
          { label: 'Total Careers', value: data.totalCareers, highlight: '#3b82f6', icon: '📊' },
          { label: 'Avg Salary', value: data.avgSalary, highlight: '#16a34a', icon: '💰' },
          { label: 'Min Salary', value: data.minSalary, highlight: '#CD2B40', icon: '📉' },
          { label: 'Max Salary', value: data.maxSalary, highlight: '#7c3aed', icon: '📈' },
        ].map((s) => (
          <div key={s.label} className="pay-agg-card">
            <div className="pay-agg-label">{s.label} <span className="pay-agg-icon">{s.icon}</span></div>
            <div className="pay-agg-value" style={{ color: s.highlight }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Summary Cards ── */}
      <div className="pay-summary-cards">
        {data.summary.map((s) => (
          <div key={s.label} className="pay-summary-card" style={{ '--card-color': s.color }}>
            <div className="pay-summary-label">{s.label}</div>
            <div className="pay-summary-value">{s.value}</div>
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
            {data.salaryDist.map((d) => (
              <div key={d.range} className="pay-dist-col">
                <div className="pay-dist-count">{d.count}</div>
                <div className="pay-dist-fill" style={{ height: `${(d.count / maxDist) * 140}px` }} />
                <div className="pay-dist-label">{d.range}</div>
              </div>
            ))}
          </div>
          {/* Y-axis hint lines */}
          <div className="pay-dist-yaxis">
            {[36, 27, 18, 9, 0].map((v) => (
              <span key={v} className="pay-dist-ytick">{v}</span>
            ))}
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="pay-card pay-card-gender">
          <div className="pay-card-title">Gender Distribution</div>
          <div className="pay-card-sub">Average across all careers</div>
          <PieChart male={data.genderSplit.male} female={data.genderSplit.female} />
        </div>

        {/* Benefits Coverage */}
        <div className="pay-card pay-card-benefits">
          <div className="pay-card-title">Benefits Coverage</div>
          <div className="pay-card-sub">Average benefits offered</div>
          <div className="pay-benefits-list">
            {data.benefits.map((b) => (
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

      {/* ── Salary Comparison by Degree ── */}
      <div className="pay-charts-grid">
        <div className="pay-card">
          <div className="pay-card-title">Salary Comparison by Degree</div>
          <div className="pay-card-sub">Average mid-career salary ({activeMarket === 'Local' ? 'PKR 000s/mo' : 'USD 000s/yr'})</div>
          <div className="pay-bar-chart">
            {data.bars.map((bar) => (
              <div key={bar.label} className="pay-bar-col">
                <div className="pay-bar-val">{bar.value}k</div>
                <div className="pay-bar-fill" style={{ height: `${(bar.value / maxBar) * 100}%`, background: bar.color }} title={`${bar.label}: ${bar.value}k`} />
                <div className="pay-bar-label">{bar.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Demand Trends */}
        <div className="pay-card">
          <div className="pay-card-title">Demand Trends</div>
          <div className="pay-card-sub">Job market demand index (0–100)</div>
          <div className="pay-demand-list">
            {data.demand.map((item) => (
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

      {/* ── All Careers Section ── */}
      <div className="careers-section">
        {/* Search & Filter */}
        <div className="careers-search-row">
          <div className="careers-search-wrap">
            <SearchIcon />
            <input
              className="careers-search-input"
              placeholder="Search careers (e.g., Software Engineer, Manager, Doctor)..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCareerPage(1) }}
            />
          </div>
          <div className="careers-filter-wrap">
            <FilterIcon />
            <select
              className="careers-filter-select"
              value={activeField}
              onChange={(e) => { setActiveField(e.target.value); setCareerPage(1) }}
            >
              {ALL_FIELDS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Header row */}
        <div className="careers-list-header">
          <span className="careers-list-title">All {data.totalCareers} Careers</span>
          <span className="careers-page-label">Page {careerPage} of {totalPages}</span>
        </div>

        {/* Cards grid */}
        {pagedCareers.length > 0 ? (
          <div className="careers-grid">
            {pagedCareers.map((career) => (
              <CareerCard key={career.title} career={career} />
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
        {totalPages > 1 && (
          <div className="careers-pagination">
            <button
              className="pag-btn"
              onClick={() => setCareerPage((p) => Math.max(1, p - 1))}
              disabled={careerPage === 1}
              type="button"
            >
              <ChevronIcon dir="left" /> Prev
            </button>
            <div className="pag-dots">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`pag-dot${careerPage === i + 1 ? ' active' : ''}`}
                  onClick={() => setCareerPage(i + 1)}
                  type="button"
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              className="pag-btn"
              onClick={() => setCareerPage((p) => Math.min(totalPages, p + 1))}
              disabled={careerPage === totalPages}
              type="button"
            >
              Next <ChevronIcon dir="right" />
            </button>
          </div>
        )}
      </div>

      {/* ── Top Roles ── */}
      <div className="pay-roles-section">
        <p className="career-section-title">Top Job Roles</p>
        <div className="pay-roles-list">
          {data.roles.map((role, i) => (
            <div key={role.name} className="pay-role-item">
              <div className="pay-role-rank">{i + 1}</div>
              <div className="pay-role-info">
                <div className="pay-role-name">{role.name}</div>
                <div className="pay-role-sub">{role.sub}</div>
              </div>
              <div className="pay-role-salary">{role.salary}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
