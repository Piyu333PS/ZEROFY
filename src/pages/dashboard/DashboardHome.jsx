import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useBilling } from '../../utils/billingStore'
import { invoiceTotal, displayStatus, STATUS_LABELS, fmtMoney } from '../../utils/invoiceCalc'
import InvoiceViewModal from '../../components/invoice/InvoiceViewModal'
import styles from './DashboardHome.module.css'

const fmt = (n) => fmtMoney(n)

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

  const { data, loading, error } = useBilling(token)
  const stats = data?.stats || null
  const invoices = data?.invoices || []
  const isPro = Boolean(data?.status?.isPro)
  const [viewing, setViewing] = useState(null)

  const RECENT_COUNT = 10

  const recentInvoices = useMemo(() => invoices.slice(0, RECENT_COUNT), [invoices])

  // Naam: business ka naam ho to wahi, warna email ka pehla hissa
  const bizName = invoices.find(i => i.bizName)?.bizName
  const greetName = bizName || (user?.email ? user.email.split('@')[0] : 'there')
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // Time-based greeting — system time ke hisaab se badalta hai
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Good morning'
    if (hour >= 12 && hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  // Business name available ho to wahi dikhao, warna generic simple heading
  const headline = 'Business Overview'

  const statCards = stats ? [
    { label: 'Total invoiced', value: fmt(stats.totalInvoiced), icon: icons.revenue },
    { label: 'Received', value: fmt(stats.received), icon: icons.revenue, tone: 'green' },
    { label: 'Pending', value: fmt(stats.pending), icon: icons.pending, tone: 'orange' },
    { label: 'Clients', value: stats.customerCount, icon: icons.customers },
  ] : []

  const overdue = invoices.filter(i => displayStatus(i) === 'overdue')
  const overdueAmount = overdue.reduce((sum, i) => sum + (Number(i.balance) || 0), 0)
  const drafts = invoices.filter(i => i.status === 'draft').length
  const collected = stats && stats.totalInvoiced > 0 ? Math.round((stats.received / stats.totalInvoiced) * 100) : 0

  return (
    <div className={styles.wrap}>
      <div className={styles.pageHead}>
        <div>
          <h1>{greeting}, {greetName}</h1>
          <p className={styles.dateLine}>{today}</p>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading && !stats ? (
        <div className={styles.summary}><div className={styles.skeleton} /></div>
      ) : stats && (
        <div className={styles.summary}>
          {/* Sabse zaroori number: kitna paisa aana baaki hai */}
          <div className={styles.hero} data-tour="to-collect">
            <p className={styles.heroLabel}>To collect</p>
            <p className={styles.heroValue}>{fmt(stats.pending)}</p>
            <div className={styles.meter} aria-hidden="true"><span style={{ width: `${collected}%` }} /></div>
            <p className={styles.heroNote}>
              {stats.totalInvoiced > 0
                ? `${collected}% collected — ${fmt(stats.received)} of ${fmt(stats.totalInvoiced)} billed`
                : 'Your numbers will appear here once you create an invoice'}
            </p>
          </div>
          <div className={styles.side}>
            <button className={`${styles.tile} ${overdue.length ? styles.tileAlert : ''}`} onClick={() => navigate('/app/invoices')}>
              <span className={styles.tileLabel}>Overdue</span>
              <span className={styles.tileValue}>{fmt(overdueAmount)}</span>
              <span className={styles.tileNote}>{overdue.length ? `${overdue.length} invoice${overdue.length === 1 ? '' : 's'} past due date` : 'Nothing overdue'}</span>
            </button>
            <button className={styles.tile} onClick={() => navigate('/app/payments')}>
              <span className={styles.tileLabel}>Received</span>
              <span className={`${styles.tileValue} ${styles.green}`}>{fmt(stats.received)}</span>
              <span className={styles.tileNote}>Payments recorded so far</span>
            </button>
            <button className={styles.tile} onClick={() => navigate('/app/customers')}>
              <span className={styles.tileLabel}>Clients</span>
              <span className={styles.tileValue}>{stats.customerCount}</span>
              <span className={styles.tileNote}>{stats.invoiceCount} invoice{stats.invoiceCount === 1 ? '' : 's'}{drafts ? `, ${drafts} draft${drafts === 1 ? '' : 's'}` : ''}</span>
            </button>
          </div>
        </div>
      )}

      <div className={styles.sectionHead}>
        <div>
          <p className={styles.sectionLabel}>Recent invoices</p>
        </div>
        <a className={styles.viewAllLink} href="/app/invoices" onClick={(e) => { e.preventDefault(); navigate('/app/invoices') }}>
          View all
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
            No invoices yet. <a href="/tools/invoice-maker" onClick={e => { e.preventDefault(); navigate('/tools/invoice-maker') }}>Create your first invoice</a>
          </p>
        ) : (
          recentInvoices.map(inv => {
            const total = inv.grandTotal !== undefined ? Number(inv.grandTotal) : invoiceTotal(inv)
            const ds = displayStatus(inv)
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
                <span className={styles.amount}>{fmtMoney(total, inv.currency || '₹')}</span>
                <span className={`${styles.stamp} ${styles[ds] || ''}`}>{STATUS_LABELS[ds] || ds}</span>
                <div className={styles.rowActions}>
                  <button className={styles.actionBtn} title="View" aria-label={`View ${inv.no}`} onClick={() => setViewing(inv)}>{icons.eye}</button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {viewing && (
        <InvoiceViewModal
          invoice={viewing}
          hideBranding={isPro}
          onClose={() => setViewing(null)}
          onEdit={(inv) => navigate(`/tools/invoice-maker?edit=${inv._id}`)}
        />
      )}
    </div>
  )
}
