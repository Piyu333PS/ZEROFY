import { useState, useRef, useCallback } from 'react'

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const JOB_TITLES = [
  'Software Engineer','Frontend Developer','Backend Developer','Full Stack Developer',
  'Mobile App Developer','DevOps Engineer','Data Scientist','Data Analyst',
  'Machine Learning Engineer','AI Engineer','Product Manager','Project Manager',
  'UI/UX Designer','Graphic Designer','Business Analyst','Systems Analyst',
  'QA Engineer','Test Engineer','Cloud Engineer','Cybersecurity Analyst',
  'Database Administrator','Network Engineer','Embedded Systems Engineer',
  'Accountant','CA / Chartered Accountant','Finance Analyst','HR Manager',
  'Marketing Manager','Digital Marketing Executive','Content Writer','Copywriter',
  'Sales Executive','Customer Support Executive','Operations Manager',
  'Supply Chain Manager','Logistics Executive','Civil Engineer','Mechanical Engineer',
  'Electrical Engineer','Teacher / Lecturer','Doctor / Physician','Lawyer','Other'
]

const SKILL_SUGGESTIONS = {
  tech: ['JavaScript','TypeScript','Python','Java','C++','C#','PHP','Go','Rust','Swift','Kotlin',
    'React','Vue.js','Angular','Next.js','Node.js','Express.js','Django','Flask','FastAPI','Spring Boot',
    'MySQL','PostgreSQL','MongoDB','Redis','Firebase','Supabase',
    'AWS','Azure','GCP','Docker','Kubernetes','CI/CD','Git','Linux',
    'React Native','Flutter','Android','iOS',
    'Machine Learning','Deep Learning','TensorFlow','PyTorch','Pandas','NumPy',
    'Figma','Adobe XD','Photoshop','Illustrator',
    'Excel','Power BI','Tableau','SQL','R',
    'Tally','SAP','QuickBooks','Zoho','MS Office'],
  soft: ['Leadership','Communication','Teamwork','Problem Solving','Critical Thinking',
    'Time Management','Adaptability','Creativity','Attention to Detail','Multitasking',
    'Project Management','Client Handling','Presentation Skills','Negotiation','Decision Making']
}

const DEGREE_OPTIONS = [
  'B.Tech / B.E.','M.Tech / M.E.','BCA','MCA','B.Sc','M.Sc',
  'B.Com','M.Com','BBA','MBA','B.A.','M.A.',
  'CA (Chartered Accountant)','CS (Company Secretary)','CMA',
  'MBBS','BDS','B.Pharm','Diploma','12th / HSC','10th / SSC','Other'
]

const YEARS = Array.from({ length: 35 }, (_, i) => String(new Date().getFullYear() - i))

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

const LANGUAGES_LIST = ['Hindi','English','Gujarati','Marathi','Bengali','Tamil',
  'Telugu','Kannada','Punjabi','Urdu','Rajasthani','Odia','Malayalam','Sanskrit','French','German','Spanish','Japanese','Chinese']

const CERT_SUGGESTIONS = ['AWS Certified','Google Cloud Professional','Microsoft Azure',
  'Meta Front-End Developer','Google Analytics','HubSpot Marketing','PMP',
  'Scrum Master','CFA Level 1','CA Final','IELTS','Six Sigma','Google Ads','Coursera Certificate']

const TEMPLATES = [
  { id: 'classic',      label: 'Classic',        icon: '📄', category: 'Fresher',       desc: 'Clean & simple, ATS-friendly' },
  { id: 'modern',       label: 'Modern Sidebar',  icon: '🎨', category: 'Experienced',   desc: 'Two-column with sidebar' },
  { id: 'executive',    label: 'Executive',       icon: '💼', category: 'Professional',  desc: 'Bold header for senior roles' },
  { id: 'minimal',      label: 'Minimal',         icon: '⬜', category: 'Fresher',       desc: 'Ultra-clean white design' },
  { id: 'creative',     label: 'Creative',        icon: '🌈', category: 'Designer',      desc: 'Colorful accent for creatives' },
  { id: 'corporate',    label: 'Corporate',       icon: '🏢', category: 'Official',      desc: 'Formal navy for corporate jobs' },
  { id: 'tech',         label: 'Tech Pro',        icon: '💻', category: 'Experienced',   desc: 'Dark header for tech roles' },
  { id: 'elegant',      label: 'Elegant',         icon: '✨', category: 'Professional',  desc: 'Serif font luxury feel' },
  { id: 'compact',      label: 'Compact',         icon: '📋', category: 'Experienced',   desc: 'Dense info, max content' },
  { id: 'fresher',      label: 'Fresh Graduate',  icon: '🎓', category: 'Fresher',       desc: 'Highlights education & projects' },
]

