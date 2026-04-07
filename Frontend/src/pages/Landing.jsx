import { Link } from 'react-router-dom'
import './Landing.css'

const FEATURES = [
  {
    title: 'AI Admission Assistant',
    desc: 'Ask anything about admissions, eligibility, fee structure, deadlines, and policies — in natural language.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="7" width="18" height="10" rx="2" />
        <circle cx="9" cy="12" r="1.5" fill="currentColor" />
        <circle cx="15" cy="12" r="1.5" fill="currentColor" />
        <path d="M8 4h8" />
        <path d="M12 2v2" />
      </svg>
    ),
  },
  {
    title: 'FAST Programs & Campuses',
    desc: 'Explore programs and campus-specific availability with quick, structured answers.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10v6" />
        <path d="M6 2h12v20H6z" />
        <path d="M9 6h6M9 10h6M9 14h6" />
      </svg>
    ),
  },
  {
    title: 'History & Continuity',
    desc: 'Your conversation is stored so you can continue where you left off after logging in.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 3v6h6" />
        <path d="M12 7v6l4 2" />
      </svg>
    ),
  },
]

const MODULES = [
  {
    title: 'Admissions Assistant',
    tag: 'Live',
    desc: 'Eligibility, fee structure, campus-wise programs, and admissions timeline in one conversational flow.',
  },
  {
    title: 'Career Counselling',
    tag: 'AI',
    desc: 'Get personalized career direction, strengths-based guidance, and suggested academic pathways.',
  },
  {
    title: 'Mock Test Preparation',
    tag: 'Prep',
    desc: 'Practice-focused support with preparation tips, strategy guidance, and confidence-building paths.',
  },
]

const STEPS = [
  { k: '01', title: 'Log in to dashboard', desc: 'Access the dashboard and your saved chat history.' },
  { k: '02', title: 'Ask your question', desc: 'Eligibility, fee structure, important dates, test pattern — anything.' },
  { k: '03', title: 'Get verified guidance', desc: 'Answers are grounded in your curated admission documents.' },
]

export default function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-bg" aria-hidden>
          <div className="blob blob-a" />
          <div className="blob blob-b" />
          <div className="grid" />
        </div>

        <div className="hero-inner">
          <div className="hero-left">
            <div className="pill">
              <span className="dot" />
              FAST Admissions • AI-powered assistant
            </div>

            <h1 className="hero-title">
              Your <span className="accent">FAST</span> admission journey, simplified.
            </h1>

            <p className="hero-subtitle">
              Talk2FAST helps students find the right information fast — programs, eligibility,
              timelines, fee structure, policies, career counselling, and mock-test preparation —
              with a modern dashboard experience.
            </p>

            <div className="hero-cta">
              <Link to="/login" className="btn btn-primary">
                Explore more
                <span className="btn-arrow" aria-hidden>
                  →
                </span>
              </Link>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <div className="stat-num">24/7</div>
                <div className="stat-label">Assistant</div>
              </div>
              <div className="stat">
                <div className="stat-num">RAG</div>
                <div className="stat-label">Grounded answers</div>
              </div>
              <div className="stat">
                <div className="stat-num">3+</div>
                <div className="stat-label">Core modules</div>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="mock">
              <div className="mock-top">
                <div className="mock-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="mock-title">AI Admission Assistant</div>
              </div>
              <div className="mock-body">
                <div className="msg msg-user">
                  <div className="bubble">What programs are offered at Islamabad Campus?</div>
                </div>
                <div className="msg msg-ai">
                  <div className="bubble">
                    Here are the programs available at Islamabad Campus along with eligibility and
                    admission timelines. Ask for BS/MS specifically to filter.
                  </div>
                </div>
                <div className="msg msg-user">
                  <div className="bubble">Explain the fee structure for BS.</div>
                </div>
                <div className="msg msg-ai">
                  <div className="bubble">
                    I can summarize tuition, semester fee, and important payment deadlines. Want a
                    campus-wise breakdown?
                  </div>
                </div>
                <div className="typing" aria-hidden>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>

            <div className="floating-card float-a">
              <div className="fc-icon">✓</div>
              <div>
                <div className="fc-title">Eligibility checks</div>
                <div className="fc-sub">BS / MS requirements</div>
              </div>
            </div>
            <div className="floating-card float-b">
              <div className="fc-icon">⚡</div>
              <div>
                <div className="fc-title">Quick answers</div>
                <div className="fc-sub">With sources</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-modules">
        <div className="section-inner">
          <div className="section-head">
            <h2>Core modules</h2>
            <p>
              A complete student support suite: admissions guidance, career counselling, and mock
              test preparation — all inside one unified experience.
            </p>
          </div>

          <div className="module-grid">
            {MODULES.map((m, idx) => (
              <div
                key={m.title}
                className="module-card"
                style={{ animationDelay: `${idx * 120}ms` }}
              >
                <div className="module-head">
                  <h3>{m.title}</h3>
                  <span className="module-tag">{m.tag}</span>
                </div>
                <p>{m.desc}</p>
                <div className="module-line" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-head">
            <h2>Everything in one place</h2>
            <p>
              Built for students who want clarity. Designed for speed. Crafted with a clean UI and
              helpful flows.
            </p>
          </div>

          <div className="cards">
            {FEATURES.map((f) => (
              <div key={f.title} className="card">
                <div className="card-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="section-inner">
          <div className="section-head">
            <h2>How it works</h2>
            <p>Start in seconds. Get answers in a chat experience that feels familiar.</p>
          </div>

          <div className="steps">
            {STEPS.map((s) => (
              <div key={s.k} className="step">
                <div className="step-k">{s.k}</div>
                <div className="step-body">
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="cta-strip">
            <div>
              <div className="cta-title">Ready to explore?</div>
              <div className="cta-sub">Log in to access the dashboard and AI assistant.</div>
            </div>
            <Link to="/login" className="btn btn-primary">
              Explore more <span className="btn-arrow" aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

