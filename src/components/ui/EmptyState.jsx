import styles from './ui.module.css'

/* Friendly empty screen: a small drawing, one line of explanation and the next step. */
const art = {
  invoice: (
    <svg viewBox="0 0 120 96" aria-hidden="true">
      <rect x="30" y="8" width="60" height="80" rx="6" fill="#fff" stroke="#12263F" strokeWidth="2.5" />
      <rect x="30" y="8" width="60" height="16" rx="6" fill="#12263F" />
      <path d="M40 38h40M40 48h40M40 58h24" stroke="#C9CFC4" strokeWidth="3" strokeLinecap="round" />
      <rect x="62" y="66" width="20" height="12" rx="3" fill="#EFA02F" />
      <circle cx="96" cy="22" r="12" fill="#EFA02F" />
      <path d="M96 16v12M90 22h12" stroke="#12263F" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  ),
  clients: (
    <svg viewBox="0 0 120 96" aria-hidden="true">
      <circle cx="46" cy="36" r="14" fill="#fff" stroke="#12263F" strokeWidth="2.5" />
      <path d="M20 82c0-15 11.5-24 26-24s26 9 26 24" fill="#fff" stroke="#12263F" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="82" cy="40" r="10" fill="#EFA02F" />
      <path d="M72 82c0-10 4-17 12-18 9 1 15 8 15 18" fill="none" stroke="#12263F" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  items: (
    <svg viewBox="0 0 120 96" aria-hidden="true">
      <path d="M60 10l34 18v38L60 84 26 66V28L60 10z" fill="#fff" stroke="#12263F" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M26 28l34 18 34-18M60 46v38" stroke="#12263F" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M43 19l34 18v12" stroke="#EFA02F" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  payments: (
    <svg viewBox="0 0 120 96" aria-hidden="true">
      <rect x="18" y="24" width="84" height="52" rx="8" fill="#fff" stroke="#12263F" strokeWidth="2.5" />
      <rect x="18" y="36" width="84" height="10" fill="#12263F" />
      <rect x="28" y="56" width="26" height="8" rx="3" fill="#C9CFC4" />
      <circle cx="88" cy="70" r="14" fill="#0B6E4F" />
      <path d="M81 70l5 5 9-10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 120 96" aria-hidden="true">
      <path d="M22 12v70h78" stroke="#12263F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <rect x="34" y="52" width="12" height="24" rx="3" fill="#C9CFC4" />
      <rect x="54" y="38" width="12" height="38" rx="3" fill="#EFA02F" />
      <rect x="74" y="24" width="12" height="52" rx="3" fill="#0B6E4F" />
    </svg>
  ),
}

export default function EmptyState({ kind = 'invoice', title, text, action, secondary }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyArt}>{art[kind] || art.invoice}</div>
      <h3 className={styles.emptyTitle}>{title}</h3>
      {text && <p className={styles.emptyText}>{text}</p>}
      {(action || secondary) && (
        <div className={styles.emptyActions}>
          {action && <button className={styles.emptyPrimary} onClick={action.onClick}>{action.label}</button>}
          {secondary && <button className={styles.emptySecondary} onClick={secondary.onClick}>{secondary.label}</button>}
        </div>
      )}
    </div>
  )
}