const DEFAULT_SETTINGS = {
  showPhoto: false,
  showSummary: true,
  showExperience: true,
  showEducation: true,
  showTechSkills: true,
  showSoftSkills: true,
  showLanguages: true,
  showCertifications: true,
  showProjects: true,
  showLinkedin: true,
  showLocation: true,
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const emptyExp = () => ({ title: '', company: '', fromMonth: '', fromYear: '', toMonth: '', toYear: '', current: false, description: '' })
const emptyEdu = () => ({ degree: '', institution: '', year: '', score: '' })
const emptyProject = () => ({ name: '', tech: '', description: '', link: '' })

/* ─────────────────────────────────────────
   SMART SELECT
───────────────────────────────────────── */
function SmartSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef()

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()))

  const handleBlur = useCallback((e) => {
    if (!ref.current?.contains(e.relatedTarget)) setOpen(false)
  }, [])

  return (
    <div style={{ position: 'relative' }} ref={ref} onBlur={handleBlur}>
      <div onClick={() => setOpen(!open)} style={{
        background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)',
        borderRadius: 10, color: value ? '#fff' : 'rgba(255,255,255,0.25)',
        fontSize: 14, padding: '10px 36px 10px 14px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.2s', userSelect: 'none', fontFamily: 'inherit',
        ...(open ? { borderColor: '#6C63FF66', background: 'rgba(108,99,255,0.08)', boxShadow: '0 0 0 3px rgba(108,99,255,0.15)' } : {})
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || placeholder}</span>
        <span style={{ position: 'absolute', right: 13, opacity: 0.4, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', fontSize: 11 }}>▼</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
          background: '#18182b', border: '1.5px solid rgba(255,255,255,0.12)',
          borderRadius: 10, marginTop: 4, boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '8px 8px 4px' }}>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              style={{
                width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 7, color: '#fff', fontSize: 13, padding: '7px 10px',
                outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
              }} />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto', padding: '4px 8px 8px' }}>
            {filtered.map(o => (
              <div key={o}
                onMouseDown={() => { onChange(o); setOpen(false); setSearch('') }}
                style={{
                  padding: '8px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 13,
                  color: value === o ? '#a89eff' : 'rgba(255,255,255,0.8)',
                  background: value === o ? 'rgba(108,99,255,0.18)' : 'transparent',
                  fontWeight: value === o ? 600 : 400, transition: 'background 0.12s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,99,255,0.14)'}
                onMouseLeave={e => e.currentTarget.style.background = value === o ? 'rgba(108,99,255,0.18)' : 'transparent'}>
                {o}
              </div>
            ))}
            {filtered.length === 0 && <div style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No results</div>}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   TAG INPUT
───────────────────────────────────────── */
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
        background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)',
        borderRadius: 10, padding: '8px 10px', minHeight: 46,
        display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
        cursor: 'text', transition: 'all 0.2s'
      }} onClick={() => { setShowSug(true); ref.current?.querySelector('input')?.focus() }}>
        {tags.map(t => (
          <span key={t} style={{
            background: `${color}22`, border: `1px solid ${color}55`, color: '#fff',
            fontSize: 12, padding: '3px 8px 3px 10px', borderRadius: 20,
            display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500
          }}>
            {t}
            <span onClick={e => { e.stopPropagation(); onRemove(t) }} style={{
              cursor: 'pointer', opacity: 0.5, fontSize: 15, lineHeight: 1, padding: '0 2px'
            }}>×</span>
          </span>
        ))}
        <input value={input}
          onChange={e => { setInput(e.target.value); setShowSug(true) }}
          onFocus={() => setShowSug(true)}
          onBlur={() => setTimeout(() => setShowSug(false), 150)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); add(input) }
            if (e.key === 'Backspace' && !input && tags.length) onRemove(tags[tags.length - 1])
          }}
          placeholder={tags.length === 0 ? placeholder : '+ Add'}
          style={{
            background: 'none', border: 'none', outline: 'none', color: '#fff',
            fontSize: 13, flex: 1, minWidth: 80, fontFamily: 'inherit'
          }} />
      </div>
      {showSug && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
          background: '#18182b', border: '1.5px solid rgba(255,255,255,0.12)',
          borderRadius: 10, marginTop: 4, padding: 6,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)', maxHeight: 200, overflowY: 'auto'
        }}>
          {filtered.map(s => (
            <div key={s} onMouseDown={() => add(s)} style={{
              padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 13,
              color: 'rgba(255,255,255,0.8)', transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(108,99,255,0.15)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   SECTION DIVIDER
───────────────────────────────────────── */
function SectionDivider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 14px' }}>
      <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.08)' }} />
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#6C63FF', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.08)' }} />
    </div>
  )
}

/* ─────────────────────────────────────────
   EXPERIENCE ENTRY
───────────────────────────────────────── */
function ExperienceEntry({ exp, idx, onChange, onRemove }) {
  const upd = (k, v) => onChange(idx, { ...exp, [k]: v })
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: 16, marginBottom: 10, position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6C63FF88', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Experience {idx + 1}</span>
        {idx > 0 && (
          <button onClick={() => onRemove(idx)} style={{
            background: 'rgba(255,80,80,0.1)', border: 'none', color: '#ff8080',
            fontSize: 11, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit'
          }}>Remove</button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={lbl}>Job Title / Role</label>
          <input style={inp} placeholder="e.g. Software Engineer" value={exp.title} onChange={e => upd('title', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Company Name</label>
          <input style={inp} placeholder="e.g. Infosys, Startup..." value={exp.company} onChange={e => upd('company', e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 12px 1fr 1fr', gap: 8, alignItems: 'end', marginBottom: 10 }}>
        <div>
          <label style={lbl}>From Month</label>
          <SmartSelect value={exp.fromMonth} onChange={v => upd('fromMonth', v)} options={MONTHS} placeholder="Month" />
        </div>
        <div>
          <label style={lbl}>From Year</label>
          <SmartSelect value={exp.fromYear} onChange={v => upd('fromYear', v)} options={YEARS} placeholder="Year" />
        </div>
        <div style={{ textAlign: 'center', paddingBottom: 10, color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>→</div>
        <div>
          <label style={lbl}>To Month</label>
          <SmartSelect value={exp.current ? '' : exp.toMonth} onChange={v => upd('toMonth', v)} options={MONTHS} placeholder={exp.current ? 'Present' : 'Month'} />
        </div>
        <div>
          <label style={lbl}>To Year</label>
          <SmartSelect value={exp.current ? '' : exp.toYear} onChange={v => upd('toYear', v)} options={YEARS} placeholder={exp.current ? 'Present' : 'Year'} />
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10, cursor: 'pointer' }}>
        <input type="checkbox" checked={exp.current} onChange={e => upd('current', e.target.checked)} style={{ accentColor: '#6C63FF' }} />
        Currently working here
      </label>
      <div>
        <label style={lbl}>Key Responsibilities / Achievements</label>
        <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }}
          placeholder="Describe your role, achievements, impact... Each point on new line."
          value={exp.description} onChange={e => upd('description', e.target.value)} />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   EDUCATION ENTRY
───────────────────────────────────────── */
function EducationEntry({ edu, idx, onChange, onRemove }) {
  const upd = (k, v) => onChange(idx, { ...edu, [k]: v })
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: 16, marginBottom: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6C63FF88', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Education {idx + 1}</span>
        {idx > 0 && (
          <button onClick={() => onRemove(idx)} style={{
            background: 'rgba(255,80,80,0.1)', border: 'none', color: '#ff8080',
            fontSize: 11, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit'
          }}>Remove</button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={lbl}>Degree / Course</label>
          <SmartSelect value={edu.degree} onChange={v => upd('degree', v)} options={DEGREE_OPTIONS} placeholder="Select degree..." />
        </div>
        <div>
          <label style={lbl}>Passing Year</label>
          <SmartSelect value={edu.year} onChange={v => upd('year', v)} options={YEARS} placeholder="Year..." />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={lbl}>College / University</label>
          <input style={inp} placeholder="e.g. IIT Delhi, DAVV..." value={edu.institution} onChange={e => upd('institution', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Score / CGPA (optional)</label>
          <input style={inp} placeholder="e.g. 8.5 CGPA / 85%" value={edu.score} onChange={e => upd('score', e.target.value)} />
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   PROJECT ENTRY
───────────────────────────────────────── */
function ProjectEntry({ proj, idx, onChange, onRemove }) {
  const upd = (k, v) => onChange(idx, { ...proj, [k]: v })
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: 16, marginBottom: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6C63FF88', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Project {idx + 1}</span>
        {idx > 0 && (
          <button onClick={() => onRemove(idx)} style={{
            background: 'rgba(255,80,80,0.1)', border: 'none', color: '#ff8080',
            fontSize: 11, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit'
          }}>Remove</button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={lbl}>Project Name</label>
          <input style={inp} placeholder="e.g. E-Commerce App" value={proj.name} onChange={e => upd('name', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Technologies Used</label>
          <input style={inp} placeholder="e.g. React, Node.js, MongoDB" value={proj.tech} onChange={e => upd('tech', e.target.value)} />
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={lbl}>Project Link / GitHub (optional)</label>
        <input style={inp} placeholder="github.com/yourname/project" value={proj.link} onChange={e => upd('link', e.target.value)} />
      </div>
      <div>
        <label style={lbl}>Description</label>
        <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }}
          placeholder="What does the project do? Your role and impact..."
          value={proj.description} onChange={e => upd('description', e.target.value)} />
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   STYLES (shared)
───────────────────────────────────────── */
const lbl = {
  display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)',
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5
}
const inp = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)',
  borderRadius: 10, color: '#fff', fontSize: 14, padding: '10px 14px',
  outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s',
  display: 'block'
}

/* ─────────────────────────────────────────
   ZEROFY WATERMARK (for resume)
───────────────────────────────────────── */
function ZerofyWatermark() {
  return (
    <div style={{
      position: 'absolute', bottom: 12, right: 18,
      display: 'flex', alignItems: 'center', gap: 5,
      opacity: 0.35, pointerEvents: 'none', userSelect: 'none'
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#6C63FF" />
        <path d="M8 16l8-8M8 8h8v8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#333', fontFamily: 'sans-serif' }}>
        Made with ZEROFY
      </span>
    </div>
  )
}

/* ═══════════════════════════════════════════
   TEMPLATES
═══════════════════════════════════════════ */

/* ── 1. CLASSIC ── */
function TemplateClassic({ data, settings }) {
  const { formData: fd, experiences, educations, techSkills, softSkills, languages, certifications, projects, summary, photoUrl } = data
  const expDur = (exp) => {
    const from = [exp.fromMonth, exp.fromYear].filter(Boolean).join(' ')
    const to = exp.current ? 'Present' : [exp.toMonth, exp.toYear].filter(Boolean).join(' ')
    return [from, to].filter(Boolean).join(' – ')
  }
  return (
    <div style={{ fontFamily: '"Times New Roman", Georgia, serif', color: '#1a1a1a', lineHeight: 1.5, position: 'relative', background: '#fff', padding: '36px 40px', minHeight: 900 }}>
      <ZerofyWatermark />
      <div style={{ textAlign: 'center', borderBottom: '2.5px solid #1a1a1a', paddingBottom: 14, marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '0.03em' }}>{fd.name || 'Your Name'}</h1>
        {fd.jobTitle && <p style={{ margin: '4px 0 8px', fontSize: 14, color: '#444', fontStyle: 'italic' }}>{fd.jobTitle}</p>}
        <div style={{ fontSize: 12, color: '#444', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 16px' }}>
          {fd.email && <span>✉ {fd.email}</span>}
          {fd.phone && <span>☏ {fd.phone}</span>}
          {settings.showLocation && fd.location && <span>📍 {fd.location}</span>}
          {settings.showLinkedin && fd.linkedin && <span>🔗 {fd.linkedin}</span>}
        </div>
      </div>
      {settings.showSummary && summary && (
        <Section title="PROFESSIONAL SUMMARY">
          <p style={{ margin: 0, fontSize: 13, textAlign: 'justify' }}>{summary}</p>
        </Section>
      )}
      {settings.showExperience && experiences.some(e => e.title) && (
        <Section title="WORK EXPERIENCE">
          {experiences.filter(e => e.title).map((exp, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div><strong style={{ fontSize: 13 }}>{exp.title}</strong>{exp.company && <span style={{ fontSize: 13, color: '#444' }}> — {exp.company}</span>}</div>
                <span style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap' }}>{expDur(exp)}</span>
              </div>
              {exp.description && <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: 12.5, color: '#333' }}>
                {exp.description.split('\n').filter(Boolean).map((b, j) => <li key={j} style={{ marginBottom: 2 }}>{b}</li>)}
              </ul>}
            </div>
          ))}
        </Section>
      )}
      {settings.showProjects && projects.some(p => p.name) && (
        <Section title="PROJECTS">
          {projects.filter(p => p.name).map((proj, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: 13 }}>{proj.name}</strong>
                {proj.tech && <span style={{ fontSize: 11, color: '#666' }}>{proj.tech}</span>}
              </div>
              {proj.link && <div style={{ fontSize: 11, color: '#888' }}>🔗 {proj.link}</div>}
              {proj.description && <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#333' }}>{proj.description}</p>}
            </div>
          ))}
        </Section>
      )}
      {settings.showEducation && educations.some(e => e.degree) && (
        <Section title="EDUCATION">
          {educations.filter(e => e.degree).map((edu, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <strong style={{ fontSize: 13 }}>{edu.degree}</strong>
                {edu.institution && <span style={{ fontSize: 13, color: '#444' }}> — {edu.institution}</span>}
                {edu.score && <span style={{ fontSize: 12, color: '#666' }}> · {edu.score}</span>}
              </div>
              <span style={{ fontSize: 12, color: '#666' }}>{edu.year}</span>
            </div>
          ))}
        </Section>
      )}
      {(settings.showTechSkills || settings.showSoftSkills) && (techSkills.length > 0 || softSkills.length > 0) && (
        <Section title="SKILLS">
          {settings.showTechSkills && techSkills.length > 0 && <p style={{ margin: '0 0 4px', fontSize: 12.5 }}><strong>Technical:</strong> {techSkills.join(', ')}</p>}
          {settings.showSoftSkills && softSkills.length > 0 && <p style={{ margin: 0, fontSize: 12.5 }}><strong>Soft Skills:</strong> {softSkills.join(', ')}</p>}
        </Section>
      )}
      {settings.showCertifications && certifications.length > 0 && (
        <Section title="CERTIFICATIONS">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {certifications.map((c, i) => <span key={i} style={{ fontSize: 12.5 }}>• {c}</span>)}
          </div>
        </Section>
      )}
      {settings.showLanguages && languages.length > 0 && (
        <Section title="LANGUAGES">
          <p style={{ margin: 0, fontSize: 12.5 }}>{languages.join(' | ')}</p>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', borderBottom: '1px solid #ccc', paddingBottom: 3, marginBottom: 8, color: '#222' }}>{title}</div>
      {children}
    </div>
  )
}

/* ── 2. MODERN SIDEBAR ── */
function TemplateModern({ data, settings }) {
  const { formData: fd, experiences, educations, techSkills, softSkills, languages, certifications, projects, summary, photoUrl } = data
  const expDur = (exp) => {
    const from = [exp.fromMonth, exp.fromYear].filter(Boolean).join(' ')
    const to = exp.current ? 'Present' : [exp.toMonth, exp.toYear].filter(Boolean).join(' ')
    return [from, to].filter(Boolean).join(' – ')
  }
  return (
    <div style={{ fontFamily: '"Segoe UI", Arial, sans-serif', color: '#1a1a2e', display: 'flex', minHeight: 900, position: 'relative', background: '#fff' }}>
      <ZerofyWatermark />
      {/* Sidebar */}
      <div style={{ width: 220, background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)', color: '#fff', padding: '32px 20px', flexShrink: 0 }}>
        {settings.showPhoto && (
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 14px', border: '2px solid rgba(255,255,255,0.3)', overflow: 'hidden' }}>
            {photoUrl ? <img src={photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (fd.name?.charAt(0)?.toUpperCase() || '?')}
          </div>
        )}
        <h1 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>{fd.name || 'Your Name'}</h1>
        {fd.jobTitle && <p style={{ margin: '0 0 18px', fontSize: 12, opacity: 0.75, lineHeight: 1.4 }}>{fd.jobTitle}</p>}
        <SbSection title="CONTACT">
          <p style={sbText}>{fd.email}</p>
          {fd.phone && <p style={sbText}>{fd.phone}</p>}
          {settings.showLocation && fd.location && <p style={sbText}>📍 {fd.location}</p>}
          {settings.showLinkedin && fd.linkedin && <p style={{ ...sbText, wordBreak: 'break-all' }}>🔗 {fd.linkedin}</p>}
        </SbSection>
        {settings.showTechSkills && techSkills.length > 0 && (
          <SbSection title="TECH SKILLS">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {techSkills.map((s, i) => <span key={i} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, fontSize: 10, padding: '2px 8px' }}>{s}</span>)}
            </div>
          </SbSection>
        )}
        {settings.showSoftSkills && softSkills.length > 0 && (
          <SbSection title="SOFT SKILLS">
            {softSkills.map((s, i) => <p key={i} style={{ ...sbText, margin: '2px 0' }}>· {s}</p>)}
          </SbSection>
        )}
        {settings.showLanguages && languages.length > 0 && (
          <SbSection title="LANGUAGES">
            {languages.map((l, i) => <p key={i} style={{ ...sbText, margin: '2px 0' }}>{l}</p>)}
          </SbSection>
        )}
        {settings.showCertifications && certifications.length > 0 && (
          <SbSection title="CERTIFICATIONS">
            {certifications.map((c, i) => <p key={i} style={{ ...sbText, margin: '3px 0', fontSize: 10 }}>✓ {c}</p>)}
          </SbSection>
        )}
        {settings.showEducation && educations.filter(e => e.degree).length > 0 && (
          <SbSection title="EDUCATION">
            {educations.filter(e => e.degree).map((e, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <p style={{ ...sbText, fontWeight: 700, margin: '0 0 1px', fontSize: 11 }}>{e.degree}</p>
                <p style={{ ...sbText, margin: 0, fontSize: 10 }}>{e.institution}</p>
                <p style={{ ...sbText, margin: 0, opacity: 0.6, fontSize: 10 }}>{e.year}{e.score ? ` · ${e.score}` : ''}</p>
              </div>
            ))}
          </SbSection>
        )}
      </div>
      {/* Main */}
      <div style={{ flex: 1, padding: '32px 28px' }}>
        {settings.showSummary && summary && (
          <MSection title="About Me">
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: '#444' }}>{summary}</p>
          </MSection>
        )}
        {settings.showExperience && experiences.some(e => e.title) && (
          <MSection title="Work Experience">
            {experiences.filter(e => e.title).map((exp, i) => (
              <div key={i} style={{ marginBottom: 14, paddingLeft: 14, borderLeft: '2px solid #6366f1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <strong style={{ fontSize: 13, color: '#1e1b4b' }}>{exp.title}</strong>
                  <span style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>{expDur(exp)}</span>
                </div>
                {exp.company && <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6366f1' }}>{exp.company}</p>}
                {exp.description && <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#555', lineHeight: 1.6 }}>
                  {exp.description.split('\n').filter(Boolean).map((b, j) => <li key={j}>{b}</li>)}
                </ul>}
              </div>
            ))}
          </MSection>
        )}
        {settings.showProjects && projects.some(p => p.name) && (
          <MSection title="Projects">
            {projects.filter(p => p.name).map((proj, i) => (
              <div key={i} style={{ marginBottom: 12, paddingLeft: 14, borderLeft: '2px solid #a5b4fc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: 13, color: '#1e1b4b' }}>{proj.name}</strong>
                  {proj.tech && <span style={{ fontSize: 11, color: '#888' }}>{proj.tech}</span>}
                </div>
                {proj.link && <p style={{ margin: '1px 0 2px', fontSize: 11, color: '#6366f1' }}>🔗 {proj.link}</p>}
                {proj.description && <p style={{ margin: 0, fontSize: 12, color: '#555' }}>{proj.description}</p>}
              </div>
            ))}
          </MSection>
        )}
      </div>
    </div>
  )
}
const sbText = { margin: '0 0 4px', fontSize: 11, opacity: 0.85, lineHeight: 1.5 }
function SbSection({ title, children }) {
  return <div style={{ marginBottom: 18 }}><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', opacity: 0.55, marginBottom: 8 }}>{title}</div>{children}</div>
}
function MSection({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b', borderBottom: '2px solid #e0e7ff', paddingBottom: 5, marginBottom: 12, letterSpacing: '0.05em' }}>{title.toUpperCase()}</div>
      {children}
    </div>
  )
}

/* ── 3. EXECUTIVE ── */
function TemplateExecutive({ data, settings }) {
  const { formData: fd, experiences, educations, techSkills, softSkills, languages, certifications, projects, summary, photoUrl } = data
  const expDur = (exp) => {
    const from = [exp.fromMonth, exp.fromYear].filter(Boolean).join(' ')
    const to = exp.current ? 'Present' : [exp.toMonth, exp.toYear].filter(Boolean).join(' ')
    return [from, to].filter(Boolean).join(' – ')
  }
  return (
    <div style={{ fontFamily: '"Segoe UI", Calibri, sans-serif', color: '#1a1a1a', background: '#fff', position: 'relative', minHeight: 900 }}>
      <ZerofyWatermark />
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: '#fff', padding: '32px 40px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 300, letterSpacing: '0.06em' }}>{fd.name || 'Your Name'}</h1>
            {fd.jobTitle && <p style={{ margin: '6px 0 0', fontSize: 14, color: '#a89eff', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{fd.jobTitle}</p>}
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, opacity: 0.8, lineHeight: 1.9 }}>
            {fd.email && <div>✉ {fd.email}</div>}
            {fd.phone && <div>☏ {fd.phone}</div>}
            {settings.showLocation && fd.location && <div>📍 {fd.location}</div>}
            {settings.showLinkedin && fd.linkedin && <div>🔗 {fd.linkedin}</div>}
          </div>
        </div>
      </div>
      <div style={{ padding: '28px 40px' }}>
        {settings.showSummary && summary && (
          <ExSection title="Professional Profile">
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: '#444', borderLeft: '3px solid #6C63FF', paddingLeft: 12 }}>{summary}</p>
          </ExSection>
        )}
        {settings.showExperience && experiences.some(e => e.title) && (
          <ExSection title="Professional Experience">
            {experiences.filter(e => e.title).map((exp, i) => (
              <div key={i} style={{ marginBottom: 14, display: 'flex', gap: 16 }}>
                <div style={{ width: 120, flexShrink: 0, fontSize: 11, color: '#888', paddingTop: 2, textAlign: 'right' }}>{expDur(exp)}</div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 13.5, color: '#1a1a2e' }}>{exp.title}</strong>
                  {exp.company && <span style={{ fontSize: 13, color: '#6C63FF' }}> · {exp.company}</span>}
                  {exp.description && <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 12.5, color: '#444', lineHeight: 1.7 }}>
                    {exp.description.split('\n').filter(Boolean).map((b, j) => <li key={j}>{b}</li>)}
                  </ul>}
                </div>
              </div>
            ))}
          </ExSection>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {settings.showEducation && educations.some(e => e.degree) && (
            <ExSection title="Education">
              {educations.filter(e => e.degree).map((e, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <strong style={{ fontSize: 13, display: 'block' }}>{e.degree}</strong>
                  <span style={{ fontSize: 12, color: '#555' }}>{e.institution} · {e.year}</span>
                  {e.score && <div style={{ fontSize: 11, color: '#888' }}>{e.score}</div>}
                </div>
              ))}
            </ExSection>
          )}
          {(settings.showTechSkills || settings.showSoftSkills) && (techSkills.length > 0 || softSkills.length > 0) && (
            <ExSection title="Core Competencies">
              {settings.showTechSkills && techSkills.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
                {techSkills.map((s, i) => <span key={i} style={{ background: '#f0eeff', color: '#4338ca', fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 600 }}>{s}</span>)}
              </div>}
              {settings.showSoftSkills && softSkills.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {softSkills.map((s, i) => <span key={i} style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 600 }}>{s}</span>)}
              </div>}
            </ExSection>
          )}
        </div>
        {settings.showProjects && projects.some(p => p.name) && (
          <ExSection title="Key Projects">
            {projects.filter(p => p.name).map((proj, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <strong style={{ fontSize: 13 }}>{proj.name}</strong>
                {proj.tech && <span style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>[{proj.tech}]</span>}
                {proj.link && <span style={{ fontSize: 11, color: '#6C63FF', marginLeft: 8 }}>🔗 {proj.link}</span>}
                {proj.description && <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#444' }}>{proj.description}</p>}
              </div>
            ))}
          </ExSection>
        )}
        {(settings.showLanguages || settings.showCertifications) && (
          <div style={{ display: 'flex', gap: 24 }}>
            {settings.showLanguages && languages.length > 0 && (
              <ExSection title="Languages" style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {languages.map((l, i) => <span key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, padding: '2px 10px', borderRadius: 20 }}>{l}</span>)}
                </div>
              </ExSection>
            )}
            {settings.showCertifications && certifications.length > 0 && (
              <ExSection title="Certifications" style={{ flex: 1 }}>
                {certifications.map((c, i) => <p key={i} style={{ margin: '2px 0', fontSize: 12 }}>✓ {c}</p>)}
              </ExSection>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
function ExSection({ title, children, style = {} }) {
  return (
    <div style={{ marginBottom: 20, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 3, height: 16, background: '#6C63FF', borderRadius: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: '#1a1a2e', textTransform: 'uppercase' }}>{title}</div>
      </div>
      {children}
    </div>
  )
}

/* ── 4. MINIMAL ── */
function TemplateMinimal({ data, settings }) {
  const { formData: fd, experiences, educations, techSkills, softSkills, languages, certifications, projects, summary, photoUrl } = data
  const expDur = (exp) => {
    const from = [exp.fromMonth, exp.fromYear].filter(Boolean).join(' ')
    const to = exp.current ? 'Present' : [exp.toMonth, exp.toYear].filter(Boolean).join(' ')
    return [from, to].filter(Boolean).join(' – ')
  }
  return (
    <div style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', color: '#111', background: '#fff', padding: '50px 48px', minHeight: 900, position: 'relative' }}>
      <ZerofyWatermark />
      <h1 style={{ margin: 0, fontSize: 34, fontWeight: 200, letterSpacing: '0.08em', color: '#000' }}>{fd.name || 'Your Name'}</h1>
      {fd.jobTitle && <p style={{ margin: '6px 0 0', fontSize: 13, color: '#888', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{fd.jobTitle}</p>}
      <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#666', margin: '14px 0 36px', flexWrap: 'wrap' }}>
        {fd.email && <span>{fd.email}</span>}
        {fd.phone && <span>{fd.phone}</span>}
        {settings.showLocation && fd.location && <span>{fd.location}</span>}
        {settings.showLinkedin && fd.linkedin && <span>{fd.linkedin}</span>}
      </div>
      {settings.showSummary && summary && <MinSection title="Summary"><p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: '#444' }}>{summary}</p></MinSection>}
      {settings.showExperience && experiences.some(e => e.title) && (
        <MinSection title="Experience">
          {experiences.filter(e => e.title).map((exp, i) => (
            <div key={i} style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: '100px 1fr', gap: 16 }}>
              <span style={{ fontSize: 11, color: '#999', paddingTop: 2 }}>{expDur(exp)}</span>
              <div>
                <strong style={{ fontSize: 13 }}>{exp.title}</strong>
                {exp.company && <span style={{ color: '#666', fontSize: 13 }}> / {exp.company}</span>}
                {exp.description && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#555', lineHeight: 1.7 }}>{exp.description.split('\n').filter(Boolean).join(' · ')}</p>}
              </div>
            </div>
          ))}
        </MinSection>
      )}
      {settings.showProjects && projects.some(p => p.name) && (
        <MinSection title="Projects">
          {projects.filter(p => p.name).map((proj, i) => (
            <div key={i} style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: '100px 1fr', gap: 16 }}>
              <span style={{ fontSize: 11, color: '#999', paddingTop: 2 }}>{proj.tech || '—'}</span>
              <div>
                <strong style={{ fontSize: 13 }}>{proj.name}</strong>
                {proj.link && <span style={{ color: '#888', fontSize: 11, marginLeft: 8 }}>{proj.link}</span>}
                {proj.description && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#555' }}>{proj.description}</p>}
              </div>
            </div>
          ))}
        </MinSection>
      )}
      {settings.showEducation && educations.some(e => e.degree) && (
        <MinSection title="Education">
          {educations.filter(e => e.degree).map((e, i) => (
            <div key={i} style={{ marginBottom: 10, display: 'grid', gridTemplateColumns: '100px 1fr', gap: 16 }}>
              <span style={{ fontSize: 11, color: '#999' }}>{e.year}</span>
              <div><strong style={{ fontSize: 13 }}>{e.degree}</strong>{e.institution && <span style={{ color: '#666', fontSize: 13 }}> / {e.institution}</span>}{e.score && <span style={{ color: '#888', fontSize: 12 }}> · {e.score}</span>}</div>
            </div>
          ))}
        </MinSection>
      )}
      {(settings.showTechSkills || settings.showSoftSkills) && (techSkills.length > 0 || softSkills.length > 0) && (
        <MinSection title="Skills">
          <p style={{ margin: 0, fontSize: 12.5, color: '#444', lineHeight: 1.8 }}>{[...techSkills, ...softSkills].join('  ·  ')}</p>
        </MinSection>
      )}
      {settings.showLanguages && languages.length > 0 && (
        <MinSection title="Languages"><p style={{ margin: 0, fontSize: 12.5, color: '#444' }}>{languages.join('  ·  ')}</p></MinSection>
      )}
      {settings.showCertifications && certifications.length > 0 && (
        <MinSection title="Certifications"><p style={{ margin: 0, fontSize: 12.5, color: '#444' }}>{certifications.join('  ·  ')}</p></MinSection>
      )}
    </div>
  )
}
function MinSection({ title, children }) {
  return (
    <div style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: '100px 1fr', gap: 16 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: '#bbb', textTransform: 'uppercase', paddingTop: 3 }}>{title}</span>
      <div style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>{children}</div>
    </div>
  )
}

/* ── 5. CREATIVE ── */
function TemplateCreative({ data, settings }) {
  const { formData: fd, experiences, educations, techSkills, softSkills, languages, certifications, projects, summary, photoUrl } = data
  const expDur = (exp) => {
    const from = [exp.fromMonth, exp.fromYear].filter(Boolean).join(' ')
    const to = exp.current ? 'Present' : [exp.toMonth, exp.toYear].filter(Boolean).join(' ')
    return [from, to].filter(Boolean).join(' – ')
  }
  const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8']
  return (
    <div style={{ fontFamily: '"Segoe UI", Arial, sans-serif', background: '#fff', minHeight: 900, position: 'relative' }}>
      <ZerofyWatermark />
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)', padding: '36px 36px 28px', color: '#fff' }}>
        {settings.showPhoto && (
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 14, border: '2px solid rgba(255,255,255,0.4)', overflow: 'hidden' }}>
            {photoUrl ? <img src={photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (fd.name?.charAt(0)?.toUpperCase() || '?')}
          </div>
        )}
        <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800 }}>{fd.name || 'Your Name'}</h1>
        {fd.jobTitle && <p style={{ margin: '0 0 14px', fontSize: 14, opacity: 0.85 }}>{fd.jobTitle}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 12, opacity: 0.85 }}>
          {fd.email && <span>✉ {fd.email}</span>}
          {fd.phone && <span>☏ {fd.phone}</span>}
          {settings.showLocation && fd.location && <span>📍 {fd.location}</span>}
          {settings.showLinkedin && fd.linkedin && <span>🔗 {fd.linkedin}</span>}
        </div>
      </div>
      <div style={{ padding: '28px 36px' }}>
        {settings.showSummary && summary && (
          <div style={{ marginBottom: 20 }}>
            <CrTitle title="About Me" color="#667eea" />
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: '#444' }}>{summary}</p>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            {settings.showExperience && experiences.some(e => e.title) && (
              <div style={{ marginBottom: 18 }}>
                <CrTitle title="Experience" color="#764ba2" />
                {experiences.filter(e => e.title).map((exp, i) => (
                  <div key={i} style={{ marginBottom: 12, paddingLeft: 12, borderLeft: `3px solid ${colors[i % colors.length]}` }}>
                    <strong style={{ fontSize: 13 }}>{exp.title}</strong>
                    {exp.company && <div style={{ fontSize: 12, color: '#888' }}>{exp.company}</div>}
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 3 }}>{expDur(exp)}</div>
                    {exp.description && exp.description.split('\n').filter(Boolean).map((b, j) => (
                      <p key={j} style={{ margin: '1px 0', fontSize: 12, color: '#555' }}>• {b}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {settings.showProjects && projects.some(p => p.name) && (
              <div style={{ marginBottom: 18 }}>
                <CrTitle title="Projects" color="#f093fb" />
                {projects.filter(p => p.name).map((proj, i) => (
                  <div key={i} style={{ marginBottom: 10, paddingLeft: 12, borderLeft: `3px solid ${colors[(i+3) % colors.length]}` }}>
                    <strong style={{ fontSize: 13 }}>{proj.name}</strong>
                    {proj.tech && <div style={{ fontSize: 11, color: '#888' }}>{proj.tech}</div>}
                    {proj.description && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#555' }}>{proj.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            {settings.showEducation && educations.some(e => e.degree) && (
              <div style={{ marginBottom: 18 }}>
                <CrTitle title="Education" color="#4ECDC4" />
                {educations.filter(e => e.degree).map((e, i) => (
                  <div key={i} style={{ marginBottom: 10, padding: '8px 12px', background: '#f8f9ff', borderRadius: 8 }}>
                    <strong style={{ fontSize: 13 }}>{e.degree}</strong>
                    <div style={{ fontSize: 12, color: '#666' }}>{e.institution}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{e.year}{e.score ? ` · ${e.score}` : ''}</div>
                  </div>
                ))}
              </div>
            )}
            {settings.showTechSkills && techSkills.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <CrTitle title="Tech Skills" color="#FF6B6B" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {techSkills.map((s, i) => (
                    <span key={i} style={{ background: colors[i % colors.length] + '22', border: `1px solid ${colors[i % colors.length]}55`, color: '#333', fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 600 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {settings.showSoftSkills && softSkills.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <CrTitle title="Soft Skills" color="#96CEB4" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {softSkills.map((s, i) => <span key={i} style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 11, padding: '2px 9px', borderRadius: 20 }}>{s}</span>)}
                </div>
              </div>
            )}
            {settings.showLanguages && languages.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <CrTitle title="Languages" color="#45B7D1" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {languages.map((l, i) => <span key={i} style={{ background: '#e0f7fa', color: '#0277bd', fontSize: 11, padding: '2px 9px', borderRadius: 20 }}>{l}</span>)}
                </div>
              </div>
            )}
            {settings.showCertifications && certifications.length > 0 && (
              <div>
                <CrTitle title="Certifications" color="#DDA0DD" />
                {certifications.map((c, i) => <div key={i} style={{ fontSize: 12, color: '#555', marginBottom: 3 }}>🏅 {c}</div>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
function CrTitle({ title, color }) {
  return <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color, marginBottom: 10, paddingBottom: 4, borderBottom: `2px solid ${color}33` }}>{title}</div>
}

/* ── 6. CORPORATE ── */
function TemplateCorporate({ data, settings }) {
  const { formData: fd, experiences, educations, techSkills, softSkills, languages, certifications, projects, summary, photoUrl } = data
  const expDur = (exp) => {
    const from = [exp.fromMonth, exp.fromYear].filter(Boolean).join(' ')
    const to = exp.current ? 'Present' : [exp.toMonth, exp.toYear].filter(Boolean).join(' ')
    return [from, to].filter(Boolean).join(' – ')
  }
  return (
    <div style={{ fontFamily: 'Cambria, "Book Antiqua", Georgia, serif', background: '#fff', minHeight: 900, position: 'relative' }}>
      <ZerofyWatermark />
      <div style={{ background: '#003366', color: '#fff', padding: '28px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '0.04em' }}>{fd.name || 'Your Name'}</h1>
            {fd.jobTitle && <p style={{ margin: '5px 0 0', fontSize: 13, color: '#a8c8e8', letterSpacing: '0.1em' }}>{fd.jobTitle}</p>}
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, lineHeight: 1.8, color: '#ccdde8' }}>
            {fd.email && <div>{fd.email}</div>}
            {fd.phone && <div>{fd.phone}</div>}
            {settings.showLocation && fd.location && <div>{fd.location}</div>}
          </div>
        </div>
        {settings.showLinkedin && fd.linkedin && <div style={{ marginTop: 10, fontSize: 11, color: '#a8c8e8' }}>🔗 {fd.linkedin}</div>}
      </div>
      <div style={{ height: 4, background: 'linear-gradient(90deg, #c8a400 0%, #ffd700 50%, #c8a400 100%)' }} />
      <div style={{ padding: '24px 40px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28 }}>
        <div>
          {settings.showSummary && summary && (
            <CorpSection title="Executive Summary">
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: '#333' }}>{summary}</p>
            </CorpSection>
          )}
          {settings.showExperience && experiences.some(e => e.title) && (
            <CorpSection title="Professional Experience">
              {experiences.filter(e => e.title).map((exp, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: 13, color: '#003366' }}>{exp.title}</strong>
                    <span style={{ fontSize: 11, color: '#888', fontStyle: 'italic' }}>{expDur(exp)}</span>
                  </div>
                  {exp.company && <div style={{ fontSize: 12, color: '#c8a400', fontWeight: 700, marginBottom: 3 }}>{exp.company}</div>}
                  {exp.description && <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, color: '#444', lineHeight: 1.7 }}>
                    {exp.description.split('\n').filter(Boolean).map((b, j) => <li key={j}>{b}</li>)}
                  </ul>}
                </div>
              ))}
            </CorpSection>
          )}
          {settings.showProjects && projects.some(p => p.name) && (
            <CorpSection title="Key Projects">
              {projects.filter(p => p.name).map((proj, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <strong style={{ fontSize: 13, color: '#003366' }}>{proj.name}</strong>
                  {proj.tech && <span style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>[{proj.tech}]</span>}
                  {proj.description && <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#444' }}>{proj.description}</p>}
                </div>
              ))}
            </CorpSection>
          )}
        </div>
        <div>
          {settings.showEducation && educations.some(e => e.degree) && (
            <CorpSection title="Education">
              {educations.filter(e => e.degree).map((e, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <strong style={{ fontSize: 13, display: 'block', color: '#003366' }}>{e.degree}</strong>
                  <span style={{ fontSize: 12, color: '#444' }}>{e.institution}</span>
                  {e.score && <div style={{ fontSize: 11, color: '#888' }}>{e.score}</div>}
                  <div style={{ fontSize: 11, color: '#888' }}>{e.year}</div>
                </div>
              ))}
            </CorpSection>
          )}
          {settings.showTechSkills && techSkills.length > 0 && (
            <CorpSection title="Technical Skills">
              {techSkills.map((s, i) => <div key={i} style={{ fontSize: 12.5, color: '#333', marginBottom: 3 }}>▸ {s}</div>)}
            </CorpSection>
          )}
          {settings.showSoftSkills && softSkills.length > 0 && (
            <CorpSection title="Key Skills">
              {softSkills.map((s, i) => <div key={i} style={{ fontSize: 12.5, color: '#333', marginBottom: 3 }}>▸ {s}</div>)}
            </CorpSection>
          )}
          {settings.showLanguages && languages.length > 0 && (
            <CorpSection title="Languages">
              {languages.map((l, i) => <div key={i} style={{ fontSize: 12.5, color: '#333', marginBottom: 2 }}>{l}</div>)}
            </CorpSection>
          )}
          {settings.showCertifications && certifications.length > 0 && (
            <CorpSection title="Certifications">
              {certifications.map((c, i) => <div key={i} style={{ fontSize: 11.5, color: '#333', marginBottom: 3 }}>✓ {c}</div>)}
            </CorpSection>
          )}
        </div>
      </div>
    </div>
  )
}
function CorpSection({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#003366', textTransform: 'uppercase', borderBottom: '2px solid #003366', paddingBottom: 4, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

/* ── 7. TECH PRO ── */
function TemplateTech({ data, settings }) {
  const { formData: fd, experiences, educations, techSkills, softSkills, languages, certifications, projects, summary, photoUrl } = data
  const expDur = (exp) => {
    const from = [exp.fromMonth, exp.fromYear].filter(Boolean).join(' ')
    const to = exp.current ? 'Present' : [exp.toMonth, exp.toYear].filter(Boolean).join(' ')
    return [from, to].filter(Boolean).join(' – ')
  }
  return (
    <div style={{ fontFamily: '"JetBrains Mono", "Courier New", monospace', background: '#0d1117', color: '#e6edf3', minHeight: 900, position: 'relative' }}>
      <ZerofyWatermark />
      <div style={{ borderBottom: '1px solid #30363d', padding: '28px 36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: '#58a6ff', marginBottom: 6, letterSpacing: '0.15em' }}>// RESUME</div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#f0f6fc' }}>{fd.name || 'Your Name'}</h1>
            {fd.jobTitle && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#58a6ff' }}>{fd.jobTitle}</p>}
          </div>
          <div style={{ fontSize: 11, color: '#8b949e', lineHeight: 1.9, textAlign: 'right' }}>
            {fd.email && <div>📧 {fd.email}</div>}
            {fd.phone && <div>📞 {fd.phone}</div>}
            {settings.showLocation && fd.location && <div>📍 {fd.location}</div>}
            {settings.showLinkedin && fd.linkedin && <div>🔗 {fd.linkedin}</div>}
          </div>
        </div>
      </div>
      <div style={{ padding: '24px 36px' }}>
        {settings.showSummary && summary && (
          <TechSection title="about">
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.8, color: '#adbac7' }}>{summary}</p>
          </TechSection>
        )}
        {settings.showTechSkills && techSkills.length > 0 && (
          <TechSection title="skills">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {techSkills.map((s, i) => <span key={i} style={{ background: '#161b22', border: '1px solid #30363d', color: '#58a6ff', fontSize: 11, padding: '3px 10px', borderRadius: 6, fontFamily: 'inherit' }}>{s}</span>)}
            </div>
            {settings.showSoftSkills && softSkills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {softSkills.map((s, i) => <span key={i} style={{ background: '#161b22', border: '1px solid #30363d', color: '#3fb950', fontSize: 11, padding: '3px 10px', borderRadius: 6 }}>{s}</span>)}
              </div>
            )}
          </TechSection>
        )}
        {settings.showExperience && experiences.some(e => e.title) && (
          <TechSection title="experience">
            {experiences.filter(e => e.title).map((exp, i) => (
              <div key={i} style={{ marginBottom: 16, paddingLeft: 16, borderLeft: '2px solid #58a6ff33' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: 13, color: '#f0f6fc' }}>{exp.title}</strong>
                  <span style={{ fontSize: 10, color: '#8b949e' }}>{expDur(exp)}</span>
                </div>
                {exp.company && <div style={{ fontSize: 12, color: '#58a6ff', marginBottom: 4 }}>@ {exp.company}</div>}
                {exp.description && exp.description.split('\n').filter(Boolean).map((b, j) => (
                  <div key={j} style={{ fontSize: 12, color: '#adbac7', marginBottom: 2 }}><span style={{ color: '#3fb950' }}>→</span> {b}</div>
                ))}
              </div>
            ))}
          </TechSection>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {settings.showProjects && projects.some(p => p.name) && (
            <TechSection title="projects">
              {projects.filter(p => p.name).map((proj, i) => (
                <div key={i} style={{ marginBottom: 12, padding: '8px 12px', background: '#161b22', border: '1px solid #30363d', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f6fc' }}>{proj.name}</div>
                  {proj.tech && <div style={{ fontSize: 10, color: '#58a6ff', margin: '2px 0' }}>{proj.tech}</div>}
                  {proj.link && <div style={{ fontSize: 10, color: '#8b949e' }}>🔗 {proj.link}</div>}
                  {proj.description && <div style={{ fontSize: 11.5, color: '#adbac7', marginTop: 4 }}>{proj.description}</div>}
                </div>
              ))}
            </TechSection>
          )}
          <div>
            {settings.showEducation && educations.some(e => e.degree) && (
              <TechSection title="education">
                {educations.filter(e => e.degree).map((e, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <strong style={{ fontSize: 12.5, color: '#f0f6fc' }}>{e.degree}</strong>
                    <div style={{ fontSize: 11, color: '#8b949e' }}>{e.institution} · {e.year}{e.score ? ` · ${e.score}` : ''}</div>
                  </div>
                ))}
              </TechSection>
            )}
            {settings.showCertifications && certifications.length > 0 && (
              <TechSection title="certifications">
                {certifications.map((c, i) => <div key={i} style={{ fontSize: 12, color: '#adbac7', marginBottom: 3 }}>✓ {c}</div>)}
              </TechSection>
            )}
            {settings.showLanguages && languages.length > 0 && (
              <TechSection title="languages">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {languages.map((l, i) => <span key={i} style={{ background: '#161b22', border: '1px solid #30363d', color: '#adbac7', fontSize: 11, padding: '2px 8px', borderRadius: 6 }}>{l}</span>)}
                </div>
              </TechSection>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
function TechSection({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 10, color: '#58a6ff', letterSpacing: '0.12em', marginBottom: 10 }}>
        <span style={{ color: '#ff7b72' }}>const</span> <span style={{ color: '#d2a8ff' }}>{title}</span> <span style={{ color: '#e6edf3' }}>= {'{'}</span>
      </div>
      <div style={{ paddingLeft: 8 }}>{children}</div>
      <div style={{ fontSize: 10, color: '#e6edf3' }}>{'}'}</div>
    </div>
  )
}

/* ── 8. ELEGANT ── */
function TemplateElegant({ data, settings }) {
  const { formData: fd, experiences, educations, techSkills, softSkills, languages, certifications, projects, summary, photoUrl } = data
  const expDur = (exp) => {
    const from = [exp.fromMonth, exp.fromYear].filter(Boolean).join(' ')
    const to = exp.current ? 'Present' : [exp.toMonth, exp.toYear].filter(Boolean).join(' ')
    return [from, to].filter(Boolean).join(' – ')
  }
  return (
    <div style={{ fontFamily: '"Garamond", "EB Garamond", Georgia, serif', background: '#fdf8f3', color: '#2c1a0e', minHeight: 900, position: 'relative' }}>
      <ZerofyWatermark />
      <div style={{ textAlign: 'center', padding: '44px 48px 28px', borderBottom: '1px solid #c8a87a' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.4em', color: '#9b7a4a', textTransform: 'uppercase', marginBottom: 14 }}>Curriculum Vitae</div>
        <h1 style={{ margin: '0 0 8px', fontSize: 36, fontWeight: 400, letterSpacing: '0.1em', color: '#2c1a0e' }}>{fd.name || 'Your Name'}</h1>
        {fd.jobTitle && <p style={{ margin: '0 0 16px', fontSize: 14, color: '#9b7a4a', letterSpacing: '0.15em', fontStyle: 'italic' }}>{fd.jobTitle}</p>}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, fontSize: 12, color: '#6b4a2a', flexWrap: 'wrap' }}>
          {fd.email && <span>{fd.email}</span>}
          {fd.phone && <span>{fd.phone}</span>}
          {settings.showLocation && fd.location && <span>{fd.location}</span>}
          {settings.showLinkedin && fd.linkedin && <span>{fd.linkedin}</span>}
        </div>
      </div>
      <div style={{ padding: '28px 48px' }}>
        {settings.showSummary && summary && (
          <ElegSection title="Profile">
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.9, color: '#3d2512', fontStyle: 'italic', textAlign: 'justify' }}>{summary}</p>
          </ElegSection>
        )}
        {settings.showExperience && experiences.some(e => e.title) && (
          <ElegSection title="Professional Experience">
            {experiences.filter(e => e.title).map((exp, i) => (
              <div key={i} style={{ marginBottom: 16, display: 'grid', gridTemplateColumns: '130px 1fr', gap: 16 }}>
                <span style={{ fontSize: 11.5, color: '#9b7a4a', fontStyle: 'italic', paddingTop: 2 }}>{expDur(exp)}</span>
                <div>
                  <strong style={{ fontSize: 13.5, color: '#2c1a0e' }}>{exp.title}</strong>
                  {exp.company && <span style={{ fontSize: 13, color: '#6b4a2a' }}> · {exp.company}</span>}
                  {exp.description && <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 12.5, color: '#3d2512', lineHeight: 1.8 }}>
                    {exp.description.split('\n').filter(Boolean).map((b, j) => <li key={j}>{b}</li>)}
                  </ul>}
                </div>
              </div>
            ))}
          </ElegSection>
        )}
        {settings.showProjects && projects.some(p => p.name) && (
          <ElegSection title="Notable Projects">
            {projects.filter(p => p.name).map((proj, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <strong style={{ fontSize: 13.5 }}>{proj.name}</strong>
                {proj.tech && <em style={{ fontSize: 12, color: '#9b7a4a', marginLeft: 8 }}>{proj.tech}</em>}
                {proj.description && <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#3d2512', lineHeight: 1.7 }}>{proj.description}</p>}
              </div>
            ))}
          </ElegSection>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
          {settings.showEducation && educations.some(e => e.degree) && (
            <ElegSection title="Education">
              {educations.filter(e => e.degree).map((e, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <strong style={{ fontSize: 13, display: 'block' }}>{e.degree}</strong>
                  <div style={{ fontSize: 12, color: '#6b4a2a' }}>{e.institution}</div>
                  <div style={{ fontSize: 11.5, color: '#9b7a4a', fontStyle: 'italic' }}>{e.year}{e.score ? ` · ${e.score}` : ''}</div>
                </div>
              ))}
            </ElegSection>
          )}
          <div>
            {(settings.showTechSkills || settings.showSoftSkills) && (techSkills.length > 0 || softSkills.length > 0) && (
              <ElegSection title="Skills & Expertise">
                {settings.showTechSkills && techSkills.length > 0 && <p style={{ margin: '0 0 4px', fontSize: 12.5, color: '#3d2512' }}><em>Technical:</em> {techSkills.join(', ')}</p>}
                {settings.showSoftSkills && softSkills.length > 0 && <p style={{ margin: 0, fontSize: 12.5, color: '#3d2512' }}><em>Personal:</em> {softSkills.join(', ')}</p>}
              </ElegSection>
            )}
            {settings.showLanguages && languages.length > 0 && (
              <ElegSection title="Languages">
                <p style={{ margin: 0, fontSize: 12.5, color: '#3d2512' }}>{languages.join(' · ')}</p>
              </ElegSection>
            )}
            {settings.showCertifications && certifications.length > 0 && (
              <ElegSection title="Certifications">
                {certifications.map((c, i) => <div key={i} style={{ fontSize: 12.5, color: '#3d2512', marginBottom: 3 }}>◆ {c}</div>)}
              </ElegSection>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
function ElegSection({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 1, background: '#c8a87a' }} />
        <span style={{ fontSize: 11, fontWeight: 400, letterSpacing: '0.2em', color: '#9b7a4a', textTransform: 'uppercase' }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: '#c8a87a' }} />
      </div>
      {children}
    </div>
  )
}

/* ── 9. COMPACT ── */
function TemplateCompact({ data, settings }) {
  const { formData: fd, experiences, educations, techSkills, softSkills, languages, certifications, projects, summary, photoUrl } = data
  const expDur = (exp) => {
    const from = [exp.fromMonth, exp.fromYear].filter(Boolean).join(' ')
    const to = exp.current ? 'Present' : [exp.toMonth, exp.toYear].filter(Boolean).join(' ')
    return [from, to].filter(Boolean).join(' – ')
  }
  return (
    <div style={{ fontFamily: 'Arial, "Helvetica Neue", sans-serif', color: '#111', background: '#fff', padding: '24px 32px', minHeight: 900, position: 'relative', fontSize: 12 }}>
      <ZerofyWatermark />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #222', paddingBottom: 10, marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>{fd.name || 'Your Name'}</h1>
          {fd.jobTitle && <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#555' }}>{fd.jobTitle}</p>}
        </div>
        <div style={{ textAlign: 'right', fontSize: 10.5, color: '#444', lineHeight: 1.7 }}>
          {fd.email && <div>{fd.email}</div>}
          {fd.phone && <div>{fd.phone}</div>}
          {settings.showLocation && fd.location && <div>{fd.location}</div>}
          {settings.showLinkedin && fd.linkedin && <div>{fd.linkedin}</div>}
        </div>
      </div>
      {settings.showSummary && summary && (
        <CompSection title="SUMMARY">
          <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.6, color: '#333' }}>{summary}</p>
        </CompSection>
      )}
      {settings.showExperience && experiences.some(e => e.title) && (
        <CompSection title="EXPERIENCE">
          {experiences.filter(e => e.title).map((exp, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>{exp.title}</strong>{exp.company && <span style={{ color: '#555' }}> · {exp.company}</span>}</span>
                <span style={{ fontSize: 10.5, color: '#777', whiteSpace: 'nowrap' }}>{expDur(exp)}</span>
              </div>
              {exp.description && <div style={{ fontSize: 11, color: '#444', marginTop: 2, paddingLeft: 8 }}>
                {exp.description.split('\n').filter(Boolean).map((b, j) => <div key={j}>• {b}</div>)}
              </div>}
            </div>
          ))}
        </CompSection>
      )}
      {settings.showProjects && projects.some(p => p.name) && (
        <CompSection title="PROJECTS">
          {projects.filter(p => p.name).map((proj, i) => (
            <div key={i} style={{ marginBottom: 5 }}>
              <strong>{proj.name}</strong>{proj.tech && <span style={{ color: '#777', fontSize: 10.5 }}> [{proj.tech}]</span>}
              {proj.description && <span style={{ color: '#444', fontSize: 11 }}> — {proj.description}</span>}
            </div>
          ))}
        </CompSection>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {settings.showEducation && educations.some(e => e.degree) && (
          <CompSection title="EDUCATION">
            {educations.filter(e => e.degree).map((e, i) => (
              <div key={i} style={{ marginBottom: 5 }}>
                <strong>{e.degree}</strong><span style={{ color: '#555' }}> · {e.institution}</span>
                <span style={{ color: '#777' }}> · {e.year}{e.score ? ` · ${e.score}` : ''}</span>
              </div>
            ))}
          </CompSection>
        )}
        <div>
          {(settings.showTechSkills || settings.showSoftSkills) && (techSkills.length > 0 || softSkills.length > 0) && (
            <CompSection title="SKILLS">
              {settings.showTechSkills && techSkills.length > 0 && <div style={{ fontSize: 11, marginBottom: 3 }}><strong>Tech:</strong> {techSkills.join(', ')}</div>}
              {settings.showSoftSkills && softSkills.length > 0 && <div style={{ fontSize: 11 }}><strong>Soft:</strong> {softSkills.join(', ')}</div>}
            </CompSection>
          )}
          {settings.showLanguages && languages.length > 0 && (
            <CompSection title="LANGUAGES">
              <div style={{ fontSize: 11 }}>{languages.join(' · ')}</div>
            </CompSection>
          )}
        </div>
      </div>
      {settings.showCertifications && certifications.length > 0 && (
        <CompSection title="CERTIFICATIONS">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 16px', fontSize: 11 }}>
            {certifications.map((c, i) => <span key={i}>✓ {c}</span>)}
          </div>
        </CompSection>
      )}
    </div>
  )
}
function CompSection({ title, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', color: '#333', borderBottom: '1px solid #ddd', paddingBottom: 2, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  )
}

/* ── 10. FRESH GRADUATE ── */
function TemplateFresher({ data, settings }) {
  const { formData: fd, experiences, educations, techSkills, softSkills, languages, certifications, projects, summary, photoUrl } = data
  const expDur = (exp) => {
    const from = [exp.fromMonth, exp.fromYear].filter(Boolean).join(' ')
    const to = exp.current ? 'Present' : [exp.toMonth, exp.toYear].filter(Boolean).join(' ')
    return [from, to].filter(Boolean).join(' – ')
  }
  return (
    <div style={{ fontFamily: '"Nunito", "Segoe UI", Arial, sans-serif', background: '#fff', minHeight: 900, position: 'relative' }}>
      <ZerofyWatermark />
      <div style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', padding: '32px 36px', color: '#fff' }}>
        {settings.showPhoto && (
          <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 12, border: '2px solid rgba(255,255,255,0.5)', overflow: 'hidden' }}>
            {photoUrl ? <img src={photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (fd.name?.charAt(0)?.toUpperCase() || '🎓')}
          </div>
        )}
        <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800 }}>{fd.name || 'Your Name'}</h1>
        {fd.jobTitle && <p style={{ margin: '0 0 14px', fontSize: 13, opacity: 0.9, fontWeight: 600 }}>{fd.jobTitle}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 12, opacity: 0.9 }}>
          {fd.email && <span>✉ {fd.email}</span>}
          {fd.phone && <span>☏ {fd.phone}</span>}
          {settings.showLocation && fd.location && <span>📍 {fd.location}</span>}
          {settings.showLinkedin && fd.linkedin && <span>🔗 {fd.linkedin}</span>}
        </div>
      </div>
      <div style={{ padding: '24px 36px' }}>
        {settings.showSummary && summary && (
          <FreshSection title="Career Objective" color="#11998e">
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: '#333', background: '#f0fdf4', padding: '12px 16px', borderRadius: 10, borderLeft: '4px solid #11998e' }}>{summary}</p>
          </FreshSection>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24 }}>
          <div>
            {settings.showEducation && educations.some(e => e.degree) && (
              <FreshSection title="Education" color="#38ef7d">
                {educations.filter(e => e.degree).map((e, i) => (
                  <div key={i} style={{ marginBottom: 12, padding: '10px 14px', background: '#f8fffe', border: '1.5px solid #38ef7d55', borderRadius: 10 }}>
                    <strong style={{ fontSize: 13, display: 'block', color: '#0d5e50' }}>{e.degree}</strong>
                    <div style={{ fontSize: 12, color: '#444' }}>{e.institution}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{e.year}{e.score ? ` · ${e.score}` : ''}</div>
                  </div>
                ))}
              </FreshSection>
            )}
            {settings.showExperience && experiences.some(e => e.title) && (
              <FreshSection title="Internships / Experience" color="#11998e">
                {experiences.filter(e => e.title).map((exp, i) => (
                  <div key={i} style={{ marginBottom: 12, paddingLeft: 12, borderLeft: '3px solid #11998e' }}>
                    <strong style={{ fontSize: 13 }}>{exp.title}</strong>
                    {exp.company && <div style={{ fontSize: 12, color: '#11998e' }}>{exp.company}</div>}
                    <div style={{ fontSize: 11, color: '#999' }}>{expDur(exp)}</div>
                    {exp.description && exp.description.split('\n').filter(Boolean).map((b, j) => (
                      <div key={j} style={{ fontSize: 12, color: '#444', marginTop: 2 }}>• {b}</div>
                    ))}
                  </div>
                ))}
              </FreshSection>
            )}
          </div>
          <div>
            {settings.showProjects && projects.some(p => p.name) && (
              <FreshSection title="Projects" color="#38ef7d">
                {projects.filter(p => p.name).map((proj, i) => (
                  <div key={i} style={{ marginBottom: 10, padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                    <strong style={{ fontSize: 12.5, color: '#0d5e50' }}>{proj.name}</strong>
                    {proj.tech && <div style={{ fontSize: 11, color: '#11998e' }}>{proj.tech}</div>}
                    {proj.link && <div style={{ fontSize: 10.5, color: '#888' }}>🔗 {proj.link}</div>}
                    {proj.description && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#444' }}>{proj.description}</p>}
                  </div>
                ))}
              </FreshSection>
            )}
            {settings.showTechSkills && techSkills.length > 0 && (
              <FreshSection title="Technical Skills" color="#11998e">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {techSkills.map((s, i) => <span key={i} style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>{s}</span>)}
                </div>
              </FreshSection>
            )}
            {settings.showSoftSkills && softSkills.length > 0 && (
              <FreshSection title="Soft Skills" color="#38ef7d">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {softSkills.map((s, i) => <span key={i} style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 11, padding: '2px 9px', borderRadius: 20 }}>{s}</span>)}
                </div>
              </FreshSection>
            )}
            {settings.showLanguages && languages.length > 0 && (
              <FreshSection title="Languages" color="#11998e">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {languages.map((l, i) => <span key={i} style={{ background: '#ecfdf5', color: '#065f46', fontSize: 11, padding: '2px 10px', borderRadius: 20, border: '1px solid #6ee7b7' }}>{l}</span>)}
                </div>
              </FreshSection>
            )}
            {settings.showCertifications && certifications.length > 0 && (
              <FreshSection title="Certifications" color="#38ef7d">
                {certifications.map((c, i) => <div key={i} style={{ fontSize: 12, color: '#065f46', marginBottom: 3 }}>🏅 {c}</div>)}
              </FreshSection>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
function FreshSection({ title, color, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color, borderBottom: `2px solid ${color}55`, paddingBottom: 5, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════
   SETTINGS PANEL
═══════════════════════════════════════════ */
function SettingsPanel({ settings, onChange, onClose }) {
  const toggles = [
    { key: 'showPhoto',         label: 'Profile Photo',        icon: '🖼️', desc: 'Upload & show photo' },
    { key: 'showSummary',       label: 'Professional Summary', icon: '📝', desc: 'Career objective' },
    { key: 'showExperience',    label: 'Work Experience',      icon: '💼', desc: 'Jobs, internships' },
    { key: 'showProjects',      label: 'Projects',             icon: '🚀', desc: 'Personal projects' },
    { key: 'showEducation',     label: 'Education',            icon: '🎓', desc: 'Degrees & history' },
    { key: 'showTechSkills',    label: 'Technical Skills',     icon: '⚙️', desc: 'Programming, tools' },
    { key: 'showSoftSkills',    label: 'Soft Skills',          icon: '🤝', desc: 'Leadership etc.' },
    { key: 'showLanguages',     label: 'Languages',            icon: '🌐', desc: 'Hindi, English...' },
    { key: 'showCertifications',label: 'Certifications',       icon: '🏅', desc: 'Courses & certs' },
    { key: 'showLocation',      label: 'Location',             icon: '📍', desc: 'City, state' },
    { key: 'showLinkedin',      label: 'LinkedIn / Portfolio', icon: '🔗', desc: 'Website link' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }} onClick={onClose}>
      <div style={{
        background: '#12121f', border: '1.5px solid rgba(255,255,255,0.1)',
        borderRadius: 20, width: '100%', maxWidth: 420, maxHeight: '88vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)'
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>Resume Sections</h2>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Changes apply instantly to the form</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => Object.keys(DEFAULT_SETTINGS).forEach(k => onChange(k, true))}
              style={{
                background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)',
                color: '#a89eff', fontSize: 11, padding: '5px 10px', borderRadius: 7,
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600
              }}>
              🔄 Reset
            </button>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        </div>

        {/* Live toggles */}
        <div style={{ overflowY: 'auto', padding: '8px 20px 20px' }}>
          {toggles.map(({ key, label, icon, desc }) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
              transition: 'opacity 0.2s', opacity: settings[key] ? 1 : 0.5
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{desc}</div>
                </div>
              </div>
              <div
                onClick={() => onChange(key, !settings[key])}
                style={{
                  width: 44, height: 24, borderRadius: 12, cursor: 'pointer', flexShrink: 0,
                  background: settings[key] ? '#6C63FF' : 'rgba(255,255,255,0.12)',
                  position: 'relative', transition: 'background 0.2s'
                }}>
                <div style={{
                  position: 'absolute', top: 2, left: settings[key] ? 22 : 2,
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%', background: 'linear-gradient(135deg,#6C63FF,#8B5CF6)',
              border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
              padding: '11px 0', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit'
            }}>
            ✓ Done
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function ResumeBuilder() {
  const [step, setStep] = useState(1) // 1=templates, 2=form, 3=preview
  const [selectedTemplate, setSelectedTemplate] = useState('classic')
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [summary, setSummary] = useState('')
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', location: '', linkedin: '', jobTitle: '',
  })
  const [experiences, setExperiences] = useState([emptyExp()])
  const [educations, setEducations] = useState([emptyEdu()])
  const [projects, setProjects] = useState([emptyProject()])
  const [techSkills, setTechSkills] = useState([])
  const [softSkills, setSoftSkills] = useState([])
  const [languages, setLanguages] = useState([])
  const [certifications, setCertifications] = useState([])
  const [photoUrl, setPhotoUrl] = useState('')
  const photoInputRef = useRef()
  const printRef = useRef()

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoUrl(ev.target.result)
    reader.readAsDataURL(file)
  }

  const upd = (k, v) => setFormData(p => ({ ...p, [k]: v }))
  const updSetting = (k, v) => setSettings(p => ({ ...p, [k]: v }))

  const resumeData = { formData, experiences, educations, techSkills, softSkills, languages, certifications, projects, summary, photoUrl }

  const renderResume = () => {
    const props = { data: resumeData, settings }
    switch (selectedTemplate) {
      case 'classic':   return <TemplateClassic {...props} />
      case 'modern':    return <TemplateModern {...props} />
      case 'executive': return <TemplateExecutive {...props} />
      case 'minimal':   return <TemplateMinimal {...props} />
      case 'creative':  return <TemplateCreative {...props} />
      case 'corporate': return <TemplateCorporate {...props} />
      case 'tech':      return <TemplateTech {...props} />
      case 'elegant':   return <TemplateElegant {...props} />
      case 'compact':   return <TemplateCompact {...props} />
      case 'fresher':   return <TemplateFresher {...props} />
      default:          return <TemplateClassic {...props} />
    }
  }

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return
    const win = window.open('', '_blank')
    win.document.write(`
      <!DOCTYPE html><html><head>
      <title>${formData.name || 'Resume'} - Resume</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #fff; }
        @page { size: A4; margin: 0; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
      </head><body>
      ${printContent.innerHTML}
      </body></html>
    `)
    win.document.close()
    setTimeout(() => { win.focus(); win.print(); }, 500)
  }

  // ── STYLES ──
  const card = {
    background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)',
    borderRadius: 20, padding: '28px 28px', maxWidth: 800, margin: '0 auto'
  }

  return (
    <>
      {/* Global styles */}
      <style>{`
        .rb-input:focus { border-color: rgba(108,99,255,0.55) !important; background: rgba(108,99,255,0.07) !important; box-shadow: 0 0 0 3px rgba(108,99,255,0.15) !important; }
        .rb-textarea:focus { border-color: rgba(108,99,255,0.55) !important; background: rgba(108,99,255,0.07) !important; box-shadow: 0 0 0 3px rgba(108,99,255,0.15) !important; }
        .tpl-card { cursor: pointer; background: rgba(255,255,255,0.03); border: 2px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 16px; transition: all 0.2s; }
        .tpl-card:hover { border-color: rgba(108,99,255,0.4); background: rgba(108,99,255,0.07); transform: translateY(-2px); }
        .tpl-card.selected { border-color: #6C63FF; background: rgba(108,99,255,0.12); box-shadow: 0 0 0 3px rgba(108,99,255,0.2); }
        .step-btn { background: none; border: none; color: rgba(255,255,255,0.5); font-size: 13px; cursor: pointer; padding: 6px 14px; border-radius: 8px; font-family: inherit; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
        .step-btn:hover { color: #fff; background: rgba(255,255,255,0.07); }
        .step-btn.active { color: #fff; }
        .add-btn { background: rgba(108,99,255,0.1); border: 1.5px dashed rgba(108,99,255,0.35); color: #a89eff; border-radius: 10px; padding: 10px; width: 100%; font-family: inherit; font-size: 13px; cursor: pointer; transition: all 0.2s; margin-top: 4px; }
        .add-btn:hover { background: rgba(108,99,255,0.18); border-color: rgba(108,99,255,0.6); }
        .primary-btn { background: linear-gradient(135deg, #6C63FF, #8B5CF6); border: none; color: #fff; font-size: 15px; font-weight: 700; padding: 13px 28px; border-radius: 12px; cursor: pointer; font-family: inherit; transition: all 0.2s; display: flex; align-items: center; gap: 8px; justify-content: center; }
        .primary-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(108,99,255,0.4); }
        .ghost-btn { background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); font-size: 14px; padding: 11px 22px; border-radius: 12px; cursor: pointer; font-family: inherit; transition: all 0.2s; }
        .ghost-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
      `}</style>

      {showSettings && <SettingsPanel settings={settings} onChange={updSetting} onClose={() => setShowSettings(false)} />}

      <div style={{ minHeight: '100%', padding: '0 0 60px', fontFamily: '"Segoe UI", Inter, Arial, sans-serif', color: '#fff' }}>

        {/* Back button + breadcrumb — same style as Invoice tool */}
        <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => window.history.back()}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)',
              color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
              fontSize: 13, fontFamily: 'inherit', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          >
            ‹ Back
          </button>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }}
              onClick={() => window.history.back()}>Home</span>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Resume Builder</span>
          </span>
        </div>

        {/* Header */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#6C63FF,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📄</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1 }}>Resume Builder</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>by Zerofy</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1,2,3].map(s => (
              <button key={s} className={`step-btn ${step === s ? 'active' : ''}`}
                onClick={() => { if (s < step || s === step) setStep(s) }}
                style={{ opacity: step >= s ? 1 : 0.4 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: step >= s ? '#6C63FF' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, transition: 'all 0.2s' }}>{s}</div>
                {s === 1 ? 'Template' : s === 2 ? 'Details' : 'Preview'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowSettings(true)} style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            ⚙️ Settings
          </button>
        </div>

        {/* ── STEP 1: Choose Template ── */}
        {step === 1 && (
          <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg,#6C63FF,#a89eff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Choose Your Template</h1>
              <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.4)' }}>10 professional designs — pick the one that fits your career</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {TEMPLATES.map(t => (
                <div key={t.id} className={`tpl-card ${selectedTemplate === t.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTemplate(t.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ fontSize: 28 }}>{t.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(108,99,255,0.15)', color: '#a89eff', letterSpacing: '0.05em' }}>{t.category}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{t.desc}</div>
                  {selectedTemplate === t.id && (
                    <div style={{ marginTop: 10, fontSize: 11, color: '#6C63FF', fontWeight: 700 }}>✓ Selected</div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button className="primary-btn" onClick={() => setStep(2)} style={{ fontSize: 16, padding: '14px 40px' }}>
                Continue with {TEMPLATES.find(t => t.id === selectedTemplate)?.label} →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Fill Details ── */}
        {step === 2 && (
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Fill Your Details</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Template: {TEMPLATES.find(t => t.id === selectedTemplate)?.label}</p>
              </div>
              <button
                onClick={() => setStep(1)}
                style={{
                  background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)',
                  color: '#fff', padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
                  fontSize: 13, fontFamily: 'inherit', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              >
                ‹ Change Template
              </button>
            </div>

            <div style={card}>
              {/* Personal Info */}
              <SectionDivider label="Personal Information" />
              {/* Photo Upload - shown only if showPhoto is enabled */}
              {settings.showPhoto && (
                <div style={{ marginBottom: 16 }}>
                  <label style={lbl}>Profile Photo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                      background: photoUrl ? 'transparent' : 'rgba(108,99,255,0.15)',
                      border: '2px solid rgba(108,99,255,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', fontSize: 24
                    }}>
                      {photoUrl
                        ? <img src={photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (formData.name?.charAt(0)?.toUpperCase() || '👤')
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        style={{
                          background: 'rgba(108,99,255,0.12)', border: '1.5px solid rgba(108,99,255,0.35)',
                          color: '#a89eff', borderRadius: 10, padding: '8px 18px',
                          fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all 0.2s', marginRight: 8
                        }}
                      >
                        📷 {photoUrl ? 'Change Photo' : 'Upload Photo'}
                      </button>
                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          style={{
                            background: 'rgba(255,80,80,0.1)', border: '1.5px solid rgba(255,80,80,0.25)',
                            color: '#ff8080', borderRadius: 10, padding: '8px 14px',
                            fontSize: 13, cursor: 'pointer', fontFamily: 'inherit'
                          }}
                        >
                          Remove
                        </button>
                      )}
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>JPG, PNG supported · Max 2MB</div>
                    </div>
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={lbl}>Full Name *</label><input className="rb-input" style={inp} placeholder="Rahul Sharma" value={formData.name} onChange={e => upd('name', e.target.value)} /></div>
                <div><label style={lbl}>Phone *</label><input className="rb-input" style={inp} type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={e => upd('phone', e.target.value)} /></div>
                <div><label style={lbl}>Email *</label><input className="rb-input" style={inp} type="email" placeholder="rahul@gmail.com" value={formData.email} onChange={e => upd('email', e.target.value)} /></div>
                <div><label style={lbl}>Location</label><input className="rb-input" style={inp} placeholder="Mumbai, Maharashtra" value={formData.location} onChange={e => upd('location', e.target.value)} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
                <div><label style={lbl}>LinkedIn / Portfolio</label><input className="rb-input" style={inp} placeholder="linkedin.com/in/rahul" value={formData.linkedin} onChange={e => upd('linkedin', e.target.value)} /></div>
                <div><label style={lbl}>Job Title / Target Role</label><SmartSelect value={formData.jobTitle} onChange={v => upd('jobTitle', v)} options={JOB_TITLES} placeholder="Select job role..." /></div>
              </div>

              {/* Summary */}
              <SectionDivider label="Professional Summary" />
              <div><label style={lbl}>Write a 2-3 line summary about yourself</label>
                <textarea className="rb-textarea" style={{ ...inp, minHeight: 80, resize: 'vertical' }}
                  placeholder="Motivated software engineer with 2+ years of experience in React and Node.js. Passionate about building user-friendly applications..."
                  value={summary} onChange={e => setSummary(e.target.value)} />
              </div>

              {/* Experience */}
              <SectionDivider label="Work Experience" />
              {experiences.map((exp, i) => (
                <ExperienceEntry key={i} exp={exp} idx={i}
                  onChange={(i, v) => setExperiences(p => p.map((x, j) => j === i ? v : x))}
                  onRemove={i => setExperiences(p => p.filter((_, j) => j !== i))} />
              ))}
              <button className="add-btn" onClick={() => setExperiences(p => [...p, emptyExp()])}>+ Add Work Experience</button>

              {/* Education */}
              <SectionDivider label="Education" />
              {educations.map((edu, i) => (
                <EducationEntry key={i} edu={edu} idx={i}
                  onChange={(i, v) => setEducations(p => p.map((x, j) => j === i ? v : x))}
                  onRemove={i => setEducations(p => p.filter((_, j) => j !== i))} />
              ))}
              <button className="add-btn" onClick={() => setEducations(p => [...p, emptyEdu()])}>+ Add Education</button>

              {/* Projects */}
              <SectionDivider label="Projects" />
              {projects.map((proj, i) => (
                <ProjectEntry key={i} proj={proj} idx={i}
                  onChange={(i, v) => setProjects(p => p.map((x, j) => j === i ? v : x))}
                  onRemove={i => setProjects(p => p.filter((_, j) => j !== i))} />
              ))}
              <button className="add-btn" onClick={() => setProjects(p => [...p, emptyProject()])}>+ Add Project</button>

              {/* Skills */}
              <SectionDivider label="Skills" />
              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>Technical Skills — type or select</label>
                <TagInput tags={techSkills} onAdd={t => setTechSkills(p => [...p, t])} onRemove={t => setTechSkills(p => p.filter(x => x !== t))}
                  suggestions={SKILL_SUGGESTIONS.tech} placeholder="e.g. React, Python, Excel..." color="#6C63FF" />
              </div>
              <div>
                <label style={lbl}>Soft Skills</label>
                <TagInput tags={softSkills} onAdd={t => setSoftSkills(p => [...p, t])} onRemove={t => setSoftSkills(p => p.filter(x => x !== t))}
                  suggestions={SKILL_SUGGESTIONS.soft} placeholder="e.g. Leadership, Communication..." color="#FF6B9D" />
              </div>

              {/* Languages */}
              <SectionDivider label="Languages" />
              <TagInput tags={languages} onAdd={t => setLanguages(p => [...p, t])} onRemove={t => setLanguages(p => p.filter(x => x !== t))}
                suggestions={LANGUAGES_LIST} placeholder="Add language..." color="#00D4AA" />

              {/* Certifications */}
              <SectionDivider label="Certifications" />
              <TagInput tags={certifications} onAdd={t => setCertifications(p => [...p, t])} onRemove={t => setCertifications(p => p.filter(x => x !== t))}
                suggestions={CERT_SUGGESTIONS} placeholder="e.g. AWS Certified, Google Analytics..." color="#F59E0B" />

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="primary-btn" style={{ flex: 1, fontSize: 15 }} onClick={() => setStep(3)}>
                  Preview Resume →
                </button>
                <button className="ghost-btn" onClick={() => setShowSettings(true)}>⚙️ Fields</button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Preview & Print ── */}
        {step === 3 && (
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            {/* Left: Vertical Template Selector */}
            <div style={{
              width: 180, flexShrink: 0, position: 'sticky', top: 20,
              background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: '14px 10px', maxHeight: '85vh', overflowY: 'auto'
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>Templates</div>
              {TEMPLATES.map(t => (
                <button key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  style={{
                    width: '100%', textAlign: 'left', marginBottom: 6,
                    background: selectedTemplate === t.id ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${selectedTemplate === t.id ? '#6C63FF' : 'rgba(255,255,255,0.08)'}`,
                    color: '#fff', borderRadius: 10, padding: '9px 11px', cursor: 'pointer',
                    fontSize: 12, fontFamily: 'inherit',
                    fontWeight: selectedTemplate === t.id ? 700 : 400,
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 7
                  }}>
                  <span style={{ fontSize: 16 }}>{t.icon}</span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{t.category}</div>
                  </div>
                  {selectedTemplate === t.id && <span style={{ fontSize: 10, color: '#6C63FF' }}>✓</span>}
                </button>
              ))}
            </div>

            {/* Right: Preview area */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Your Resume is Ready! 🎉</h2>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Preview, switch template, or print as PDF</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    onClick={() => setStep(2)}
                    style={{
                      background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)',
                      color: '#fff', padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
                      fontSize: 13, fontFamily: 'inherit', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                  >
                    ‹ Edit Details
                  </button>
                  <button className="ghost-btn" onClick={() => setShowSettings(true)}>⚙️ Settings</button>
                  <button className="primary-btn" onClick={handlePrint}>🖨️ Print / Save PDF</button>
                </div>
              </div>

              {/* Resume Preview */}
              <div style={{
                background: '#e5e7eb', borderRadius: 16, padding: 24,
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)'
              }}>
                <div ref={printRef} style={{
                  background: '#fff', borderRadius: 8,
                  boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
                  overflow: 'hidden', minHeight: 800
                }}>
                  {renderResume()}
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button className="primary-btn" onClick={handlePrint} style={{ fontSize: 16, padding: '14px 40px' }}>
                  🖨️ Print / Download as PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
