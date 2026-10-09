import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useBilling } from '../../utils/billingStore'
import GuidedTour, { TOUR_EVENT, isTourDone } from '../tour/GuidedTour'
import styles from './DashboardLayout.module.css'

const I = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
const icons = {
  overview: I(<><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>),
  invoices: I(<><path d="M7 3h8l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"/><path d="M9 12h6M9 16h6M9 8h3"/></>),
  clients: I(<><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M17 4.2a3.2 3.2 0 010 6.2M21.5 20c0-3-2-5.2-5-5.8"/></>),
  items: I(<><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></>),
  payments: I(<><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6.5 15h4"/></>),
  reports: I(<><path d="M4 19V5M4 19h16"/><path d="M8 19v-6M12 19V9M16 19v-4"/></>),
  settings: I(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 01-4 0v-.09A1.7 1.7 0 009 19.36a1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004.64 15a1.7 1.7 0 00-1.55-1H3a2 2 0 010-4h.09A1.7 1.7 0 004.64 9a1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 009 4.64a1.7 1.7 0 001-1.55V3a2 2 0 014 0v.09a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0019.36 9a1.7 1.7 0 001.55 1H21a2 2 0 010 4h-.09a1.7 1.7 0 00-1.55 1z"/></>),
  plus: I(<path d="M12 5v14M5 12h14"/>),
  logout: I(<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></>),
  menu: I(<path d="M4 7h16M4 12h16M4 17h16"/>),
  close: I(<path d="M6 6l12 12M18 6L6 18"/>),
}

const NAV_ITEMS = [
  { to: '/app', label: 'Overview', icon: icons.overview, end: true, tour: 'nav-overview' },
  { to: '/app/invoices', label: 'Invoices', icon: icons.invoices, tour: 'nav-invoices' },
  { to: '/app/customers', label: 'Clients', icon: icons.clients, tour: 'nav-clients' },
  { to: '/app/items', label: 'Items', icon: icons.items, tour: 'nav-items' },
  { to: '/app/payments', label: 'Payments', icon: icons.payments, tour: 'nav-payments' },
  { to: '/app/reports', label: 'Reports', icon: icons.reports, tour: 'nav-reports' },
]

/* Billing app ka shell. Site ka purana dark navbar aur marketing footer yahan nahi aate —
   brand, navigation, plan aur account sab is ek sidebar mein hain (mobile par upar ki patti + drawer). */
export default function DashboardLayout() {
  const { user, token, initializing, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { data } = useBilling(token)
  const [open, setOpen] = useState(false)
  const [tour, setTour] = useState(false)

  // Guided tour: starts by itself for a brand-new account (no invoices yet, tour never seen),
  // and whenever Settings asks for it
  useEffect(() => {
    const start = () => setTour(true)
    window.addEventListener(TOUR_EVENT, start)
    return () => window.removeEventListener(TOUR_EVENT, start)
  }, [])
  useEffect(() => {
    if (data && user && data.invoices.length === 0 && !isTourDone(user.email)) setTour(true)
  }, [Boolean(data), user?.email]) // eslint-disable-line

  useEffect(() => {
    if (!initializing && !user) navigate('/')
  }, [user, initializing, navigate])

  // Page badalte hi mobile drawer band
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Jab tak localStorage se session check nahi ho jata, kuch mat dikhao
  if (initializing) return null
  if (!user) return null

  const status = data?.status
  const isPro = Boolean(status?.isPro)
  const left = status ? Math.max(0, (status.freeLimit || 3) - (status.invoiceCount || 0)) : null
  const bizName = data?.businesses?.[0]?.name
  const initial = (bizName || user.email || '?').trim()[0]?.toUpperCase() || '?'
  const linkClass = ({ isActive }) => (isActive ? `${styles.navLink} ${styles.active}` : styles.navLink)

  return (
    <div className={styles.shell}>
      {/* Mobile top bar */}
      <header className={styles.mobileBar}>
        <button className={styles.iconBtn} onClick={() => setOpen(true)} aria-label="Open menu">{icons.menu}</button>
        <NavLink to="/app" className={styles.brandRow}>
          <span className={styles.mark}>Z</span><span className={styles.word}>ZEROFY</span>
        </NavLink>
        <button className={styles.mobileNew} onClick={() => navigate('/tools/invoice-maker')} aria-label="New invoice">{icons.plus}</button>
      </header>

      {open && <div className={styles.scrim} onClick={() => setOpen(false)} />}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>
        <div className={styles.sideTop}>
          <NavLink to="/app" className={styles.brandRow}>
            <span className={styles.mark}>Z</span><span className={styles.word}>ZEROFY</span>
          </NavLink>
          <button className={`${styles.iconBtn} ${styles.closeBtn}`} onClick={() => setOpen(false)} aria-label="Close menu">{icons.close}</button>
        </div>
        <div className={styles.brandSub}>Billing &amp; GST</div>

        <button className={styles.newBtn} data-tour="new-invoice" onClick={() => navigate('/tools/invoice-maker')}>
          {icons.plus} New invoice
        </button>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass} data-tour={item.tour}>
              <span className={styles.navIcon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sideBottom}>
          {status && !isPro && (
            <div className={styles.planCard}>
              <div className={styles.planTitle}>Free plan</div>
              <div className={styles.planMeter} aria-hidden="true">
                <span style={{ width: `${Math.min(100, ((status.invoiceCount || 0) / (status.freeLimit || 3)) * 100)}%` }} />
              </div>
              <div className={styles.planText}>
                {left > 0 ? `${left} of ${status.freeLimit || 3} free invoices left` : 'Free invoices used up'}
              </div>
              <button className={styles.upgradeBtn} onClick={() => navigate('/pricing')}>Upgrade to Pro</button>
            </div>
          )}

          <NavLink to="/app/settings" className={linkClass} data-tour="nav-settings">
            <span className={styles.navIcon}>{icons.settings}</span>
            Settings
          </NavLink>

          <div className={styles.account}>
            <span className={styles.avatar}>{initial}</span>
            <div className={styles.accountText}>
              <div className={styles.accountName}>{bizName || user.email?.split('@')[0]}</div>
              <div className={styles.accountMail}>{isPro ? 'Pro plan' : user.email}</div>
            </div>
            <button className={styles.logoutBtn} onClick={logout} title="Log out" aria-label="Log out">{icons.logout}</button>
          </div>
        </div>
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>

      {tour && <GuidedTour email={user.email} onClose={() => setTour(false)} />}
    </div>
  )
}
