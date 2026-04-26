import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { TOOLS } from '../tools/toolsData'
import styles from './Navbar.module.css'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'

function UserDropdown({ user, logout, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200 }} />
      <div style={{
        position: 'absolute', right: 0, top: 44,
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 14, padding: '8px', minWidth: 210,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 201
      }}>
        {/* User info */}
        <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid var(--border2)', marginBottom: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </div>
          <div style={{ fontSize: 12, color: user.isPro ? '#f59e0b' : 'var(--text3)', marginTop: 2 }}>
            {user.isPro ? '✦ Pro Member' : 'Free Plan'}
          </div>
        </div>

        {/* Menu items */}
        {[
          { icon: '📜', label: 'History' },
          { icon: '⚙️', label: 'Settings' },
          { icon: '💳', label: 'Billing & Plan' },
        ].map(item => (
          <button key={item.label} style={{
            width: '100%', padding: '9px 12px', borderRadius: 9,
            border: 'none', background: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            color: 'var(--text2)', fontSize: 14, textAlign: 'left'
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            {item.icon} {item.label}
          </button>
        ))}

        {/* Logout */}
        <div style={{ borderTop: '1px solid var(--border2)', marginTop: 6, paddingTop: 6 }}>
          <button
            onClick={() => { logout(); onClose() }}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 9,
              border: 'none', background: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              color: '#f87171', fontSize: 14, textAlign: 'left'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </>
  )
}

export default function Navbar({ theme, toggleTheme }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [authTab, setAuthTab] = useState('login')
  const [showDropdown, setShowDropdown] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  useEffect(() => {
    setMenuOpen(false)
    setQuery('')
    setResults([])
    setShowDropdown(false)
  }, [location.pathname])

  const handleSearch = (e) => {
    const q = e.target.value
    setQuery(q)
    if (q.length > 1) {
      setResults(
        TOOLS.filter(t =>
          (t.name.toLowerCase().includes(q.toLowerCase()) ||
           t.desc.toLowerCase().includes(q.toLowerCase())) &&
          t.status === 'ready'
        ).slice(0, 6)
      )
    } else {
      setResults([])
    }
  }

  const goTo = (route) => {
    setQuery(''); setResults([])
    navigate(route)
  }

  const openLogin = () => { setAuthTab('login'); setShowAuth(true); setMenuOpen(false) }
  const openSignup = () => { setAuthTab('signup'); setShowAuth(true); setMenuOpen(false) }

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.inner}>

          {/* Logo */}
          <Link to="/" className={styles.logo}>
            <span className={styles.logoText}>ZEROFY</span>
          </Link>

          {/* Search — Desktop only */}
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Search any tool..."
              value={query}
              onChange={handleSearch}
              onBlur={() => setTimeout(() => setResults([]), 200)}
            />
            {results.length > 0 && (
              <div className={styles.dropdown}>
                {results.map(t => (
                  <div key={t.id} className={styles.dropItem} onMouseDown={() => goTo(t.route)}>
                    <span className={styles.dropIcon}>{t.icon}</span>
                    <div>
                      <div className={styles.dropName}>{t.name}</div>
                      <div className={styles.dropDesc}>{t.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Nav */}
          <div className={styles.navLinks}>

            {/* ANONYMOUS USER */}
            {!user && (
              <button
                onClick={openLogin}
                className={styles.loginBtn}
              >
                Login / Sign Up
              </button>
            )}

            {/* LOGGED IN FREE USER */}
            {user && !user.isPro && (
              <>
                <Link to="/pricing" className={styles.proLink}>⚡ Go Pro</Link>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowDropdown(s => !s)}
                    className={styles.avatarBtn}
                  >
                    {user.email[0].toUpperCase()}
                  </button>
                  {showDropdown && (
                    <UserDropdown user={user} logout={logout} onClose={() => setShowDropdown(false)} />
                  )}
                </div>
              </>
            )}

            {/* PRO USER */}
            {user && user.isPro && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowDropdown(s => !s)}
                  className={styles.proAvatarBtn}
                >
                  <div className={styles.avatarCircle}>
                    {user.email[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>✦ Pro</span>
                </button>
                {showDropdown && (
                  <UserDropdown user={user} logout={logout} onClose={() => setShowDropdown(false)} />
                )}
              </div>
            )}

            <button className={styles.themeBtn} onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Mobile Actions */}
          <div className={styles.mobileActions}>
            <button className={styles.themeBtn} onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button className={styles.iconBtn} onClick={() => setMenuOpen(m => !m)} aria-label="Menu">
              {menuOpen
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              }
            </button>
          </div>

        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className={styles.mobileMenu}>
            {!user && (
              <>
                <button className={styles.mobileLoginBtn} onClick={openLogin}>
                  <span>👤</span> Login
                </button>
                <button className={styles.mobileSignupBtn} onClick={openSignup}>
                  <span>✨</span> Sign Up Free
                </button>
              </>
            )}
            {user && !user.isPro && (
              <Link to="/pricing" className={styles.mobileProLink} onClick={() => setMenuOpen(false)}>
                <span>⚡</span> Go Pro
              </Link>
            )}
            {user && (
              <button className={styles.mobileLogoutBtn} onClick={() => { logout(); setMenuOpen(false) }}>
                <span>🚪</span> Logout ({user.email})
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} defaultTab={authTab} />
    </>
  )
}
