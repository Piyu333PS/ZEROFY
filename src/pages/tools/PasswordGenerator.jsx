import { useState, useCallback } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

export default function PasswordGenerator() {
  const [length, setLength] = useState(16)
  const [upper, setUpper] = useState(true)
  const [lower, setLower] = useState(true)
  const [numbers, setNumbers] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState([])

  const generate = useCallback(() => {
    let chars = ''
    if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (lower) chars += 'abcdefghijklmnopqrstuvwxyz'
    if (numbers) chars += '0123456789'
    if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    if (!chars) { alert('Please select at least one option'); return }
    let pass = ''
    const arr = new Uint32Array(length)
    window.crypto.getRandomValues(arr)
    arr.forEach(n => { pass += chars[n % chars.length] })
    setPassword(pass)
    setHistory(prev => [pass, ...prev].slice(0, 5))
    setCopied(false)
  }, [length, upper, lower, numbers, symbols])

  const copy = (p = password) => {
    navigator.clipboard.writeText(p)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const strength = () => {
    let score = 0
    if (length >= 12) score++
    if (length >= 16) score++
    if (upper && lower) score++
    if (numbers) score++
    if (symbols) score++
    if (score <= 2) return { label: 'Kamzor', color: '#ff4d4d', pct: 30 }
    if (score <= 3) return { label: 'Theek Hai', color: '#ffd700', pct: 60 }
    return { label: 'Mazboot', color: '#00d4aa', pct: 100 }
  }

  const s = strength()

  return (
    <ToolLayout icon="🔑" name="Password Generator" desc="Generate cryptographically secure random passwords">
      <div className={styles.controls}>
        <div className={styles.controlGroup} style={{ gridColumn: '1/-1' }}>
          <label className={styles.controlLabel}>Length: {length} characters</label>
          <input type="range" min="6" max="64" value={length}
            onChange={e => setLength(+e.target.value)} className={styles.controlInput} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        {[
          { label: 'A-Z Uppercase', val: upper, set: setUpper },
          { label: 'a-z Lowercase', val: lower, set: setLower },
          { label: '0-9 Numbers', val: numbers, set: setNumbers },
          { label: '!@# Symbols', val: symbols, set: setSymbols },
        ].map(opt => (
          <label key={opt.label} style={{
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            background: opt.val ? 'var(--accent-glow)' : 'var(--surface2)',
            border: `1px solid ${opt.val ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 100, padding: '8px 16px', fontSize: 14, transition: 'all 0.2s'
          }}>
            <input type="checkbox" checked={opt.val} onChange={e => opt.set(e.target.checked)}
              style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
            <span style={{ color: opt.val ? 'var(--accent2)' : 'var(--text2)' }}>{opt.label}</span>
          </label>
        ))}
      </div>

      <button className={styles.actionBtn} onClick={generate}>🔑 Generate Password</button>

      {password && (
        <div style={{ marginTop: 24 }}>
          <div style={{
            background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)',
            padding: '20px 24px', fontFamily: 'monospace', fontSize: 18, letterSpacing: 2,
            color: 'var(--text)', wordBreak: 'break-all', lineHeight: 1.6, marginBottom: 12
          }}>
            {password}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: 'var(--text3)' }}>Strength</span>
              <span style={{ color: s.color, fontWeight: 600 }}>{s.label}</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: s.pct + '%', background: s.color }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className={styles.copyBtn} onClick={() => copy()} style={{ flex: 1 }}>
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
            <button className={styles.copyBtn} onClick={generate}>🔄 Generate New</button>
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div style={{ marginTop: 24 }}>
          <div className={styles.fileListTitle}>Recent Passwords</div>
          {history.slice(1).map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
              borderBottom: '1px solid var(--border)', fontSize: 13
            }}>
              <span style={{ fontFamily: 'monospace', flex: 1, color: 'var(--text2)', wordBreak: 'break-all' }}>{p}</span>
              <button className={styles.copyBtn} style={{ padding: '4px 12px', margin: 0 }}
                onClick={() => copy(p)}>Copy</button>
            </div>
          ))}
        </div>
      )}
    </ToolLayout>
  )
}
