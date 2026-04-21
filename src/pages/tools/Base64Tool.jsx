import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

export default function Base64Tool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState('encode')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [imagePreview, setImagePreview] = useState('')

  const process = (val, m) => {
    setError('')
    setImagePreview('')
    if (!val.trim()) { setOutput(''); return }
    try {
      if (m === 'encode') {
        const encoded = btoa(unescape(encodeURIComponent(val)))
        setOutput(encoded)
      } else {
        const decoded = decodeURIComponent(escape(atob(val.trim())))
        setOutput(decoded)
        // Check if it's a data URL image
        if (val.trim().startsWith('data:image')) setImagePreview(val.trim())
      }
    } catch {
      setError(m === 'decode' ? '❌ Invalid Base64 string!' : '❌ Encoding failed!')
      setOutput('')
    }
  }

  const handleInput = (val) => {
    setInput(val)
    process(val, mode)
  }

  const handleMode = (m) => {
    setMode(m)
    setInput(output)
    process(output, m)
  }

  const copy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      setMode('encode')
      setInput(dataUrl)
      setOutput(dataUrl.split(',')[1])
      setImagePreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  return (
    <ToolLayout icon="🔐" name="Base64 Encoder / Decoder" desc="Text ya file ko Base64 mein encode karo ya decode karo">

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['encode', 'decode'].map(m => (
          <button key={m} onClick={() => handleMode(m)} style={{
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

      <div className={styles.controlGroup} style={{ marginBottom: 12 }}>
        <label className={styles.controlLabel}>Ya file/image upload karo (encode ke liye)</label>
        <input type="file" onChange={handleFile} style={{ color: 'var(--text2)', fontSize: 13 }} />
      </div>

      <div className={styles.splitRow}>
        <div>
          <div className={styles.controlLabel} style={{ marginBottom: 6 }}>Input</div>
          <textarea
            className={styles.textArea}
            value={input}
            onChange={e => handleInput(e.target.value)}
            placeholder={mode === 'encode' ? 'Text yahan likho...' : 'Base64 string paste karo...'}
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

      {imagePreview && (
        <div style={{ marginTop: 16 }}>
          <div className={styles.controlLabel} style={{ marginBottom: 8 }}>Image Preview</div>
          <img src={imagePreview} alt="preview" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
        </div>
      )}

      {output && (
        <div className={styles.statsRow} style={{ marginTop: 16 }}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{input.length}</span>
            <span className={styles.statLbl}>Input chars</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{output.length}</span>
            <span className={styles.statLbl}>Output chars</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{input.length ? ((output.length / input.length) * 100).toFixed(0) : 0}%</span>
            <span className={styles.statLbl}>Size ratio</span>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
