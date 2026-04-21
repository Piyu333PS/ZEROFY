import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

export default function JsonFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [indent, setIndent] = useState(2)
  const [copied, setCopied] = useState(false)

  const format = () => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, indent))
      setError('')
    } catch (e) {
      setError('Invalid JSON: ' + e.message)
      setOutput('')
    }
  }

  const minify = () => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
      setError('')
    } catch (e) {
      setError('Invalid JSON: ' + e.message)
      setOutput('')
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const validate = () => {
    try {
      JSON.parse(input)
      setError('')
      alert('✅ Valid JSON hai!')
    } catch (e) {
      setError('❌ Invalid JSON: ' + e.message)
    }
  }

  return (
    <ToolLayout icon="{ }" name="JSON Formatter" desc="JSON ko beautify, minify aur validate karo">
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={indent} onChange={e => setIndent(+e.target.value)} className={styles.controlSelect}
          style={{ width: 'auto' }}>
          <option value={2}>2 spaces</option>
          <option value={4}>4 spaces</option>
          <option value={8}>8 spaces</option>
        </select>
        <button className={styles.actionBtn} style={{ flex: 'none', padding: '10px 20px', fontSize: 14 }} onClick={format}>
          ✨ Beautify
        </button>
        <button className={styles.copyBtn} onClick={minify}>🗜️ Minify</button>
        <button className={styles.copyBtn} onClick={validate}>✅ Validate</button>
      </div>

      <div className={styles.splitRow}>
        <div>
          <div className={styles.controlLabel} style={{ marginBottom: 8 }}>Input JSON</div>
          <textarea className={styles.textArea} style={{ fontFamily: 'monospace', fontSize: 13, minHeight: 300 }}
            placeholder='{"name": "Zerofy", "version": "1.0"}' value={input}
            onChange={e => { setInput(e.target.value); setError('') }} />
        </div>
        <div>
          <div className={styles.controlLabel} style={{ marginBottom: 8 }}>Output</div>
          <textarea className={styles.outputArea} style={{ fontFamily: 'monospace', fontSize: 13, minHeight: 300 }}
            readOnly value={output} placeholder="Yahan formatted JSON aayega..." />
        </div>
      </div>

      {error && <div className={styles.hint} style={{ color: '#ff6b6b', borderColor: 'rgba(255,107,107,0.3)', background: 'rgba(255,77,77,0.08)' }}>⚠️ {error}</div>}

      {output && (
        <button className={styles.copyBtn} onClick={copy} style={{ marginTop: 12 }}>
          {copied ? '✅ Copied!' : '📋 Output Copy Karo'}
        </button>
      )}
    </ToolLayout>
  )
}
