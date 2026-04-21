import { useState, useEffect, useRef } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/* ─── Data ─────────────────────────────────────────────── */
const JOB_TITLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Mobile App Developer', 'DevOps Engineer', 'Data Scientist', 'Data Analyst',
  'Machine Learning Engineer', 'AI Engineer', 'Product Manager', 'Project Manager',
  'UI/UX Designer', 'Graphic Designer', 'Business Analyst', 'Systems Analyst',
  'QA Engineer', 'Test Engineer', 'Cloud Engineer', 'Cybersecurity Analyst',
  'Database Administrator', 'Network Engineer', 'Embedded Systems Engineer',
  'Accountant', 'CA / Chartered Accountant', 'Finance Analyst', 'HR Manager',
  'Marketing Manager', 'Digital Marketing Executive', 'Content Writer', 'Copywriter',
  'Sales Executive', 'Customer Support Executive', 'Operations Manager',
  'Supply Chain Manager', 'Logistics Executive', 'Civil Engineer', 'Mechanical Engineer',
  'Electrical Engineer', 'Other'
]

const SKILL_SUGGESTIONS = {
  tech: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Go', 'Rust', 'Swift', 'Kotlin',
    'React', 'Vue.js', 'Angular', 'Next.js', 'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot',
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Firebase', 'Supabase',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'Linux',
    'React Native', 'Flutter', 'Android', 'iOS',
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
    'Figma', 'Adobe XD', 'Photoshop', 'Illustrator',
    'Excel', 'Power BI', 'Tableau', 'SQL', 'R',
    'Tally', 'SAP', 'QuickBooks', 'Zoho', 'MS Office'],
  soft: ['Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
    'Time Management', 'Adaptability', 'Creativity', 'Attention to Detail', 'Multitasking',
    'Project Management', 'Client Handling', 'Presentation Skills', 'Negotiation', 'Decision Making']
}

const DEGREE_OPTIONS = [
  'B.Tech / B.E.', 'M.Tech / M.E.', 'BCA', 'MCA', 'B.Sc', 'M.Sc',
  'B.Com', 'M.Com', 'BBA', 'MBA', 'B.A.', 'M.A.',
  'CA (Chartered Accountant)', 'CS (Company Secretary)', 'CMA',
  'MBBS', 'BDS', 'B.Pharm', 'Diploma', '12th / HSC', '10th / SSC', 'Other'
]

const YEARS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i))

const DURATION_OPTIONS = [
  'Jan 2024 – Present', 'Jan 2023 – Dec 2023', 'Jan 2022 – Dec 2022',
  'Jan 2021 – Dec 2021', 'Jan 2020 – Dec 2020',
  '6 months (2024)', '6 months (2023)', '1 year (2023–24)',
  '2 years (2022–24)', '3 years (2021–24)', 'Internship (3 months)', 'Internship (6 months)',
  'Freelance (2022–Present)', 'Part-time (2023–24)'
]

/* ─── Auth Hook ─────────────────────────────────────────── */
function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('rb_token'))
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (token) fetchStatus(token) }, [token])

  async function fetchStatus(t) {
    try {
      const res = await fetch(`${API_BASE}/api/user/status`, { headers: { Authorization: `Bearer ${t}` } })
      const data = await res.json()
      if (res.ok) setStatus(data)
      else logout()
    } catch {}
  }

  async function register(email, password) {
    setLoading(true)
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) throw new Error(data.error)
    localStorage.setItem('rb_token', data.token)
    setToken(data.token); setStatus(data)
  }

  async function login(email, password) {
    setLoading(true)
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) throw new Error(data.error)
    localStorage.setItem('rb_token', data.token)
    setToken(data.token); setStatus(data)
  }

  function logout() {
    localStorage.removeItem('rb_token')
    setToken(null); setStatus(null)
  }

  return { token, status, loading, register, login, logout, fetchStatus: () => fetchStatus(token) }
}

