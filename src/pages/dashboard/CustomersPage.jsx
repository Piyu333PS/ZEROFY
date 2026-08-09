import { useState, useEffect, useRef } from 'react'
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
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

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

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/customers/template`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Template download nahi ho paya')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'zerofy-customers-template.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setError(null)
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API}/api/customers/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      }).then(r => r.json())
      if (!res.success) throw new Error(res.error || 'Import nahi ho paya')
      setImportResult(res)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setImporting(false)
      e.target.value = '' // taaki same file dobara select ho sake
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>Customers</h1>
        <div className={styles.btnGroup}>
          <button className={styles.secondaryBtn} onClick={handleDownloadTemplate} disabled={downloadingTemplate}>
            {downloadingTemplate ? 'Downloading...' : 'Download template'}
          </button>
          <button className={styles.secondaryBtn} onClick={handleImportClick} disabled={importing}>
            {importing ? 'Importing...' : 'Import Excel'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportFile}
            className={styles.hiddenInput}
          />
          <button className={styles.primaryBtn} onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Cancel' : '+ Add customer'}
          </button>
        </div>
      </div>

      {importResult && (
        <div className={styles.importSummary}>
          <p>
            ✅ {importResult.createdCount} customer{importResult.createdCount === 1 ? '' : 's'} import ho gaye
            {importResult.skippedCount > 0 && `, ${importResult.skippedCount} skip ho gaye (Naam missing tha)`}.
          </p>
          {importResult.errors?.length > 0 && (
            <p className={styles.importErrors}>
              Skipped rows: {importResult.errors.map(e => `Row ${e.row}`).join(', ')}
            </p>
          )}
          <button className={styles.closeSummary} onClick={() => setImportResult(null)}>Close</button>
        </div>
      )}

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
