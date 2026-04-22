import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, TOOLS, POPULAR_TOOLS } from '../tools/toolsData'
import styles from './HomePage.module.css'
import ZerofyLogoAnimation from '../components/ZerofyLogoAnimation'

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
    <Link to={tool.route} className={styles.toolCard}>
      {content}
    </Link>
  )
}

// Status filter options
const STATUS_TABS = [
  { id: 'live',   label: '✅ Live Tools' },
  { id: 'coming', label: '🕐 Coming Soon' },
  { id: 'all',    label: 'All' },
]

export default function HomePage() {
  const [activecat, setActivecat]       = useState('all')
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('live') // default: sirf ready tools

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

  // Coming soon count (for badge on tab)
  const comingSoonCount = TOOLS.filter(t => t.status !== 'ready').length

  const popularTools = TOOLS.filter(t => POPULAR_TOOLS.includes(t.id))

  // Search mode mein status filter ignore karo — sab dikhao
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
            PDF, Video, Audio, Image — sab kuch ek jagah.<br />
            Fast, free, aur bilkul aasaan. No signup.
          </p>
          <div className={`${styles.heroSearch} fade-up-2`}>
            <span className={styles.heroSearchIcon}>🔍</span>
            <input
              placeholder="Koi bhi tool dhundho... jaise 'PDF compress' ya 'MP3 cut'"
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
            <div className={styles.stat}><strong>No</strong> Signup</div>
            <div className={styles.statDivider} />
            <div className={styles.stat}><strong>Privacy</strong> First</div>
          </div>
        </div>
      </section>

      <div className="page-wrapper">
        {/* Popular Tools — sirf default view mein */}
        {!isSearching && activecat === 'all' && statusFilter === 'live' && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.fire}>🔥</span> Popular Tools
            </h2>
            <div className={styles.popularGrid}>
              {popularTools.map(t => (
                <Link to={t.route} key={t.id} className={styles.popularCard}>
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

        {/* Status Filter Tabs — search mode mein nahi dikhenge */}
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
              "{search}" ke liye {displayTools.length} tools mile
            </p>
          )}

          {displayTools.length > 0 ? (
            <div className={styles.toolsGrid}>
              {displayTools.map(t => <ToolCard key={t.id} tool={t} />)}
            </div>
          ) : (
            <div className={styles.noResults}>
              <div className={styles.noResultsIcon}>🔍</div>
              <div>Koi tool nahi mila</div>
              <div style={{ fontSize: 14, color: 'var(--text3)', marginTop: 8 }}>
                {isSearching ? 'Alag keywords try karo' : 'Doosra filter try karo'}
              </div>
            </div>
          )}

          {/* Coming Soon nudge — sirf live filter mein */}
          {!isSearching && statusFilter === 'live' && (
            <div className={styles.comingSoonNudge}>
              <span>🚀</span>
              <span>
                <strong>{comingSoonCount} aur tools</strong> aa rahe hain —{' '}
                <button
                  className={styles.nudgeLink}
                  onClick={() => setStatusFilter('coming')}
                >
                  Coming Soon dekho →
                </button>
              </span>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
