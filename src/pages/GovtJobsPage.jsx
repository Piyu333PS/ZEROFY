import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import styles from './GovtJobsPage.module.css'

// ─── RSS Sources ───────────────────────────────────────────────────────────
const RSS_SOURCES = [
  {
    id: 'rojgarresult',
    name: 'Rojgar Result',
    feedUrl: 'https://rojgarresult.com/feed/',
    color: '#10b981',
  },
  {
    id: 'sarkariresult',
    name: 'Sarkari Result',
    feedUrl: 'https://www.sarkariresult.com/feed/',
    color: '#f59e0b',
  },
  {
    id: 'freejobalert',
    name: 'FreeJobAlert',
    feedUrl: 'https://www.freejobalert.com/feed/',
    color: '#ec4899',
  },
  {
    id: 'sarkariexam',
    name: 'Sarkari Exam',
    feedUrl: 'https://www.sarkariexam.com/feed/',
    color: '#8b5cf6',
  },
  {
    id: 'govtjobsguru',
    name: 'Govt Jobs Guru',
    feedUrl: 'https://www.govtjobsguru.in/feed/',
    color: '#06b6d4',
  },
  {
    id: 'naukriday',
    name: 'Naukri Day',
    feedUrl: 'https://www.naukriday.com/feed/',
    color: '#f97316',
  },
]

const FILTERS = [
  { id: 'all',       label: '🗂️ All Jobs' },
  { id: 'rajasthan', label: '🏜️ Rajasthan' },
  { id: 'railway',   label: '🚂 Railway' },
  { id: 'bank',      label: '🏦 Bank' },
  { id: 'ssc',       label: '📋 SSC' },
  { id: 'police',    label: '👮 Police' },
  { id: 'army',      label: '🪖 Army' },
]

const KEYWORDS = {
  rajasthan: ['rajasthan', 'rpsc', 'reet', 'patwari', 'rsmssb'],
  railway:   ['railway', 'rrb', 'rail'],
  bank:      ['bank', 'ibps', 'sbi', 'rbi', 'nabard'],
  ssc:       ['ssc', 'cgl', 'chsl', 'mts', 'gd'],
  police:    ['police', 'constable', 'sub inspector'],
  army:      ['army', 'navy', 'airforce', 'agniveer', 'defence'],
}

const SORT_OPTIONS = [
  { id: 'deadline', label: '📅 By Deadline' },
  { id: 'newest',   label: '🆕 Newest First' },
]

// ─── Date Extraction ────────────────────────────────────────────────────────
const MONTH_MAP = {
  jan:1,feb:2,mar:3,apr:4,may:5,jun:6,
  jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
  january:1,february:2,march:3,april:4,june:6,
  july:7,august:8,september:9,october:10,november:11,december:12,
}

function parseDate(str) {
  if (!str) return null
  const s = str.trim().replace(/\s+/g, ' ')
  const d = new Date(s)
  if (!isNaN(d) && d.getFullYear() > 2020) return d
  // DD Month YYYY
  const m1 = s.match(/(\d{1,2})[\s\-\/]([a-zA-Z]+)[\s\-\/,]*(\d{4})/)
  if (m1) {
    const mon = MONTH_MAP[m1[2].toLowerCase().slice(0,3)]
    if (mon) return new Date(+m1[3], mon - 1, +m1[1])
  }
  // DD/MM/YYYY or DD-MM-YYYY
  const m2 = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (m2) return new Date(+m2[3], +m2[2] - 1, +m2[1])
  return null
}

function extractLastDate(title, description) {
  const desc = (description || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ')
  const combined = `${title} ${desc}`

  const keywordPatterns = [
    /last\s+date[:\s\-–]*([^\n<|]{3,35})/gi,
    /apply\s+(?:by|before|upto|up\s+to)[:\s\-–]*([^\n<|]{3,35})/gi,
    /closing\s+date[:\s\-–]*([^\n<|]{3,35})/gi,
    /deadline[:\s\-–]*([^\n<|]{3,35})/gi,
    /last\s+dt\.?[:\s\-–]*([^\n<|]{3,35})/gi,
    /application\s+(?:last|closing)\s+date[:\s\-–]*([^\n<|]{3,35})/gi,
  ]

  for (const pattern of keywordPatterns) {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(combined)) !== null) {
      const d = parseDate(match[1])
      if (d && d.getFullYear() >= 2024) return d
    }
  }

  // Scan for any future dates
  const datePats = [
    /(\d{1,2}\s+[a-zA-Z]{3,9}\s+\d{4})/g,
    /(\d{1,2}[\-\/]\d{1,2}[\-\/]\d{4})/g,
  ]
  const future = []
  for (const pat of datePats) {
    let m
    while ((m = pat.exec(combined)) !== null) {
      const d = parseDate(m[1])
      if (d && d > new Date()) future.push(d)
    }
  }
  if (future.length) return future.sort((a, b) => a - b)[0]
  return null
}

