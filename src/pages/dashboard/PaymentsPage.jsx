import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../utils/api'
import { invoiceTotal, displayStatus, formatDate, fmtMoney, localToday, r2 } from '../../utils/invoiceCalc'
import ConfirmDialog from '../../components/ConfirmDialog'
import styles from './PaymentsPage.module.css'

const METHODS = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'card', label: 'Card' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
]

const blankForm = () => ({ invoiceId: '', amount: '', date: localToday(), method: 'upi', notes: '' })
const balanceOf = (inv) => inv.balance !== undefined ? Number(inv.balance) : invoiceTotal(inv)

export default function PaymentsPage() {
  const { token } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(blankForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const [invRes, payRes] = await Promise.all([
      api('/api/invoices', token),
      api('/api/payments', token),
    ])
    if (invRes.ok && invRes.data.success) setInvoices(invRes.data.invoices || [])
    if (payRes.ok && payRes.data.success) setPayments(payRes.data.payments || [])
    if (!invRes.ok || !payRes.ok) setError('Data load nahi ho paya. Page refresh karke dobara try karein.')
    setLoading(false)
    return invRes.ok ? (invRes.data.invoices || []) : []
  }, [token])

  // Invoices page se "Record payment" → /app/payments?invoice=<id> : form khula aur balance bhara hua mile
  useEffect(() => {
    if (!token) return
    load().then(list => {
      const wanted = searchParams.get('invoice')
      if (!wanted) return
      const inv = list.find(i => i._id === wanted)
      if (inv && ['sent', 'partial', 'overdue'].includes(displayStatus(inv))) {
        setForm({ ...blankForm(), invoiceId: inv._id, amount: String(balanceOf(inv)) })
        setShowForm(true)
      }
      setSearchParams({}, { replace: true })
    })
  }, [token]) // eslint-disable-line

  const invoiceMap = useMemo(() => Object.fromEntries(invoices.map(inv => [inv._id, inv])), [invoices])
  // Payment sirf un invoices par jinka paisa baaki hai
  const payable = useMemo(
    () => invoices.filter(inv => ['sent', 'partial', 'overdue'].includes(displayStatus(inv)) && balanceOf(inv) > 0),
    [invoices]
  )
  const selected = invoiceMap[form.invoiceId]
  const selectedBalance = selected ? r2(balanceOf(selected)) : 0
  const amountNum = Number(form.amount)
  const amountTooHigh = Boolean(selected) && amountNum > selectedBalance + 0.01
  const totalReceived = useMemo(() => payments.reduce((s, p) => s + (Number(p.amount) || 0), 0), [payments])

  const pickInvoice = (id) => {
    const inv = invoiceMap[id]
    setForm(f => ({ ...f, invoiceId: id, amount: inv ? String(r2(balanceOf(inv))) : '' }))
    setError(null)
  }

  const closeForm = () => { setShowForm(false); setForm(blankForm()); setError(null) }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.invoiceId) { setError('Pehle invoice chunein.'); return }
    if (!(amountNum > 0)) { setError('Amount 0 se zyada hona chahiye.'); return }
    if (amountTooHigh) { setError(`Amount balance (${fmtMoney(selectedBalance, selected.currency || '₹')}) se zyada nahi ho sakta.`); return }
    setSaving(true)
    setError(null)
    const res = await api('/api/payments', token, { method: 'POST', body: { ...form, amount: amountNum } })
    setSaving(false)
    if (!res.ok || !res.data.success) { setError(res.data.error || 'Payment record nahi hua. Dobara try karein.'); return }
    setNotice(res.data.invoiceStatus === 'paid'
      ? `Payment record ho gaya — invoice ${selected?.no || ''} ab poora paid hai.`
      : `Payment record ho gaya. Balance baaki: ${fmtMoney(res.data.balance, selected?.currency || '₹')}`)
    setTimeout(() => setNotice(null), 5000)
    closeForm()
    load(true)
  }

  const handleDelete = async () => {
    setDeleting(true)
    const res = await api(`/api/payments/${toDelete._id}`, token, { method: 'DELETE' })
    setDeleting(false)
    setToDelete(null)
    if (!res.ok) { setError(res.data.error || 'Delete nahi ho paya.'); return }
    load(true)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Payments</h1>
          <p className={styles.subtitle}>
            {loading ? 'Loading…' : `${payments.length} payment${payments.length === 1 ? '' : 's'} · Total received ${fmtMoney(totalReceived)}`}
          </p>
        </div>
        <button className={styles.primaryBtn} onClick={() => (showForm ? closeForm() : setShowForm(true))}>
          {showForm ? 'Cancel' : '+ Record payment'}
        </button>
      </div>

      {notice && <p className={styles.notice}>{notice}</p>}
      {error && !showForm && <p className={styles.error}>{error}</p>}

      {showForm && (
        <form className={styles.form} onSubmit={handleAdd} noValidate>
          {payable.length === 0 && !loading ? (
            <p className={styles.balanceHint}>Abhi koi unpaid invoice nahi hai jis par payment record ho sake. (Draft aur cancelled invoices yahan nahi aate.)</p>
          ) : (
            <>
              <div className={styles.formGrid}>
                <select value={form.invoiceId} onChange={e => pickInvoice(e.target.value)} required aria-label="Invoice">
                  <option value="">Select invoice *</option>
                  {payable.map(inv => (
                    <option key={inv._id} value={inv._id}>
                      {inv.no} — {inv.clientName || 'No client'} (bal {fmtMoney(balanceOf(inv), inv.currency || '₹')})
                    </option>
                  ))}
                </select>
                <input type="number" step="0.01" min="0" placeholder="Amount *" aria-label="Amount" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })} required />
                <input type="date" aria-label="Payment date" value={form.date} max={localToday()} onChange={e => setForm({ ...form, date: e.target.value })} required />
                <select value={form.method} aria-label="Payment method" onChange={e => setForm({ ...form, method: e.target.value })}>
                  {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <input placeholder="Notes / reference no. (optional)" value={form.notes} maxLength={500}
                  onChange={e => setForm({ ...form, notes: e.target.value })} className={styles.wide} />
              </div>
              {selected && (
                <p className={styles.balanceHint}>
                  Invoice total <strong>{fmtMoney(invoiceTotal(selected), selected.currency || '₹')}</strong> · Balance <strong>{fmtMoney(selectedBalance, selected.currency || '₹')}</strong>
                  {amountNum !== selectedBalance && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, amount: String(selectedBalance) }))}>Poora balance bharein</button>
                  )}
                </p>
              )}
              {error && <p className={styles.error}>{error}</p>}
              <div className={styles.formActions}>
                <button type="submit" className={styles.primaryBtn} disabled={saving}>
                  {saving ? 'Saving...' : 'Save payment'}
                </button>
                <button type="button" className={styles.secondaryBtn} onClick={closeForm}>Cancel</button>
              </div>
            </>
          )}
        </form>
      )}

      <div className={styles.table}>
        <div className={styles.tableHead}>
          <span>Invoice</span><span>Client</span><span>Amount</span><span>Date</span><span>Method</span><span></span>
        </div>
        {loading ? (
          <p className={styles.empty}>Loading...</p>
        ) : payments.length === 0 ? (
          <p className={styles.empty}>Abhi tak koi payment record nahi hua.</p>
        ) : (
          payments.map(p => {
            const inv = invoiceMap[p.invoiceId]
            return (
              <div key={p._id} className={styles.tableRow}>
                <span className={styles.mono}>{inv?.no || '—'}</span>
                <div>
                  {inv?.clientName || '—'}
                  {p.notes && <div className={styles.noteText}>{p.notes}</div>}
                </div>
                <span className={styles.mono}>{fmtMoney(p.amount, inv?.currency || '₹')}</span>
                <span>{formatDate(p.date)}</span>
                <span className={styles.methodBadge}>{METHODS.find(m => m.value === p.method)?.label || p.method}</span>
                <button className={styles.deleteBtn} onClick={() => setToDelete(p)}>Delete</button>
              </div>
            )
          })
        )}
      </div>

      {toDelete && (
        <ConfirmDialog
          danger
          busy={deleting}
          title="Ye payment record delete karein?"
          message={`${fmtMoney(toDelete.amount)} ka payment hat jayega aur invoice ka balance wapas badh jayega.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
