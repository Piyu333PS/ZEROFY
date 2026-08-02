import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { openPrintWindow, shareViaWhatsApp, shareViaEmail } from '../../utils/invoiceShare'
import styles from './DashboardHome.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const initials = (name) => (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'

const icons = {
  revenue: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  pending: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></svg>,
  customers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M17 4.2a3.2 3.2 0 010 6.2M21.5 20c0-3-2-5.2-5-5.8"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>,
}

export default function DashboardHome() {
  const { token, user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')

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

  const filteredInvoices = useMemo(() => {
    const list = invoices.slice(0, 5)
    if (!query.trim()) return list
    const q = query.trim().toLowerCase()
    return invoices.filter(inv =>
      inv.no?.toLowerCase().includes(q) ||
      inv.clientName?.toLowerCase().includes(q) ||
      inv.bizName?.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [invoices, query])

  const greetName = user?.email ? user.email.split('@')[0] : 'there'
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })

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
          <div className={styles.avatar}>{initials(greetName)}</div>
        </div>
      </div>

      <div className={styles.pageHead}>
        <div className={styles.eyebrow}>Namaste, {greetName} · {today}</div>
        <h1>Aaj ka business, ek nazar mein</h1>
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
      <p className={styles.sectionSub}>Latest activity across all clients</p>

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
