import { useNavigate, useLocation } from 'react-router-dom'
import styles from './ToolLayout.module.css'

export default function ToolLayout({ icon, name, desc, children }) {
  const navigate = useNavigate()
  const location = useLocation()

  const goBack = () => {
    // History mein kuch hai to back jao, warna home
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <div className={styles.page}>
      <div className="page-wrapper">

        {/* Top bar — Back button + Breadcrumb */}
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={goBack} aria-label="Wapas Jao">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Back</span>
          </button>
          <div className={styles.breadcrumb}>
            <span className={styles.breadHome} onClick={() => navigate('/')}>Home</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            <span className={styles.breadCurrent}>{name}</span>
          </div>
        </div>

        {/* Tool Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrap}>
              <span className={styles.icon}>{icon}</span>
            </div>
            <div>
              <h1 className={styles.title}>{name}</h1>
              <p className={styles.desc}>{desc}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {children}
        </div>

      </div>
    </div>
  )
}
