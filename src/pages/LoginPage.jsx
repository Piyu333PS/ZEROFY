import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const { login, register, googleLogin, loading, error, setError, user } = useAuth()
  const googleButtonRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => { setError(null) }, [tab])

  useEffect(() => {
    if (user) navigate('/app', { replace: true })
  }, [user, navigate])

  // Google Identity Services setup — same wiring as AuthModal
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) return

    const initGoogle = () => {
      if (!window.google) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => { await googleLogin(response.credential) }
      })
      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 360,
          text: 'continue_with',
          shape: 'rectangular',
        })
      }
    }

    if (window.google) { initGoogle(); return }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initGoogle
    document.head.appendChild(script)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    tab === 'login' ? await login(email, password) : await register(email, password)
  }

  return (
    <div className={styles.page}>

      {/* ── Left: Auth panel ── */}
      <div className={styles.formSide}>
        <div className={styles.formInner}>
          <div className={styles.logoRow}>
            <span className={styles.logoMark}>Z</span>
            <span className={styles.logoText}>ZEROFY</span>
          </div>
          <p className={styles.logoSub}>Billing &amp; GST Suite</p>

          <div className={styles.tabs}>
            <button
              type="button"
              className={tab === 'login' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => setTab('login')}
            >Log in</button>
            <button
              type="button"
              className={tab === 'signup' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => setTab('signup')}
            >Create account</button>
          </div>

          <h1 className={styles.heading}>
            {tab === 'login' ? 'Welcome back' : 'Set up your business'}
          </h1>
          <p className={styles.subheading}>
            {tab === 'login'
              ? 'Log in to view your invoices, clients and payments.'
              : 'Create an account to start billing your clients in minutes.'}
          </p>

          <div className={styles.googleWrap}>
            <div ref={googleButtonRef} />
          </div>

          <div className={styles.divider}>
            <span /><p>or continue with email</p><span />
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.label}>
              Email address
              <input
                type="email"
                placeholder="name@business.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                className={styles.input}
              />
            </label>

            <label className={styles.label}>
              Password
              <div className={styles.passWrap}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={styles.input}
                />
                <button type="button" className={styles.showBtn} onClick={() => setShowPass(s => !s)}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {error && <div className={styles.errorBox}>{error}</div>}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Please wait…' : tab === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <p className={styles.switchLine}>
            {tab === 'login' ? "Don't have a business account yet? " : 'Already billing with Zerofy? '}
            <button type="button" className={styles.switchBtn} onClick={() => setTab(tab === 'login' ? 'signup' : 'login')}>
              {tab === 'login' ? 'Create one' : 'Log in'}
            </button>
          </p>
        </div>
      </div>

      {/* ── Right: Ledger visual ── */}
      <div className={styles.visualSide}>
        <div className={styles.visualInner}>
          <p className={styles.visualEyebrow}>GST-compliant invoicing</p>
          <h2 className={styles.visualHeading}>Invoices that<br />get paid faster.</h2>
          <p className={styles.visualSub}>
            Create GST-ready invoices, track every payment, and manage clients — one ledger for your whole business.
          </p>

          <div className={styles.invoiceCard}>
            <div className={styles.stamp}>PAID</div>
            <div className={styles.invoiceHead}>
              <div>
                <div className={styles.invoiceLabel}>Invoice</div>
                <div className={styles.invoiceNo}>INV-2026-0042</div>
              </div>
              <div className={styles.invoiceLogo}>ZF</div>
            </div>
            <div className={styles.invoiceRule} />
            <div className={styles.lineItem}><span>Web design retainer</span><span>₹45,000.00</span></div>
            <div className={styles.lineItem}><span>Hosting &amp; support</span><span>₹8,500.00</span></div>
            <div className={styles.invoiceRule} />
            <div className={styles.lineItemMuted}><span>Subtotal</span><span>₹53,500.00</span></div>
            <div className={styles.lineItemMuted}><span>GST (18%)</span><span>₹9,630.00</span></div>
            <div className={styles.lineItemTotal}><span>Total due</span><span>₹63,130.00</span></div>
          </div>
        </div>
      </div>

    </div>
  )
}
