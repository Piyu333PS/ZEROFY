import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, TOOLS, POPULAR_TOOLS } from '../tools/toolsData'
import styles from './HomePage.module.css'
import ZerofyLogoAnimation from '../components/ZerofyLogoAnimation'

const RECENT_TOOLS_KEY = 'zerofy_recent_tools'
const MAX_RECENT = 8

function getRecentToolIds() {
  try {
    const stored = localStorage.getItem(RECENT_TOOLS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function trackToolUsage(toolId) {
  try {
    const recent = getRecentToolIds().filter(id => id !== toolId)
    recent.unshift(toolId)
    localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
  } catch {}
}

function ToolCard({ tool }) {
  const isReady = tool.status === 'ready'

  const content = (
    <>
      {!isReady && <div className={styles.comingOverlay} />}
      <div className={styles.toolCardInner}>
        <div className={styles.toolIconWrap}>
          <span className={styles.toolIcon}>{tool.icon}</span>
        </div>
        <div className={styles.toolName}>{tool.name}</div>
        <div className={styles.toolDesc}>{tool.desc}</div>
      </div>
      {!isReady && (
        <div className={styles.comingBadgeWrap}>
          <span className={styles.comingBadge}>
            <span className={styles.comingDot} />
            Coming Soon
          </span>
        </div>
      )}
      {isReady && <div className={styles.readyArrow}>→</div>}
    </>
  )

  if (!isReady) {
    return <div className={`${styles.toolCard} ${styles.coming}`}>{content}</div>
  }

  return (
    <Link to={tool.route} className={styles.toolCard} onClick={() => trackToolUsage(tool.id)}>
      {content}
    </Link>
  )
}

const STATUS_TABS = [
  { id: 'live',   label: '✅ Live Tools' },
  { id: 'coming', label: '🕐 Coming Soon' },
  { id: 'all',    label: 'All' },
]

export default function HomePage() {
  const [activecat, setActivecat]       = useState('all')
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('live')
  const [recentToolIds, setRecentToolIds] = useState(() => getRecentToolIds())

  // Refresh recent tools when page gains focus (user comes back from a tool)
  useEffect(() => {
    const onFocus = () => setRecentToolIds(getRecentToolIds())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const filtered = TOOLS.filter(t => {
    const matchCat    = activecat === 'all' || t.cat === activecat
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      statusFilter === 'all'    ? true :
      statusFilter === 'live'   ? t.status === 'ready' :
      statusFilter === 'coming' ? t.status !== 'ready' :
      true
    return matchCat && matchSearch && matchStatus
  })

  const comingSoonCount = TOOLS.filter(t => t.status !== 'ready').length

  const recentTools = recentToolIds
    .map(id => TOOLS.find(t => t.id === id))
    .filter(Boolean)

  const hasRecentTools = recentTools.length > 0
  const popularTools = TOOLS.filter(t => POPULAR_TOOLS.includes(t.id))
  const shownTools = hasRecentTools ? recentTools : popularTools
  const sectionLabel = hasRecentTools ? '🕐 Recently Used' : '🔥 Popular Tools'
  const isSearching = search.length > 0

  const displayTools = isSearching
    ? TOOLS.filter(t => {
        const matchCat = activecat === 'all' || t.cat === activecat
        return matchCat && (
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.desc.toLowerCase().includes(search.toLowerCase())
        )
      })
    : filtered

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className="page-wrapper">
          <div className={styles.heroBadge}>
            <ZerofyLogoAnimation />
          </div>
          <h1 className={`${styles.heroTitle} fade-up`}>
            Zero Limits.<br />
            <span className={styles.accent}>Infinite Tools.</span>
          </h1>
          <p className={`${styles.heroSub} fade-up-1`}>
            PDF, Video, Audio, Image — everything in one place.<br />
            Fast, free, and incredibly easy to use.
          </p>
          <div className={`${styles.heroSearch} fade-up-2`}>
            <span className={styles.heroSearchIcon}>🔍</span>
            <input
              placeholder="Search any tool... like 'compress PDF' or 'cut MP3'"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.heroSearchInput}
            />
          </div>
          <div className={`${styles.heroStats} fade-up-3`}>
            <div className={styles.stat}><strong>70+</strong> Tools</div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><strong>100%</strong> Free</div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><strong>Privacy</strong> First</div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><strong>No</strong> Limits</div>
          </div>
        </div>
      </section>

      <div className="page-wrapper">
        {/* Popular / Recently Used Tools */}
        {!isSearching && activecat === 'all' && statusFilter === 'live' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.fire}>{hasRecentTools ? '🕐' : '🔥'}</span>
              {hasRecentTools ? 'Recently Used' : 'Popular Tools'}
              {hasRecentTools && (
                <button
                  className={styles.clearRecentBtn}
                  onClick={() => {
                    localStorage.removeItem(RECENT_TOOLS_KEY)
                    setRecentToolIds([])
                  }}
                  title="Clear history"
                >
                  Clear
                </button>
              )}
            </h2>
            <div className={styles.popularGrid}>
              {shownTools.map(t => (
                <Link
                  to={t.route}
                  key={t.id}
                  className={styles.popularCard}
                  onClick={() => trackToolUsage(t.id)}
                >
                  <span className={styles.popularIcon}>{t.icon}</span>
                  <span className={styles.popularName}>{t.name}</span>
                  <span className={styles.popularArrow}>→</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Category Tabs */}
        <section className={styles.section}>
          <div className={styles.catTabs}>
            <button
              className={`${styles.catTab} ${activecat === 'all' ? styles.catActive : ''}`}
              onClick={() => setActivecat('all')}
            >
              All
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                className={`${styles.catTab} ${activecat === c.id ? styles.catActive : ''}`}
                onClick={() => setActivecat(c.id)}
                style={activecat === c.id ? { '--cat-color': c.color, '--cat-dim': c.dim } : {}}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </section>

        {/* Status Filter Tabs */}
        {!isSearching && (
          <section className={styles.statusTabsSection}>
            <div className={styles.statusTabs}>
              {STATUS_TABS.map(s => (
                <button
                  key={s.id}
                  className={`${styles.statusTab} ${statusFilter === s.id ? styles.statusActive : ''}`}
                  onClick={() => setStatusFilter(s.id)}
                >
                  {s.label}
                  {s.id === 'coming' && (
                    <span className={styles.statusBadge}>{comingSoonCount}</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Tools Grid */}
        <section className={styles.section}>
          {isSearching && (
            <p className={styles.searchResult}>
              {displayTools.length} result{displayTools.length !== 1 ? 's' : ''} for "{search}"
            </p>
          )}

          {displayTools.length > 0 ? (
            <div className={styles.toolsGrid}>
              {displayTools.map(t => <ToolCard key={t.id} tool={t} />)}
            </div>
          ) : (
            <div className={styles.noResults}>
              <div className={styles.noResultsIcon}>🔍</div>
              <div>No tools found</div>
              <div style={{ fontSize: 14, color: 'var(--text3)', marginTop: 8 }}>
                {isSearching ? 'Try different keywords' : 'Try a different filter'}
              </div>
            </div>
          )}

          {!isSearching && statusFilter === 'live' && (
            <div className={styles.comingSoonNudge}>
              <span>🚀</span>
              <span>
                <strong>{comingSoonCount} more tools</strong> are on the way —{' '}
                <button
                  className={styles.nudgeLink}
                  onClick={() => setStatusFilter('coming')}
                >
                  View Coming Soon →
                </button>
              </span>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
