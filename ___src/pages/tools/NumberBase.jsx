import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

const BASES = [
  { label: 'Binary', base: 2, prefix: '0b', placeholder: '1010 1111' },
  { label: 'Octal', base: 8, prefix: '0o', placeholder: '255' },
  { label: 'Decimal', base: 10, prefix: '', placeholder: '42' },
  { label: 'Hexadecimal', base: 16, prefix: '0x', placeholder: 'FF or ff' },
]

function toBase(n, base) {
  if (isNaN(n)) return ''
  const val = n.toString(base).toUpperCase()
  if (base === 2) return val.replace(/(.{4})/g, '$1 ').trim()
  return val
}

export default function NumberBaseConverter() {
  const [input, setInput] = useState('')
  const [fromBase, setFromBase] = useState(10)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(null)

  const num = (() => {
    if (!input.trim()) return null
    const clean = input.replace(/\s/g, '')
    const n = parseInt(clean, fromBase)
    return isNaN(n) ? null : n
  })()

  const handleInput = (val) => {
    setInput(val)
    setError('')
    if (val.trim()) {
      const clean = val.replace(/\s/g, '')
      const n = parseInt(clean, fromBase)
      if (isNaN(n)) setError('❌ Invalid input for base ' + fromBase)
    }
  }

  const copy = (val, label) => {
    navigator.clipboard.writeText(val.replace(/\s/g, ''))
    setCopied(label)
    setTimeout(() => setCopied(null), 1500)
  }

  const COMMON_NUMS = [0, 1, 8, 10, 15, 16, 32, 64, 128, 255, 256, 512, 1024, 65535]

  return (
    <ToolLayout icon="🔢" name="Number Base Converter" desc="Convert between Decimal, Binary, Octal and Hexadecimal">

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {BASES.map(b => (
          <button key={b.base} onClick={() => { setFromBase(b.base); setInput(''); setError('') }} style={{
            flex: 1, minWidth: 100, padding: '10px', borderRadius: 'var(--radius)',
            border: '2px solid', cursor: 'pointer', fontWeight: 600, fontSize: 13,
            borderColor: fromBase === b.base ? 'var(--accent)' : 'var(--border)',
            background: fromBase === b.base ? 'var(--accent-glow)' : 'var(--bg3)',
            color: fromBase === b.base ? 'var(--accent2)' : 'var(--text2)',
          }}>
            {b.label}<br />
            <span style={{ fontSize: 10, opacity: 0.7 }}>Base {b.base}</span>
          </button>
        ))}
      </div>

      <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
        <label className={styles.controlLabel}>
          Input ({BASES.find(b => b.base === fromBase)?.label})
        </label>
        <input className={styles.controlInput} value={input} onChange={e => handleInput(e.target.value)}
          placeholder={BASES.find(b => b.base === fromBase)?.placeholder}
          style={{ fontFamily: 'monospace', fontSize: 16 }} />
        {error && <div style={{ color: '#ff4d4d', fontSize: 13, marginTop: 4 }}>{error}</div>}
      </div>

      {num !== null && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {BASES.map(b => {
            const val = toBase(num, b.base)
            const isFrom = b.base === fromBase
            return (
              <div key={b.base} style={{
                background: isFrom ? 'var(--accent-glow)' : 'var(--bg3)',
                border: `2px solid ${isFrom ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12
              }}>
                <div style={{ width: 100, flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700 }}>{b.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>Base {b.base} {b.prefix && `• ${b.prefix}`}</div>
                </div>
                <div style={{ flex: 1, fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'var(--text)', wordBreak: 'break-all' }}>
                  {b.prefix}{val}
                </div>
                <button className={styles.copyBtn} style={{ marginTop: 0 }} onClick={() => copy(b.prefix + val, b.label)}>
                  {copied === b.label ? '✅' : '📋'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {num !== null && !error && (
        <div style={{ marginBottom: 20 }}>
          <div className={styles.fileListTitle}>Additional Info</div>
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{num.toLocaleString()}</span>
              <span className={styles.statLbl}>Decimal Value</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{toBase(num, 2).replace(/\s/g, '').length}</span>
              <span className={styles.statLbl}>Bits needed</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{num < 0 ? 'Negative' : 'Positive'}</span>
              <span className={styles.statLbl}>Sign</span>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className={styles.fileListTitle}>Common Numbers</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {COMMON_NUMS.map(n => (
            <button key={n} className={styles.copyBtn} style={{ marginTop: 0 }}
              onClick={() => { setFromBase(10); setInput(String(n)); setError('') }}>
              {n}
            </button>
          ))}
        </div>
      </div>
    </ToolLayout>
  )
}
