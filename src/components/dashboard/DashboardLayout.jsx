import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './DashboardLayout.module.css'

const NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', icon: '📊', end: true },
  { to: '/tools/invoice-maker', label: 'Invoices', icon: '🧾' },
  { to: '/app/customers', label: 'Customers', icon: '👥' },
  { to: '/app/payments', label: 'Payments', icon: '💰' },
]

export default function DashboardLayout() {
  const { user, initializing } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!initializing && !user) navigate('/')
  }, [user, initializing, navigate])

  // Jab tak localStorage se session check nahi ho jata, kuch mat dikhao —
  // isse pehle hi "not logged in" maan ke home pe redirect nahi hoga
  if (initializing) return null
  if (!user) return null

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Zerofy</div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/settings" className={styles.navLink} style={{ marginTop: 'auto' }}>
          <span className={styles.navIcon}>⚙️</span>
          Settings
        </NavLink>
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
