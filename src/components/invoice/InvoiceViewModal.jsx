import { useEffect, useState } from 'react'
import { InvoicePreview } from './InvoicePreview'
import { printInvoice, downloadInvoicePdf, shareViaWhatsApp, shareViaEmail } from '../../utils/invoiceShare'
import { formatDate } from '../../utils/invoiceCalc'
import styles from './InvoiceViewModal.module.css'

/* Saved invoice ko app ke andar hi dikhata hai (pehle "View" naya tab/popup kholta tha,
   jo popup blocker rok deta tha). Yahin se Print, PDF download, WhatsApp, Email, Edit. */
export default function InvoiceViewModal({ invoice, hideBranding = false, onClose, onEdit }) {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  if (!invoice) return null
  const opts = { hideBranding }

  const run = (key, fn) => async () => {
    setBusy(key)
    setError('')
    try { await fn(invoice, opts) } catch (e) {
      console.error(e)
      setError('Ye action poora nahi ho paya. Dobara try karein.')
    } finally { setBusy('') }
  }

  return (
    <div className={styles.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={`Invoice ${invoice.no}`}>
        <div className={styles.head}>
          <div>
            <div className={styles.title}>{invoice.no}</div>
            <div className={styles.sub}>{invoice.clientName || '—'} · {formatDate(invoice.date)}</div>
          </div>
          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.primary}`} disabled={!!busy} onClick={run('print', printInvoice)}>
              {busy === 'print' ? 'Opening…' : 'Print'}
            </button>
            <button className={styles.btn} disabled={!!busy} onClick={run('pdf', downloadInvoicePdf)}>
              {busy === 'pdf' ? 'Preparing…' : 'Download PDF'}
            </button>
            <button className={styles.btn} disabled={!!busy} onClick={run('wa', shareViaWhatsApp)}>
              {busy === 'wa' ? 'Preparing…' : 'WhatsApp'}
            </button>
            <button className={styles.btn} disabled={!!busy} onClick={run('mail', shareViaEmail)}>
              {busy === 'mail' ? 'Preparing…' : 'Email'}
            </button>
            {onEdit && <button className={styles.btn} disabled={!!busy} onClick={() => onEdit(invoice)}>Edit</button>}
            <button className={`${styles.btn} ${styles.close}`} onClick={onClose} aria-label="Close">×</button>
          </div>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.body}>
          <div className={styles.sheet}>
            <InvoicePreview inv={invoice} hideBranding={hideBranding} />
          </div>
        </div>
      </div>
    </div>
  )
}
