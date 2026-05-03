import { useState, useEffect } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

async function hashText(text, algorithm) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest(algorithm, data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

const ALGOS = [
  { label: 'MD5', algo: null, note: '(no native browser support, using CRC32)' },
  { label: 'SHA-1', algo: 'SHA-1' },
  { label: 'SHA-256', algo: 'SHA-256' },
  { label: 'SHA-384', algo: 'SHA-384' },
  { label: 'SHA-512', algo: 'SHA-512' },
]

// Simple CRC32 as MD5 substitute
function crc32(str) {
  let crc = -1
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ ((crc ^ str.charCodeAt(i)) & 0xff) * 0x04c11db7
  }
  return ((crc ^ -1) >>> 0).toString(16).padStart(8, '0')
}

export default function HashGenerator() {
  const [input, setInput] = useState('')
  const [hashes, setHashes] = useState({})
  const [copied, setCopied] = useState(null)
  const [isFile, setIsFile] = useState(false)

  useEffect(() => {
    if (!input) { setHashes({}); return }
    const compute = async () => {
      const results = {}
      results['MD5 (CRC32)'] = crc32(input)
      for (const { label, algo } of ALGOS.slice(1)) {
        results[label] = await hashText(input, algo)
      }
      setHashes(results)
    }
    compute()
  }, [input])

  const copy = (label, val) => {
    navigator.clipboard.writeText(val)
    setCopied(label)
    setTimeout(() => setCopied(null), 1500)
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setIsFile(true)
    const reader = new FileReader()
    reader.onload = (ev) => setInput(ev.target.result)
    reader.readAsText(file)
  }

  return (
    <ToolLayout icon="🔑" name="Hash Generator" desc="Generate MD5, SHA-1, SHA-256, SHA-512 hash of text or file">

      <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
        <label className={styles.controlLabel}>Generate hash from file</label>
        <input type="file" onChange={handleFile} style={{ color: 'var(--text2)', fontSize: 13 }} />
      </div>

      {!isFile && (
        <textarea
          className={styles.textArea}
          style={{ minHeight: 100 }}
          placeholder="Type or paste text here..."
          value={input}
          onChange={e => { setInput(e.target.value); setIsFile(false) }}
        />
      )}

      {isFile && input && (
        <div className={styles.hint}>
          📁 File loaded ({input.length.toLocaleString()} characters) — hashes calculate ho rahe hain
          <button onClick={() => { setInput(''); setIsFile(false) }} style={{
            marginLeft: 12, background: 'none', border: 'none', color: 'var(--accent2)', cursor: 'pointer', fontSize: 13
          }}>✕ Clear</button>
        </div>
      )}

      {Object.keys(hashes).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
          {Object.entries(hashes).map(([label, val]) => (
            <div key={label} style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '12px 16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent2)' }}>{label}</span>
                <button className={styles.copyBtn} style={{ marginTop: 0 }} onClick={() => copy(label, val)}>
                  {copied === label ? '✅' : '📋'}
                </button>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text)', wordBreak: 'break-all', letterSpacing: '0.5px' }}>
                {val}
              </div>
            </div>
          ))}
        </div>
      )}

      {!input && (
        <div className={styles.hint} style={{ marginTop: 16 }}>
          💡 Type text or upload a file — all hash formats will be shown at once
        </div>
      )}
    </ToolLayout>
  )
}
