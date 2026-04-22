import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, TOOLS, POPULAR_TOOLS } from '../tools/toolsData'
import styles from './HomePage.module.css'
import logoImg from '../assets/logo.png'

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

export default function HomePage() {
  const [activecat, setActivecat] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = TOOLS.filter(t => {
    const matchCat = activecat === 'all' || t.cat === activecat
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const popularTools = TOOLS.filter(t => POPULAR_TOOLS.includes(t.id))

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className="page-wrapper">
          <div className={styles.heroBadge}>
            <div className={styles.logoRingWrap}>
              <div className={styles.logoRing} />
              <div className={styles.logoRingOuter} />
              <img
                src={logoImg}
                alt="Zerofy"
                className={styles.heroLogoImg}
              />
            </div>
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
        {/* Popular Tools */}
        {!search && activecat === 'all' && (
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

        {/* Categories */}
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

        {/* Tools Grid */}
        <section className={styles.section}>
          {search && (
            <p className={styles.searchResult}>
              "{search}" ke liye {filtered.length} tools mile
            </p>
          )}
          {filtered.length > 0 ? (
            <div className={styles.toolsGrid}>
              {filtered.map(t => <ToolCard key={t.id} tool={t} />)}
            </div>
          ) : (
            <div className={styles.noResults}>
              <div className={styles.noResultsIcon}>🔍</div>
              <div>Koi tool nahi mila</div>
              <div style={{ fontSize: 14, color: 'var(--text3)', marginTop: 8 }}>Alag keywords try karo</div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
