import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { InvoicePreview } from './InvoicePreview'
import { printInvoice, downloadInvoicePdf, shareViaWhatsApp, shareViaEmail, preparePdf } from '../../utils/invoiceShare'
import { formatDate, docInfo } from '../../utils/invoiceCalc'
import styles from './InvoiceViewModal.module.css'

const SHEET_W = 794 // the invoice is laid out at A4 width

/* Shows a saved document inside the app, with Print, PDF, WhatsApp, Email and Edit.
   - Drawn through a portal on document.body, so it always covers the whole screen no matter how
     the page behind it is laid out, scrolled or animated.
   - The top bar (with Close) never scrolls away; only the invoice scrolls.
   - The invoice shrinks to fit the width of small screens.
   Close with the × button, the Esc key, a click outside, or the Close button at the bottom on phones. */
export default function InvoiceViewModal({ invoice, hideBranding = false, onClose, onEdit, sample = false }) {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const bodyRef = useRef(null)
  const sheetRef = useRef(null)
  const closeRef = useRef(null)
  const [fit, setFit] = useState({ scale: 1, height: 0 })

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  useEffect(() => { closeRef.current?.focus() }, [])

  // Build the PDF in the background as soon as the document opens, so WhatsApp / Email can
  // attach it instantly inside the click (the browser refuses to share after a long wait)
  useEffect(() => {
    if (!invoice || sample) return
    const t = setTimeout(() => preparePdf(invoice, { hideBranding }), 300)
    return () => clearTimeout(t)
  }, [invoice, hideBranding, sample])

  // Shrink the A4-wide sheet to the space available, and keep the scroll height right
  useLayoutEffect(() => {
    const body = bodyRef.current, sheet = sheetRef.current
    if (!body || !sheet) return
    const measure = () => {
      const cs = getComputedStyle(body)
      const room = body.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const scale = Math.min(1, Math.max(0.3, room / SHEET_W))
      setFit({ scale, height: sheet.offsetHeight * scale })
    }
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (ro) { ro.observe(body); ro.observe(sheet) }
    window.addEventListener('resize', measure)
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [invoice])

  if (!invoice) return null
  const opts = { hideBranding }

  const run = (key, fn) => async () => {
    setBusy(key)
    setError('')
    try { await fn(invoice, opts) } catch (e) {
      console.error(e)
      setError('That did not work. Please try again.')
    } finally { setBusy('') }
  }

  return createPortal(
    <div className={styles.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={`${docInfo(invoice).label} ${invoice.no}`}>
        <div className={styles.head}>
          <div className={styles.titleBlock}>
            <div className={styles.title}>{invoice.no}</div>
            <div className={styles.sub}>{sample ? 'Sample invoice — this is how your invoices will look' : `${invoice.clientName || '—'} · ${formatDate(invoice.date)}`}</div>
          </div>
          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.primary}`} disabled={!!busy} onClick={run('print', printInvoice)}>
              {busy === 'print' ? 'Opening…' : 'Print'}
            </button>
            <button className={styles.btn} disabled={!!busy} onClick={run('pdf', downloadInvoicePdf)}>
              {busy === 'pdf' ? 'Preparing…' : 'Download PDF'}
            </button>
            {!sample && (
              <button className={styles.btn} disabled={!!busy} onClick={run('wa', shareViaWhatsApp)}>
                {busy === 'wa' ? 'Preparing…' : 'WhatsApp'}
              </button>
            )}
            {!sample && (
              <button className={styles.btn} disabled={!!busy} onClick={run('mail', shareViaEmail)}>
                {busy === 'mail' ? 'Preparing…' : 'Email'}
              </button>
            )}
            {onEdit && !sample && <button className={styles.btn} disabled={!!busy} onClick={() => onEdit(invoice)}>Edit</button>}
          </div>
          <button ref={closeRef} className={`${styles.btn} ${styles.close}`} onClick={onClose} aria-label="Close" title="Close (Esc)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.body} ref={bodyRef}>
          <div className={styles.fit} style={{ width: SHEET_W * fit.scale, height: fit.height || undefined }}>
            <div className={styles.sheet} ref={sheetRef} style={{ transform: fit.scale < 1 ? `scale(${fit.scale})` : undefined }}>
              <InvoicePreview inv={invoice} hideBranding={hideBranding} />
            </div>
          </div>
        </div>
        <div className={styles.foot}>
          <button className={styles.btn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
