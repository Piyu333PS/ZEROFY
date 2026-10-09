import { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import styles from './GuidedTour.module.css'

/* Guided tour of the billing app.
   - Runs automatically the first time a new account opens the app (see DashboardLayout)
   - Can be replayed any time from Settings → Guided tour
   Each step can point at an element (data-tour="...") on a given page. If that element is not
   visible (for example the sidebar on a phone), the step is shown as a centred card instead. */

export const TOUR_EVENT = 'zerofy:start-tour'
export const startTour = () => window.dispatchEvent(new Event(TOUR_EVENT))

const doneKey = (email) => `zerofy-tour-done:${email || 'me'}`
export const isTourDone = (email) => { try { return localStorage.getItem(doneKey(email)) === '1' } catch { return true } }
const markDone = (email) => { try { localStorage.setItem(doneKey(email), '1') } catch { /* ignore */ } }

const STEPS = [
  {
    route: '/app',
    title: 'Welcome to Zerofy',
    body: 'This short tour shows you how billing works here: create an invoice, get paid, and keep track of who owes you. It takes about a minute.',
  },
  {
    route: '/app', target: 'new-invoice',
    title: 'Create an invoice',
    body: 'Start here. Fill in your business and client once, add items, and Zerofy works out GST (CGST, SGST or IGST) for you. Save it as a draft, or save and print.',
  },
  {
    route: '/app', target: 'to-collect',
    title: 'See what you are owed',
    body: 'The overview shows the money still to collect, how much has come in, and anything overdue. It updates as soon as you add an invoice or a payment.',
  },
  {
    route: '/app/invoices', target: 'nav-invoices',
    title: 'All your invoices',
    body: 'Search and filter by status. Open an invoice to print it, download a PDF, or share it on WhatsApp or email. Use the ⋯ menu to edit, duplicate, cancel or delete.',
  },
  {
    route: '/app/quotations', target: 'nav-quotations',
    title: 'Quotations, before the sale',
    body: 'Send a client a price offer first. Quotations are free and are not counted in your billing or GST. When the client agrees, use "Convert to invoice" and the invoice is ready.',
  },
  {
    route: '/app/credit-notes', target: 'nav-credit-notes',
    title: 'Credit notes, after the sale',
    body: 'If goods come back or you need to reduce an invoice you already sent, make a credit note for it. The invoice balance and your GST summary go down by that amount.',
  },
  {
    route: '/app/customers', target: 'nav-clients',
    title: 'Clients are saved for you',
    body: 'Every client you invoice is saved automatically. Next time, type the name and the details fill in. You can also see what each client has been billed and still owes.',
  },
  {
    route: '/app/items', target: 'nav-items',
    title: 'Items you sell',
    body: 'Items and services from your invoices are remembered with their rate, GST and HSN/SAC code, so you never type them twice.',
  },
  {
    route: '/app/payments', target: 'nav-payments',
    title: 'Record payments',
    body: 'When a client pays, record it here. Part payments are fine. The invoice moves to Part paid or Paid, and the balance updates everywhere.',
  },
  {
    route: '/app/reports', target: 'nav-reports',
    title: 'Reports and GST summary',
    body: 'See billing by month, your top clients and who still owes you. The GST summary can be exported as a CSV for your accountant.',
  },
  {
    route: '/app/settings', target: 'nav-settings',
    title: 'Settings',
    body: 'Manage your plan and password here. You can replay this tour from Settings whenever you like.',
  },
  {
    route: '/app',
    title: 'You are ready',
    body: 'Tip: add your logo, bank details and UPI ID under Business profiles on the invoice screen. Your invoices then carry a Scan to pay QR code.',
    final: true,
  },
]

const visibleRect = (el) => {
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width < 4 || r.height < 4) return null
  if (r.right < 0 || r.bottom < 0 || r.left > window.innerWidth || r.top > window.innerHeight) return null
  const cs = getComputedStyle(el)
  if (cs.visibility === 'hidden' || cs.display === 'none') return null
  return r
}

export default function GuidedTour({ email, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)
  const cardRef = useRef(null)
  const step = STEPS[i]

  const finish = useCallback((goCreate = false) => {
    markDone(email)
    onClose()
    if (goCreate) navigate('/tools/invoice-maker')
  }, [email, navigate, onClose])

  // Go to the page this step is about
  useEffect(() => {
    if (step.route && location.pathname !== step.route) navigate(step.route)
  }, [i]) // eslint-disable-line

  // Find and follow the highlighted element
  const measure = useCallback(() => {
    if (!step.target) { setRect(null); return }
    const el = document.querySelector(`[data-tour="${step.target}"]`)
    const r = visibleRect(el)
    setRect(r ? { top: r.top, left: r.left, width: r.width, height: r.height } : null)
  }, [step])

  useLayoutEffect(() => {
    measure()
    // The page may still be rendering after a route change — look again a few times
    const timers = [60, 200, 500, 900].map(ms => setTimeout(measure, ms))
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => { timers.forEach(clearTimeout); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true) }
  }, [measure, location.pathname])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') finish()
      else if (e.key === 'ArrowRight' && i < STEPS.length - 1) setI(n => n + 1)
      else if (e.key === 'ArrowLeft' && i > 0) setI(n => n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [i, finish])

  useEffect(() => { cardRef.current?.focus() }, [i])

  // Place the card next to the highlight, kept inside the screen
  const pad = 8
  const CARD_W = Math.min(360, window.innerWidth - 24)
  let cardStyle = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: CARD_W }
  if (rect) {
    const spaceRight = window.innerWidth - (rect.left + rect.width)
    let left, top
    if (spaceRight > CARD_W + 28) { left = rect.left + rect.width + 18; top = rect.top - 6 }
    else if (rect.top + rect.height + 250 < window.innerHeight) { left = rect.left; top = rect.top + rect.height + 16 }
    else { left = rect.left; top = Math.max(12, rect.top - 250) }
    left = Math.max(12, Math.min(left, window.innerWidth - CARD_W - 12))
    top = Math.max(12, Math.min(top, window.innerHeight - 260))
    cardStyle = { left, top, width: CARD_W }
  }

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-label="Guided tour">
      {rect
        ? <div className={styles.spot} style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }} />
        : <div className={styles.dim} />}

      <div className={styles.card} style={cardStyle} ref={cardRef} tabIndex={-1} key={i}>
        <div className={styles.count}>Step {i + 1} of {STEPS.length}</div>
        <h2 className={styles.title}>{step.title}</h2>
        <p className={styles.body}>{step.body}</p>
        <div className={styles.dots} aria-hidden="true">
          {STEPS.map((_, n) => <span key={n} className={n === i ? styles.dotOn : n < i ? styles.dotDone : styles.dot} />)}
        </div>
        <div className={styles.actions}>
          {!step.final && <button className={styles.skip} onClick={() => finish()}>Skip tour</button>}
          <div className={styles.spacer} />
          {i > 0 && <button className={styles.back} onClick={() => setI(n => n - 1)}>Back</button>}
          {step.final ? (
            <>
              <button className={styles.back} onClick={() => finish()}>Finish</button>
              <button className={styles.next} onClick={() => finish(true)}>Create my first invoice</button>
            </>
          ) : (
            <button className={styles.next} onClick={() => setI(n => n + 1)}>{i === 0 ? 'Start tour' : 'Next'}</button>
          )}
        </div>
      </div>
    </div>
  )
}
