import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

const conversions = [
  { label: 'UPPERCASE', fn: t => t.toUpperCase() },
  { label: 'lowercase', fn: t => t.toLowerCase() },
  { label: 'Title Case', fn: t => t.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) },
  { label: 'Sentence case', fn: t => t.replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase()).replace(/(?<!^)(?<![.!?]\s)\b\w/g, c => c.toLowerCase()) },
  { label: 'camelCase', fn: t => t.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()) },
  { label: 'PascalCase', fn: t => t.replace(/(^\w|[^a-zA-Z0-9]\w)/g, c => c.replace(/[^a-zA-Z0-9]/, '').toUpperCase()) },
  { label: 'snake_case', fn: t => t.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') },
  { label: 'kebab-case', fn: t => t.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') },
  { label: 'CONSTANT_CASE', fn: t => t.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '') },
  { label: 'aLtErNaTiNg', fn: t => [...t].map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('') },
]

export default function CaseConverter() {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(null)

  const copy = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <ToolLayout icon="Aa" name="Case Converter" desc="Convert text to UPPER, lower, Title Case, camelCase and more formats">
      <textarea
        className={styles.textArea}
        style={{ minHeight: 120 }}
        placeholder="Paste your text here..."
        value={input}
        onChange={e => setInput(e.target.value)}
      />

      {input.trim() && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          {conversions.map(({ label, fn }) => {
            const result = fn(input)
            return (
              <div key={label} style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '12px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 14, color: 'var(--text)', wordBreak: 'break-all' }}>{result}</div>
                </div>
                <button className={styles.copyBtn} style={{ marginTop: 0, flexShrink: 0 }} onClick={() => copy(result, label)}>
                  {copied === label ? '✅' : '📋'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {!input.trim() && (
        <div className={styles.hint} style={{ marginTop: 16 }}>
          💡 Type text above — all conversions will appear instantly
        </div>
      )}
    </ToolLayout>
  )
}
