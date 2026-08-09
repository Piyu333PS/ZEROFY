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
  eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>,
  share: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.2M8.2 13.2l7.6 4.2"/></svg>,
}

export default function DashboardHome() {
  const { token, user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [shareMenuId, setShareMenuId] = useState(null)

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

  const recentInvoices = useMemo(() => invoices.slice(0, RECENT_COUNT), [invoices])

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
        <div />
        <div className={styles.topActions}>
          <button className={styles.primaryBtn} onClick={() => navigate('/tools/invoice-maker')}>
            {icons.plus} New Invoice
          </button>
        </div>
      </div>

      <div className={styles.pageHead}>
        <div className={styles.eyebrow}>{greeting}, {greetName} · {today}</div>
        <h1>{headline}</h1>
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

      <div className={styles.sectionHead}>
        <div>
          <p className={styles.sectionLabel}>Recent Invoices</p>
          <p className={styles.sectionSub}>Latest {RECENT_COUNT} invoices across all clients</p>
        </div>
        <a className={styles.viewAllLink} href="/app/invoices" onClick={(e) => { e.preventDefault(); navigate('/app/invoices') }}>
          View all →
        </a>
      </div>

      <div className={styles.ledgerPanel}>
        <div className={styles.tableHead}>
          <span>Invoice</span><span>Client</span><span>Amount</span><span>Status</span><span></span>
        </div>
        {loading ? (
          <p className={styles.empty}>Loading...</p>
        ) : recentInvoices.length === 0 ? (
          <p className={styles.empty}>
            Abhi tak koi invoice nahi bana. <a href="/tools/invoice-maker">Pehla invoice banao →</a>
          </p>
        ) : (
          recentInvoices.map(inv => {
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
                <div className={styles.rowActions} style={{ position: 'relative' }}>
                  <button className={styles.actionBtn} title="View" onClick={() => openPrintWindow(inv)}>{icons.eye}</button>
                  <button
                    className={styles.actionBtn}
                    title="Share"
                    onClick={() => setShareMenuId(id => id === inv._id ? null : inv._id)}
                  >
                    {icons.share}
                  </button>

                  {shareMenuId === inv._id && (
                    <>
                      <div
                        style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                        onClick={() => setShareMenuId(null)}
                      />
                      <div
                        style={{
                          position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 11,
                          background: '#fff', border: '1px solid var(--border, #e5e5e5)', borderRadius: 8,
                          boxShadow: '0 6px 20px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: 140,
                        }}
                      >
                        <button
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13 }}
                          onClick={() => { setShareMenuId(null); shareViaWhatsApp(inv) }}
                        >
                          💬 WhatsApp
                        </button>
                        <button
                          style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13 }}
                          onClick={() => { setShareMenuId(null); shareViaEmail(inv) }}
                        >
                          ✉️ Email
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
