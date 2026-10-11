import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { startTour } from '../components/tour/GuidedTour'
import styles from './SettingsPage.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const I = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
const icons = {
  mail: I(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 7l8.5 6 8.5-6" /></>),
  lock: I(<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></>),
  tour: I(<><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" /></>),
  help: I(<><path d="M4 5h16v11H9l-5 4V5z" /></>),
  out: I(<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>),
}

/* Settings — a short list of rows. The email and password forms stay closed until asked for,
   so the whole page fits on one screen. Shown inside the billing app (light theme, sidebar). */
export default function SettingsPage() {
  const { user, token, logout, initializing } = useAuth()
  const navigate = useNavigate()

  const [params] = useSearchParams()
  // ?password=1 — arriving from "Forgot password → Continue with Google": open the password form straight away
  const [open, setOpen] = useState(params.get('password') ? 'password' : '') // '' | 'email' | 'password'
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' })
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [emailMsg, setEmailMsg] = useState(null)
  const [pwdMsg, setPwdMsg] = useState(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)

  // People who log in with Google have no password here, so the email / password forms do not apply to them
  const [account, setAccount] = useState(null)
  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetch(`${API}/api/user/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled && d) setAccount(d) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [token])

  // Wait for the session check before sending anyone away (a refresh used to log people out)
  useEffect(() => {
    if (!initializing && !user) navigate('/')
  }, [initializing, user, navigate])
  if (initializing || !user) return null

  const passwordless = account?.hasPassword === false
  // Logged in with Google in the last hour → may choose a new password without typing the old one
  const canSet = Boolean(account?.canSetPassword)
  const toggle = (key) => { setOpen(o => (o === key ? '' : key)); setEmailMsg(null); setPwdMsg(null) }

  const handleEmailChange = async (e) => {
    e.preventDefault()
    setEmailMsg(null)
    setEmailLoading(true)
    try {
      const res = await fetch(`${API}/api/user/change-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(emailForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEmailMsg({ type: 'success', text: `${data.message} Please log in again with your new email.` })
      setEmailForm({ newEmail: '', password: '' })
      setTimeout(() => { logout() }, 2000)
    } catch (err) {
      setEmailMsg({ type: 'error', text: err.message || 'Could not update the email. Please try again.' })
    } finally {
      setEmailLoading(false)
    }
  }

  const handlePwdChange = async (e) => {
    e.preventDefault()
    setPwdMsg(null)
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match' })
      return
    }
    setPwdLoading(true)
    try {
      const res = await fetch(`${API}/api/user/${canSet ? 'set-password' : 'change-password'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(canSet ? { newPassword: pwdForm.newPassword } : { currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPwdMsg({ type: 'success', text: data.message })
      setAccount(a => (a ? { ...a, hasPassword: true } : a))
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.message || 'Could not change the password. Please try again.' })
    } finally {
      setPwdLoading(false)
    }
  }

  const msg = (m) => m && <div className={`${styles.msg} ${m.type === 'success' ? styles.ok : styles.bad}`} role="status">{m.text}</div>
  const used = Math.min(3, account?.invoiceCount || 0)
  const expiry = account?.proExpiry ? new Date(account.proExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.subtitle}>Your account, plan and help.</p>

      <div className={styles.grid}>
        {/* ── Account ── */}
        <div className={styles.col}>
          <div className={styles.card}>
            <div className={styles.cardHead}>Account</div>

            <div className={styles.row}>
              <span className={styles.icon}>{icons.mail}</span>
              <div className={styles.text}>
                <div className={styles.label}>Email</div>
                <div className={styles.value}>{user.email}</div>
              </div>
              {!passwordless && <button className={styles.btn} aria-expanded={open === 'email'} onClick={() => toggle('email')}>{open === 'email' ? 'Close' : 'Change'}</button>}
            </div>
            {open === 'email' && !passwordless && (
              <form className={styles.panel} onSubmit={handleEmailChange}>
                <div className={styles.fields}>
                  <div className={styles.field}>
                    <label htmlFor="set-new-email">New email</label>
                    <input id="set-new-email" type="email" required autoFocus className={styles.inp} placeholder="new@email.com"
                      value={emailForm.newEmail} onChange={e => setEmailForm(f => ({ ...f, newEmail: e.target.value }))} />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="set-email-pwd">Current password</label>
                    <input id="set-email-pwd" type="password" required className={styles.inp} autoComplete="current-password"
                      value={emailForm.password} onChange={e => setEmailForm(f => ({ ...f, password: e.target.value }))} />
                  </div>
                </div>
                <div className={styles.actions}>
                  <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={emailLoading}>{emailLoading ? 'Updating…' : 'Update email'}</button>
                  <button type="button" className={styles.btn} onClick={() => toggle('email')}>Cancel</button>
                </div>
                {msg(emailMsg)}
              </form>
            )}

            <div className={styles.row}>
              <span className={styles.icon}>{icons.lock}</span>
              <div className={styles.text}>
                <div className={styles.label}>Password</div>
                <div className={styles.value}>{passwordless ? 'Not set — you log in with your Google account' : '••••••••'}</div>
              </div>
              {(canSet || !passwordless) && (
                <button className={styles.btn} aria-expanded={open === 'password'} onClick={() => toggle('password')}>
                  {open === 'password' ? 'Close' : passwordless ? 'Set password' : 'Change'}
                </button>
              )}
            </div>
            {passwordless && !canSet && account && (
              <p className={styles.note}>To add a password, log out and log in with Google again, then come back here within an hour.</p>
            )}
            {open === 'password' && (canSet || !passwordless) && (
              <form className={styles.panel} onSubmit={handlePwdChange}>
                {canSet && (
                  <div className={`${styles.msg} ${styles.ok}`} style={{ marginTop: 0, marginBottom: 12 }}>
                    You logged in with Google, so your old password is not needed. Choose a new one below.
                  </div>
                )}
                <div className={styles.fields}>
                  {!canSet && (
                    <div className={`${styles.field} ${styles.full}`}>
                      <label htmlFor="set-cur-pwd">Current password</label>
                      <input id="set-cur-pwd" type="password" required autoFocus className={styles.inp} autoComplete="current-password"
                        value={pwdForm.currentPassword} onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))} />
                    </div>
                  )}
                  <div className={styles.field}>
                    <label htmlFor="set-new-pwd">New password</label>
                    <input id="set-new-pwd" type="password" required minLength={6} autoFocus={canSet} className={styles.inp} autoComplete="new-password"
                      value={pwdForm.newPassword} onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))} />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="set-new-pwd2">Confirm new password</label>
                    <input id="set-new-pwd2" type="password" required minLength={6} className={styles.inp} autoComplete="new-password"
                      value={pwdForm.confirmPassword} onChange={e => setPwdForm(f => ({ ...f, confirmPassword: e.target.value }))} />
                  </div>
                </div>
                <div className={styles.actions}>
                  <button type="submit" className={`${styles.btn} ${styles.primary}`} disabled={pwdLoading}>{pwdLoading ? 'Saving…' : canSet ? 'Save new password' : 'Change password'}</button>
                  <button type="button" className={styles.btn} onClick={() => toggle('password')}>Cancel</button>
                </div>
                {!canSet && (
                  <p style={{ fontSize: 12.5, color: 'var(--slate)', margin: '12px 0 0', lineHeight: 1.55 }}>
                    Forgot your current password? Log out and use "Continue with Google" with this email, then set a new one here.
                  </p>
                )}
                {msg(pwdMsg)}
              </form>
            )}

            <div className={styles.row}>
              <span className={styles.icon}>{icons.out}</span>
              <div className={styles.text}>
                <div className={styles.label}>Log out</div>
                <div className={styles.value}>Sign out of Zerofy on this device</div>
              </div>
              <button className={`${styles.btn} ${styles.danger}`} onClick={() => logout()}>Log out</button>
            </div>
          </div>
        </div>

        {/* ── Plan + help ── */}
        <div className={styles.col}>
          <div className={styles.card}>
            <div className={styles.cardHead}>Plan</div>
            <div className={styles.plan}>
              {!account ? (
                <div className={styles.planText}>Loading your plan…</div>
              ) : account.isPro ? (
                <>
                  <div className={styles.planTop}><span className={styles.planName}>Zerofy Pro</span><span className={`${styles.pill} ${styles.pillPro}`}>Active</span></div>
                  <p className={styles.planText}>Unlimited invoices{expiry ? ` · valid till ${expiry}` : ''}</p>
                  <div className={styles.planBtns}>
                    <button className={styles.btn} onClick={() => navigate('/billing')}>Billing &amp; invoices</button>
                    <button className={styles.btn} onClick={() => navigate('/pricing')}>Renew or extend</button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.planTop}><span className={styles.planName}>Free plan</span><span className={styles.pill}>{used} of 3 used</span></div>
                  <p className={styles.planText}>
                    {used >= 3 ? 'You have used all 3 free invoices.' : `${3 - used} of 3 free invoices left.`} Pro gives you unlimited invoices from ₹149 a month.
                  </p>
                  <div className={styles.meter} aria-hidden="true"><span style={{ width: `${(used / 3) * 100}%` }} /></div>
                  <div className={styles.planBtns}>
                    <button className={`${styles.btn} ${styles.primary}`} onClick={() => navigate('/pricing')}>Upgrade to Pro</button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>Help</div>
            <div className={styles.row}>
              <span className={styles.icon}>{icons.tour}</span>
              <div className={styles.text}>
                <div className={styles.label}>Guided tour</div>
                <div className={styles.value}>A one-minute walk through the app</div>
              </div>
              <button className={styles.btn} onClick={() => startTour()}>Take the tour</button>
            </div>
            <div className={styles.row}>
              <span className={styles.icon}>{icons.help}</span>
              <div className={styles.text}>
                <div className={styles.label}>Support</div>
                <div className={styles.value}>support@zerofy.co.in · reply within 48 hours</div>
              </div>
              <a className={styles.btn} href="/contact" style={{ textDecoration: 'none' }}>Contact us</a>
            </div>
            <div className={styles.links}>
              <a href="/terms-conditions">Terms</a>
              <a href="/privacy-policy">Privacy</a>
              <a href="/refund">Refund &amp; cancellation</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
