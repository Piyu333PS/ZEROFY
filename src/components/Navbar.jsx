import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { TOOLS } from '../tools/toolsData'
import styles from './Navbar.module.css'

export default function Navbar({ theme, toggleTheme }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
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
    setQuery(''); setResults([])
    navigate(route)
  }

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.inner}>

          {/* Logo — ZEROFY text only */}
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
            <Link to="/pricing" className={styles.proLink}>⚡ Go Pro</Link>
            <button className={styles.themeBtn} onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Mobile — theme toggle + hamburger (NO search icon) */}
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

        {/* Mobile Menu — only Go Pro */}
        {menuOpen && (
          <div className={styles.mobileMenu}>
            <Link to="/pricing" className={styles.mobileProLink} onClick={() => setMenuOpen(false)}>
              <span>⚡</span> Go Pro
            </Link>
          </div>
        )}
      </nav>
    </>
  )
}
