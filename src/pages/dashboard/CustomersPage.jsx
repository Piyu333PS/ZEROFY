import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import styles from './CustomersPage.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const emptyForm = { name: '', email: '', phone: '', gst: '', addr: '' }

export default function CustomersPage() {
  const { token } = useAuth()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/customers`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
      if (res.success) setCustomers(res.customers || [])
    } catch (e) {
      setError('Customers load nahi ho paye.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (token) load() }, [token])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      }).then(r => r.json())
      if (!res.success) throw new Error(res.error || 'Save nahi hua')
      setForm(emptyForm)
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Ye customer delete karna hai? Unke invoices delete nahi honge.')) return
    await fetch(`${API}/api/customers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>Customers</h1>
        <button className={styles.primaryBtn} onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Cancel' : '+ Add customer'}
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleAdd}>
          <div className={styles.formGrid}>
            <input placeholder="Naam *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <input placeholder="GSTIN" value={form.gst} onChange={e => setForm({ ...form, gst: e.target.value })} />
            <input placeholder="Address" value={form.addr} onChange={e => setForm({ ...form, addr: e.target.value })} className={styles.wide} />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.primaryBtn} disabled={saving}>
            {saving ? 'Saving...' : 'Save customer'}
          </button>
        </form>
      )}

      <div className={styles.table}>
        <div className={styles.tableHead}>
          <span>Naam</span><span>Phone</span><span>Email</span><span>GSTIN</span><span></span>
        </div>
        {loading ? (
          <p className={styles.empty}>Loading...</p>
        ) : customers.length === 0 ? (
          <p className={styles.empty}>Abhi tak koi customer add nahi hua.</p>
        ) : (
          customers.map(c => (
            <div key={c._id} className={styles.tableRow}>
              <span>{c.name}</span>
              <span>{c.phone || '—'}</span>
              <span>{c.email || '—'}</span>
              <span>{c.gst || '—'}</span>
              <button className={styles.deleteBtn} onClick={() => handleDelete(c._id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
