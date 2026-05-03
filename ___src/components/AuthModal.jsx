import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }) {
  const [tab, setTab] = useState(defaultTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const { login, register, googleLogin, loading, error, setError } = useAuth()
  const googleButtonRef = useRef(null)

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

  // Google One Tap / GSI setup
  useEffect(() => {
    if (!isOpen) return

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) return

    const initGoogle = () => {
      if (!window.google) return
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          const result = await googleLogin(response.credential)
          if (result.success) onClose()
        }
      })

      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'filled_black',
          size: 'large',
          width: 344,
          text: 'continue_with',
          shape: 'rectangular',
        })
      }
    }

    // Script already loaded
    if (window.google) {
      initGoogle()
      return
    }

    // Load Google script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initGoogle
    document.head.appendChild(script)
  }, [isOpen])

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

          {/* Google Button — rendered by Google GSI */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div ref={googleButtonRef} />
          </div>

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
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
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
