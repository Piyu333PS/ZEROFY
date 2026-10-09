import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../utils/api'
import { useBilling } from '../../utils/billingStore'
import { fmtMoney } from '../../utils/invoiceCalc'
import { UQC_CODES } from '../../data/invoiceCodes'
import ConfirmDialog from '../../components/ConfirmDialog'
import styles from './CustomersPage.module.css'

const emptyForm = { name: '', type: 'goods', hsnSac: '', uqc: 'PCS', rate: '', gstRate: '18' }
const GST_RATES = [0, 0.1, 0.25, 1.5, 3, 5, 7.5, 12, 18, 28]

/* Saved items / products. Invoice banate waqt naam chunte hi rate, HSN, GST aur unit bhar jata hai.
   Invoice mein daale gaye items yahan apne aap aa jate hain; yahan se unhe theek ya delete kar sakte hain. */
export default function ItemsPage() {
  const { token } = useAuth()
  const { data, loading, error: loadError, refresh } = useBilling(token)
  const items = data?.items || []

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [actionError, setError] = useState(null)
  const error = actionError || loadError
  const [notice, setNotice] = useState(null)
  const [query, setQuery] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(i => [i.name, i.hsnSac].some(v => String(v || '').toLowerCase().includes(q)))
  }, [items, query])

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setError(null); setShowForm(true) }
  const openEdit = (it) => {
    setEditingId(it._id)
    setForm({ name: it.name || '', type: it.type === 'service' ? 'service' : 'goods', hsnSac: it.hsnSac || '', uqc: it.uqc || 'PCS', rate: String(it.rate ?? ''), gstRate: String(it.gstRate ?? 18) })
    setError(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); setError(null) }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const gst = Number(form.gstRate)
    if (isNaN(gst) || gst < 0 || gst > 100) { setError('GST % 0 se 100 ke beech hona chahiye.'); return }
    setSaving(true)
    setError(null)
    const body = { ...form, rate: Number(form.rate) || 0, gstRate: gst }
    const res = editingId
      ? await api(`/api/items/${editingId}`, token, { method: 'PUT', body })
      : await api('/api/items', token, { method: 'POST', body })
    setSaving(false)
    if (!res.ok || !res.data.success) { setError(res.data.error || 'Save nahi hua. Dobara try karein.'); return }
    setNotice(editingId ? 'Item update ho gaya.' : 'Item add ho gaya.')
    setTimeout(() => setNotice(null), 4000)
    closeForm()
    refresh()
  }

  const handleDelete = async () => {
    setDeleting(true)
    const res = await api(`/api/items/${toDelete._id}`, token, { method: 'DELETE' })
    setDeleting(false)
    setToDelete(null)
    if (!res.ok) { setError(res.data.error || 'Delete nahi ho paya.'); return }
    refresh()
  }

  const cols = { gridTemplateColumns: '1.8fr 90px 1fr 80px 1fr 70px 110px' }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Items</h1>
          <p className={styles.subtitle}>
            {loading ? 'Loading…' : `${items.length} saved item${items.length === 1 ? '' : 's'} — invoice mein daala gaya item yahan apne aap save ho jata hai`}
          </p>
        </div>
        <div className={styles.btnGroup}>
          <button className={styles.primaryBtn} onClick={() => (showForm ? closeForm() : openAdd())}>
            {showForm ? 'Cancel' : '+ Add item'}
          </button>
        </div>
      </div>

      {notice && <p className={styles.notice}>{notice}</p>}
      {error && !showForm && <p className={styles.error}>{error}</p>}

      {showForm && (
        <form className={styles.form} onSubmit={handleSave} noValidate>
          <div className={styles.formTitle}>{editingId ? 'Edit item' : 'New item'}</div>
          <div className={styles.formGrid}>
            <input placeholder="Item / service name *" value={form.name} maxLength={200} onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus className={styles.wide} />
            <select aria-label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="goods">Goods</option>
              <option value="service">Service</option>
            </select>
            <input placeholder={form.type === 'goods' ? 'HSN code' : 'SAC code'} value={form.hsnSac} maxLength={20} onChange={e => setForm({ ...form, hsnSac: e.target.value.replace(/[^0-9A-Za-z]/g, '') })} />
            <select aria-label="Unit" value={form.uqc} onChange={e => setForm({ ...form, uqc: e.target.value })}>
              {UQC_CODES.map(u => <option key={u.code} value={u.code}>{u.label}</option>)}
            </select>
            <input type="number" min="0" step="any" placeholder="Rate (excl. GST)" aria-label="Rate" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} />
            <input type="number" min="0" max="100" step="any" list="zerofy-gst-rates" placeholder="GST %" aria-label="GST percent" value={form.gstRate} onChange={e => setForm({ ...form, gstRate: e.target.value })} />
            <datalist id="zerofy-gst-rates">{GST_RATES.map(r => <option key={r} value={r} />)}</datalist>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryBtn} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving...' : editingId ? 'Update item' : 'Save item'}
            </button>
            <button type="button" className={styles.secondaryBtn} onClick={closeForm}>Cancel</button>
          </div>
        </form>
      )}

      {items.length > 5 && (
        <input className={styles.searchBox} placeholder="Search by name or HSN/SAC…" value={query} onChange={e => setQuery(e.target.value)} />
      )}

      <div className={styles.table}>
        <div className={styles.tableHead} style={cols}>
          <span>Item</span><span>Type</span><span>HSN / SAC</span><span>Unit</span><span>Rate</span><span>GST</span><span></span>
        </div>
        {loading ? (
          <p className={styles.empty}>Loading...</p>
        ) : items.length === 0 ? (
          <p className={styles.empty}>Abhi koi saved item nahi hai. "+ Add item" se jodein, ya invoice banayein — uske items yahan apne aap aa jayenge.</p>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>Is search se koi item nahi mila.</p>
        ) : (
          filtered.map(it => (
            <div key={it._id} className={`${styles.tableRow} ${styles.itemRow}`} style={cols}>
              <div className={styles.nameMain}>{it.name}</div>
              <span><span className={styles.cellLabel}>Type</span>{it.type === 'service' ? 'Service' : 'Goods'}</span>
              <span className={styles.mono}><span className={styles.cellLabel}>HSN / SAC</span>{it.hsnSac || '—'}</span>
              <span className={styles.mono}><span className={styles.cellLabel}>Unit</span>{it.uqc || 'PCS'}</span>
              <span className={styles.num}><span className={styles.cellLabel}>Rate</span>{fmtMoney(it.rate)}</span>
              <span className={styles.num}><span className={styles.cellLabel}>GST</span>{it.gstRate}%</span>
              <div className={styles.rowBtns}>
                <button className={styles.linkBtn} onClick={() => openEdit(it)}>Edit</button>
                <button className={styles.deleteBtn} onClick={() => setToDelete(it)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {toDelete && (
        <ConfirmDialog
          danger
          busy={deleting}
          title={`"${toDelete.name}" ko delete karein?`}
          message="Ye sirf saved items ki list se hatega. Purane invoices par koi asar nahi padega."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
