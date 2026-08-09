import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { openPrintWindow, shareViaWhatsApp, shareViaEmail } from '../../utils/invoiceShare'
import styles from './InvoicesPage.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const PAGE_SIZE = 10

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const initials = (name) => (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'

const invoiceTotal = (inv) => {
  const sub = (inv.items || []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0)
  const afterDisc = sub - (sub * (Number(inv.discPct) || 0) / 100)
  return afterDisc + (afterDisc * (Number(inv.taxPct) || 0) / 100)
}

const icons = {
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>,
  eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>,
  share: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.2M8.2 13.2l7.6 4.2"/></svg>,
  chevLeft: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>,
  chevRight: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>,
}

const STATUS_FILTERS = ['all', 'draft', 'sent', 'paid', 'cancelled']

export default function InvoicesPage() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [shareMenuId, setShareMenuId] = useState(null)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API}/api/invoices`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
        if (cancelled) return
        if (res.success) setInvoices(res.invoices || [])
        else setError('Invoices load nahi ho paye.')
      } catch (e) {
        if (!cancelled) setError('Invoices load nahi ho paye. Dobara try karo.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [token])

  // Filter + search reset page to 1
  useEffect(() => { setPage(1) }, [query, statusFilter])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return invoices.filter(inv => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false
      if (!q) return true
      return (
        (inv.no || '').toLowerCase().includes(q) ||
        (inv.clientName || '').toLowerCase().includes(q) ||
        (inv.bizName || '').toLowerCase().includes(q)
      )
    })
  }, [invoices, query, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageInvoices = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  )

  const pageNumbers = useMemo(() => {
    const nums = []
    const span = 2
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - span && i <= currentPage + span)) {
        nums.push(i)
      } else if (nums[nums.length - 1] !== '…') {
        nums.push('…')
      }
    }
    return nums
  }, [totalPages, currentPage])

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Invoices</h1>
          <p className={styles.subtitle}>
            {loading ? 'Loading…' : `${filtered.length} invoice${filtered.length === 1 ? '' : 's'}${statusFilter !== 'all' || query ? ' (filtered)' : ''}`}
          </p>
        </div>
        <button className={styles.primaryBtn} onClick={() => navigate('/tools/invoice-maker')}>
          {icons.plus} New Invoice
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          {icons.search}
          <input
            placeholder="Search by invoice no, client, or business…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              className={`${styles.filterChip} ${statusFilter === s ? styles.filterChipActive : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.panel}>
        <div className={styles.tableHead}>
          <span>Invoice</span><span>Client</span><span>Date</span><span>Amount</span><span>Status</span><span></span>
        </div>

        {loading ? (
          <p className={styles.empty}>Loading...</p>
        ) : pageInvoices.length === 0 ? (
          <p className={styles.empty}>
            {invoices.length === 0
              ? <>Abhi tak koi invoice nahi bana. <a href="/tools/invoice-maker">Pehla invoice banao →</a></>
              : 'Is filter/search se koi invoice nahi mila.'}
          </p>
        ) : (
          pageInvoices.map(inv => {
            const total = invoiceTotal(inv)
            return (
              <div key={inv._id} className={styles.tableRow}>
                <span className={styles.invId}>{inv.no}</span>
                <div className={styles.clientCell}>
                  <div className={styles.clientAvatar}>{initials(inv.clientName)}</div>
                  <div>
                    <div className={styles.clientName}>{inv.clientName || '—'}</div>
                    {inv.bizName && <div className={styles.clientBiz}>{inv.bizName}</div>}
                  </div>
                </div>
                <span className={styles.dateCell}>{inv.date || '—'}</span>
                <span className={styles.amount}>{fmt(total)}</span>
                <span className={`${styles.stamp} ${styles[inv.status] || ''}`}>{inv.status}</span>
                <div className={styles.rowActions}>
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
                      <div className={styles.menuOverlay} onClick={() => setShareMenuId(null)} />
                      <div className={styles.shareMenu}>
                        <button onClick={() => { setShareMenuId(null); shareViaWhatsApp(inv) }}>💬 WhatsApp</button>
                        <button onClick={() => { setShareMenuId(null); shareViaEmail(inv) }}>✉️ Email</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={currentPage === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            {icons.chevLeft}
          </button>

          {pageNumbers.map((n, i) =>
            n === '…' ? (
              <span key={`e${i}`} className={styles.pageEllipsis}>…</span>
            ) : (
              <button
                key={n}
                className={`${styles.pageBtn} ${n === currentPage ? styles.pageBtnActive : ''}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            )
          )}

          <button
            className={styles.pageBtn}
            disabled={currentPage === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            {icons.chevRight}
          </button>
        </div>
      )}
    </div>
  )
}
