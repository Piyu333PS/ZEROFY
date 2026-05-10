import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CATEGORIES, TOOLS } from '../tools/toolsData'
import { trackToolUsage } from './HomePage'
import styles from './HomePage.module.css'

// Category color map
const CAT_COLORS = {
  pdf:       { color: '#ef4444', dim: 'rgba(239,68,68,0.08)' },
  video:     { color: '#a855f7', dim: 'rgba(168,85,247,0.08)' },
  audio:     { color: '#f59e0b', dim: 'rgba(245,158,11,0.08)' },
  image:     { color: '#10b981', dim: 'rgba(16,185,129,0.08)' },
  document:  { color: '#3b82f6', dim: 'rgba(59,130,246,0.08)' },
  converter: { color: '#06b6d4', dim: 'rgba(6,182,212,0.08)' },
  developer: { color: '#8b5cf6', dim: 'rgba(139,92,246,0.08)' },
  security:  { color: '#f97316', dim: 'rgba(249,115,22,0.08)' },
}

function ToolCard({ tool }) {
  const isReady = tool.status === 'ready'
  const catStyle = CAT_COLORS[tool.cat] || {}

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

  const cardStyle = {
    '--cat-color': catStyle.color,
    '--cat-dim': catStyle.dim,
  }

  if (!isReady) {
    return <div className={`${styles.toolCard} ${styles.coming}`} data-cat={tool.cat} style={cardStyle}>{content}</div>
  }

  return (
    <Link to={tool.route} className={styles.toolCard} data-cat={tool.cat} style={cardStyle} onClick={() => trackToolUsage(tool.id)}>
      {content}
    </Link>
  )
}

const STATUS_TABS = [
  { id: 'live',   label: '✅ Live Tools' },
  { id: 'coming', label: '🕐 Coming Soon' },
  { id: 'all',    label: 'All' },
]

export default function AllToolsPage() {
  const navigate = useNavigate()
  const [activecat, setActivecat]       = useState('all')
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('live')

  const comingSoonCount = TOOLS.filter(t => t.status !== 'ready').length

  const isSearching = search.length > 0

  const displayTools = isSearching
    ? TOOLS.filter(t => {
        const matchCat = activecat === 'all' || t.cat === activecat
        return matchCat && (
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.desc.toLowerCase().includes(search.toLowerCase())
        )
      })
    : TOOLS.filter(t => {
        const matchCat    = activecat === 'all' || t.cat === activecat
        const matchStatus =
          statusFilter === 'all'    ? true :
          statusFilter === 'live'   ? t.status === 'ready' :
          statusFilter === 'coming' ? t.status !== 'ready' :
          true
        return matchCat && matchStatus
      })

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className="page-wrapper" style={{ paddingTop: 32, paddingBottom: 0 }}>
        <div style={{ marginBottom: 24 }}>
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 100, padding: '6px 14px',
              color: 'var(--text2)', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', marginBottom: 16,
              transition: 'all 0.18s', fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text2)' }}
          >
            ← Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>⚡</span>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              All Tools
            </h1>
            <span style={{
              background: 'rgba(99,102,241,0.15)', color: '#818cf8',
              fontSize: 11, fontWeight: 600, padding: '2px 8px',
              borderRadius: 100, border: '1px solid rgba(99,102,241,0.25)'
            }}>
              {TOOLS.filter(t => t.status === 'ready').length}+ Live
            </span>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 14, margin: 0 }}>
            PDF, Video, Audio, Image, Document — sab kuch ek jagah. Free mein use karo, bina signup ke.
          </p>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface)', border: '1px solid var(--border2)',
          borderRadius: 12, padding: '10px 16px', marginBottom: 20
        }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input
            placeholder="Search any tool... like 'compress PDF' or 'cut MP3'"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: 14, width: '100%'
            }}
          />
        </div>

        {/* Category Tabs */}
        <section className={styles.section} style={{ paddingTop: 0 }}>
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
