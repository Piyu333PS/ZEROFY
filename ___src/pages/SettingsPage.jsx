import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function SettingsPage({ theme, toggleTheme }) {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()

  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' })
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [emailMsg, setEmailMsg] = useState(null)
  const [pwdMsg, setPwdMsg] = useState(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)

  if (!user) {
    navigate('/')
    return null
  }

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
      setPwdMsg({ type: 'error', text: 'Naye passwords match nahi kar rahe' })
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
    <div style={{ minHeight: '100vh', background: 'var(--bg, #0f1117)', padding: '48px 24px 80px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 14, marginBottom: 16, padding: 0 }}>
            ← Back
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', margin: 0 }}>⚙️ Settings</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 6 }}>{user.email}</p>
        </div>

        {/* Theme Toggle */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16, marginTop: 0 }}>🎨 Appearance</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>Theme</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                Currently: {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </div>
            </div>
            <button
              onClick={toggleTheme}
              style={{
                padding: '9px 20px', borderRadius: 10, border: '1px solid var(--border2)',
                background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer',
                fontSize: 14, fontWeight: 600
              }}
            >
              {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </div>

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
                Email update hui! Naye email se dobara login karo.
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

        {/* Danger Zone */}
        <div style={{ ...cardStyle, borderColor: 'rgba(248,113,113,0.2)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F87171', marginBottom: 8, marginTop: 0 }}>🚪 Account</h2>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>Account se logout karo</p>
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