// ─── RSS Fetch with Multiple Proxies ────────────────────────────────────────
function parseXMLItems(xml, src) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const items = Array.from(doc.querySelectorAll('item'))
  if (items.length === 0) throw new Error('No items in XML')
  return items.slice(0, 50).map(item => {
    const title   = item.querySelector('title')?.textContent || ''
    const link    = item.querySelector('link')?.textContent ||
                    item.querySelector('link')?.getAttribute('href') || ''
    const desc    = item.querySelector('description')?.textContent || ''
    const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString()
    return {
      title, link, description: desc, pubDate,
      source: src.name,
      sourceColor: src.color,
      lastDate: extractLastDate(title, desc),
    }
  })
}

async function fetchRSSFeed(src) {
  const proxies = [
    // Proxy 1: allorigins raw (most reliable in prod)
    async () => {
      const r = await fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(src.feedUrl)}`,
        { signal: AbortSignal.timeout(12000) }
      )
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const xml = await r.text()
      return parseXMLItems(xml, src)
    },
    // Proxy 2: allorigins JSON wrapper
    async () => {
      const r = await fetch(
        `https://api.allorigins.win/get?url=${encodeURIComponent(src.feedUrl)}`,
        { signal: AbortSignal.timeout(12000) }
      )
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = await r.json()
      if (!data.contents) throw new Error('No contents')
      return parseXMLItems(data.contents, src)
    },
    // Proxy 3: rss2json (reliable fallback)
    async () => {
      const r = await fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(src.feedUrl)}&count=50`,
        { signal: AbortSignal.timeout(12000) }
      )
      const data = await r.json()
      if (!data.items?.length) throw new Error('No items')
      return data.items.map(item => ({
        ...item,
        source: src.name,
        sourceColor: src.color,
        lastDate: extractLastDate(item.title || '', item.description || ''),
      }))
    },
    // Proxy 4: corsproxy.io
    async () => {
      const r = await fetch(
        `https://corsproxy.io/?${encodeURIComponent(src.feedUrl)}`,
        { signal: AbortSignal.timeout(12000) }
      )
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const xml = await r.text()
      return parseXMLItems(xml, src)
    },
    // Proxy 5: thingproxy
    async () => {
      const r = await fetch(
        `https://thingproxy.freeboard.io/fetch/${src.feedUrl}`,
        { signal: AbortSignal.timeout(12000) }
      )
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const xml = await r.text()
      return parseXMLItems(xml, src)
    },
  ]

  for (const proxy of proxies) {
    try {
      const items = await proxy()
      if (items.length > 0) return items
    } catch (e) {
      console.warn(`Proxy failed for ${src.name}:`, e.message)
    }
  }
  throw new Error(`All proxies failed for ${src.name}`)
}


