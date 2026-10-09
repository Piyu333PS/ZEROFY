import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../utils/api'
import { useBilling } from '../../utils/billingStore'
import { downloadInvoicePdf } from '../../utils/invoiceShare'
import { invoiceTotal, displayStatus, STATUS_LABELS, formatDate, fmtMoney } from '../../utils/invoiceCalc'
import InvoiceViewModal from '../../components/invoice/InvoiceViewModal'
import ConfirmDialog from '../../components/ConfirmDialog'
import styles from './InvoicesPage.module.css'

const PAGE_SIZE = 10

const initials = (name) => (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'
const totalOf = (inv) => inv.grandTotal !== undefined ? Number(inv.grandTotal) : invoiceTotal(inv)
const money = (inv, n) => fmtMoney(n, inv.currency || '₹')

const icons = {
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>,
  eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>,
  more: <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>,
  chevLeft: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>,
  chevRight: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>,
}

// Filter chips → kaun se display-status us chip mein aate hain
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft', match: ['draft'] },
  { key: 'unpaid', label: 'Unpaid', match: ['sent', 'partial', 'overdue'] },
  { key: 'overdue', label: 'Overdue', match: ['overdue'] },
  { key: 'paid', label: 'Paid', match: ['paid'] },
  { key: 'cancelled', label: 'Cancelled', match: ['cancelled'] },
]

