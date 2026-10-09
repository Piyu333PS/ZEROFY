import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../utils/api'
import { useBilling } from '../../utils/billingStore'
import { downloadInvoicePdf, sendPaymentReminder } from '../../utils/invoiceShare'
import { toast } from '../../components/ui/Toast'
import { SkeletonRows } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { sampleInvoice } from '../../data/sampleInvoice'
import { invoiceTotal, displayStatus, STATUS_LABELS, formatDate, fmtMoney, docInfo } from '../../utils/invoiceCalc'
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

// Filter chips → which display statuses fall under each chip
const FILTERS = {
  invoice: [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Draft', match: ['draft'] },
    { key: 'unpaid', label: 'Unpaid', match: ['sent', 'partial', 'overdue'] },
    { key: 'overdue', label: 'Overdue', match: ['overdue'] },
    { key: 'paid', label: 'Paid', match: ['paid', 'credited'] },
    { key: 'cancelled', label: 'Cancelled', match: ['cancelled'] },
  ],
  quotation: [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Draft', match: ['draft'] },
    { key: 'sent', label: 'Sent', match: ['sent'] },
    { key: 'accepted', label: 'Accepted', match: ['accepted'] },
    { key: 'converted', label: 'Invoiced', match: ['converted'] },
    { key: 'closed', label: 'Declined / expired', match: ['declined', 'expired'] },
  ],
  credit_note: [
    { key: 'all', label: 'All' },
    { key: 'issued', label: 'Issued', match: ['issued'] },
    { key: 'cancelled', label: 'Cancelled', match: ['cancelled'] },
  ],
}

const NEW_URL = {
  invoice: '/tools/invoice-maker',
  quotation: '/tools/invoice-maker?type=quotation',
  credit_note: '/tools/invoice-maker?type=credit_note',
}

const EXPLAIN = {
  quotation: 'A quotation is a price offer you send before the sale. It is not counted in your billing or GST. When the client agrees, turn it into an invoice in one click.',
  credit_note: 'A credit note reduces an invoice you have already sent — for returned goods, a wrong rate, or a discount given later. The original invoice stays as it is and its balance goes down.',
}

