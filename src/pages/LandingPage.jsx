import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { InvoicePreview } from '../components/invoice/InvoicePreview'
import { sampleInvoice } from '../data/sampleInvoice'
import { PLANS } from '../data/proPlans'
import styles from './LandingPage.module.css'

/* The public home page: what Zerofy is, what an invoice looks like, what it costs, and one clear next step.
   The invoice in the hero is the real preview component with sample data — not a picture. */

const I = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
const tick = <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`

const FEATURES = [
  { icon: I(<><path d="M7 3h8l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M9 12h6M9 16h6M9 8h3" /></>), title: 'GST worked out for you', text: 'Enter the items and rates. Zerofy splits CGST, SGST or IGST from the GSTIN and place of supply, with HSN / SAC codes.' },
  { icon: I(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v7h-7v-3M18 18h.01" /></>), title: 'UPI "Scan to pay" on every invoice', text: 'Add your UPI ID once. Each invoice carries a QR code with the exact amount, so clients pay in seconds.' },
  { icon: I(<><path d="M4 5h16v11H9l-5 4V5z" /><path d="M8 9h8M8 12h5" /></>), title: 'Share on WhatsApp and email', text: 'Send a clean PDF from the app, print it, or nudge late payers with a ready reminder message.' },
  { icon: I(<><path d="M7 3h8l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" /><path d="M15 14H9.5M11.5 11.5L9 14l2.5 2.5" /></>), title: 'Quotations and credit notes', text: 'Quote first and turn it into an invoice in one click. Handle returns and corrections properly with credit notes.' },
  { icon: I(<><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M17 4.2a3.2 3.2 0 010 6.2M21.5 20c0-3-2-5.2-5-5.8" /></>), title: 'Clients, items and payments', text: 'Clients and items are saved as you bill. Record part payments and always know who still owes you.' },
  { icon: I(<><path d="M4 19V5M4 19h16" /><path d="M8 19v-6M12 19V9M16 19v-4" /></>), title: 'Reports your CA will like', text: 'Month-wise GST summary, outstanding by client and a CSV export — ready when return time comes.' },
]

export default function LandingPage() {
  const frameRef = useRef(null)
  const [scale, setScale] = useState(0.6)
  // The sample invoice is laid out at A4 width and shrunk to the space it has
  useLayoutEffect(() => {
    const el = frameRef.current
    if (!el) return
    const measure = () => setScale(Math.max(0.3, Math.min(0.75, el.clientWidth / 794)))
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (ro) ro.observe(el)
    window.addEventListener('resize', measure)
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [])

  const monthly = PLANS.find(p => p.id === 'monthly'), yearly = PLANS.find(p => p.id === 'yearly')
  const signup = '/login?signup=1'

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <div className={`${styles.inner} ${styles.topInner}`}>
          <Link to="/" className={styles.brand}><span className={styles.mark}>Z</span><span className={styles.word}>ZEROFY</span></Link>
          <a href="#features" className={`${styles.navLink} ${styles.hideSm}`}>Features</a>
          <Link to="/pricing" className={`${styles.navLink} ${styles.hideSm}`}>Pricing</Link>
          <Link to="/login" className={styles.btn}>Log in</Link>
          <Link to={signup} className={`${styles.btn} ${styles.primary}`}>Start free</Link>
        </div>
      </header>

      <main>
        <section className={`${styles.inner} ${styles.hero}`}>
          <div>
            <span className={styles.eyebrow}>GST billing for Indian businesses</span>
            <h1 className={styles.h1}>A proper GST invoice in <em>one minute</em>.</h1>
            <p className={styles.lead}>
              Zerofy makes clean GST invoices, sends them on WhatsApp, and keeps track of who has paid — so you spend less time on billing and get paid sooner.
            </p>
            <div className={styles.cta}>
              <Link to={signup} className={`${styles.btn} ${styles.primary} ${styles.big}`}>Start free</Link>
              <Link to="/pricing" className={`${styles.btn} ${styles.big}`}>See pricing</Link>
            </div>
            <div className={styles.assure}>
              <span>{tick} 3 invoices free</span>
              <span>{tick} No card needed</span>
              <span>{tick} Ready in a minute</span>
            </div>
          </div>

          <div className={styles.shot} aria-hidden="true">
            <div className={styles.shotFrame} ref={frameRef} style={{ height: Math.round(760 * scale) }}>
              <div className={styles.shotSheet} style={{ transform: `scale(${scale})` }}>
                <InvoicePreview inv={sampleInvoice()} />
              </div>
            </div>
            <span className={styles.paid}>PAID</span>
            <div className={styles.chip}>Scan to pay<strong>₹11,233.60</strong>with any UPI app</div>
          </div>
        </section>

        <section id="features" className={`${styles.section} ${styles.alt}`}>
          <div className={styles.inner}>
            <div className={styles.kicker}>What you get</div>
            <h2 className={styles.h2}>Everything a small business needs to bill</h2>
            <p className={styles.sub}>No accounting knowledge needed. If you can fill a form, you can make a correct GST invoice.</p>
            <div className={styles.features}>
              {FEATURES.map(f => (
                <div key={f.title} className={styles.feature}>
                  <div className={styles.icon}>{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.inner}>
            <div className={styles.kicker}>How it works</div>
            <h2 className={styles.h2}>Three steps to your first invoice</h2>
            <p className={styles.sub}>From signing up to sending your first invoice takes about five minutes.</p>
            <div className={styles.steps}>
              <div className={styles.step}><h3>Set up your business</h3><p>Name, mobile, address and GSTIN if you have one. You do this once.</p></div>
              <div className={styles.step}><h3>Add the client and items</h3><p>Type what you sold. GST, totals and the amount in words fill in by themselves.</p></div>
              <div className={styles.step}><h3>Send it and get paid</h3><p>Share the PDF on WhatsApp or email. Record the payment when it comes in.</p></div>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.alt}`}>
          <div className={styles.inner}>
            <div className={styles.kicker}>Pricing</div>
            <h2 className={styles.h2}>Start free. Pay only when you need more.</h2>
            <p className={styles.sub}>Every plan has all the features. Pro simply removes the limit on invoices.</p>
            <div className={styles.prices}>
              <div className={styles.price}>
                <div className={styles.priceName}>Free</div>
                <div className={styles.amount}>₹0</div>
                <p>3 invoices, plus quotations, credit notes, clients and reports.</p>
              </div>
              <div className={styles.price}>
                <div className={styles.priceName}>Pro Monthly</div>
                <div className={styles.amount}>{rupees(monthly.price)}<span>/month</span></div>
                <p>Unlimited invoices. Pay month by month.</p>
              </div>
              <div className={`${styles.price} ${styles.priceBest}`}>
                <div className={styles.priceName}>Pro Yearly <span className={styles.tag}>Best value</span></div>
                <div className={styles.amount}>{rupees(yearly.price)}<span>/year</span></div>
                <p>Unlimited invoices for a full year. Launch offer{yearly.listPrice > yearly.price ? ` — regular price ${rupees(yearly.listPrice)}` : ''}.</p>
              </div>
            </div>
            <div className={styles.pricesFoot}>
              <Link to="/pricing" className={styles.btn}>Compare plans</Link>
              <span>7-day money-back guarantee · UPI, cards and net banking</span>
            </div>
          </div>
        </section>

        <section className={styles.section} style={{ paddingBottom: 0 }}>
          <div className={styles.inner}>
            <div className={styles.band}>
              <div>
                <h2>Make your first invoice today</h2>
                <p>Free to start. No card, no installation — it works in your browser and on your phone.</p>
              </div>
              <Link to={signup} className={`${styles.btn} ${styles.primary} ${styles.big}`}>Start free</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.foot}>
        <div className={`${styles.inner} ${styles.footInner}`}>
          <span>© {new Date().getFullYear()} Zerofy · Made in Jaipur, Rajasthan</span>
          <nav>
            <Link to="/pricing">Pricing</Link>
            <a href="/contact">Contact</a>
            <a href="/terms-conditions">Terms</a>
            <a href="/privacy-policy">Privacy</a>
            <a href="/refund">Refund &amp; cancellation</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
