import styles from './ui.module.css'

/* Grey shimmering rows shown while a list is loading — the page keeps its shape
   instead of showing a bare "Loading..." line. */
export function SkeletonRows({ rows = 4 }) {
  return (
    <div className={styles.skelWrap} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.skelRow}>
          <span className={styles.skel} style={{ width: '14%' }} />
          <span className={styles.skel} style={{ width: `${28 - (i % 3) * 5}%` }} />
          <span className={styles.skel} style={{ width: '12%' }} />
          <span className={styles.skel} style={{ width: '16%' }} />
          <span className={styles.skel} style={{ width: '9%' }} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonBlock({ height = 120 }) {
  return <div className={`${styles.skel} ${styles.skelBlock}`} style={{ height }} aria-busy="true" aria-label="Loading" />
}
