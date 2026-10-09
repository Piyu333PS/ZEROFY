import { useState } from 'react'
import { api } from '../utils/api'

/* Forgot password — 2 steps:
   1) email daalo → us par 6-digit code jata hai
   2) code + naya password → password badal jata hai
   `styles` LoginPage ka CSS module hai, taaki dono ek jaise dikhein. */
export default function ForgotPassword({ styles, initialEmail = '', onDone, onBack }) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const infoBox = {
    background: '#E3F1EB', border: '1px solid #BCDCCB', borderRadius: 9,
    padding: '10px 13px', fontSize: 12.5, color: '#085239', lineHeight: 1.5,
  }

  const sendCode = async (e) => {
    e?.preventDefault()
    if (!email.trim()) return
    setBusy(true); setError(''); setInfo('')
    const res = await api('/api/auth/forgot-password', null, { method: 'POST', body: { email: email.trim() } })
    setBusy(false)
    if (!res.ok) { setError(res.data.message || res.data.error || 'Code nahi bhej paye. Dobara try karein.'); return }
    setInfo(res.data.message || 'Code bhej diya gaya hai.')
    setStep(2)
  }

  const reset = async (e) => {
    e.preventDefault()
    if (code.length !== 6) { setError('6-digit code daalein jo email par aaya hai.'); return }
    if (password.length < 6) { setError('Naya password kam se kam 6 characters ka hona chahiye.'); return }
    setBusy(true); setError('')
    const res = await api('/api/auth/reset-password', null, { method: 'POST', body: { email: email.trim(), code, newPassword: password } })
    setBusy(false)
    if (!res.ok) { setError(res.data.error || 'Password reset nahi ho paya. Dobara try karein.'); return }
    onDone(email.trim(), res.data.message || 'Password badal gaya! Ab naye password se login karein.')
  }

  return (
    <div>
      <h1 className={styles.heading}>Reset your password</h1>
      <p className={styles.subheading}>
        {step === 1
          ? 'Apna registered email daalein — hum us par 6-digit code bhejenge.'
          : 'Email par aaya code aur apna naya password daalein.'}
      </p>

      {step === 1 ? (
        <form onSubmit={sendCode} className={styles.form} noValidate>
          <label className={styles.label}>
            Email address
            <input type="email" placeholder="name@business.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus className={styles.input} />
          </label>
          {error && <div className={styles.errorBox}>{error}</div>}
          <button type="submit" className={styles.submitBtn} disabled={busy || !email.trim()}>
            {busy ? 'Sending…' : 'Send reset code'}
          </button>
        </form>
      ) : (
        <form onSubmit={reset} className={styles.form} noValidate>
          {info && <div style={infoBox}>{info}</div>}
          <label className={styles.label}>
            6-digit code
            <input inputMode="numeric" autoComplete="one-time-code" placeholder="123456" value={code} maxLength={6}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required autoFocus className={styles.input}
              style={{ letterSpacing: '0.3em', fontWeight: 700 }} />
          </label>
          <label className={styles.label}>
            New password
            <div className={styles.passWrap}>
              <input type={showPass ? 'text' : 'password'} autoComplete="new-password" placeholder="Minimum 6 characters" value={password}
                onChange={e => setPassword(e.target.value)} required minLength={6} className={styles.input} />
              <button type="button" className={styles.showBtn} onClick={() => setShowPass(s => !s)}>{showPass ? 'Hide' : 'Show'}</button>
            </div>
          </label>
          {error && <div className={styles.errorBox}>{error}</div>}
          <button type="submit" className={styles.submitBtn} disabled={busy}>
            {busy ? 'Please wait…' : 'Change password'}
          </button>
          <p className={styles.switchLine} style={{ marginTop: 0 }}>
            Code nahi aaya? Spam folder dekhein, ya 1 minute baad{' '}
            <button type="button" className={styles.switchBtn} disabled={busy} onClick={() => { setCode(''); sendCode() }}>dobara bhejein</button>
          </p>
        </form>
      )}

      <p className={styles.switchLine}>
        <button type="button" className={styles.switchBtn} onClick={onBack}>← Back to log in</button>
      </p>
    </div>
  )
}
