import { useEffect, useState } from 'react'
import styles from './SplashScreen.module.css'

export default function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // Show for 1.8s then fade out
    const t1 = setTimeout(() => setFading(true), 1800)
    const t2 = setTimeout(() => onDone(), 2200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div className={`${styles.splash} ${fading ? styles.fadeOut : ''}`}>
      <div className={styles.content}>
        <div className={styles.logoWrap}>
          <div className={styles.ring} />
          <div className={styles.ring2} />
          <div className={styles.logoCircle}>
            <svg className={styles.infSvg} viewBox="0 0 80 38">
              <defs>
                <linearGradient id="sp-g" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00d2c8"/>
                  <stop offset="50%" stopColor="#7c6ef5"/>
                  <stop offset="100%" stopColor="#00d2c8"/>
                </linearGradient>
              </defs>
              <path className={styles.infPath}
                d="M40,19 C40,19 34,7 24,7 C14,7 7,13 7,19 C7,25 14,31 24,31 C34,31 40,19 40,19 C40,19 46,7 56,7 C66,7 73,13 73,19 C73,25 66,31 56,31 C46,31 40,19 40,19 Z"
              />
            </svg>
          </div>
        </div>
        <div className={styles.name}>ZEROFY</div>
        <div className={styles.tagline}>Zero Limits. Infinite Tools.</div>
        <div className={styles.loader}>
          <div className={styles.loaderBar} />
        </div>
      </div>
    </div>
  )
}
