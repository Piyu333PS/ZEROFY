import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { openPrintWindow, shareViaWhatsApp, shareViaEmail } from '../../utils/invoiceShare'
import styles from './DashboardHome.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const initials = (name) => (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'

const icons = {
  revenue: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 4h11M6 8h11M6 4v3.2c0 3 2.2 5.3 5.5 5.3H17M6 12.5h6.5M9 12.5l6 8"/></svg>,
  pending: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></svg>,
  customers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M17 4.2a3.2 3.2 0 010 6.2M21.5 20c0-3-2-5.2-5-5.8"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>,
  profile: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c0-4.14 3.36-7 7.5-7s7.5 2.86 7.5 7"/></svg>,
  card: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>,
}

export default function DashboardHome() {
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [statsRes, invRes] = await Promise.all([
          fetch(`${API}/api/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
          fetch(`${API}/api/invoices`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        ])
        if (cancelled) return
        if (statsRes.success) setStats(statsRes.stats)
        if (invRes.success) setInvoices(invRes.invoices || [])
      } catch (e) {
        if (!cancelled) setError('Data load nahi ho paya. Dobara try karo.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [token])

  const RECENT_COUNT = 10

  const filteredInvoices = useMemo(() => {
    const list = invoices.slice(0, RECENT_COUNT)
    if (!query.trim()) return list
    const q = query.trim().toLowerCase()
    return invoices.filter(inv =>
      inv.no?.toLowerCase().includes(q) ||
      inv.clientName?.toLowerCase().includes(q) ||
      inv.bizName?.toLowerCase().includes(q)
    ).slice(0, 10)
  }, [invoices, query])

  const greetName = user?.email ? user.email.split('@')[0] : 'there'
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })

  // Time-based greeting — system time ke hisaab se badalta hai
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Good Morning'
    if (hour >= 12 && hour < 17) return 'Good Afternoon'
    if (hour >= 17 && hour < 21) return 'Good Evening'
    return 'Good Night'
  }, [])

  // Business name available ho to wahi dikhao, warna generic simple heading
  const headline = (invoices[0]?.bizName) ? invoices[0].bizName : 'Business Overview'

  const statCards = stats ? [
    { label: 'Total invoiced', value: fmt(stats.totalInvoiced), icon: icons.revenue },
    { label: 'Received', value: fmt(stats.received), icon: icons.revenue, tone: 'green' },
    { label: 'Pending', value: fmt(stats.pending), icon: icons.pending, tone: 'orange' },
    { label: 'Customers', value: stats.customerCount, icon: icons.customers },
  ] : []

  return (
    <div className={styles.wrap}>
      <div className={styles.topbar}>
        <div className={styles.search}>
          {icons.search}
          <input
            placeholder="Search invoice ya client…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className={styles.topActions}>
          <button className={styles.primaryBtn} onClick={() => navigate('/tools/invoice-maker')}>
            {icons.plus} New Invoice
          </button>

          <div className={styles.userMenuWrap}>
            <button
              className={styles.avatar}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Account menu"
            >
              {initials(greetName)}
            </button>

            {menuOpen && (
              <>
                <div className={styles.menuOverlay} onClick={() => setMenuOpen(false)} />
                <div className={styles.userMenu}>
                  <div className={styles.userMenuHead}>
                    <div className={styles.userMenuEmail}>{user?.email}</div>
                    <div className={styles.userMenuPlan}>{user?.isPro ? '✦ Pro plan' : 'Free plan'}</div>
                  </div>

                  <button className={styles.userMenuItem} onClick={() => { setMenuOpen(false); navigate('/settings') }}>
                    <span className={styles.userMenuIcon}>{icons.profile}</span> Profile
                  </button>
                  <button className={styles.userMenuItem} onClick={() => { setMenuOpen(false); navigate('/billing') }}>
                    <span className={styles.userMenuIcon}>{icons.card}</span> Billing
                  </button>

                  <div className={styles.userMenuDivider} />

                  <button className={`${styles.userMenuItem} ${styles.userMenuDanger}`} onClick={() => { setMenuOpen(false); logout() }}>
                    <span className={styles.userMenuIcon}>{icons.logout}</span> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.pageHead}>
        <div className={styles.eyebrow}>{greeting}, {greetName} · {today}</div>
        <h1>{headline}</h1>
        <div className={styles.subgreet}>
          {stats ? `${stats.invoiceCount} invoice${stats.invoiceCount === 1 ? '' : 's'} total · ${stats.customerCount} client${stats.customerCount === 1 ? '' : 's'}` : 'Data load ho raha hai…'}
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.statsGrid}>
        {loading && !stats ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className={styles.statCardSkeleton} />)
        ) : (
          statCards.map(card => (
            <div key={card.label} className={styles.statCard}>
              <div className={styles.statTop}>
                <div className={styles.statIcon}>{card.icon}</div>
              </div>
              <p className={styles.statLabel}>{card.label}</p>
              <p className={`${styles.statValue} ${card.tone ? styles[card.tone] : ''}`}>{card.value}</p>
            </div>
          ))
        )}
      </div>

      <p className={styles.sectionLabel}>Recent Invoices</p>
      <p className={styles.sectionSub}>Latest {RECENT_COUNT} invoices across all clients</p>

      <div className={styles.ledgerPanel}>
        <div className={styles.tableHead}>
          <span>Invoice</span><span>Client</span><span>Amount</span><span>Status</span><span></span>
        </div>
        {loading ? (
          <p className={styles.empty}>Loading...</p>
        ) : filteredInvoices.length === 0 ? (
          <p className={styles.empty}>
            {query ? 'Koi match nahi mila.' : <>Abhi tak koi invoice nahi bana. <a href="/tools/invoice-maker">Pehla invoice banao →</a></>}
          </p>
        ) : (
          filteredInvoices.map(inv => {
            const sub = (inv.items || []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0)
            const afterDisc = sub - (sub * (Number(inv.discPct) || 0) / 100)
            const total = afterDisc + (afterDisc * (Number(inv.taxPct) || 0) / 100)
            return (
              <div key={inv._id} className={styles.tableRow}>
                <span className={styles.invId}>{inv.no}</span>
                <div className={styles.clientCell}>
                  <div className={styles.clientAvatar}>{initials(inv.clientName)}</div>
                  <div>
                    <div className={styles.clientName}>{inv.clientName || '—'}</div>
                    {inv.bizName && <div style={{ fontSize: 11, color: 'var(--slate)' }}>{inv.bizName}</div>}
                  </div>
                </div>
                <span className={styles.amount}>{fmt(total)}</span>
                <span className={`${styles.stamp} ${styles[inv.status] || ''}`}>{inv.status}</span>
                <div className={styles.rowActions}>
                  <button className={styles.actionBtn} title="Preview" onClick={() => openPrintWindow(inv)}>👁</button>
                  <button className={styles.actionBtn} title="WhatsApp" onClick={() => shareViaWhatsApp(inv)}>💬</button>
                  <button className={styles.actionBtn} title="Email" onClick={() => shareViaEmail(inv)}>✉️</button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
