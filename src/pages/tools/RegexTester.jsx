import { useState, useMemo } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

const PRESETS = [
  { label: 'Email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'gi' },
  { label: 'Mobile (India)', pattern: '[6-9]\\d{9}', flags: 'g' },
  { label: 'URL', pattern: 'https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+[\\/\\w\\-._~:/?#\\[\\]@!$&\'()*+,;=]*', flags: 'gi' },
  { label: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
  { label: 'Date (DD/MM/YYYY)', pattern: '\\b\\d{2}\\/\\d{2}\\/\\d{4}\\b', flags: 'g' },
  { label: 'Hashtag', pattern: '#[a-zA-Z_][a-zA-Z0-9_]*', flags: 'g' },
  { label: 'HTML Tag', pattern: '<[^>]+>', flags: 'gi' },
]

export default function RegexTester() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [testText, setTestText] = useState('Mera email: test@example.com\nPhone: 9876543210\nWebsite: https://zerofy.app')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    if (!pattern || !testText) return { error: null, matches: [], highlighted: testText }
    try {
      const regex = new RegExp(pattern, flags)
      const matches = []
      let m
      const cleanRegex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')

      while ((m = cleanRegex.exec(testText)) !== null) {
        matches.push({
          match: m[0], index: m.index,
          groups: m.slice(1),
          namedGroups: m.groups || {}
        })
        if (!flags.includes('g')) break
      }

      // Highlight
      let highlighted = ''
      let lastIndex = 0
      const highlightRegex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')
      testText.replace(highlightRegex, (match, ...args) => {
        const offset = args[args.length - 2]
        highlighted += escapeHtml(testText.slice(lastIndex, offset))
        highlighted += `<mark style="background:var(--accent-glow);color:var(--accent2);border-radius:3px;padding:0 2px">${escapeHtml(match)}</mark>`
        lastIndex = offset + match.length
        return match
      })
      highlighted += escapeHtml(testText.slice(lastIndex))

      return { error: null, matches, highlighted }
    } catch (e) {
      return { error: e.message, matches: [], highlighted: testText }
    }
  }, [pattern, flags, testText])

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
  }

  return (
    <ToolLayout icon="🔍" name="Regex Tester" desc="Regular expressions test karo — live highlighting aur match details ke saath">

      {/* Presets */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {PRESETS.map(p => (
          <button key={p.label} className={styles.copyBtn} style={{ marginTop: 0 }}
            onClick={() => { setPattern(p.pattern); setFlags(p.flags) }}>
            {p.label}
          </button>
        ))}
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Regex Pattern</label>
          <input className={styles.controlInput} value={pattern}
            onChange={e => setPattern(e.target.value)}
            placeholder="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" />
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Flags</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {['g', 'i', 'm', 's'].map(f => (
              <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
                <input type="checkbox" checked={flags.includes(f)}
                  onChange={e => setFlags(prev => e.target.checked ? prev + f : prev.replace(f, ''))}
                  style={{ accentColor: 'var(--accent)' }} />
                {f}
              </label>
            ))}
          </div>
        </div>
      </div>

      {result.error && (
        <div style={{ color: '#ff4d4d', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: 'rgba(255,77,77,0.1)', borderRadius: 'var(--radius)' }}>
          ❌ {result.error}
        </div>
      )}

      {/* Test text */}
      <div className={styles.controlLabel} style={{ marginBottom: 6 }}>Test Text</div>
      <textarea className={styles.textArea} value={testText}
        onChange={e => setTestText(e.target.value)}
        placeholder="Yahan wo text paste karo jisme regex test karna hai..." />

      {/* Highlighted result */}
      {pattern && !result.error && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className={styles.controlLabel}>Result ({result.matches.length} matches)</div>
          </div>
          <div style={{
            background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            padding: 14, fontSize: 14, lineHeight: 1.8, color: 'var(--text)', minHeight: 80
          }} dangerouslySetInnerHTML={{ __html: result.highlighted }} />
        </div>
      )}

      {/* Matches list */}
      {result.matches.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className={styles.fileListTitle}>Matches</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {result.matches.map((m, i) => (
              <div key={i} style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13,
                display: 'flex', gap: 12, alignItems: 'center'
              }}>
                <span style={{ color: 'var(--accent2)', fontWeight: 700, minWidth: 24 }}>#{i + 1}</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--text)', flex: 1 }}>{m.match}</span>
                <span style={{ color: 'var(--text3)' }}>index: {m.index}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