export default function InvoicesPage() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const { data, loading, error: loadError, refresh } = useBilling(token)
  const invoices = data?.invoices || []
  const isPro = Boolean(data?.status?.isPro)
  const [actionError, setError] = useState(null)
  const error = actionError || loadError
  const [notice, setNotice] = useState(null)

  const [menuId, setMenuId] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [confirm, setConfirm] = useState(null) // { type: 'delete' | 'cancel', inv }
  const [working, setWorking] = useState(false)

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  // Filter + search reset page to 1
  useEffect(() => { setPage(1) }, [query, statusFilter])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = FILTERS.find(f => f.key === statusFilter)?.match
    return invoices.filter(inv => {
      if (match && !match.includes(displayStatus(inv))) return false
      if (!q) return true
      return (
        (inv.no || '').toLowerCase().includes(q) ||
        (inv.clientName || '').toLowerCase().includes(q) ||
        (inv.bizName || '').toLowerCase().includes(q)
      )
    })
  }, [invoices, query, statusFilter])

  const summary = useMemo(() => {
    const live = filtered.filter(i => !['draft', 'cancelled'].includes(i.status))
    return {
      total: live.reduce((s, i) => s + totalOf(i), 0),
      outstanding: live.reduce((s, i) => s + (i.balance !== undefined ? Number(i.balance) : totalOf(i)), 0),
    }
  }, [filtered])

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

  const flash = (msg) => { setNotice(msg); setTimeout(() => setNotice(n => (n === msg ? null : n)), 4000) }

  const setStatus = async (inv, status, msg) => {
    setWorking(true)
    setError(null)
    const res = await api(`/api/invoices/${inv._id}`, token, { method: 'PUT', body: { status } })
    setWorking(false)
    setConfirm(null)
    if (!res.ok) { setError(res.data.message || res.data.error || 'Update nahi ho paya.'); return }
    flash(msg)
    refresh()
  }

  const doDelete = async (inv) => {
    setWorking(true)
    const res = await api(`/api/invoices/${inv._id}`, token, { method: 'DELETE' })
    setWorking(false)
    setConfirm(null)
    if (!res.ok) { setError(res.data.error || 'Delete nahi ho paya.'); return }
    flash(`Invoice ${inv.no} delete ho gaya.`)
    refresh()
  }

  const act = (fn) => () => { setMenuId(null); fn() }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Invoices</h1>
          <p className={styles.subtitle}>
            {loading ? 'Loading…' : `${filtered.length} invoice${filtered.length === 1 ? '' : 's'}${statusFilter !== 'all' || query ? ' (filtered)' : ''}`}
          </p>
        </div>
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
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`${styles.filterChip} ${statusFilter === f.key ? styles.filterChipActive : ''}`}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {!loading && filtered.length > 0 && (
        <div className={styles.summary}>
          <span>Billed: <strong>{fmtMoney(summary.total)}</strong></span>
          <span>Outstanding: <strong>{fmtMoney(summary.outstanding)}</strong></span>
        </div>
      )}

      {notice && <p className={styles.notice}>{notice}</p>}
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
              ? <>Abhi tak koi invoice nahi bana. <a href="/tools/invoice-maker" onClick={e => { e.preventDefault(); navigate('/tools/invoice-maker') }}>Pehla invoice banao →</a></>
              : 'Is filter/search se koi invoice nahi mila.'}
          </p>
        ) : (
          pageInvoices.map(inv => {
            const total = totalOf(inv)
            const ds = displayStatus(inv)
            const paid = Number(inv.paidAmount) || 0
            const canPay = ['sent', 'partial', 'overdue'].includes(ds)
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
                <div className={styles.dateCell}>
                  {formatDate(inv.date)}
                  {inv.dueDate && ds !== 'paid' && ds !== 'cancelled' && (
                    <div className={`${styles.subText} ${ds === 'overdue' ? styles.due : ''}`}>Due {formatDate(inv.dueDate)}</div>
                  )}
                </div>
                <div className={`${styles.amount} ${styles.amountCell}`}>
                  {money(inv, total)}
                  {paid > 0 && ds !== 'paid' && <div className={`${styles.subText} ${styles.bal}`}>Bal {money(inv, inv.balance)}</div>}
                </div>
                <span className={`${styles.stamp} ${styles.statusCell} ${styles[ds] || ''}`}>{STATUS_LABELS[ds] || ds}</span>
                <div className={styles.rowActions}>
                  <button className={styles.actionBtn} title="View" aria-label={`View ${inv.no}`} onClick={() => setViewing(inv)}>{icons.eye}</button>
                  <button
                    className={styles.actionBtn}
                    title="More actions"
                    aria-label={`More actions for ${inv.no}`}
                    onClick={() => setMenuId(id => id === inv._id ? null : inv._id)}
                  >
                    {icons.more}
                  </button>

                  {menuId === inv._id && (
                    <>
                      <div className={styles.menuOverlay} onClick={() => setMenuId(null)} />
                      <div className={styles.rowMenu}>
                        <button onClick={act(() => navigate(`/tools/invoice-maker?edit=${inv._id}`))}>Edit</button>
                        <button onClick={act(() => navigate(`/tools/invoice-maker?copy=${inv._id}`))}>Duplicate</button>
                        {canPay && <button onClick={act(() => navigate(`/app/payments?invoice=${inv._id}`))}>Record payment</button>}
                        <button onClick={act(() => downloadInvoicePdf(inv, { hideBranding: isPro }).catch(() => setError('PDF nahi ban paya. Dobara try karein.')))}>Download PDF</button>
                        <hr />
                        {inv.status === 'cancelled'
                          ? <button onClick={act(() => setStatus(inv, 'sent', `Invoice ${inv.no} dobara active ho gaya.`))}>Restore invoice</button>
                          : <button onClick={act(() => setConfirm({ type: 'cancel', inv }))}>Cancel invoice</button>}
                        <button className={styles.danger} onClick={act(() => setConfirm({ type: 'delete', inv }))}>Delete</button>
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

      {viewing && (
        <InvoiceViewModal
          invoice={viewing}
          hideBranding={isPro}
          onClose={() => setViewing(null)}
          onEdit={(inv) => navigate(`/tools/invoice-maker?edit=${inv._id}`)}
        />
      )}

      {confirm?.type === 'delete' && (
        <ConfirmDialog
          danger
          busy={working}
          title={`Invoice ${confirm.inv.no} delete karein?`}
          message="Ye invoice aur iske payment records hamesha ke liye hat jayenge. Ye wapas nahi aa sakta."
          confirmLabel="Delete"
          onConfirm={() => doDelete(confirm.inv)}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm?.type === 'cancel' && (
        <ConfirmDialog
          busy={working}
          title={`Invoice ${confirm.inv.no} cancel karein?`}
          message="Cancelled invoice totals aur reports mein nahi gina jata. Aap ise baad mein restore kar sakte hain."
          confirmLabel="Cancel invoice"
          onConfirm={() => setStatus(confirm.inv, 'cancelled', `Invoice ${confirm.inv.no} cancel ho gaya.`)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
