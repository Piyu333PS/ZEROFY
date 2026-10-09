import { useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api, API } from '../../utils/api'
import { useBilling } from '../../utils/billingStore'
import { fmtMoney } from '../../utils/invoiceCalc'
import ConfirmDialog from '../../components/ConfirmDialog'
import { toast } from '../../components/ui/Toast'
import { SkeletonRows } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import styles from './CustomersPage.module.css'

const emptyForm = { name: '', email: '', phone: '', gst: '', addr: '' }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i

export default function CustomersPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const { data, loading, error: loadError, refresh } = useBilling(token)
  const customers = data?.customers || []
  const load = refresh
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [actionError, setError] = useState(null)
  const error = actionError || loadError
  const [query, setQuery] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(c =>
      [c.name, c.phone, c.email, c.gst].some(v => String(v || '').toLowerCase().includes(q))
    )
  }, [customers, query])

  const emailBad = Boolean(form.email.trim()) && !EMAIL_RE.test(form.email.trim())
  const gstBad = Boolean(form.gst.trim()) && !GSTIN_RE.test(form.gst.trim())
  const phoneBad = Boolean(form.phone) && form.phone.length !== 10

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setError(null); setShowForm(true) }
  const openEdit = (c) => {
    setEditingId(c._id)
    setForm({ name: c.name || '', email: c.email || '', phone: c.phone || '', gst: c.gst || '', addr: c.addr || '' })
    setError(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); setError(null) }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    if (emailBad || gstBad || phoneBad) { setError('Fix the fields marked in red, then save.'); return }
    setSaving(true)
    setError(null)
    const res = editingId
      ? await api(`/api/customers/${editingId}`, token, { method: 'PUT', body: form })
      : await api('/api/customers', token, { method: 'POST', body: form })
    setSaving(false)
    if (!res.ok || !res.data.success) { setError(res.data.error || 'Could not save. Please try again.'); return }
    toast(editingId ? 'Client updated' : 'Client added')
    closeForm()
    load(true)
  }

  const handleDelete = async () => {
    setDeleting(true)
    const res = await api(`/api/customers/${toDelete._id}`, token, { method: 'DELETE' })
    setDeleting(false)
    setToDelete(null)
    if (!res.ok) { toast.error(res.data.error || 'Could not delete. Please try again.'); return }
    toast('Client deleted')
    load(true)
  }

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/customers/template`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Could not download the template')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'zerofy-clients-template.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => window.URL.revokeObjectURL(url), 4000)
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
      if (!res.success) throw new Error(res.error || 'Could not import the file')
      setImportResult(res)
      load(true)
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
        <div>
          <h1 className={styles.title}>Clients</h1>
          <p className={styles.subtitle}>
            {loading ? 'Loading…' : `${customers.length} client${customers.length === 1 ? '' : 's'} — clients are saved here automatically when you create an invoice`}
          </p>
        </div>
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
          <button className={styles.primaryBtn} onClick={() => (showForm ? closeForm() : openAdd())}>
            {showForm ? 'Cancel' : '+ Add client'}
          </button>
        </div>
      </div>

      {importResult && (
        <div className={styles.importSummary}>
          <p>
            ✅ {importResult.createdCount} client{importResult.createdCount === 1 ? '' : 's'} imported
            {importResult.skippedCount > 0 && `, ${importResult.skippedCount} skipped (name was missing)`}.
          </p>
          {importResult.errors?.length > 0 && (
            <p className={styles.importErrors}>
              Skipped rows: {importResult.errors.map(e => `Row ${e.row}`).join(', ')}
            </p>
          )}
          <button className={styles.closeSummary} onClick={() => setImportResult(null)}>Close</button>
        </div>
      )}

      {error && !showForm && <p className={styles.error}>{error}</p>}

      {showForm && (
        <form className={styles.form} onSubmit={handleSave} noValidate>
          <div className={styles.formTitle}>{editingId ? 'Edit client' : 'New client'}</div>
          <div className={styles.formGrid}>
            <input placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus />
            <input placeholder="Phone (10 digits)" inputMode="numeric" value={form.phone}
              className={phoneBad ? styles.fieldErr : ''}
              onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
            <input placeholder="Email" type="email" value={form.email}
              className={emailBad ? styles.fieldErr : ''}
              onChange={e => setForm({ ...form, email: e.target.value })} />
            <input placeholder="GSTIN" value={form.gst} maxLength={15}
              className={gstBad ? styles.fieldErr : ''}
              onChange={e => setForm({ ...form, gst: e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15) })} />
            <input placeholder="Address" value={form.addr} onChange={e => setForm({ ...form, addr: e.target.value })} className={styles.wide} />
          </div>
          {(emailBad || gstBad || phoneBad) && (
            <p className={styles.hint}>
              {[phoneBad && 'Phone must be 10 digits', emailBad && 'Email is not valid', gstBad && 'GSTIN must be 15 characters (for example 22AAAAA0000A1Z5)'].filter(Boolean).join(' · ')}
            </p>
          )}
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryBtn} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving...' : editingId ? 'Update client' : 'Save client'}
            </button>
            <button type="button" className={styles.secondaryBtn} onClick={closeForm}>Cancel</button>
          </div>
        </form>
      )}

      {customers.length > 5 && (
        <input className={styles.searchBox} type="search" placeholder="Search clients (press / )" value={query} onChange={e => setQuery(e.target.value)} />
      )}

      <div className={styles.table}>
        <div className={styles.tableHead}>
          <span>Client</span><span>GSTIN</span><span>Invoices</span><span>Billed</span><span>Outstanding</span><span></span>
        </div>
        {loading ? (
          <SkeletonRows rows={4} />
        ) : customers.length === 0 ? (
          <EmptyState
            kind="clients"
            title="No clients yet"
            text="Clients are saved here automatically when you invoice them. You can also add one now or import a list from Excel."
            action={{ label: 'Add client', onClick: openAdd }}
            secondary={{ label: 'New invoice', onClick: () => navigate('/tools/invoice-maker') }}
          />
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>No clients match your search.</p>
        ) : (
          filtered.map(c => (
            <div key={c._id} className={styles.tableRow}>
              <div>
                <div className={styles.nameMain}>{c.name}</div>
                {(c.phone || c.email) && <div className={styles.nameSub}>{[c.phone, c.email].filter(Boolean).join(' · ')}</div>}
              </div>
              <span className={styles.mono}><span className={styles.cellLabel}>GSTIN</span>{c.gst || '—'}</span>
              <span className={styles.num}><span className={styles.cellLabel}>Invoices</span>{c.invoiceCount || 0}</span>
              <span className={styles.num}><span className={styles.cellLabel}>Billed</span>{fmtMoney(c.billed)}</span>
              <span className={`${styles.num} ${c.outstanding > 0 ? styles.due : ''}`}><span className={styles.cellLabel}>Outstanding</span>{fmtMoney(c.outstanding)}</span>
              <div className={styles.rowBtns}>
                <button className={styles.linkBtn} onClick={() => navigate(`/tools/invoice-maker?client=${c._id}`)}>New invoice</button>
                <button className={styles.linkBtn} onClick={() => openEdit(c)}>Edit</button>
                <button className={styles.deleteBtn} onClick={() => setToDelete(c)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {toDelete && (
        <ConfirmDialog
          danger
          busy={deleting}
          title={`Delete ${toDelete.name}?`}
          message="The client will be removed from your list. Their invoices will not be deleted."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
