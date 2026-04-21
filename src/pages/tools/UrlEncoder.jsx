import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

export default function UrlEncoder() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState('encode')
  const [encodeType, setEncodeType] = useState('component')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const getOutput = () => {
    if (!input.trim()) return ''
    try {
      setError('')
      if (mode === 'encode') {
        return encodeType === 'component' ? encodeURIComponent(input) : encodeURI(input)
      } else {
        return encodeType === 'component' ? decodeURIComponent(input) : decodeURI(input)
      }
    } catch {
      setError('❌ Invalid URL encoding!')
      return ''
    }
  }

  const output = getOutput()

  const copy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // Parse URL params
  const parseParams = () => {
    try {
      const url = input.includes('?') ? input : `https://example.com?${input}`
      const params = new URL(url).searchParams
      return [...params.entries()]
    } catch { return [] }
  }

  const params = mode === 'decode' ? parseParams() : []

  return (
    <ToolLayout icon="🔗" name="URL Encoder / Decoder" desc="URLs ko encode ya decode karo — query params bhi parse karo">

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['encode', 'decode'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex: 1, padding: '10px', borderRadius: 'var(--radius)',
            border: '2px solid', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            borderColor: mode === m ? 'var(--accent)' : 'var(--border)',
            background: mode === m ? 'var(--accent-glow)' : 'var(--bg3)',
            color: mode === m ? 'var(--accent2)' : 'var(--text2)',
          }}>
            {m === 'encode' ? '🔒 Encode' : '🔓 Decode'}
          </button>
        ))}
      </div>

      <div className={styles.controls} style={{ marginBottom: 16 }}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Encoding Type</label>
          <select className={styles.controlSelect} value={encodeType} onChange={e => setEncodeType(e.target.value)}>
            <option value="component">encodeURIComponent (recommended)</option>
            <option value="uri">encodeURI (full URL ke liye)</option>
          </select>
        </div>
      </div>

      <div className={styles.splitRow}>
        <div>
          <div className={styles.controlLabel} style={{ marginBottom: 6 }}>Input</div>
          <textarea
            className={styles.textArea}
            value={input}
            onChange={e => { setInput(e.target.value); setError('') }}
            placeholder={mode === 'encode' ? 'URL ya text yahan likho...\n\nhttps://example.com/path?name=राम&city=कोटा' : 'Encoded URL paste karo...\n\nhttps%3A%2F%2Fexample.com'}
          />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div className={styles.controlLabel}>Output</div>
            {output && <button className={styles.copyBtn} style={{ marginTop: 0 }} onClick={copy}>{copied ? '✅' : '📋 Copy'}</button>}
          </div>
          <textarea className={styles.outputArea} value={output} readOnly placeholder="Result yahan aayega..." />
        </div>
      </div>

      {error && <div style={{ color: '#ff4d4d', fontSize: 14, marginTop: 8 }}>{error}</div>}

      {params.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div className={styles.fileListTitle}>Parsed Query Parameters</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {params.map(([k, v], i) => (
              <div key={i} style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '10px 14px',
                display: 'flex', gap: 12, fontSize: 13
              }}>
                <span style={{ color: 'var(--accent2)', fontWeight: 600, minWidth: 100 }}>{k}</span>
                <span style={{ color: 'var(--text2)' }}>=</span>
                <span style={{ color: 'var(--text)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