function formatLastDate(date) {
  if (!date) return null
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysLeft(date) {
  if (!date) return null
  return Math.ceil((date - Date.now()) / 86400000)
}

function isJobActive(job) {
  if (!job.lastDate) return true
  return job.lastDate >= new Date(new Date().setHours(0, 0, 0, 0))
}

function matchesFilter(title, filter) {
  if (filter === 'all') return true
  const t = title.toLowerCase()
  return (KEYWORDS[filter] || []).some(k => t.includes(k))
}

function postedAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

// ─── Job Card ────────────────────────────────────────────────────────────────
function JobCard({ job, index }) {
  const left   = daysLeft(job.lastDate)
  const posted = postedAgo(job.pubDate)
  const isNew  = posted === 'Today'

  let urgency = ''
  if (left !== null) {
    if (left <= 3)       urgency = 'critical'
    else if (left <= 7)  urgency = 'soon'
  }

  return (
    <a
      href={job.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.jobCard} ${urgency ? styles[`urgency_${urgency}`] : ''}`}
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      <div className={styles.accentBar} />

      <div className={styles.jobBody}>
        {/* Title row */}
        <div className={styles.jobTitleRow}>
          <span className={styles.jobTitle}>{job.title}</span>
          {isNew && <span className={styles.newBadge}>🔥 New</span>}
        </div>

        {/* Meta row */}
        <div className={styles.jobMeta}>
          <span
            className={styles.sourceChip}
            style={{
              color: job.sourceColor,
              borderColor: job.sourceColor + '50',
              background: job.sourceColor + '15',
            }}
          >
            {job.source}
          </span>

          <span className={styles.metaDot} />

          <span className={styles.postedLabel}>Posted: {posted}</span>

          <span className={styles.metaDot} />

          {job.lastDate ? (
            <span className={`${styles.deadlineChip} ${urgency === 'critical' ? styles.deadlineCritical : urgency === 'soon' ? styles.deadlineSoon : styles.deadlineOk}`}>
              📅 Apply by {formatLastDate(job.lastDate)}
              {left !== null && (
                <span className={styles.daysLeftTag}>
                  {left === 0 ? 'Today!' : left === 1 ? '1 day left' : `${left}d left`}
                </span>
              )}
            </span>
          ) : (
            <span className={styles.deadlineUnknown}>📅 Check deadline</span>
          )}
        </div>
      </div>

      <span className={styles.jobArrow}>→</span>
    </a>
  )
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ jobs }) {
  const withDeadline = jobs.filter(j => j.lastDate)
  const expiring     = withDeadline.filter(j => { const l = daysLeft(j.lastDate); return l !== null && l <= 7 })
  const addedToday   = jobs.filter(j => postedAgo(j.pubDate) === 'Today')

  return (
    <div className={styles.statsBar}>
      <div className={styles.statItem}>
        <span className={styles.statNum}>{jobs.length}</span>
        <span className={styles.statLabel}>Active Jobs</span>
      </div>
      <div className={styles.statDivider} />
      <div className={styles.statItem}>
        <span className={`${styles.statNum} ${styles.statRed}`}>{expiring.length}</span>
        <span className={styles.statLabel}>Expiring This Week</span>
      </div>
      <div className={styles.statDivider} />
      <div className={styles.statItem}>
        <span className={`${styles.statNum} ${styles.statGreen}`}>{addedToday.length}</span>
        <span className={styles.statLabel}>Added Today</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GovtJobsPage() {
  const [jobs, setJobs]               = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [filter, setFilter]           = useState('all')
  const [search, setSearch]           = useState('')
  const [sort, setSort]               = useState('deadline')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loadingMsg, setLoadingMsg]   = useState('')

  useEffect(() => { fetchAllFeeds() }, [])

  async function fetchAllFeeds() {
    setLoading(true)
    setError(null)
    let loaded = 0

    try {
      const results = await Promise.allSettled(
        RSS_SOURCES.map(src =>
          fetchRSSFeed(src).then(items => {
            loaded++
            setLoadingMsg(`${loaded} of ${RSS_SOURCES.length} sources loaded...`)
            return { items }
          }).catch(err => {
            console.warn(`Feed failed: ${src.name}`, err)
            throw err
          })
        )
      )

      const successCount = results.filter(r => r.status === 'fulfilled').length
      const allJobs = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value.items)
        .filter((job, idx, arr) => arr.findIndex(j => j.title === job.title) === idx)
        .filter(isJobActive)

      if (allJobs.length === 0 && successCount === 0) {
        setError('Unable to load jobs right now. This may be due to network restrictions. Please try again in a moment.')
      } else {
        setJobs(allJobs)
        setLastUpdated(new Date())
        // Show partial warning if some sources failed
        if (successCount < RSS_SOURCES.length && successCount > 0) {
          console.info(`Loaded from ${successCount}/${RSS_SOURCES.length} sources`)
        }
      }
    } catch {
      setError('Could not load jobs. Please check your internet connection.')
    } finally {
      setLoading(false)
      setLoadingMsg('')
    }
  }

  const displayed = useMemo(() => {
    let list = jobs.filter(j =>
      matchesFilter(j.title, filter) &&
      (!search || j.title.toLowerCase().includes(search.toLowerCase()))
    )

    if (sort === 'deadline') {
      const withDate    = list.filter(j => j.lastDate).sort((a, b) => a.lastDate - b.lastDate)
      const withoutDate = list.filter(j => !j.lastDate).sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      return [...withDate, ...withoutDate]
    }
    return list.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
  }, [jobs, filter, search, sort])

  const expiringSoon = displayed.filter(j => { const l = daysLeft(j.lastDate); return l !== null && l <= 7 })

  return (
    <div className={styles.page}>

      {/* ── Back Button ── */}
      <div className="page-wrapper">
        <div className={styles.backRow}>
          <Link to="/" className={styles.backBtn}>
            ← Back
          </Link>
          <span className={styles.breadcrumb}>
            Home › Govt Jobs
          </span>
        </div>
      </div>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerGlow} />
        <div className="page-wrapper">
          <div className={styles.eyebrow}>🏛️ Govt Jobs Portal</div>
          <h1 className={styles.title}>
            Govt Jobs<br />
            <span className={styles.accent}>Daily Updates</span>
          </h1>
          <p className={styles.sub}>
            SSC · Railway · Bank · RPSC · Police · Army — all in one place
          </p>

          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              placeholder="Search jobs... like 'RPSC' or 'Railway'"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.clearSearch} onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          {lastUpdated && (
            <div className={styles.lastUpdated}>
              🕐 Updated: {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              <button className={styles.refreshBtn} onClick={fetchAllFeeds}>↻ Refresh</button>
            </div>
          )}
        </div>
      </div>

      <div className="page-wrapper">

        {/* Stats Bar */}
        {!loading && !error && jobs.length > 0 && <StatsBar jobs={jobs} />}

        {/* Filter Tabs */}
        <div className={styles.filters}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              className={`${styles.filterBtn} ${filter === f.id ? styles.filterActive : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Control Row: count + sort */}
        {!loading && !error && (
          <div className={styles.controlRow}>
            <div className={styles.resultsCount}>
              <strong>{displayed.length}</strong> active jobs
              {filter !== 'all' && <span className={styles.filterLabel}> · {FILTERS.find(f => f.id === filter)?.label}</span>}
              {expiringSoon.length > 0 && (
                <span className={styles.expiringPill}>⚠️ {expiringSoon.length} expiring soon</span>
              )}
            </div>
            <div className={styles.sortTabs}>
              {SORT_OPTIONS.map(s => (
                <button
                  key={s.id}
                  className={`${styles.sortBtn} ${sort === s.id ? styles.sortActive : ''}`}
                  onClick={() => setSort(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className={styles.quickLinks}>
          <span className={styles.quickLabel}>🔗 Official Sites:</span>
          {[
            { name: 'RPSC',           url: 'https://rpsc.rajasthan.gov.in' },
            { name: 'SSC',            url: 'https://ssc.nic.in' },
            { name: 'Railway',        url: 'https://indianrailways.gov.in' },
            { name: 'IBPS',           url: 'https://www.ibps.in' },
            { name: 'Rojgar Result',  url: 'https://rojgarresult.com' },
            { name: 'Sarkari Result', url: 'https://sarkariresult.com' },
          ].map(link => (
            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className={styles.quickLink}>
              {link.name} ↗
            </a>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Loading jobs...</p>
            {loadingMsg && <p className={styles.loadingStatus}>{loadingMsg}</p>}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className={styles.errorWrap}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <p>{error}</p>
            <button className={styles.retryBtn} onClick={fetchAllFeeds}>↻ Retry</button>
          </div>
        )}

        {/* Jobs List */}
        {!loading && !error && (
          displayed.length > 0 ? (
            <div className={styles.jobsGrid}>
              {displayed.map((job, i) => (
                <JobCard key={`${job.title}-${i}`} job={job} index={i} />
              ))}
            </div>
          ) : (
            <div className={styles.noResults}>
              <div style={{ fontSize: 44 }}>🔍</div>
              <p>No active jobs found</p>
              <p style={{ fontSize: 13, opacity: 0.6, marginTop: 6 }}>Try changing the filter or search term</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