/* ─── Tag Input Component ──────────────────────────────── */
function TagInput({ tags, onAdd, onRemove, suggestions, placeholder, color = '#6C63FF' }) {
  const [input, setInput] = useState('')
  const [showSug, setShowSug] = useState(false)
  const ref = useRef()

  const filtered = input.length > 0
    ? suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)).slice(0, 8)
    : suggestions.filter(s => !tags.includes(s)).slice(0, 10)

  const add = (val) => {
    const v = val.trim()
    if (v && !tags.includes(v)) { onAdd(v); setInput(''); setShowSug(false) }
  }

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 11, padding: '8px 10px', minHeight: 46,
        display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
        cursor: 'text', transition: 'all 0.2s'
      }} onClick={() => { setShowSug(true); ref.current?.querySelector('input')?.focus() }}>
        {tags.map(t => (
          <span key={t} style={{
            background: `${color}22`, border: `1px solid ${color}44`, color: '#fff',
            fontSize: 12, padding: '3px 8px 3px 10px', borderRadius: 20,
            display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500
          }}>
            {t}
            <span onClick={e => { e.stopPropagation(); onRemove(t) }} style={{
              cursor: 'pointer', opacity: 0.5, fontSize: 14, lineHeight: 1,
              padding: '0 2px', borderRadius: '50%', transition: 'opacity 0.2s'
            }}>×</span>
          </span>
        ))}
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setShowSug(true) }}
          onFocus={() => setShowSug(true)}
          onBlur={() => setTimeout(() => setShowSug(false), 150)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); add(input) }
            if (e.key === 'Backspace' && !input && tags.length) onRemove(tags[tags.length - 1])
          }}
          placeholder={tags.length === 0 ? placeholder : ''}
          style={{
            background: 'none', border: 'none', outline: 'none', color: '#fff',
            fontSize: 13, flex: 1, minWidth: 80, fontFamily: 'inherit'
          }}
        />
      </div>
      {showSug && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, marginTop: 4, padding: 6,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', maxHeight: 200, overflowY: 'auto'
        }}>
          {filtered.map(s => (
            <div key={s} onMouseDown={() => add(s)} style={{
              padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.8)',
              transition: 'background 0.15s'
            }} onMouseEnter={e => e.target.style.background = 'rgba(108,99,255,0.15)'}
               onMouseLeave={e => e.target.style.background = 'transparent'}>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Smart Select Component ──────────────────────────── */
function SmartSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div onClick={() => setOpen(!open)} style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 11, color: value ? '#fff' : 'rgba(255,255,255,0.18)',
        fontSize: 14, padding: '11px 36px 11px 14px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.2s', userSelect: 'none',
        ...(open ? { borderColor: 'rgba(108,99,255,0.55)', background: 'rgba(108,99,255,0.07)', boxShadow: '0 0 0 3px rgba(108,99,255,0.13)' } : {})
      }}>
        <span>{value || placeholder}</span>
        <span style={{ position: 'absolute', right: 12, opacity: 0.4, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', fontSize: 12 }}>▼</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, marginTop: 4, boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '8px 8px 4px' }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              style={{
                width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 7, color: '#fff', fontSize: 13, padding: '7px 10px',
                outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto', padding: '4px 8px 8px' }}>
            {filtered.map(o => (
              <div key={o} onMouseDown={() => { onChange(o); setOpen(false); setSearch('') }} style={{
                padding: '8px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 13,
                color: value === o ? '#a89eff' : 'rgba(255,255,255,0.8)',
                background: value === o ? 'rgba(108,99,255,0.15)' : 'transparent',
                fontWeight: value === o ? 600 : 400, transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,99,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = value === o ? 'rgba(108,99,255,0.15)' : 'transparent'}>
                {o}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Experience Entry ──────────────────────────────────── */
function ExperienceEntry({ exp, idx, onChange, onRemove }) {
  const upd = (k, v) => onChange(idx, { ...exp, [k]: v })
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '16px', marginBottom: 10, position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Experience {idx + 1}
        </span>
        {idx > 0 && (
          <button onClick={() => onRemove(idx)} style={{
            background: 'rgba(255,80,80,0.1)', border: 'none', color: '#ff8080',
            fontSize: 11, padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit'
          }}>Remove</button>
        )}
      </div>
      <div className="rb-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label className="rb-label">Job Title / Role</label>
          <input className="rb-input" placeholder="e.g. Software Engineer" value={exp.title} onChange={e => upd('title', e.target.value)} />
        </div>
        <div>
          <label className="rb-label">Company Name</label>
          <input className="rb-input" placeholder="e.g. Infosys, TCS, Startup..." value={exp.company} onChange={e => upd('company', e.target.value)} />
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label className="rb-label">Duration</label>
        <SmartSelect
          value={exp.duration}
          onChange={v => upd('duration', v)}
          options={DURATION_OPTIONS}
          placeholder="e.g. Jan 2022 – Dec 2023"
        />
      </div>
      <div>
        <label className="rb-label">Key Responsibilities / Achievements</label>
        <textarea className="rb-textarea" style={{ minHeight: 70 }}
          placeholder="Kya kiya wahan? e.g. REST APIs banaye, 40% performance improve ki, 5 member team lead ki..."
          value={exp.description} onChange={e => upd('description', e.target.value)} />
      </div>
    </div>
  )
}

/* ─── Education Entry ───────────────────────────────────── */
function EducationEntry({ edu, idx, onChange, onRemove }) {
  const upd = (k, v) => onChange(idx, { ...edu, [k]: v })
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '16px', marginBottom: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Education {idx + 1}
        </span>
        {idx > 0 && (
          <button onClick={() => onRemove(idx)} style={{
            background: 'rgba(255,80,80,0.1)', border: 'none', color: '#ff8080',
            fontSize: 11, padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit'
          }}>Remove</button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label className="rb-label">Degree / Course</label>
          <SmartSelect value={edu.degree} onChange={v => upd('degree', v)} options={DEGREE_OPTIONS} placeholder="Select degree..." />
        </div>
        <div>
          <label className="rb-label">Passing Year</label>
          <SmartSelect value={edu.year} onChange={v => upd('year', v)} options={YEARS} placeholder="Year..." />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label className="rb-label">College / University</label>
          <input className="rb-input" placeholder="e.g. IIT Delhi, DAVV..." value={edu.institution} onChange={e => upd('institution', e.target.value)} />
        </div>
        <div>
          <label className="rb-label">Score / CGPA</label>
          <input className="rb-input" placeholder="e.g. 8.5 CGPA / 85%" value={edu.score} onChange={e => upd('score', e.target.value)} />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   TEMPLATE 1 — CLASSIC
══════════════════════════════════════════════════════════ */
function TemplateClassic({ resume, formData }) {
  return (
    <div className="tpl-classic">
      <div className="tc-head">
        <h1>{formData.name}</h1>
        {resume.jobTitle && <p className="tc-role">{resume.jobTitle}</p>}
        <div className="tc-contact">
          {formData.email && <span>{formData.email}</span>}
          {formData.phone && <><span className="tc-dot">|</span><span>{formData.phone}</span></>}
          {formData.linkedin && <><span className="tc-dot">|</span><span>{formData.linkedin}</span></>}
          {formData.location && <><span className="tc-dot">|</span><span>{formData.location}</span></>}
        </div>
      </div>
      {resume.summary && (
        <div className="tc-section">
          <div className="tc-section-heading">PROFESSIONAL SUMMARY</div>
          <p className="tc-body">{resume.summary}</p>
        </div>
      )}
      {resume.experience?.length > 0 && (
        <div className="tc-section">
          <div className="tc-section-heading">WORK EXPERIENCE</div>
          {resume.experience.map((exp, i) => (
            <div key={i} className="tc-exp">
              <div className="tc-exp-top">
                <div><span className="tc-exp-title">{exp.title}</span>{exp.company && <span className="tc-exp-company"> — {exp.company}</span>}</div>
                <span className="tc-exp-dur">{exp.duration}</span>
              </div>
              {exp.bullets?.length > 0 && <ul className="tc-list">{exp.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
            </div>
          ))}
        </div>
      )}
      {resume.education?.length > 0 && (
        <div className="tc-section">
          <div className="tc-section-heading">EDUCATION</div>
          {resume.education.map((e, i) => (
            <div key={i} className="tc-edu">
              <span className="tc-exp-title">{e.degree}</span>
              <span className="tc-exp-company"> — {e.institution}</span>
              {e.score && <span className="tc-exp-company"> · {e.score}</span>}
              <span className="tc-exp-dur" style={{ float: 'right' }}>{e.year}</span>
            </div>
          ))}
        </div>
      )}
      {resume.skills && (
        <div className="tc-section">
          <div className="tc-section-heading">SKILLS</div>
          {resume.skills.technical?.length > 0 && <p className="tc-body"><strong>Technical: </strong>{resume.skills.technical.join(', ')}</p>}
          {resume.skills.soft?.length > 0 && <p className="tc-body"><strong>Soft Skills: </strong>{resume.skills.soft.join(', ')}</p>}
        </div>
      )}
      {resume.certifications?.length > 0 && (
        <div className="tc-section">
          <div className="tc-section-heading">CERTIFICATIONS</div>
          {resume.certifications.map((c, i) => <p key={i} className="tc-body" style={{ margin: '2px 0' }}>• {c}</p>)}
        </div>
      )}
      {resume.languages?.length > 0 && (
        <div className="tc-section">
          <div className="tc-section-heading">LANGUAGES</div>
          <p className="tc-body">{resume.languages.join(' | ')}</p>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   TEMPLATE 2 — MODERN
══════════════════════════════════════════════════════════ */
function TemplateModern({ resume, formData }) {
  return (
    <div className="tpl-modern">
      <div className="tm-sidebar">
        <div className="tm-avatar">{formData.name?.charAt(0)?.toUpperCase()}</div>
        <h1 className="tm-name">{formData.name}</h1>
        {resume.jobTitle && <p className="tm-role">{resume.jobTitle}</p>}
        <div className="tm-sb-section">
          <div className="tm-sb-title">CONTACT</div>
          <p className="tm-sb-text">{formData.email}</p>
          {formData.phone && <p className="tm-sb-text">{formData.phone}</p>}
          {formData.location && <p className="tm-sb-text">📍 {formData.location}</p>}
          {formData.linkedin && <p className="tm-sb-text">🔗 {formData.linkedin}</p>}
        </div>
        {resume.skills?.technical?.length > 0 && (
          <div className="tm-sb-section">
            <div className="tm-sb-title">TECHNICAL SKILLS</div>
            <div className="tm-tags">{resume.skills.technical.map((s, i) => <span key={i} className="tm-tag">{s}</span>)}</div>
          </div>
        )}
        {resume.skills?.soft?.length > 0 && (
          <div className="tm-sb-section">
            <div className="tm-sb-title">SOFT SKILLS</div>
            <div className="tm-tags">{resume.skills.soft.map((s, i) => <span key={i} className="tm-tag tm-tag-soft">{s}</span>)}</div>
          </div>
        )}
        {resume.education?.length > 0 && (
          <div className="tm-sb-section">
            <div className="tm-sb-title">EDUCATION</div>
            {resume.education.map((e, i) => (
              <div key={i} className="tm-edu">
                <p className="tm-edu-deg">{e.degree}</p>
                <p className="tm-edu-inst">{e.institution}</p>
                {e.score && <p className="tm-edu-yr">{e.score}</p>}
                <p className="tm-edu-yr">{e.year}</p>
              </div>
            ))}
          </div>
        )}
        {resume.languages?.length > 0 && (
          <div className="tm-sb-section">
            <div className="tm-sb-title">LANGUAGES</div>
            {resume.languages.map((l, i) => <p key={i} className="tm-sb-text">{l}</p>)}
          </div>
        )}
        {resume.certifications?.length > 0 && (
          <div className="tm-sb-section">
            <div className="tm-sb-title">CERTIFICATIONS</div>
            {resume.certifications.map((c, i) => <p key={i} className="tm-sb-text" style={{ marginBottom: 4 }}>✓ {c}</p>)}
          </div>
        )}
      </div>
      <div className="tm-main">
        {resume.summary && (
          <div className="tm-section">
            <div className="tm-section-title">About Me</div>
            <p className="tm-body">{resume.summary}</p>
          </div>
        )}
        {resume.experience?.length > 0 && (
          <div className="tm-section">
            <div className="tm-section-title">Work Experience</div>
            {resume.experience.map((exp, i) => (
              <div key={i} className="tm-exp">
                <div className="tm-exp-header">
                  <div><span className="tm-exp-title">{exp.title}</span>{exp.company && <span className="tm-exp-company"> · {exp.company}</span>}</div>
                  <span className="tm-exp-dur">{exp.duration}</span>
                </div>
                {exp.bullets?.length > 0 && <ul className="tm-list">{exp.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   TEMPLATE 3 — EXECUTIVE
══════════════════════════════════════════════════════════ */
function TemplateExecutive({ resume, formData }) {
  return (
    <div className="tpl-exec">
      <div className="te-header">
        <div className="te-header-left">
          <h1 className="te-name">{formData.name}</h1>
          {resume.jobTitle && <p className="te-role">{resume.jobTitle}</p>}
        </div>
        <div className="te-header-right">
          {formData.email && <p className="te-contact-line">✉ {formData.email}</p>}
          {formData.phone && <p className="te-contact-line">☏ {formData.phone}</p>}
          {formData.location && <p className="te-contact-line">📍 {formData.location}</p>}
          {formData.linkedin && <p className="te-contact-line">🔗 {formData.linkedin}</p>}
        </div>
      </div>
      <div className="te-body">
        {resume.summary && (
          <div className="te-section">
            <div className="te-section-title"><span className="te-title-bar" />Professional Profile</div>
            <p className="te-text">{resume.summary}</p>
          </div>
        )}
        {resume.experience?.length > 0 && (
          <div className="te-section">
            <div className="te-section-title"><span className="te-title-bar" />Professional Experience</div>
            {resume.experience.map((exp, i) => (
              <div key={i} className="te-exp">
                <div className="te-exp-header">
                  <div className="te-exp-left">
                    <span className="te-exp-title">{exp.title}</span>
                    {exp.company && <span className="te-exp-company">{exp.company}</span>}
                  </div>
                  <div className="te-exp-badge">{exp.duration}</div>
                </div>
                {exp.bullets?.length > 0 && <ul className="te-list">{exp.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
              </div>
            ))}
          </div>
        )}
        <div className="te-two-col">
          {resume.education?.length > 0 && (
            <div className="te-section te-section-half">
              <div className="te-section-title"><span className="te-title-bar" />Education</div>
              {resume.education.map((e, i) => (
                <div key={i} className="te-edu">
                  <p className="te-edu-deg">{e.degree}</p>
                  <p className="te-edu-inst">{e.institution} · {e.year}</p>
                  {e.score && <p className="te-edu-inst" style={{ color: '#555' }}>{e.score}</p>}
                </div>
              ))}
            </div>
          )}
          {resume.skills && (
            <div className="te-section te-section-half">
              <div className="te-section-title"><span className="te-title-bar" />Core Competencies</div>
              {resume.skills.technical?.length > 0 && (
                <div className="te-skill-grid">{resume.skills.technical.map((s, i) => <span key={i} className="te-skill-chip">{s}</span>)}</div>
              )}
              {resume.skills.soft?.length > 0 && (
                <div className="te-skill-grid" style={{ marginTop: 8 }}>{resume.skills.soft.map((s, i) => <span key={i} className="te-skill-chip te-skill-soft">{s}</span>)}</div>
              )}
            </div>
          )}
        </div>
        {resume.languages?.length > 0 && (
          <div className="te-section">
            <div className="te-section-title"><span className="te-title-bar" />Languages</div>
            <div className="te-skill-grid">{resume.languages.map((l, i) => <span key={i} className="te-skill-chip">{l}</span>)}</div>
          </div>
        )}
        {resume.certifications?.length > 0 && (
          <div className="te-section">
            <div className="te-section-title"><span className="te-title-bar" />Certifications</div>
            <div className="te-skill-grid">{resume.certifications.map((c, i) => <span key={i} className="te-cert-chip">{c}</span>)}</div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function ResumeBuilder() {
  const { token, status, loading, register, login, logout, fetchStatus } = useAuth()
  const [step, setStep] = useState(1)
  const [authMode, setAuthMode] = useState('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [payLoading, setPayLoading] = useState(false)
  const [resume, setResume] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState('classic')

  // Structured form state
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', location: '', linkedin: '',
    jobTitle: '', targetCompany: '',
  })
  const [experiences, setExperiences] = useState([{ title: '', company: '', duration: '', description: '' }])
  const [educations, setEducations] = useState([{ degree: '', institution: '', year: '', score: '' }])
  const [techSkills, setTechSkills] = useState([])
  const [softSkills, setSoftSkills] = useState([])
  const [certifications, setCertifications] = useState([])
  const [languages, setLanguages] = useState(['Hindi', 'English'])
  const [certInput, setCertInput] = useState('')

  useEffect(() => { if (token && status) setStep(2) }, [token, status])

  async function handleAuth(e) {
    e.preventDefault(); setError('')
    try {
      if (authMode === 'register') await register(email, password)
      else await login(email, password)
      setStep(2)
    } catch (err) { setError(err.message) }
  }

  async function handleGenerate(e) {
    e.preventDefault(); setError(''); setGenerating(true)
    // Build structured payload
    const payload = {
      ...formData,
      experiences,
      educations,
      techSkills,
      softSkills,
      certifications,
      languages,
    }
    try {
      const res = await fetch(`${API_BASE}/api/resume/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.status === 403 && data.error === 'free_limit_reached') { setStep(4); return }
      if (!res.ok) throw new Error(data.error)
      setResume(data.resume)
      fetchStatus()
      setTimeout(() => setStep(3), 150)
    } catch (err) { setError(err.message) }
    finally { setGenerating(false) }
  }

  async function handlePayment() {
    setPayLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/payment/create-subscription`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const options = {
        key: data.razorpayKeyId, subscription_id: data.subscriptionId,
        name: 'Zerofy Resume Builder', description: '₹19/month — Unlimited Resumes',
        prefill: { email: status?.email }, theme: { color: '#6C63FF' },
        handler: async () => { await new Promise(r => setTimeout(r, 2000)); await fetchStatus(); setStep(2) },
      }
      const rzp = new window.Razorpay(options); rzp.open()
    } catch (err) { setError(err.message) }
    finally { setPayLoading(false) }
  }

  function handlePrint() {
    const printContent = document.getElementById('resume-print-area').innerHTML
    const win = window.open('', '_blank', 'width=850,height=1100')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Resume — ${formData.name}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}body{background:#fff;font-family:'Inter',sans-serif}
        .tpl-classic{padding:40px 48px;font-family:'Inter',sans-serif;color:#111}
        .tc-head{text-align:center;border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:20px}
        .tc-head h1{font-size:26px;font-weight:700;letter-spacing:-0.5px;color:#111}
        .tc-role{font-size:13px;color:#555;margin-top:3px}
        .tc-contact{font-size:12px;color:#444;margin-top:6px}
        .tc-dot{margin:0 8px}
        .tc-section{margin-bottom:18px}
        .tc-section-heading{font-size:11px;font-weight:700;letter-spacing:.15em;color:#111;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:10px}
        .tc-body{font-size:12.5px;line-height:1.6;color:#333;margin:0}
        .tc-exp{margin-bottom:12px}
        .tc-exp-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px}
        .tc-exp-title{font-size:13px;font-weight:600;color:#111}
        .tc-exp-company{font-size:12.5px;color:#555}
        .tc-exp-dur{font-size:11.5px;color:#777;white-space:nowrap}
        .tc-list{padding-left:16px;margin:4px 0 0}
        .tc-list li{font-size:12.5px;color:#333;line-height:1.55;margin-bottom:2px}
        .tc-edu{margin-bottom:6px;overflow:hidden}
        .tpl-modern{display:flex;min-height:100vh;font-family:'Inter',sans-serif}
        .tm-sidebar{width:240px;min-width:240px;background:#1a237e;color:#fff;padding:32px 20px}
        .tm-avatar{width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;margin:0 auto 12px}
        .tm-name{font-size:18px;font-weight:700;text-align:center;line-height:1.2}
        .tm-role{font-size:11px;text-align:center;color:rgba(255,255,255,.6);margin-top:4px}
        .tm-sb-section{margin-top:20px}
        .tm-sb-title{font-size:9px;font-weight:700;letter-spacing:.12em;color:rgba(255,255,255,.5);margin-bottom:8px}
        .tm-sb-text{font-size:11px;color:rgba(255,255,255,.8);margin-bottom:3px;line-height:1.4;word-break:break-all}
        .tm-tags{display:flex;flex-wrap:wrap;gap:4px}
        .tm-tag{background:rgba(255,255,255,.15);color:#fff;font-size:10px;padding:3px 8px;border-radius:20px}
        .tm-tag-soft{background:rgba(255,255,255,.08)}
        .tm-edu{margin-bottom:8px}
        .tm-edu-deg{font-size:11px;font-weight:600;color:#fff}
        .tm-edu-inst{font-size:10px;color:rgba(255,255,255,.65)}
        .tm-edu-yr{font-size:10px;color:rgba(255,255,255,.45)}
        .tm-main{flex:1;padding:32px 28px;background:#fff;color:#111}
        .tm-section{margin-bottom:22px}
        .tm-section-title{font-size:13px;font-weight:700;color:#1a237e;border-left:3px solid #1a237e;padding-left:10px;margin-bottom:12px;letter-spacing:.02em}
        .tm-body{font-size:12.5px;color:#444;line-height:1.65}
        .tm-exp{margin-bottom:14px}
        .tm-exp-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px}
        .tm-exp-title{font-size:13px;font-weight:600;color:#111}
        .tm-exp-company{font-size:12px;color:#555}
        .tm-exp-dur{font-size:11px;color:#fff;background:#1a237e;padding:2px 8px;border-radius:20px;white-space:nowrap}
        .tm-list{padding-left:16px;margin:4px 0 0}
        .tm-list li{font-size:12.5px;color:#444;line-height:1.55;margin-bottom:2px}
        .tpl-exec{font-family:'Inter',sans-serif;color:#111}
        .te-header{background:#0d1b2a;color:#fff;padding:28px 40px;display:flex;justify-content:space-between;align-items:center}
        .te-name{font-size:26px;font-weight:700;letter-spacing:-.5px}
        .te-role{font-size:13px;color:rgba(255,255,255,.6);margin-top:3px}
        .te-contact-line{font-size:12px;color:rgba(255,255,255,.75);text-align:right;margin-bottom:3px}
        .te-body{padding:28px 40px}
        .te-section{margin-bottom:22px}
        .te-section-title{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:700;color:#0d1b2a;letter-spacing:.05em;text-transform:uppercase;margin-bottom:12px}
        .te-title-bar{width:4px;height:16px;background:#c8a84b;border-radius:2px;display:inline-block;flex-shrink:0}
        .te-text{font-size:12.5px;color:#444;line-height:1.7}
        .te-exp{margin-bottom:14px;padding-left:14px;border-left:2px solid #eee}
        .te-exp-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}
        .te-exp-left{flex:1}
        .te-exp-title{font-size:13.5px;font-weight:600;color:#111;display:block}
        .te-exp-company{font-size:12px;color:#777;display:block;margin-top:1px}
        .te-exp-badge{background:#0d1b2a;color:#fff;font-size:10.5px;padding:3px 10px;border-radius:20px;white-space:nowrap;margin-left:12px}
        .te-list{padding-left:16px;margin:6px 0 0}
        .te-list li{font-size:12.5px;color:#444;line-height:1.6;margin-bottom:2px}
        .te-two-col{display:flex;gap:24px}
        .te-section-half{flex:1}
        .te-edu{margin-bottom:8px}
        .te-edu-deg{font-size:13px;font-weight:600;color:#111}
        .te-edu-inst{font-size:11.5px;color:#777}
        .te-skill-grid{display:flex;flex-wrap:wrap;gap:5px}
        .te-skill-chip{background:#f0f4ff;color:#0d1b2a;font-size:11px;padding:3px 10px;border-radius:4px}
        .te-skill-soft{background:#fff8e6;color:#7a5c00}
        .te-cert-chip{background:#e8f5e9;color:#1b5e20;font-size:11px;padding:3px 10px;border-radius:4px}
      </style></head><body>${printContent}</body></html>`)
    win.document.close(); win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  const upd = (k, v) => setFormData(p => ({ ...p, [k]: v }))

  const TEMPLATES = [
    { id: 'classic', label: 'Classic', desc: 'ATS-friendly, clean B&W', icon: '📄' },
    { id: 'modern',  label: 'Modern',  desc: 'Blue sidebar, polished',  icon: '💼' },
    { id: 'exec',    label: 'Executive', desc: 'Dark header, premium', icon: '🏆' },
  ]

  function renderResume() {
    const fd = { ...formData }
    if (selectedTemplate === 'modern')  return <TemplateModern  resume={resume} formData={fd} />
    if (selectedTemplate === 'exec')    return <TemplateExecutive resume={resume} formData={fd} />
    return <TemplateClassic resume={resume} formData={fd} />
  }

  const addExp = () => setExperiences(p => [...p, { title: '', company: '', duration: '', description: '' }])
  const updExp = (i, val) => setExperiences(p => p.map((e, idx) => idx === i ? val : e))
  const remExp = (i) => setExperiences(p => p.filter((_, idx) => idx !== i))

  const addEdu = () => setEducations(p => [...p, { degree: '', institution: '', year: '', score: '' }])
  const updEdu = (i, val) => setEducations(p => p.map((e, idx) => idx === i ? val : e))
  const remEdu = (i) => setEducations(p => p.filter((_, idx) => idx !== i))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        .rb-wrap{min-height:100vh;background:#080810;font-family:'Inter',sans-serif;position:relative;overflow:hidden}
        .rb-blob{position:fixed;border-radius:50%;filter:blur(80px);opacity:0.15;pointer-events:none;animation:blobFloat 12s ease-in-out infinite alternate}
        .rb-blob-1{width:500px;height:500px;background:#6C63FF;top:-100px;left:-100px}
        .rb-blob-2{width:400px;height:400px;background:#FF6B9D;top:40%;right:-80px;animation-delay:-4s}
        .rb-blob-3{width:350px;height:350px;background:#00D4AA;bottom:-80px;left:30%;animation-delay:-8s}
        @keyframes blobFloat{0%{transform:translate(0,0) scale(1)}100%{transform:translate(30px,40px) scale(1.08)}}
        .rb-wrap::before{content:'';position:fixed;inset:0;pointer-events:none;background-image:linear-gradient(rgba(108,99,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,.04) 1px,transparent 1px);background-size:48px 48px}
        .rb-inner{position:relative;z-index:1;max-width:720px;margin:0 auto;padding:48px 24px 80px}
        .rb-header{text-align:center;margin-bottom:44px;animation:fadeUp .6s ease both}
        .rb-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(108,99,255,.12);border:1px solid rgba(108,99,255,.3);color:#a89eff;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:5px 14px;border-radius:100px;margin-bottom:18px}
        .rb-title{font-size:clamp(28px,6vw,46px);font-weight:700;color:#fff;line-height:1.1;margin:0 0 12px;letter-spacing:-.03em}
        .rb-title span{background:linear-gradient(135deg,#6C63FF,#FF6B9D);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .rb-subtitle{color:rgba(255,255,255,.4);font-size:14px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .rb-steps{display:flex;align-items:center;justify-content:center;margin-bottom:32px;animation:fadeUp .6s ease .1s both}
        .rb-step-dot{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;transition:all .3s}
        .rb-step-dot.done{background:#6C63FF;color:#fff}
        .rb-step-dot.active{background:#fff;color:#080810;box-shadow:0 0 0 4px rgba(108,99,255,.35)}
        .rb-step-dot.idle{background:rgba(255,255,255,.07);color:rgba(255,255,255,.25);border:1px solid rgba(255,255,255,.1)}
        .rb-step-line{flex:1;height:1px;max-width:72px;background:rgba(255,255,255,.1);transition:background .3s}
        .rb-step-line.done{background:#6C63FF}
        .rb-card{background:rgba(255,255,255,.032);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:36px;backdrop-filter:blur(20px);animation:fadeUp .6s ease .15s both}
        @media(max-width:500px){.rb-card{padding:22px}}
        .rb-card-title{font-size:20px;font-weight:700;color:#fff;margin:0 0 5px;letter-spacing:-.02em}
        .rb-card-sub{color:rgba(255,255,255,.32);font-size:13px;margin:0 0 24px}
        .rb-section-divider{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.25);border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:8px;margin:24px 0 14px;display:flex;align-items:center;gap:8px}
        .rb-section-divider::before{content:'';width:3px;height:14px;background:linear-gradient(135deg,#6C63FF,#FF6B9D);border-radius:2px;display:inline-block}
        .rb-field{margin-bottom:14px}
        .rb-label{display:block;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.38);margin-bottom:7px}
        .rb-input,.rb-textarea{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:11px;color:#fff;font-family:'Inter',sans-serif;font-size:14px;padding:11px 14px;outline:none;transition:all .2s;box-sizing:border-box}
        .rb-input::placeholder,.rb-textarea::placeholder{color:rgba(255,255,255,.18)}
        .rb-input:focus,.rb-textarea:focus{border-color:rgba(108,99,255,.55);background:rgba(108,99,255,.07);box-shadow:0 0 0 3px rgba(108,99,255,.13)}
        .rb-textarea{resize:vertical;min-height:78px;line-height:1.5}
        .rb-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        @media(max-width:480px){.rb-grid{grid-template-columns:1fr}}
        .rb-btn{width:100%;padding:13px 22px;border-radius:11px;border:none;font-family:'Inter',sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;margin-top:8px}
        .rb-btn-primary{background:linear-gradient(135deg,#6C63FF,#8B5CF6);color:#fff;box-shadow:0 4px 20px rgba(108,99,255,.3)}
        .rb-btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 28px rgba(108,99,255,.45)}
        .rb-btn-primary:disabled{opacity:.6;cursor:not-allowed}
        .rb-btn-ghost{background:rgba(255,255,255,.05);color:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.09);margin-top:10px}
        .rb-btn-ghost:hover{background:rgba(255,255,255,.09);color:#fff}
        .rb-btn-add{background:rgba(108,99,255,.1);color:#a89eff;border:1px dashed rgba(108,99,255,.3);border-radius:10px;padding:9px 16px;cursor:pointer;font-family:'Inter',sans-serif;font-size:13px;font-weight:500;width:100%;margin-top:4px;transition:all .2s}
        .rb-btn-add:hover{background:rgba(108,99,255,.18);border-color:rgba(108,99,255,.5)}
        .rb-toggle{text-align:center;margin-top:14px;font-size:13px;color:rgba(255,255,255,.3)}
        .rb-toggle span{color:#a89eff;cursor:pointer;font-weight:600;text-decoration:underline;text-underline-offset:3px}
        .rb-error{background:rgba(255,80,80,.09);border:1px solid rgba(255,80,80,.22);color:#ff8080;font-size:13px;padding:10px 14px;border-radius:9px;margin-bottom:12px}
        .rb-usage{display:flex;align-items:center;gap:8px;padding:11px 14px;border-radius:11px;margin-bottom:18px;font-size:13px;font-weight:500}
        .rb-usage.free{background:rgba(255,200,50,.07);border:1px solid rgba(255,200,50,.18);color:#ffc832}
        .rb-usage.paid{background:rgba(0,212,170,.07);border:1px solid rgba(0,212,170,.18);color:#00d4aa}
        .rb-tpl-picker{margin-bottom:24px}
        .rb-tpl-label{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.38);margin-bottom:10px;display:block}
        .rb-tpl-options{display:flex;gap:8px}
        .rb-tpl-opt{flex:1;padding:12px 10px;border-radius:12px;border:1.5px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);cursor:pointer;text-align:center;transition:all .2s}
        .rb-tpl-opt:hover{border-color:rgba(108,99,255,.4);background:rgba(108,99,255,.06)}
        .rb-tpl-opt.selected{border-color:#6C63FF;background:rgba(108,99,255,.12)}
        .rb-tpl-icon{font-size:22px;margin-bottom:5px}
        .rb-tpl-name{font-size:12px;font-weight:600;color:#fff}
        .rb-tpl-desc{font-size:10px;color:rgba(255,255,255,.35);margin-top:2px}
        .rb-resume-wrap{border-radius:14px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.5);margin-bottom:20px}
        /* Templates */
        .tpl-classic{padding:40px 44px;font-family:'Inter',sans-serif;color:#111;background:#fff}
        .tc-head{text-align:center;border-bottom:2px solid #111;padding-bottom:14px;margin-bottom:18px}
        .tc-head h1{font-size:24px;font-weight:700;color:#111;letter-spacing:-.5px;margin:0 0 3px}
        .tc-role{font-size:12.5px;color:#555;margin:3px 0 0}
        .tc-contact{font-size:12px;color:#555;margin-top:6px}
        .tc-dot{margin:0 8px;opacity:.4}
        .tc-section{margin-bottom:16px}
        .tc-section-heading{font-size:10px;font-weight:800;letter-spacing:.18em;color:#111;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:9px}
        .tc-body{font-size:12.5px;line-height:1.65;color:#333;margin:0}
        .tc-exp{margin-bottom:11px}
        .tc-exp-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px}
        .tc-exp-title{font-size:13px;font-weight:700;color:#111}
        .tc-exp-company{font-size:12px;color:#555}
        .tc-exp-dur{font-size:11px;color:#888;white-space:nowrap}
        .tc-list{padding-left:15px;margin:3px 0 0}
        .tc-list li{font-size:12.5px;color:#333;line-height:1.55;margin-bottom:2px}
        .tc-edu{margin-bottom:5px;overflow:hidden}
        .tpl-modern{display:flex;font-family:'Inter',sans-serif;min-height:600px}
        .tm-sidebar{width:220px;min-width:220px;background:#1a237e;padding:28px 18px}
        .tm-avatar{width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#fff;margin:0 auto 10px}
        .tm-name{font-size:16px;font-weight:700;color:#fff;text-align:center;line-height:1.25}
        .tm-role{font-size:10.5px;color:rgba(255,255,255,.55);text-align:center;margin-top:3px}
        .tm-sb-section{margin-top:18px}
        .tm-sb-title{font-size:8.5px;font-weight:800;letter-spacing:.14em;color:rgba(255,255,255,.45);margin-bottom:7px;text-transform:uppercase}
        .tm-sb-text{font-size:11px;color:rgba(255,255,255,.78);margin-bottom:3px;line-height:1.4;word-break:break-all}
        .tm-tags{display:flex;flex-wrap:wrap;gap:4px}
        .tm-tag{background:rgba(255,255,255,.15);color:#fff;font-size:10px;padding:2px 7px;border-radius:20px}
        .tm-tag-soft{background:rgba(255,255,255,.08)}
        .tm-edu{margin-bottom:8px}
        .tm-edu-deg{font-size:11px;font-weight:600;color:#fff}
        .tm-edu-inst{font-size:10px;color:rgba(255,255,255,.6);margin-top:1px}
        .tm-edu-yr{font-size:10px;color:rgba(255,255,255,.4)}
        .tm-main{flex:1;padding:28px 24px;background:#fff;color:#111}
        .tm-section{margin-bottom:20px}
        .tm-section-title{font-size:12px;font-weight:700;color:#1a237e;border-left:3px solid #1a237e;padding-left:9px;margin-bottom:10px;letter-spacing:.02em}
        .tm-body{font-size:12.5px;color:#444;line-height:1.65}
        .tm-exp{margin-bottom:12px}
        .tm-exp-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;flex-wrap:wrap;gap:4px}
        .tm-exp-title{font-size:13px;font-weight:600;color:#111}
        .tm-exp-company{font-size:12px;color:#666}
        .tm-exp-dur{font-size:10.5px;color:#fff;background:#1a237e;padding:2px 8px;border-radius:20px;white-space:nowrap}
        .tm-list{padding-left:15px;margin:4px 0 0}
        .tm-list li{font-size:12.5px;color:#444;line-height:1.55;margin-bottom:2px}
        .tpl-exec{font-family:'Inter',sans-serif;background:#fff}
        .te-header{background:#0d1b2a;color:#fff;padding:26px 36px;display:flex;justify-content:space-between;align-items:center;gap:16px}
        .te-name{font-size:24px;font-weight:700;letter-spacing:-.5px}
        .te-role{font-size:12px;color:rgba(255,255,255,.55);margin-top:3px}
        .te-contact-line{font-size:11.5px;color:rgba(255,255,255,.7);text-align:right;margin-bottom:2px}
        .te-body{padding:26px 36px}
        .te-section{margin-bottom:20px}
        .te-section-title{display:flex;align-items:center;gap:9px;font-size:11px;font-weight:800;color:#0d1b2a;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px}
        .te-title-bar{width:3px;height:14px;background:#c8a84b;border-radius:2px;display:inline-block;flex-shrink:0}
        .te-text{font-size:12.5px;color:#444;line-height:1.7}
        .te-exp{margin-bottom:13px;padding-left:12px;border-left:2px solid #e8e8e8}
        .te-exp-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:5px;flex-wrap:wrap;gap:4px}
        .te-exp-left{flex:1}
        .te-exp-title{font-size:13px;font-weight:700;color:#111;display:block}
        .te-exp-company{font-size:11.5px;color:#777;display:block;margin-top:1px}
        .te-exp-badge{background:#0d1b2a;color:#fff;font-size:10px;padding:2px 9px;border-radius:20px;white-space:nowrap}
        .te-list{padding-left:15px;margin:5px 0 0}
        .te-list li{font-size:12.5px;color:#444;line-height:1.6;margin-bottom:2px}
        .te-two-col{display:flex;gap:20px}
        .te-section-half{flex:1}
        .te-edu{margin-bottom:7px}
        .te-edu-deg{font-size:13px;font-weight:600;color:#111}
        .te-edu-inst{font-size:11.5px;color:#777;margin-top:1px}
        .te-skill-grid{display:flex;flex-wrap:wrap;gap:5px}
        .te-skill-chip{background:#eef0ff;color:#0d1b2a;font-size:11px;padding:3px 9px;border-radius:4px}
        .te-skill-soft{background:#fff8e6;color:#7a5c00}
        .te-cert-chip{background:#e8f5e9;color:#1b5e20;font-size:11px;padding:3px 9px;border-radius:4px}
        .rb-paywall{text-align:center;padding:16px 0}
        .rb-price-badge{font-size:44px;font-weight:800;background:linear-gradient(135deg,#6C63FF,#FF6B9D);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:12px 0 4px;display:inline-block}
        .rb-features{list-style:none;padding:0;margin:14px 0 20px;text-align:left;display:inline-block}
        .rb-features li{color:rgba(255,255,255,.55);font-size:13.5px;padding:4px 0}
        .rb-features li::before{content:'✦';color:#6C63FF;margin-right:10px;font-size:9px}
        .rb-logout{background:none;border:none;color:rgba(255,255,255,.2);font-size:12px;cursor:pointer;margin-top:10px;font-family:'Inter',sans-serif;width:100%;text-align:center}
        .rb-logout:hover{color:rgba(255,255,255,.4)}
        .rb-progress{display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(108,99,255,.07);border:1px solid rgba(108,99,255,.2);border-radius:10px;margin-bottom:16px;color:#a89eff;font-size:13px;font-weight:500}
        .rb-generating-dots::after{content:'...';animation:dots 1.2s steps(4,end) infinite}
        @keyframes dots{0%,20%{content:'.'}40%{content:'..'}60%,100%{content:'...'}}
      `}</style>

      <div className="rb-wrap">
        <div className="rb-blob rb-blob-1" /><div className="rb-blob rb-blob-2" /><div className="rb-blob rb-blob-3" />
        <div className="rb-inner">

          {/* Header */}
          <div className="rb-header">
            <div className="rb-badge">✦ AI Powered</div>
            <h1 className="rb-title">Resume jo <span>impress</span> kare</h1>
            <p className="rb-subtitle">AI se ATS-optimized professional resume banao — sirf 60 seconds mein</p>
          </div>

          {/* Steps */}
          <div className="rb-steps">
            {['Account', 'Details', 'Resume', 'Plan'].map((s, i) => {
              const n = i + 1; const cls = step > n ? 'done' : step === n ? 'active' : 'idle'
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                  <div className={`rb-step-dot ${cls}`}>{step > n ? '✓' : n}</div>
                  {i < 3 && <div className={`rb-step-line ${step > n ? 'done' : ''}`} />}
                </div>
              )
            })}
          </div>

          {/* ── STEP 1: Auth ── */}
          {step === 1 && (
            <div className="rb-card">
              <h2 className="rb-card-title">{authMode === 'register' ? 'Account banao' : 'Wapas aao'}</h2>
              <p className="rb-card-sub">{authMode === 'register' ? '2 resumes bilkul free — koi credit card nahi' : 'Apne account mein login karo'}</p>
              {error && <div className="rb-error">{error}</div>}
              <form onSubmit={handleAuth}>
                <div className="rb-field">
                  <label className="rb-label">Email</label>
                  <input className="rb-input" type="email" placeholder="aap@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                </div>
                <div className="rb-field">
                  <label className="rb-label">Password</label>
                  <input className="rb-input" type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="rb-btn rb-btn-primary" disabled={loading}>
                  {loading ? 'Thoda ruko...' : authMode === 'register' ? '✦ Account Banao — Free' : '→ Login Karo'}
                </button>
              </form>
              <div className="rb-toggle">
                {authMode === 'register' ? 'Pehle se account hai? ' : 'Naya account? '}
                <span onClick={() => { setAuthMode(authMode === 'register' ? 'login' : 'register'); setError('') }}>
                  {authMode === 'register' ? 'Login karo' : 'Register karo'}
                </span>
              </div>
            </div>
          )}

          {/* ── STEP 2: Advanced Form ── */}
          {step === 2 && (
            <div className="rb-card">
              <h2 className="rb-card-title">✦ Apni details bharo</h2>
              <p className="rb-card-sub">Jitna detail doge, utna acha resume banega</p>

              <div className={`rb-usage ${status?.plan === 'paid' ? 'paid' : 'free'}`}>
                {status?.plan === 'paid'
                  ? '✦ Paid Plan — Unlimited resumes'
                  : `◆ Free: ${status?.resumesLeft ?? 0} resume bacha hai (${status?.resumeCount ?? 0}/${status?.freeLimit ?? 2} use hua)`}
              </div>

              {/* Template Picker */}
              <div className="rb-tpl-picker">
                <span className="rb-tpl-label">Template choose karo</span>
                <div className="rb-tpl-options">
                  {TEMPLATES.map(t => (
                    <div key={t.id} className={`rb-tpl-opt ${selectedTemplate === t.id ? 'selected' : ''}`} onClick={() => setSelectedTemplate(t.id)}>
                      <div className="rb-tpl-icon">{t.icon}</div>
                      <div className="rb-tpl-name">{t.label}</div>
                      <div className="rb-tpl-desc">{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {error && <div className="rb-error">{error}</div>}

              <form onSubmit={handleGenerate}>

                {/* Personal Info */}
                <div className="rb-section-divider">Personal Information</div>
                <div className="rb-grid" style={{ marginBottom: 10 }}>
                  <div className="rb-field">
                    <label className="rb-label">Full Name *</label>
                    <input className="rb-input" placeholder="Rahul Sharma" value={formData.name} onChange={e => upd('name', e.target.value)} required />
                  </div>
                  <div className="rb-field">
                    <label className="rb-label">Phone *</label>
                    <input className="rb-input" type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={e => upd('phone', e.target.value)} required />
                  </div>
                  <div className="rb-field">
                    <label className="rb-label">Email *</label>
                    <input className="rb-input" type="email" placeholder="rahul@gmail.com" value={formData.email} onChange={e => upd('email', e.target.value)} required />
                  </div>
                  <div className="rb-field">
                    <label className="rb-label">Location</label>
                    <input className="rb-input" placeholder="e.g. Mumbai, Maharashtra" value={formData.location} onChange={e => upd('location', e.target.value)} />
                  </div>
                </div>
                <div className="rb-field" style={{ marginBottom: 0 }}>
                  <label className="rb-label">LinkedIn / Portfolio (optional)</label>
                  <input className="rb-input" placeholder="linkedin.com/in/rahul or yourwebsite.com" value={formData.linkedin} onChange={e => upd('linkedin', e.target.value)} />
                </div>

                {/* Job Target */}
                <div className="rb-section-divider">Job Target</div>
                <div className="rb-grid" style={{ marginBottom: 10 }}>
                  <div className="rb-field">
                    <label className="rb-label">Target Job Title *</label>
                    <SmartSelect value={formData.jobTitle} onChange={v => upd('jobTitle', v)} options={JOB_TITLES} placeholder="Select job role..." />
                  </div>
                  <div className="rb-field">
                    <label className="rb-label">Target Company (optional)</label>
                    <input className="rb-input" placeholder="Google, TCS, Infosys..." value={formData.targetCompany} onChange={e => upd('targetCompany', e.target.value)} />
                  </div>
                </div>

                {/* Experience */}
                <div className="rb-section-divider">Work Experience</div>
                {experiences.map((exp, i) => (
                  <ExperienceEntry key={i} exp={exp} idx={i} onChange={updExp} onRemove={remExp} />
                ))}
                <button type="button" className="rb-btn-add" onClick={addExp}>+ Aur Experience Add Karo</button>

                {/* Education */}
                <div className="rb-section-divider">Education</div>
                {educations.map((edu, i) => (
                  <EducationEntry key={i} edu={edu} idx={i} onChange={updEdu} onRemove={remEdu} />
                ))}
                <button type="button" className="rb-btn-add" onClick={addEdu} style={{ marginTop: 4 }}>+ Aur Education Add Karo</button>

                {/* Skills */}
                <div className="rb-section-divider">Skills</div>
                <div className="rb-field">
                  <label className="rb-label">Technical Skills — type karke ya select karke add karo</label>
                  <TagInput
                    tags={techSkills} onAdd={t => setTechSkills(p => [...p, t])} onRemove={t => setTechSkills(p => p.filter(x => x !== t))}
                    suggestions={SKILL_SUGGESTIONS.tech} placeholder="e.g. React, Python, Excel..." color="#6C63FF"
                  />
                </div>
                <div className="rb-field">
                  <label className="rb-label">Soft Skills</label>
                  <TagInput
                    tags={softSkills} onAdd={t => setSoftSkills(p => [...p, t])} onRemove={t => setSoftSkills(p => p.filter(x => x !== t))}
                    suggestions={SKILL_SUGGESTIONS.soft} placeholder="e.g. Leadership, Communication..." color="#FF6B9D"
                  />
                </div>

                {/* Languages */}
                <div className="rb-section-divider">Languages</div>
                <div className="rb-field">
                  <label className="rb-label">Aap konsi languages jaante ho?</label>
                  <TagInput
                    tags={languages} onAdd={t => setLanguages(p => [...p, t])} onRemove={t => setLanguages(p => p.filter(x => x !== t))}
                    suggestions={['Hindi', 'English', 'Gujarati', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Punjabi', 'Urdu', 'Rajasthani', 'Odia', 'Malayalam']}
                    placeholder="Language add karo..." color="#00D4AA"
                  />
                </div>

                {/* Certifications */}
                <div className="rb-section-divider">Certifications (optional)</div>
                <div className="rb-field">
                  <label className="rb-label">Certifications — type karke Enter dabao</label>
                  <TagInput
                    tags={certifications} onAdd={t => setCertifications(p => [...p, t])} onRemove={t => setCertifications(p => p.filter(x => x !== t))}
                    suggestions={['AWS Certified', 'Google Cloud Professional', 'Microsoft Azure', 'Meta Front-End Developer', 'Google Analytics', 'HubSpot Marketing', 'PMP', 'Scrum Master', 'CFA Level 1', 'CA Final', 'IELTS', 'Six Sigma']}
                    placeholder="e.g. AWS Certified, Google Analytics..." color="#F59E0B"
                  />
                </div>

                {generating && (
                  <div className="rb-progress">
                    <span style={{ fontSize: 18 }}>✨</span>
                    <span>AI aapka resume bana raha hai<span className="rb-generating-dots" /></span>
                  </div>
                )}

                <button type="submit" className="rb-btn rb-btn-primary" disabled={generating} style={{ marginTop: 16 }}>
                  {generating ? '✦ AI kaam kar raha hai...' : '✦ Resume Generate Karo'}
                </button>
                <button type="button" className="rb-logout" onClick={logout}>Logout</button>
              </form>
            </div>
          )}

          {/* ── STEP 3: Result ── */}
          {step === 3 && resume && (
            <div className="rb-card">
              <h2 className="rb-card-title">🎉 Aapka Resume Taiyaar!</h2>
              <p className="rb-card-sub">Template change karo ya PDF save karo</p>
              <div className="rb-tpl-picker" style={{ marginBottom: 16 }}>
                <div className="rb-tpl-options">
                  {TEMPLATES.map(t => (
                    <div key={t.id} className={`rb-tpl-opt ${selectedTemplate === t.id ? 'selected' : ''}`} onClick={() => setSelectedTemplate(t.id)}>
                      <div className="rb-tpl-icon">{t.icon}</div>
                      <div className="rb-tpl-name">{t.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rb-resume-wrap">
                <div id="resume-print-area">{renderResume()}</div>
              </div>
              <button className="rb-btn rb-btn-primary" onClick={handlePrint}>🖨️ Print / Save as PDF</button>
              <button className="rb-btn rb-btn-ghost" onClick={() => { setStep(2); setResume(null) }}>← Naya Resume Banao</button>
            </div>
          )}

          {/* ── STEP 4: Paywall ── */}
          {step === 4 && (
            <div className="rb-card">
              <div className="rb-paywall">
                <div style={{ fontSize: 44, marginBottom: 8 }}>✦</div>
                <h2 className="rb-card-title">Free limit khatam</h2>
                <p className="rb-card-sub">{status?.freeLimit ?? 2} free resumes use ho gaye</p>
                <div className="rb-price-badge">₹19<span style={{ fontSize: 18, fontWeight: 400 }}>/mo</span></div>
                <p style={{ color: 'rgba(255,255,255,.28)', fontSize: 13, margin: '0 0 18px' }}>Cancel anytime · Instant access</p>
                <ul className="rb-features">
                  <li>Unlimited AI-generated resumes</li>
                  <li>3 professional templates</li>
                  <li>ATS-optimized content</li>
                  <li>Download as PDF</li>
                  <li>Priority support</li>
                </ul>
                {error && <div className="rb-error">{error}</div>}
                <button className="rb-btn rb-btn-primary" onClick={handlePayment} disabled={payLoading}>
                  {payLoading ? 'Processing...' : '💳 ₹19/month se unlock karo'}
                </button>
                <button className="rb-btn rb-btn-ghost" onClick={() => setStep(2)}>← Wapas jao</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
