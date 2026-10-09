import { useEffect } from 'react'

/* Browser ke confirm() ki jagah app ke andar ka confirm box —
   confirm() poora page rok deta hai aur kuch browsers/webviews mein dikhta hi nahi. */
export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger = false, busy = false, onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, busy])

  const btn = {
    border: '1px solid #E1D9C4', background: '#fff', color: '#1B2340', fontSize: 13.5, fontWeight: 600,
    padding: '10px 16px', borderRadius: 10, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit',
  }
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 3100, background: 'rgba(27,35,64,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
      onMouseDown={e => { if (e.target === e.currentTarget && !busy) onCancel() }}
    >
      <div role="alertdialog" aria-modal="true" style={{
        background: '#fff', borderRadius: 14, padding: '22px 22px 18px', maxWidth: 400, width: '100%',
        boxShadow: '0 24px 60px rgba(27,35,64,0.3)',
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2340', marginBottom: 8 }}>{title}</div>
        {message && <div style={{ fontSize: 13.5, color: '#4B5566', lineHeight: 1.55, marginBottom: 18 }}>{message}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button style={btn} onClick={onCancel} disabled={busy}>Cancel</button>
          <button
            style={{ ...btn, background: danger ? '#C1443C' : '#E8933C', borderColor: danger ? '#C1443C' : '#E8933C', color: '#fff', opacity: busy ? 0.7 : 1 }}
            onClick={onConfirm} disabled={busy} autoFocus
          >
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
