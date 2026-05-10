import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TOOLS, POPULAR_TOOLS } from '../tools/toolsData'
import styles from './HomePage.module.css'

const RECENT_TOOLS_KEY = 'zerofy_recent_tools'
const MAX_RECENT = 8

function getRecentToolIds() {
  try {
    const stored = localStorage.getItem(RECENT_TOOLS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

export function trackToolUsage(toolId) {
  try {
    const recent = getRecentToolIds().filter(id => id !== toolId)
    recent.unshift(toolId)
    localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
  } catch {}
}

export default function HomePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [recentToolIds, setRecentToolIds] = useState(() => getRecentToolIds())

  useEffect(() => {
    const onFocus = () => setRecentToolIds(getRecentToolIds())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const recentTools = recentToolIds.map(id => TOOLS.find(t => t.id === id)).filter(Boolean)
  const hasRecentTools = recentTools.length > 0
  const popularTools = TOOLS.filter(t => POPULAR_TOOLS.includes(t.id))
  const shownTools = hasRecentTools ? recentTools : popularTools

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/tools?q=${encodeURIComponent(search.trim())}`)
    }
  }

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className="page-wrapper">
          <div className={`${styles.heroEyebrow} fade-up`}>
            <span className={styles.eyebrowDot} />
            All-in-one productivity platform
          </div>
          <h1 className={`${styles.heroTitle} fade-up`}>
            Stop Switching.<br />
            <span className={styles.accent}>Start Doing.</span>
          </h1>
          <p className={`${styles.heroSub} fade-up-1`}>
            70+ tools. One platform. Zero distractions.
          </p>
          <div className={`${styles.heroSearch} fade-up-2`}>
            <span className={styles.heroSearchIcon}>🔍</span>
            <input
              placeholder="Search any tool... like 'compress PDF' or 'cut MP3'"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className={styles.heroSearchInput}
            />
          </div>

          {/* ── Recently Used / Popular — RIGHT BELOW HERO SEARCH ── */}
          <div className={styles.quickBar}>
            <div className={styles.quickBarLabel}>
              {hasRecentTools ? '🕐 Recently Used' : '🔥 Popular'}
            </div>
            <div className={styles.quickBarTools}>
              {shownTools.slice(0, 6).map(t => (
                <Link
                  key={t.id}
                  to={t.route}
                  className={styles.quickBarChip}
                  onClick={() => trackToolUsage(t.id)}
                >
                  <span>{t.icon}</span>
                  <span>{t.name}</span>
                </Link>
              ))}
              {hasRecentTools && (
                <button
                  className={styles.quickBarClear}
                  onClick={() => { localStorage.removeItem(RECENT_TOOLS_KEY); setRecentToolIds([]) }}
                >✕ Clear</button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <div className={styles.statsStrip}>
        <div className={styles.statItem}><span className={styles.statNum}>70+</span><span className={styles.statLabel}>Tools</span></div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}><span className={styles.statNum}>100%</span><span className={styles.statLabel}>Free</span></div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}><span className={styles.statNum}>0</span><span className={styles.statLabel}>Signup needed</span></div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}><span className={styles.statNum}>∞</span><span className={styles.statLabel}>Usage</span></div>
      </div>

      {/* ── 4 Feature Cards (new design) ── */}
      <div className="page-wrapper">
        <div className={styles.featureGrid}>

          {/* Card 1 – Invoice Maker */}
          <Link to="/tools/invoice-maker" className={`${styles.featureCard} ${styles.featureCardInvoice}`} onClick={() => trackToolUsage('invoice-maker')}>
            <div className={styles.fcBg} />
            <div className={styles.fcCornerAccent} />
            <div className={styles.fcTop}>
              <div className={styles.fcIconRing}>🧾</div>
              <span className={styles.fcBadge}>PRO</span>
            </div>
            <div className={styles.fcBody}>
              <h3 className={styles.fcTitle}>Invoice Maker</h3>
              <p className={styles.fcDesc}>GST-ready professional invoices. PDF export in seconds.</p>
            </div>
            <div className={styles.fcFooter}>
              <span className={styles.fcTag}>✓ GST ready</span>
              <span className={styles.fcTag}>✓ PDF export</span>
              <span className={styles.fcArrow}>→</span>
            </div>
          </Link>

          {/* Card 2 – Resume Builder */}
          <Link to="/tools/resume-builder" className={`${styles.featureCard} ${styles.featureCardResume}`} onClick={() => trackToolUsage('resume-builder')}>
            <div className={styles.fcBg} />
            <div className={styles.fcCornerAccent} />
            <div className={styles.fcTop}>
              <div className={styles.fcIconRing}>📄</div>
              <span className={`${styles.fcBadge} ${styles.fcBadgeBlue}`}>PRO</span>
            </div>
            <div className={styles.fcBody}>
              <h3 className={styles.fcTitle}>Resume Builder</h3>
              <p className={styles.fcDesc}>ATS-friendly resumes with pro templates. Download-ready.</p>
            </div>
            <div className={styles.fcFooter}>
              <span className={styles.fcTag}>✓ ATS friendly</span>
              <span className={styles.fcTag}>✓ Templates</span>
              <span className={styles.fcArrow}>→</span>
            </div>
          </Link>

          {/* Card 3 – Govt Jobs */}
          <Link to="/govt-jobs" className={`${styles.featureCard} ${styles.featureCardGovt}`}>
            <div className={styles.fcBg} />
            <div className={styles.fcCornerAccent} />
            <div className={styles.fcTop}>
              <div className={styles.fcIconRing}>🏛️</div>
              <span className={`${styles.fcBadge} ${styles.fcBadgeLive}`}>🔴 Live</span>
            </div>
            <div className={styles.fcBody}>
              <h3 className={styles.fcTitle}>Govt Jobs Portal</h3>
              <p className={styles.fcDesc}>SSC · Railway · Bank · RPSC · Police — daily updates.</p>
            </div>
            <div className={styles.fcFooter}>
              <span className={styles.fcTag}>🚂 Railway</span>
              <span className={styles.fcTag}>📋 SSC</span>
              <span className={styles.fcArrow}>→</span>
            </div>
          </Link>

          {/* Card 4 – All Tools */}
          <Link to="/tools" className={`${styles.featureCard} ${styles.featureCardTools}`}>
            <div className={styles.fcBg} />
            <div className={styles.fcCornerAccent} />
            <div className={styles.fcTop}>
              <div className={styles.fcIconRing}>⚡</div>
              <span className={`${styles.fcBadge} ${styles.fcBadgePurple}`}>{TOOLS.filter(t => t.status === 'ready').length}+ Live</span>
            </div>
            <div className={styles.fcBody}>
              <h3 className={styles.fcTitle}>All Power Tools</h3>
              <p className={styles.fcDesc}>PDF, Video, Audio, Image, Dev tools — sab ek jagah.</p>
            </div>
            <div className={styles.fcFooter}>
              <span className={styles.fcTag}>📄 PDF</span>
              <span className={styles.fcTag}>🎬 Video</span>
              <span className={styles.fcTag}>🖼️ Image</span>
              <span className={styles.fcArrow}>→</span>
            </div>
          </Link>

        </div>
      </div>

    </div>
  )
}
