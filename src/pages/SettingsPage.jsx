import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// `embedded` = billing dashboard (/app/settings) ke andar — wahan light theme aur sidebar ke saath dikhta hai
export default function SettingsPage({ embedded = false }) {
  const { user, token, logout, initializing } = useAuth()
  const navigate = useNavigate()

  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' })
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [emailMsg, setEmailMsg] = useState(null)
  const [pwdMsg, setPwdMsg] = useState(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)

  // Google se login karne walon ka password nahi hota — unhe email/password forms dikhana galat hai
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

  // Session check poora hone se pehle redirect mat karo (warna page refresh par logged-in user bhi bahar ho jata tha)
  useEffect(() => {
    if (!initializing && !user) navigate('/')
  }, [initializing, user, navigate])
  if (initializing || !user) return null

  const passwordless = account?.hasPassword === false

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
      setEmailMsg({ type: 'success', text: data.message })
      setEmailForm({ newEmail: '', password: '' })
      // Logout karke dobara login karo naye email se
      setTimeout(() => { logout() }, 2000)
    } catch (err) {
      setEmailMsg({ type: 'error', text: err.message })
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
      const res = await fetch(`${API}/api/user/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPwdMsg({ type: 'success', text: data.message })
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.message })
    } finally {
      setPwdLoading(false)
    }
  }

  const cardStyle = {
    background: 'var(--bg2, #1a1a2e)',
    border: '1px solid var(--border2, rgba(255,255,255,0.08))',
    borderRadius: 16, padding: '28px 24px', marginBottom: 20
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1px solid var(--border2, rgba(255,255,255,0.1))',
    background: 'var(--surface, rgba(255,255,255,0.04))',
    color: 'var(--text, #f1f5f9)', fontSize: 14, outline: 'none',
    boxSizing: 'border-box'
  }

  const labelStyle = { fontSize: 13, color: 'var(--text2, #94a3b8)', marginBottom: 6, display: 'block', fontWeight: 500 }

  const msgStyle = (type) => ({
    padding: '10px 14px', borderRadius: 10, fontSize: 13, marginTop: 12,
    background: type === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
    border: `1px solid ${type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
    color: type === 'success' ? '#34D399' : '#F87171'
  })

  return (
    <div style={embedded ? {
      // Dashboard ke andar light palette
      '--bg2': '#FFFFFF', '--border2': '#E1D9C4', '--surface': '#F7F3EA',
      '--text': '#1B2340', '--text2': '#69708A', '--text3': '#8890A6',
      padding: '26px 34px 60px',
    } : { minHeight: '100vh', background: 'var(--bg, #0f1117)', padding: '48px 24px 80px' }}>
      <div style={{ maxWidth: 560, margin: embedded ? 0 : '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: embedded ? 22 : 32 }}>
          {!embedded && (
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 14, marginBottom: 16, padding: 0 }}>
              ← Back
            </button>
          )}
          <h1 style={{ fontSize: embedded ? 26 : 28, fontWeight: embedded ? 600 : 800, color: 'var(--text)', fontFamily: embedded ? "'Space Grotesk', sans-serif" : 'var(--font-display)', margin: 0 }}>{embedded ? 'Settings' : '⚙️ Settings'}</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 6 }}>{user.email}</p>
        </div>

        {/* Plan */}
        {account && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8, marginTop: 0 }}>Plan</h2>
            <p style={{ fontSize: 14, color: 'var(--text2)', margin: '0 0 14px' }}>
              {account.isPro
                ? <>Zerofy Pro{account.proExpiry ? ` — ${new Date(account.proExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} tak valid` : ''}</>
                : <>Free plan — {Math.max(0, 3 - (account.invoiceCount || 0))} free invoice baaki</>}
            </p>
            <button onClick={() => navigate(account.isPro ? '/billing' : '/pricing')} style={{
              padding: '9px 20px', borderRadius: 10, border: '1px solid var(--border2)', background: 'var(--surface)',
              color: 'var(--text)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
            }}>
              {account.isPro ? 'Manage billing' : 'Upgrade to Pro'}
            </button>
          </div>
        )}

        {passwordless && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8, marginTop: 0 }}>Login</h2>
            <p style={{ fontSize: 14, color: 'var(--text2)', margin: 0, lineHeight: 1.6 }}>
              Aap Google account se login karte hain, isliye yahan email ya password badalne ki zaroorat nahi — wo aapke Google account se manage hota hai.
            </p>
          </div>
        )}

        {!passwordless && (<>
        {/* Change Email */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 20, marginTop: 0 }}>📧 Change Email</h2>
          <form onSubmit={handleEmailChange}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>New Email</label>
              <input
                type="email" required style={inputStyle}
                placeholder="naya@email.com"
                value={emailForm.newEmail}
                onChange={e => setEmailForm(f => ({ ...f, newEmail: e.target.value }))}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Current Password (confirm karne ke liye)</label>
              <input
                type="password" required style={inputStyle}
                placeholder="••••••••"
                value={emailForm.password}
                onChange={e => setEmailForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            <button
              type="submit" disabled={emailLoading}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #60A5FA, #A78BFA)',
                color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                opacity: emailLoading ? 0.7 : 1
              }}
            >
              {emailLoading ? '⏳ Updating...' : 'Update Email'}
            </button>
            {emailMsg && <div style={msgStyle(emailMsg.type)}>{emailMsg.type === 'success' ? '✅' : '⚠️'} {emailMsg.text}</div>}
            {emailMsg?.type === 'success' && (
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>
                Email updated! Please log in again with your new email.
              </div>
            )}
          </form>
        </div>

        {/* Change Password */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 20, marginTop: 0 }}>🔒 Change Password</h2>
          <form onSubmit={handlePwdChange}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Current Password</label>
              <input
                type="password" required style={inputStyle}
                placeholder="••••••••"
                value={pwdForm.currentPassword}
                onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>New Password</label>
              <input
                type="password" required style={inputStyle}
                placeholder="••••••••"
                value={pwdForm.newPassword}
                onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                type="password" required style={inputStyle}
                placeholder="••••••••"
                value={pwdForm.confirmPassword}
                onChange={e => setPwdForm(f => ({ ...f, confirmPassword: e.target.value }))}
              />
            </div>
            <button
              type="submit" disabled={pwdLoading}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #60A5FA, #A78BFA)',
                color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                opacity: pwdLoading ? 0.7 : 1
              }}
            >
              {pwdLoading ? '⏳ Updating...' : 'Change Password'}
            </button>
            {pwdMsg && <div style={msgStyle(pwdMsg.type)}>{pwdMsg.type === 'success' ? '✅' : '⚠️'} {pwdMsg.text}</div>}
          </form>
        </div>

        </>)}

        {/* Danger Zone */}
        <div style={{ ...cardStyle, borderColor: 'rgba(248,113,113,0.2)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F87171', marginBottom: 8, marginTop: 0 }}>🚪 Account</h2>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>Sign out of your account</p>
          <button
            onClick={() => { logout() }}
            style={{
              padding: '10px 24px', borderRadius: 10,
              border: '1px solid rgba(248,113,113,0.3)',
              background: 'rgba(248,113,113,0.08)',
              color: '#F87171', fontWeight: 600, fontSize: 14, cursor: 'pointer'
            }}
          >
            🚪 Logout
          </button>
        </div>

      </div>
    </div>
  )
}