export default function InvoicesPage({ docType = 'invoice' }) {
  const { token } = useAuth()
  const navigate = useNavigate()
  const info = docInfo(docType)
  const isInvoice = docType === 'invoice', isQuote = docType === 'quotation', isCredit = docType === 'credit_note'
  const filters = FILTERS[docType]
  const noun = (n) => (n === 1 ? info.lower : `${info.lower}s`)

  const { data, loading, error: loadError, refresh } = useBilling(token)
  const invoices = data?.[info.listKey] || []
  const isPro = Boolean(data?.status?.isPro)
  const [actionError, setError] = useState(null)
  const error = actionError || loadError

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
    const match = filters.find(f => f.key === statusFilter)?.match
    return invoices.filter(inv => {
      if (match && !match.includes(displayStatus(inv))) return false
      if (!q) return true
      return (
        (inv.no || '').toLowerCase().includes(q) ||
        (inv.clientName || '').toLowerCase().includes(q) ||
        (inv.bizName || '').toLowerCase().includes(q) ||
        (inv.refInvoiceNo || '').toLowerCase().includes(q)
      )
    })
  }, [invoices, query, statusFilter])

  const summary = useMemo(() => {
    const live = filtered.filter(i => !['draft', 'cancelled'].includes(i.status))
    if (isQuote) {
      const open = live.filter(i => ['sent', 'accepted'].includes(displayStatus(i)))
      return { total: live.reduce((s, i) => s + totalOf(i), 0), outstanding: open.reduce((s, i) => s + totalOf(i), 0) }
    }
    return {
      total: live.reduce((s, i) => s + totalOf(i), 0),
      outstanding: live.reduce((s, i) => s + (i.balance !== undefined ? Number(i.balance) : totalOf(i)), 0),
    }
  }, [filtered, isQuote])

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

  const flash = (msg) => toast(msg)

  const setStatus = async (inv, status, msg) => {
    setWorking(true)
    setError(null)
    const res = await api(`/api/invoices/${inv._id}`, token, { method: 'PUT', body: { status } })
    setWorking(false)
    setConfirm(null)
    if (!res.ok) { toast.error(res.data.message || res.data.error || 'Could not update. Please try again.'); return }
    flash(msg)
    refresh()
  }

  const doDelete = async (inv) => {
    setWorking(true)
    const res = await api(`/api/invoices/${inv._id}`, token, { method: 'DELETE' })
    setWorking(false)
    setConfirm(null)
    if (!res.ok) { toast.error(res.data.error || 'Could not delete. Please try again.'); return }
    flash(`${info.label} ${inv.no} deleted.`)
    refresh()
  }

  const act = (fn) => () => { setMenuId(null); fn() }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{info.plural}</h1>
          <p className={styles.subtitle}>
            {loading ? 'Loading…' : `${filtered.length} ${noun(filtered.length)}${statusFilter !== 'all' || query ? ' (filtered)' : ''}`}
          </p>
        </div>
        {!isInvoice && (
          <button className={styles.primaryBtn} onClick={() => navigate(NEW_URL[docType])}>
            {icons.plus} New {info.lower}
          </button>
        )}
      </div>

      {EXPLAIN[docType] && <p className={styles.explain}>{EXPLAIN[docType]}</p>}

      <div className={styles.toolbar}>
        <div className={styles.search}>
          {icons.search}
          <input
            type="search"
            placeholder={`Search ${info.lower}s (press / )`}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          {filters.map(f => (
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
          <span>{isInvoice ? 'Billed' : isQuote ? 'Quoted' : 'Credited'}: <strong>{fmtMoney(summary.total)}</strong></span>
          {isInvoice && <span>Outstanding: <strong>{fmtMoney(summary.outstanding)}</strong></span>}
          {isQuote && <span>Waiting for a reply: <strong>{fmtMoney(summary.outstanding)}</strong></span>}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.panel}>
        <div className={styles.tableHead}>
          <span>{isInvoice ? 'Invoice' : 'Number'}</span><span>Client</span><span>Date</span><span>Amount</span><span>Status</span><span></span>
        </div>

        {loading ? (
          <SkeletonRows rows={5} />
        ) : invoices.length === 0 ? (
          isInvoice ? (
            <EmptyState
              kind="invoice"
              title="Create your first invoice"
              text="Add your business, a client and a few items. Zerofy works out GST and gives you a clean PDF to print or share."
              action={{ label: 'New invoice', onClick: () => navigate('/tools/invoice-maker') }}
              secondary={{ label: 'See a sample invoice', onClick: () => setViewing({ ...sampleInvoice(), __sample: true }) }}
            />
          ) : isQuote ? (
            <EmptyState
              kind="invoice"
              title="Send your first quotation"
              text="Tell a client what the work will cost before you bill them. Quotations are free and do not use up your invoices."
              action={{ label: 'New quotation', onClick: () => navigate(NEW_URL.quotation) }}
            />
          ) : (
            <EmptyState
              kind="invoice"
              title="No credit notes yet"
              text="Make a credit note when a client returns goods or you need to reduce an invoice you have already sent."
              action={(data?.invoices || []).some(i => i.status !== 'draft' && i.status !== 'cancelled')
                ? { label: 'New credit note', onClick: () => navigate(NEW_URL.credit_note) }
                : { label: 'Go to invoices', onClick: () => navigate('/app/invoices') }}
            />
          )
        ) : pageInvoices.length === 0 ? (
          <p className={styles.empty}>No {info.lower}s match this filter or search.</p>
        ) : (
          pageInvoices.map(inv => {
            const total = totalOf(inv)
            const ds = displayStatus(inv)
            const paid = Number(inv.paidAmount) || 0
            const canPay = isInvoice && ['sent', 'partial', 'overdue'].includes(ds)
            const credited = Number(inv.creditedAmount) || 0
            const canCredit = isInvoice && inv.status !== 'draft' && inv.status !== 'cancelled' && credited < total - 0.01
            const pdf = () => downloadInvoicePdf(inv, { hideBranding: isPro }).then(() => toast('PDF downloaded')).catch(() => toast.error('Could not create the PDF. Please try again.'))
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
                  {isInvoice && inv.dueDate && !['paid', 'credited', 'cancelled'].includes(ds) && (
                    <div className={`${styles.subText} ${ds === 'overdue' ? styles.due : ''}`}>Due {formatDate(inv.dueDate)}</div>
                  )}
                  {isQuote && ds === 'converted' && inv.convertedInvoiceNo && <div className={styles.subText}>Invoice {inv.convertedInvoiceNo}</div>}
                  {isQuote && ds !== 'converted' && inv.validTill && (
                    <div className={`${styles.subText} ${ds === 'expired' ? styles.due : ''}`}>Valid till {formatDate(inv.validTill)}</div>
                  )}
                  {isCredit && inv.refInvoiceNo && <div className={styles.subText}>For {inv.refInvoiceNo}</div>}
                </div>
                <div className={`${styles.amount} ${styles.amountCell}`}>
                  {money(inv, total)}
                  {isInvoice && credited > 0 && <div className={styles.subText}>Credit −{money(inv, credited)}</div>}
                  {isInvoice && (paid > 0 || credited > 0) && !['paid', 'credited', 'cancelled', 'draft'].includes(ds) && <div className={`${styles.subText} ${styles.bal}`}>Bal {money(inv, inv.balance)}</div>}
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
                        {!isCredit && <button onClick={act(() => navigate(`/tools/invoice-maker?copy=${inv._id}`))}>Duplicate</button>}
                        {canPay && <button onClick={act(() => navigate(`/app/payments?invoice=${inv._id}`))}>Record payment</button>}
                        {canPay && <button onClick={act(() => sendPaymentReminder(inv))}>Send reminder on WhatsApp</button>}
                        {canCredit && <button onClick={act(() => navigate(`/tools/invoice-maker?type=credit_note&invoice=${inv._id}`))}>Create credit note</button>}
                        {isQuote && ds !== 'converted' && <button onClick={act(() => navigate(`/tools/invoice-maker?fromQuote=${inv._id}`))}>Convert to invoice</button>}
                        {isQuote && ds === 'converted' && <button onClick={act(() => navigate('/app/invoices'))}>Go to invoice {inv.convertedInvoiceNo}</button>}
                        {isQuote && ['sent', 'expired', 'declined'].includes(ds) && <button onClick={act(() => setStatus(inv, 'accepted', `Quotation ${inv.no} marked as accepted.`))}>Mark as accepted</button>}
                        {isQuote && ['sent', 'expired', 'accepted'].includes(ds) && <button onClick={act(() => setStatus(inv, 'declined', `Quotation ${inv.no} marked as declined.`))}>Mark as declined</button>}
                        {isQuote && ['draft', 'accepted', 'declined'].includes(ds) && <button onClick={act(() => setStatus(inv, 'sent', `Quotation ${inv.no} marked as sent.`))}>Mark as sent</button>}
                        <button onClick={act(pdf)}>Download PDF</button>
                        <hr />
                        {!isQuote && (inv.status === 'cancelled'
                          ? <button onClick={act(() => setStatus(inv, isCredit ? 'issued' : 'sent', `${info.label} ${inv.no} restored.`))}>Restore {info.lower}</button>
                          : <button onClick={act(() => setConfirm({ type: 'cancel', inv }))}>Cancel {info.lower}</button>)}
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
          sample={Boolean(viewing.__sample)}
          hideBranding={isPro}
          onClose={() => setViewing(null)}
          onEdit={(inv) => navigate(`/tools/invoice-maker?edit=${inv._id}`)}
        />
      )}

      {confirm?.type === 'delete' && (
        <ConfirmDialog
          danger
          busy={working}
          title={`Delete ${info.lower} ${confirm.inv.no}?`}
          message={isInvoice
            ? 'This invoice and its payment records will be deleted permanently. This cannot be undone.'
            : isCredit
              ? `This credit note will be deleted permanently and the balance of invoice ${confirm.inv.refInvoiceNo || ''} will go back up. This cannot be undone.`
              : 'This quotation will be deleted permanently. This cannot be undone.'}
          confirmLabel="Delete"
          onConfirm={() => doDelete(confirm.inv)}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm?.type === 'cancel' && (
        <ConfirmDialog
          busy={working}
          title={`Cancel ${info.lower} ${confirm.inv.no}?`}
          message={isCredit
            ? `A cancelled credit note no longer reduces invoice ${confirm.inv.refInvoiceNo || ''}. You can restore it later.`
            : 'A cancelled invoice is left out of totals and reports. You can restore it later.'}
          confirmLabel={`Cancel ${info.lower}`}
          onConfirm={() => setStatus(confirm.inv, 'cancelled', `${info.label} ${confirm.inv.no} cancelled.`)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
