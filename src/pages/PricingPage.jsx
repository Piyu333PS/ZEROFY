import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBilling } from '../utils/billingStore'
import { PLANS, savingsVsMonthly } from '../data/proPlans'
import styles from './PricingPage.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const price = (n) => `₹${Number(n).toLocaleString('en-IN')}`
const tick = <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>

const FREE_FEATURES = ['3 invoices', 'Quotations and credit notes', 'Clients, items and payments', 'GST summary and reports', 'PDF, print, WhatsApp and email']
const PRO_EXTRA = ['Unlimited invoices', 'Everything in Free', 'Priority support']

const faqs = [
  { q: 'Do I need a card to sign up?', a: 'No. The free plan needs only an email address. You pay only when you choose Pro.' },
  { q: 'Do you have a coupon code?', a: 'If you have a coupon or a sales code, enter it on the checkout page. Coupons work with one-time payment.' },
  { q: 'Can I cancel anytime?', a: 'Yes. If you chose Auto Pay, cancel it from Settings → Billing & invoices and keep Pro until the period you paid for ends. A one-time payment does not renew, so there is nothing to cancel.' },
  { q: 'What happens when my plan ends?', a: 'Your account moves to the free plan. All your invoices, clients and reports stay as they are. Renew any time to create more invoices.' },
  { q: 'How can I pay?', a: 'UPI, credit and debit cards, and net banking. Payments are processed by Razorpay; we never see your card details.' },
  { q: 'Can I get a refund?', a: 'Yes — a full refund within 7 days of your first Pro payment. See the Refund & Cancellation policy below.' },
]

/* Pricing — everything on one screen: Free, Monthly and Yearly side by side, then a short FAQ.
   Choosing a paid plan opens the checkout page. */
export default function PricingPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const { data } = useBilling(token)
  const isPro = Boolean(data?.status?.isPro)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [gstEnabled, setGstEnabled] = useState(false)

  // Whether GST is added on top of these prices is decided on the server
  useEffect(() => {
    fetch(`${API}/api/payment/plans`).then(r => r.json()).then(d => setGstEnabled(Boolean(d.gstEnabled))).catch(() => {})
  }, [])

  const choose = (planId) => {
    if (!token) {
      try { sessionStorage.setItem('zerofy-after-login', `/checkout?plan=${planId}`) } catch { /* ignore */ }
      setShowAuthPrompt(true)
      return
    }
    navigate(`/checkout?plan=${planId}`)
  }

  const monthly = PLANS.find(p => p.id === 'monthly')
  const yearly = PLANS.find(p => p.id === 'yearly')

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <div className={styles.topInner}>
          <Link to={token ? '/app' : '/'} className={styles.brand}><span className={styles.mark}>Z</span><span className={styles.word}>ZEROFY</span></Link>
          <button className={styles.topBtn} onClick={() => navigate(token ? '/app' : '/login')}>{token ? '‹ Back to app' : 'Log in'}</button>
        </div>
      </header>

      <main className={styles.wrap}>
        <div className={styles.hero}>
          <div className={styles.eyebrow}>Pricing</div>
          <h1 className={styles.title}>Start free. Go Pro when you need more.</h1>
          <p className={styles.sub}>
            {gstEnabled ? 'Prices are before GST. 18% GST is added at checkout, with a GST invoice.' : 'You pay exactly the price shown. No hidden charges.'}
          </p>
        </div>

        <div className={styles.plans}>
          <section className={styles.plan} aria-label="Free plan">
            <div className={styles.planName}>Free</div>
            <div className={styles.priceRow}><span className={styles.price}>₹0</span><span className={styles.per}>forever</span></div>
            <p className={styles.planNote}>Try everything with your first 3 invoices.</p>
            <button className={styles.cta} disabled={Boolean(token)} onClick={() => navigate('/login?signup=1')}>{token ? (isPro ? 'Included' : 'Your current plan') : 'Start free'}</button>
            <ul className={styles.list}>{FREE_FEATURES.map(f => <li key={f}>{tick}{f}</li>)}</ul>
          </section>

          <section className={`${styles.plan} ${styles.monthly}`} aria-label="Monthly plan">
            <div className={styles.planName}>Pro Monthly</div>
            <div className={styles.priceRow}><span className={styles.price}>{price(monthly.price)}</span><span className={styles.per}>/month</span></div>
            <p className={styles.planNote}>Pay month by month. Good for trying Pro.</p>
            <button className={styles.cta} onClick={() => choose('monthly')}>Choose Monthly</button>
            <ul className={styles.list}>{PRO_EXTRA.map(f => <li key={f}>{tick}{f}</li>)}</ul>
          </section>

          <section className={`${styles.plan} ${styles.featured} ${styles.yearly}`} aria-label="Yearly plan">
            <span className={styles.badge}>Best value</span>
            <div className={styles.planName}>Pro Yearly</div>
            <div className={styles.priceRow}>
              <span className={styles.price}>{price(yearly.price)}</span><span className={styles.per}>/year</span>
              {yearly.listPrice > yearly.price && <span className={styles.was}>{price(yearly.listPrice)}</span>}
            </div>
            <p className={styles.planNote}>
              Launch offer. One payment for the whole year.<br />
              <span className={styles.save}>Save {savingsVsMonthly('yearly')}% vs monthly</span>
            </p>
            <button className={`${styles.cta} ${styles.ctaPrimary}`} onClick={() => choose('yearly')}>Choose Yearly</button>
            <ul className={styles.list}>{PRO_EXTRA.map(f => <li key={f}>{tick}{f}</li>)}</ul>
          </section>
        </div>

        <div className={styles.trust}>
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>Secure payments by Razorpay</span>
          <span>7-day money-back guarantee</span>
          <span>UPI, cards and net banking</span>
        </div>

        <h2 className={styles.faqTitle}>Questions</h2>
        <div className={styles.faqs}>
          {faqs.map(f => (
            <details key={f.q} className={styles.faq}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </main>

      <footer className={styles.foot}>
        <div className={styles.footInner}>
          <span>© {new Date().getFullYear()} Zerofy · Jaipur, Rajasthan</span>
          <nav>
            <a href="/terms-conditions">Terms</a>
            <a href="/privacy-policy">Privacy</a>
            <a href="/refund">Refund &amp; cancellation</a>
            <a href="/contact">Contact</a>
          </nav>
        </div>
      </footer>

      {showAuthPrompt && (
        <div className={styles.overlay} onMouseDown={e => { if (e.target === e.currentTarget) setShowAuthPrompt(false) }}>
          <div className={styles.dialog} role="dialog" aria-modal="true" aria-label="Log in to continue">
            <h2>Log in to continue</h2>
            <p>Log in or create a free account first. You will come straight back to checkout.</p>
            <button className={`${styles.cta} ${styles.ctaPrimary}`} onClick={() => navigate('/login')}>Log in / Create account</button>
            <button className={styles.cta} onClick={() => setShowAuthPrompt(false)}>Maybe later</button>
          </div>
        </div>
      )}
    </div>
  )
}
