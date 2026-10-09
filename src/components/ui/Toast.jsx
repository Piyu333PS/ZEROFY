import { useEffect, useState } from 'react'
import styles from './ui.module.css'

/* Small confirmation messages that appear at the bottom and go away by themselves.
   Use from anywhere:  toast('Client added')  ·  toast.error('Could not save')  ·  toast.paid('INV-12')
   <Toaster /> is mounted once in App. */

let nextId = 1
let items = []
const listeners = new Set()
const emit = () => listeners.forEach(fn => fn(items))

function push(message, type = 'success', ms = 3600) {
  const id = nextId++
  items = [...items.slice(-2), { id, message, type }]
  emit()
  setTimeout(() => dismiss(id), ms)
  return id
}
function dismiss(id) {
  items = items.filter(t => t.id !== id)
  emit()
}

export const toast = (message) => push(message, 'success')
toast.success = (message) => push(message, 'success')
toast.error = (message) => push(message, 'error', 5200)
toast.info = (message) => push(message, 'info')
// Invoice fully paid — shown with a PAID stamp
toast.paid = (invoiceNo) => push(`Invoice ${invoiceNo} is fully paid`, 'paid', 4400)

const Tick = () => (
  <svg className={styles.tick} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M7.5 12.5l3 3 6-6.5" />
  </svg>
)

export function Toaster() {
  const [list, setList] = useState(items)
  useEffect(() => {
    listeners.add(setList)
    return () => { listeners.delete(setList) }
  }, [])
  if (!list.length) return null
  return (
    <div className={styles.toaster} role="status" aria-live="polite">
      {list.map(t => (
        <div key={t.id} className={`${styles.toast} ${styles['toast_' + t.type] || ''}`}>
          {t.type === 'success' && <Tick />}
          {t.type === 'paid' && <span className={styles.stampFx}>PAID</span>}
          {t.type === 'error' && <span className={styles.bang} aria-hidden="true">!</span>}
          <span className={styles.toastText}>{t.message}</span>
          <button className={styles.toastClose} onClick={() => dismiss(t.id)} aria-label="Dismiss">×</button>
        </div>
      ))}
    </div>
  )
}
