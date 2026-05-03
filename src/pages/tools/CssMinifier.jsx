import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')      // remove comments
    .replace(/\s+/g, ' ')                   // collapse whitespace
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*,\s*/g, ',')
    .replace(/;\s*}/g, '}')                 // remove last semicolon
    .trim()
}

function minifyJS(js) {
  return js
    .replace(/\/\/[^\n]*/g, '')             // remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')       // remove block comments
    .replace(/\n\s*/g, ' ')                 // collapse newlines
    .replace(/\s+/g, ' ')                   // collapse spaces
    .replace(/\s*([=+\-*/<>!&|?,;:{}()[\]])\s*/g, '$1') // remove space around operators
    .replace(/;\s*}/g, '}')
    .trim()
}

function beautifyCSS(css) {
  let result = ''
  let indent = 0
  const lines = css.replace(/([{}])/g, '\n$1\n').split('\n')
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (t === '}') { indent = Math.max(0, indent - 1) }
    result += '  '.repeat(indent) + t + '\n'
    if (t === '{') indent++
    else if (t.endsWith('{')) indent++
  }
  return result
}

export default function CssMinifier() {
  const [input, setInput] = useState('')
  const [type, setType] = useState('css')
  const [mode, setMode] = useState('minify')
  const [copied, setCopied] = useState(false)

  const output = (() => {
    if (!input.trim()) return ''
    try {
      if (mode === 'minify') return type === 'css' ? minifyCSS(input) : minifyJS(input)
      else return type === 'css' ? beautifyCSS(minifyCSS(input)) : input
    } catch { return input }
  })()

  const copy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const savings = input.length > 0 ? (((input.length - output.length) / input.length) * 100).toFixed(1) : 0

  const SAMPLES = {
    css: `.container   {
  display  :   flex  ;
  flex-direction   :  column  ;
  /* This is a comment */
  background-color  :  #ffffff  ;
  padding  :  16px  20px  ;
  margin  :  0  auto  ;
}

.button {
  background : var(--accent) ;
  color : #fff ;
  border-radius : 8px ;
  padding : 12px 24px ;
}`,
    js: `// This is a comment
function calculateSum(a, b) {
  /* Block comment */
  const result = a + b;
  console.log("Result:", result);
  return result;
}

const greet = (name) => {
  return "Hello, " + name + "!";
};`
  }

  return (
    <ToolLayout icon="🗜️" name="CSS / JS Minifier" desc="Minify or beautify CSS and JavaScript code">

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['css', 'js'].map(t => (
          <button key={t} onClick={() => setType(t)} style={{
            flex: 1, padding: '10px', borderRadius: 'var(--radius)', border: '2px solid',
            cursor: 'pointer', fontWeight: 700, fontSize: 14,
            borderColor: type === t ? 'var(--accent)' : 'var(--border)',
            background: type === t ? 'var(--accent-glow)' : 'var(--bg3)',
            color: type === t ? 'var(--accent2)' : 'var(--text2)',
          }}>
            {t.toUpperCase()}
          </button>
        ))}
        <button onClick={() => setMode(m => m === 'minify' ? 'beautify' : 'minify')} style={{
          flex: 2, padding: '10px', borderRadius: 'var(--radius)', border: '2px solid var(--border)',
          cursor: 'pointer', fontWeight: 600, fontSize: 13,
          background: 'var(--bg3)', color: 'var(--text2)'
        }}>
          {mode === 'minify' ? '🗜️ Minify mode' : '✨ Beautify mode'} → switch
        </button>
      </div>

      <button className={styles.copyBtn} style={{ marginBottom: 10 }}
        onClick={() => setInput(SAMPLES[type])}>
        📄 Load Sample {type.toUpperCase()}
      </button>

      <div className={styles.splitRow}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <div className={styles.controlLabel}>Input</div>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{input.length} chars</span>
          </div>
          <textarea className={styles.textArea} style={{ minHeight: 300, fontFamily: 'monospace', fontSize: 12 }}
            value={input} onChange={e => setInput(e.target.value)}
            placeholder={`Paste your ${type.toUpperCase()} code here...`} />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div className={styles.controlLabel}>Output ({mode === 'minify' ? 'Minified' : 'Beautified'})</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {output && <span style={{ fontSize: 12, color: 'var(--text3)' }}>{output.length} chars</span>}
              {output && <button className={styles.copyBtn} style={{ marginTop: 0 }} onClick={copy}>{copied ? '✅' : '📋'}</button>}
            </div>
          </div>
          <textarea className={styles.outputArea} style={{ minHeight: 300, fontSize: 12 }}
            value={output} readOnly placeholder="Result yahan aayega..." />
        </div>
      </div>

      {input.length > 0 && output.length > 0 && (
        <div className={styles.statsRow} style={{ marginTop: 12 }}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{input.length}</span>
            <span className={styles.statLbl}>Original</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{output.length}</span>
            <span className={styles.statLbl}>Minified</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum} style={{ color: savings > 0 ? 'var(--green)' : 'var(--text)' }}>
              {savings}%
            </span>
            <span className={styles.statLbl}>Saved</span>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
