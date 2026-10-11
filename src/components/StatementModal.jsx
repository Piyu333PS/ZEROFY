import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { buildStatement, statementMarkup, statementMessage, financialYearOf, periodText } from '../utils/statement'
import { localToday, addDays, fmtMoney } from '../utils/invoiceCalc'
import { markupToPdfBlob, printMarkup, saveBlob } from '../utils/invoiceShare'
import { toast } from './ui/Toast'
import styles from './StatementModal.module.css'

const fileName = (st) => `Statement-${String(st.customer.name || 'client').replace(/[^\w.-]+/g, '-')}.pdf`

// A client's account statement: pick a period, then print it, save it as a PDF or send it on WhatsApp
export default function StatementModal({ customer, data, onClose }) {
  const fy = financialYearOf()
  const today = localToday()
  const PERIODS = [
    { key: 'all', label: 'All time', from: '', to: '' },
    { key: 'fy', label: `This year (${fy.label})`, from: fy.from, to: fy.to },
    { key: '90', label: 'Last 3 months', from: addDays(today, -90), to: today },
    { key: 'custom', label: 'Choose dates' },
  ]
  const [period, setPeriod] = useState('all')
  const [custom, setCustom] = useState({ from: fy.from, to: today })
  const [busy, setBusy] = useState('')
  const range = period === 'custom' ? custom : PERIODS.find(p => p.key === period)

  const st = useMemo(() => buildStatement({
    customer, invoices: data?.invoices || [], creditNotes: data?.creditNotes || [], payments: data?.payments || [], from: range.from, to: range.to,
  }), [customer, data, range.from, range.to])
  const markup = useMemo(() => statementMarkup(st), [st])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  // The statement is laid out at A4 width and shrunk to fit narrow screens
  const bodyRef = useRef(null), sheetRef = useRef(null)
  const [fit, setFit] = useState({ scale: 1, height: 0 })
  useLayoutEffect(() => {
    const measure = () => {
      const body = bodyRef.current, sheet = sheetRef.current
      if (!body || !sheet) return
      const cs = getComputedStyle(body)
      const room = body.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const scale = Math.min(1, Math.max(0.3, room / 794))
      setFit({ scale, height: sheet.offsetHeight * scale })
    }
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (ro && bodyRef.current) ro.observe(bodyRef.current)
    window.addEventListener('resize', measure)
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [markup])

  const download = async () => {
    setBusy('pdf')
    try { saveBlob(await markupToPdfBlob(markup), fileName(st)) }
    catch { toast.error('Could not make the PDF. Try Print and choose "Save as PDF".') }
    setBusy('')
  }

  // On a phone the PDF goes straight into the share sheet; elsewhere WhatsApp opens with the summary typed in
  const whatsapp = async () => {
    const text = statementMessage(st)
    setBusy('wa')
    try {
      const blob = await markupToPdfBlob(markup)
      const file = new File([blob], fileName(st), { type: 'application/pdf' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text, title: 'Statement of account' })
        setBusy(''); return
      }
      saveBlob(blob, fileName(st))
      toast('Statement downloaded — attach it in WhatsApp')
    } catch (e) { if (e && e.name === 'AbortError') { setBusy(''); return } }
    setBusy('')
    const phone = String(customer.phone || '').replace(/\D/g, '').slice(-10)
    window.open(`https://wa.me/${phone.length === 10 ? '91' + phone : ''}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  return createPortal(
    <div className={styles.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={`Statement for ${customer.name}`}>
        <div className={styles.head}>
          <div className={styles.headText}>
            <div className={styles.title}>Statement — {customer.name}</div>
            <div className={styles.sub}>{periodText(st)} · {st.closing > 0.005 ? <b className={styles.due}>{fmtMoney(st.closing, st.currency)} due</b> : st.closing < -0.005 ? <b className={styles.ok}>{fmtMoney(-st.closing, st.currency)} advance</b> : <b className={styles.ok}>Nothing due</b>}</div>
          </div>
          <div className={styles.btns}>
            <button className={styles.btn} onClick={() => printMarkup(markup, `Statement - ${customer.name}`)}>Print</button>
            <button className={styles.btn} onClick={download} disabled={Boolean(busy)}>{busy === 'pdf' ? 'Making…' : 'Download PDF'}</button>
            <button className={`${styles.btn} ${styles.primary}`} onClick={whatsapp} disabled={Boolean(busy)}>{busy === 'wa' ? 'Opening…' : 'WhatsApp'}</button>
            <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>
        <div className={styles.periods}>
          {PERIODS.map(p => <button key={p.key} className={`${styles.chip} ${period === p.key ? styles.chipOn : ''}`} onClick={() => setPeriod(p.key)}>{p.label}</button>)}
          {period === 'custom' && (
            <span className={styles.dates}>
              <input type="date" aria-label="From" value={custom.from} max={custom.to || undefined} onChange={e => setCustom(c => ({ ...c, from: e.target.value }))} />
              <span>to</span>
              <input type="date" aria-label="To" value={custom.to} min={custom.from || undefined} onChange={e => setCustom(c => ({ ...c, to: e.target.value }))} />
            </span>
          )}
        </div>
        <div className={styles.body} ref={bodyRef}>
          {st.hasAny
            ? <div className={styles.fit} style={{ width: 794 * fit.scale, height: fit.height || undefined }}>
                <div className={styles.sheet} ref={sheetRef} style={{ transform: fit.scale < 1 ? `scale(${fit.scale})` : undefined }} dangerouslySetInnerHTML={{ __html: markup }} />
              </div>
            : <p className={styles.empty}>No invoices for {customer.name} yet. The statement fills in once you bill them.</p>}
        </div>
        <button className={styles.closeBottom} onClick={onClose}>Close</button>
      </div>
    </div>,
    document.body
  )
}
