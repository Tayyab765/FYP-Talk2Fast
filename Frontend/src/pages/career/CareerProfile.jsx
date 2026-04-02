import { useState } from 'react'
import './CareerProfile.css'

const INTERESTS = ['Technology', 'Healthcare', 'Business', 'Arts', 'Sciences', 'Education', 'Engineering', 'Law', 'Media', 'Sports']
const COMPLETION = 62

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)
const SaveCheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

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

export default function CareerProfile() {
  const [editAcad, setEditAcad] = useState(false)
  const [editInt, setEditInt] = useState(false)
  const [editSkills, setEditSkills] = useState(false)
  const [toast, setToast] = useState(false)

  const [acadForm, setAcadForm] = useState({
    year: '2nd Year',
    major: 'Pre-Engineering',
    matric: '87',
    inter: '73',
    institution: 'Punjab College',
  })
  const [acadErrors, setAcadErrors] = useState({})

  const [interests, setInterests] = useState(['Technology', 'Engineering', 'Sciences'])
  const [skills, setSkills] = useState(['Python', 'Mathematics', 'Problem Solving'])
  const [skillInput, setSkillInput] = useState('')

  function validateAcad() {
    const errors = {}
    const m = parseInt(acadForm.matric, 10)
    const i = parseInt(acadForm.inter, 10)
    if (isNaN(m) || m < 0 || m > 100) errors.matric = 'Enter a valid % (0–100)'
    if (acadForm.inter && (isNaN(i) || i < 0 || i > 100)) errors.inter = 'Enter a valid % (0–100)'
    return errors
  }

  function saveAcad() {
    const errors = validateAcad()
    if (Object.keys(errors).length) { setAcadErrors(errors); return }
    setAcadErrors({})
    setEditAcad(false)
    showToast()
  }

  function toggleInterest(item) {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    )
  }

  function addSkill() {
    const s = skillInput.trim()
    if (s && !skills.includes(s)) setSkills((prev) => [...prev, s])
    setSkillInput('')
  }

  function removeSkill(s) {
    setSkills((prev) => prev.filter((x) => x !== s))
  }

  function showToast() {
    setToast(true)
    setTimeout(() => setToast(false), 2200)
  }

  return (
    <div className="career-profile-page">
      {/* Header */}
      <div className="profile-page-header">
        <div>
          <div className="profile-page-title">My Career Profile</div>
          <div className="profile-page-subtitle">Keep your profile updated for better recommendations.</div>
        </div>
        <div className="profile-completion-bar">
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Profile</span>
          <div className="profile-completion-track">
            <div className="profile-completion-fill" style={{ width: `${COMPLETION}%` }} />
          </div>
          <span className="profile-completion-text">{COMPLETION}% complete</span>
        </div>
      </div>

      <div className="profile-grid">
        {/* Academic Info */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-title">
              <div className="profile-card-icon"><AcadIcon /></div>
              Academic Information
            </div>
            {editAcad
              ? <button className="profile-save-btn" onClick={saveAcad}><SaveCheckIcon /> Save</button>
              : <button className="profile-edit-btn" onClick={() => setEditAcad(true)}><EditIcon /> Edit</button>
            }
          </div>
          <div className="profile-card-body">
            <div className="profile-fields-grid">
              {[
                { key: 'year', label: 'Academic Year', placeholder: 'e.g. 2nd Year' },
                { key: 'major', label: 'Major / Group', placeholder: 'e.g. Pre-Engineering' },
                { key: 'matric', label: 'Matric %', placeholder: '0–100' },
                { key: 'inter', label: 'Inter % (if applicable)', placeholder: '0–100' },
                { key: 'institution', label: 'Institution', placeholder: 'College / University' },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="profile-field">
                  <label className="profile-field-label">{label}</label>
                  <input
                    className={`profile-field-input${acadErrors[key] ? ' error' : ''}`}
                    value={acadForm[key]}
                    placeholder={placeholder}
                    disabled={!editAcad}
                    onChange={(e) => setAcadForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                  {acadErrors[key] && <span className="profile-error-msg">{acadErrors[key]}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-title">
              <div className="profile-card-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}><StarIcon /></div>
              Interests
            </div>
            {editInt
              ? <button className="profile-save-btn" onClick={() => { setEditInt(false); showToast() }}><SaveCheckIcon /> Save</button>
              : <button className="profile-edit-btn" onClick={() => setEditInt(true)}><EditIcon /> Edit</button>
            }
          </div>
          <div className="profile-card-body">
            <div className="profile-chips">
              {INTERESTS.map((item) => (
                <button
                  key={item}
                  className={`profile-chip${interests.includes(item) ? ' selected' : ''}`}
                  onClick={() => editInt && toggleInterest(item)}
                  disabled={!editInt}
                  type="button"
                >
                  {interests.includes(item) && <SaveCheckIcon />}
                  {item}
                </button>
              ))}
            </div>
            {!editInt && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Click Edit to update your interests.</p>}
          </div>
        </div>

        {/* Skills */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-title">
              <div className="profile-card-icon" style={{ background: '#f0fdfa', color: '#0d9488' }}><BoltIcon /></div>
              Skills
            </div>
            {editSkills
              ? <button className="profile-save-btn" onClick={() => { setEditSkills(false); showToast() }}><SaveCheckIcon /> Save</button>
              : <button className="profile-edit-btn" onClick={() => setEditSkills(true)}><EditIcon /> Edit</button>
            }
          </div>
          <div className="profile-card-body">
            <div className="skill-tags">
              {skills.map((s) => (
                <span key={s} className="skill-tag">
                  {s}
                  {editSkills && (
                    <button className="skill-tag-remove" onClick={() => removeSkill(s)} type="button">
                      <XIcon />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {editSkills && (
              <div className="skill-add-row">
                <input
                  className="skill-add-input"
                  placeholder="Add a skill..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                />
                <button className="skill-add-btn" onClick={addSkill} type="button">+ Add</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="profile-toast">
          <SaveCheckIcon /> Changes saved successfully!
        </div>
      )}
    </div>
  )
}
