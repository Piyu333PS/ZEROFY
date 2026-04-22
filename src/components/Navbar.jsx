import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { TOOLS } from '../tools/toolsData'
import styles from './Navbar.module.css'
import logoImg from '../assets/logo.png'

export default function Navbar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const inputRef = useRef(null)

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
    setQuery('')
    setResults([])
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
    setQuery(''); setResults([]); setSearchOpen(false)
    navigate(route)
  }

  const isHome = location.pathname === '/' || location.pathname === '/all-tools'

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.inner}>

          {/* Logo */}
          <Link to="/" className={styles.logo}>
            <img src={logoImg} alt="Zerofy" style={{ height: 36, width: 'auto', objectFit: 'contain', display: 'block' }} />
          </Link>

          {/* Search — Desktop */}
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Koi bhi tool dhundho..."
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

          {/* Nav Links — Desktop */}
          <div className={styles.navLinks}>
            <Link to="/" className={`${styles.navLink} ${isHome ? styles.active : ''}`}>All Tools</Link>
            <Link to="/pricing" style={{ color: '#A78BFA', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
              ⚡ Go Pro
            </Link>
          </div>

          {/* Mobile — Search icon + Hamburger */}
          <div className={styles.mobileActions}>
            <button className={styles.iconBtn} onClick={() => { setSearchOpen(s => !s); setMenuOpen(false) }} aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
            <button className={styles.iconBtn} onClick={() => { setMenuOpen(m => !m); setSearchOpen(false) }} aria-label="Menu">
              {menuOpen
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              }
            </button>
          </div>

        </div>

        {/* Mobile Search Bar */}
        {searchOpen && (
          <div className={styles.mobileSearch}>
            <div className={styles.mobileSearchInner}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.5, flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={inputRef}
                autoFocus
                className={styles.mobileSearchInput}
                placeholder="Tool search karo..."
                value={query}
                onChange={handleSearch}
              />
              {query && (
                <button onClick={() => { setQuery(''); setResults([]) }} className={styles.clearBtn}>✕</button>
              )}
            </div>
            {results.length > 0 && (
              <div className={styles.mobileResults}>
                {results.map(t => (
                  <div key={t.id} className={styles.dropItem} onClick={() => goTo(t.route)}>
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
        )}

        {/* Mobile Menu */}
        {menuOpen && (
          <div className={styles.mobileMenu}>
            <Link to="/" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              <span>🏠</span> Home
            </Link>
            <Link to="/all-tools" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
              <span>🔧</span> All Tools
            </Link>
            <Link to="/pricing" className={styles.mobileLink} onClick={() => setMenuOpen(false)}
              style={{ color: '#A78BFA', fontWeight: 700 }}>
              <span>⚡</span> Go Pro
            </Link>
          </div>
        )}
      </nav>
    </>
  )
}
