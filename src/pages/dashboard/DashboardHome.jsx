import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { openPrintWindow, shareViaWhatsApp, shareViaEmail } from '../../utils/invoiceShare'
import styles from './DashboardHome.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function DashboardHome() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
        if (invRes.success) setInvoices((invRes.invoices || []).slice(0, 5))
      } catch (e) {
        if (!cancelled) setError('Data load nahi ho paya. Dobara try karo.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [token])

  const statCards = stats ? [
    { label: 'Total invoiced', value: fmt(stats.totalInvoiced) },
    { label: 'Received', value: fmt(stats.received), tone: 'green' },
    { label: 'Pending', value: fmt(stats.pending), tone: 'orange' },
    { label: 'Customers', value: stats.customerCount },
  ] : []

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <button className={styles.primaryBtn} onClick={() => navigate('/tools/invoice-maker')}>
          + New invoice
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.statsGrid}>
        {loading && !stats ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className={styles.statCardSkeleton} />)
        ) : (
          statCards.map(card => (
            <div key={card.label} className={styles.statCard}>
              <p className={styles.statLabel}>{card.label}</p>
              <p className={`${styles.statValue} ${card.tone ? styles[card.tone] : ''}`}>{card.value}</p>
            </div>
          ))
        )}
      </div>

      <p className={styles.sectionLabel}>Recent invoices</p>
      <div className={styles.table}>
        <div className={styles.tableHead}>
          <span>Business</span><span>Invoice</span><span>Client</span><span>Amount</span><span>Status</span><span>Actions</span>
        </div>
        {loading ? (
          <p className={styles.empty}>Loading...</p>
        ) : invoices.length === 0 ? (
          <p className={styles.empty}>Abhi tak koi invoice nahi bana. <a href="/tools/invoice-maker">Pehla invoice banao →</a></p>
        ) : (
          invoices.map(inv => {
            const sub = (inv.items || []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0)
            const afterDisc = sub - (sub * (Number(inv.discPct) || 0) / 100)
            const total = afterDisc + (afterDisc * (Number(inv.taxPct) || 0) / 100)
            return (
              <div key={inv._id} className={styles.tableRow}>
                <span>{inv.bizName || '—'}</span>
                <span>{inv.no}</span>
                <span>{inv.clientName || '—'}</span>
                <span>{fmt(total)}</span>
                <span className={`${styles.badge} ${styles[inv.status] || ''}`}>{inv.status}</span>
                <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    title="Preview / Print"
                    onClick={() => openPrintWindow(inv)}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#B8B4E0', borderRadius: 8, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
                  >👁 Preview</button>
                  <button
                    title="Share on WhatsApp"
                    onClick={() => shareViaWhatsApp(inv)}
                    style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', borderRadius: 8, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
                  >💬</button>
                  <button
                    title="Share via Email"
                    onClick={() => shareViaEmail(inv)}
                    style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60A5FA', borderRadius: 8, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
                  >✉️</button>
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
