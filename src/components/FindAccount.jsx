import { useState } from 'react'
import { api } from '../utils/api'

/* "Forgot your email?" — the person gives the mobile number or GSTIN they used in Zerofy
   and sees the account email partly hidden (pi•••••h@gmail.com). `styles` is the login page's CSS module. */
export default function FindAccount({ styles, onBack, onUse, googleSlot }) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [accounts, setAccounts] = useState(null) // null = not searched yet

  const box = { border: '1px solid #DDE1D9', borderRadius: 10, padding: '12px 14px', background: '#fff' }
  const infoBox = { background: '#E3F1EB', border: '1px solid #BCDCCB', borderRadius: 9, padding: '10px 13px', fontSize: 12.5, color: '#085239', lineHeight: 1.5 }

  const search = async (e) => {
    e.preventDefault()
    if (!value.trim()) return
    setBusy(true); setError(''); setAccounts(null)
    const res = await api('/api/auth/find-account', null, { method: 'POST', body: { value: value.trim() } })
    setBusy(false)
    if (!res.ok) { setError(res.data.error || 'Could not search right now. Please try again.'); return }
    setAccounts(res.data.accounts || [])
  }

  const anyGoogle = (accounts || []).some(a => a.google)

  return (
    <div>
      <h1 className={styles.heading}>Find your account</h1>
      <p className={styles.subheading}>
        Not sure which email you signed up with? Enter the mobile number or GSTIN you used in Zerofy — on your business profile or an invoice.
      </p>

      <form onSubmit={search} className={styles.form} noValidate>
        <label className={styles.label}>
          Mobile number or GSTIN
          <input value={value} onChange={e => { setValue(e.target.value); setError('') }} required autoFocus maxLength={20}
            placeholder="10-digit mobile or 15-character GSTIN" className={styles.input} />
        </label>
        {error && <div className={styles.errorBox}>{error}</div>}
        <button type="submit" className={styles.submitBtn} disabled={busy || !value.trim()}>{busy ? 'Searching…' : 'Find my account'}</button>
      </form>

      {accounts && accounts.length > 0 && (
        <div style={{ marginTop: 18, display: 'grid', gap: 10 }} role="status">
          <div style={infoBox}>
            {accounts.length === 1 ? 'We found an account. Its email is:' : 'We found these accounts:'}
          </div>
          {accounts.map((a, i) => (
            <div key={i} style={box}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 600, color: '#12263F', overflowWrap: 'anywhere' }}>{a.email}</div>
              <div style={{ fontSize: 12, color: '#5C7189', marginTop: 4 }}>
                {a.google ? 'You can log in to this account with "Continue with Google".' : 'Log in with this email and your password.'}
              </div>
            </div>
          ))}
          <p style={{ fontSize: 12.5, color: '#5C7189', lineHeight: 1.55, margin: 0 }}>
            Part of the email is hidden for safety. If you recognise it, go back and log in with it.
          </p>
          {anyGoogle && googleSlot && <div className={styles.googleWrap} style={{ marginBottom: 0 }}><div ref={googleSlot} /></div>}
          <button type="button" className={styles.submitBtn} onClick={onUse}>Back to log in</button>
        </div>
      )}

      {accounts && accounts.length === 0 && (
        <div className={styles.errorBox} style={{ marginTop: 18 }} role="status">
          No account was found with that. Try another mobile number or GSTIN you may have used. If nothing works, write to support@zerofy.co.in with your business name and we will help you.
        </div>
      )}

      <p className={styles.switchLine}>
        <button type="button" className={styles.switchBtn} onClick={onBack}>← Back to log in</button>
      </p>
    </div>
  )
}
