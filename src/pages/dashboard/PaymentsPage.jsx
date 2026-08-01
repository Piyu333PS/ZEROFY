import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import styles from './PaymentsPage.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const today = () => new Date().toISOString().slice(0, 10)
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const METHODS = [
  { value: 'upi', label: 'UPI' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'card', label: 'Card' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
]

export default function PaymentsPage() {
  const { token } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ invoiceId: '', amount: '', date: today(), method: 'upi', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [invRes, payRes] = await Promise.all([
        fetch(`${API}/api/invoices`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API}/api/payments`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ])
      if (invRes.success) setInvoices(invRes.invoices || [])
      if (payRes.success) setPayments(payRes.payments || [])
    } catch (e) {
      setError('Data load nahi ho paya.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (token) load() }, [token])

  const invoiceMap = Object.fromEntries(invoices.map(inv => [inv._id, inv]))

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.invoiceId || !form.amount) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, amount: Number(form.amount) })
      }).then(r => r.json())
      if (!res.success) throw new Error(res.error || 'Payment record nahi hua')
      setForm({ invoiceId: '', amount: '', date: today(), method: 'upi', notes: '' })
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Ye payment record delete karna hai?')) return
    await fetch(`${API}/api/payments/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>Payments</h1>
        <button className={styles.primaryBtn} onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Cancel' : '+ Record payment'}
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleAdd}>
          <div className={styles.formGrid}>
            <select value={form.invoiceId} onChange={e => setForm({ ...form, invoiceId: e.target.value })} required>
              <option value="">Invoice chuno *</option>
              {invoices.map(inv => (
                <option key={inv._id} value={inv._id}>{inv.no} — {inv.clientName || 'No client'}</option>
              ))}
            </select>
            <input type="number" step="0.01" placeholder="Amount *" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
              {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={styles.wide} />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.primaryBtn} disabled={saving}>
            {saving ? 'Saving...' : 'Save payment'}
          </button>
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
                <span>{inv?.no || '—'}</span>
                <span>{inv?.clientName || '—'}</span>
                <span>{fmt(p.amount)}</span>
                <span>{p.date}</span>
                <span className={styles.methodBadge}>{METHODS.find(m => m.value === p.method)?.label || p.method}</span>
                <button className={styles.deleteBtn} onClick={() => handleDelete(p._id)}>Delete</button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
