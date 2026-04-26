import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }) {
  const [tab, setTab] = useState(defaultTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const { login, register, loading, error, setError } = useAuth()

  useEffect(() => {
    setTab(defaultTab)
  }, [defaultTab])

  useEffect(() => {
    if (isOpen) {
      setEmail('')
      setPassword('')
      setError(null)
    }
  }, [isOpen])

  useEffect(() => {
    setError(null)
  }, [tab])

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!email || !password) return
    const result = tab === 'login'
      ? await login(email, password)
      : await register(email, password)
    if (result.success) onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.2s ease'
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1001,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px'
      }}>
        <div
          onKeyDown={handleKeyDown}
          style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border2)',
            borderRadius: 20,
            padding: '32px 28px',
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            animation: 'slideUp 0.25s ease',
            position: 'relative'
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'var(--surface)', border: '1px solid var(--border2)',
              borderRadius: '50%', width: 32, height: 32,
              cursor: 'pointer', color: 'var(--text2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, lineHeight: 1
            }}
          >×</button>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
              letterSpacing: '3px',
              background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', marginBottom: 4
            }}>ZEROFY</div>
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>
              {tab === 'login' ? 'Welcome back!' : 'Create your free account'}
            </p>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--surface)',
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
            border: '1px solid var(--border2)'
          }}>
            {['login', 'signup'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '8px 0',
                  borderRadius: 9,
                  border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600,
                  transition: 'all 0.2s',
                  background: tab === t ? 'var(--bg2)' : 'transparent',
                  color: tab === t ? 'var(--text)' : 'var(--text3)',
                  boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.2)' : 'none'
                }}
              >
                {t === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Google OAuth Button */}
          <button
            style={{
              width: '100%', padding: '11px 16px',
              borderRadius: 12, border: '1px solid var(--border2)',
              background: 'var(--surface)', color: 'var(--text)',
              cursor: 'pointer', fontSize: 14, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, marginBottom: 16,
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
            <span style={{ color: 'var(--text3)', fontSize: 12 }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
          </div>

          {/* Email Input */}
          <div style={{ marginBottom: 12 }}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              style={{
                width: '100%', padding: '11px 14px',
                borderRadius: 12, border: '1px solid var(--border2)',
                background: 'var(--surface)', color: 'var(--text)',
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#60A5FA'}
              onBlur={e => e.target.style.borderColor = 'var(--border2)'}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: 20, position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width: '100%', padding: '11px 40px 11px 14px',
                borderRadius: 12, border: '1px solid var(--border2)',
                background: 'var(--surface)', color: 'var(--text)',
                fontSize: 14, outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#60A5FA'}
              onBlur={e => e.target.style.borderColor = 'var(--border2)'}
            />
            <button
              onClick={() => setShowPass(s => !s)}
              style={{
                position: 'absolute', right: 12, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none',
                cursor: 'pointer', color: 'var(--text3)',
                fontSize: 16, padding: 0
              }}
            >
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, padding: '10px 14px',
              marginBottom: 16, color: '#f87171', fontSize: 13
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            style={{
              width: '100%', padding: '12px',
              borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
              color: '#fff', fontSize: 15, fontWeight: 600,
              cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              opacity: loading || !email || !password ? 0.6 : 1,
              transition: 'opacity 0.2s, transform 0.1s'
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'scale(1.01)' }}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)' }
          >
            {loading ? '...' : tab === 'login' ? 'Login' : 'Create Account'}
          </button>

          {/* Switch tab */}
          <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, marginTop: 16 }}>
            {tab === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setTab(tab === 'login' ? 'signup' : 'login')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#60A5FA', fontSize: 13, fontWeight: 600, padding: 0
              }}
            >
              {tab === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </>
  )
}
