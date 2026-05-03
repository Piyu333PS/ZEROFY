import { useState } from 'react'
import { downloadBlob } from '../../utils/download'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

// Simple markdown to HTML converter
function markdownToHtml(md) {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^#{6} (.+)$/gm, '<h6>$1</h6>')
    .replace(/^#{5} (.+)$/gm, '<h5>$1</h5>')
    .replace(/^#{4} (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--bg3);padding:2px 6px;border-radius:4px;font-family:monospace">$1</code>')
    .replace(/```[\w]*\n([\s\S]+?)```/gm, '<pre style="background:var(--bg3);padding:12px;border-radius:8px;overflow-x:auto"><code>$1</code></pre>')
    .replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:3px solid var(--accent);padding-left:12px;color:var(--text2);margin:8px 0">$1</blockquote>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul style="padding-left:20px;margin:8px 0">$&</ul>')
    .replace(/^\d+\. (.+)$/gm, '<oli>$1</oli>')
    .replace(/(<oli>.*<\/oli>\n?)+/g, (m) => '<ol style="padding-left:20px;margin:8px 0">' + m.replace(/<\/?oli>/g, s => s === '<oli>' ? '<li>' : '</li>') + '</ol>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color:var(--accent2)">$1</a>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:16px 0">')
    .replace(/\n\n/g, '</p><p style="margin:8px 0">')
    .replace(/^(?!<[houbl]|<pre|<block)(.+)$/gm, (m) => m.startsWith('<') ? m : m)
}

const DEFAULT = `# Hello, Zerofy! 👋

## Markdown Editor

Yahan apna markdown likhao aur **live preview** dekho!

### Features:
- **Bold** aur *Italic* text
- ~~Strikethrough~~
- \`Inline code\`
- [Links](https://example.com)

> Blockquote bhi work karta hai!

---

### Code Block:
\`\`\`
function hello() {
  console.log("Zerofy!")
}
\`\`\`

1. Numbered lists
2. Bhi kaam karte hain
3. Easy hai!
`

export default function MarkdownEditor() {
  const [md, setMd] = useState(DEFAULT)
  const [view, setView] = useState('split')
  const [copied, setCopied] = useState(false)

  const html = markdownToHtml(md)

  const copy = (type) => {
    navigator.clipboard.writeText(type === 'md' ? md : html.replace(/<[^>]+>/g, ''))
    setCopied(type)
    setTimeout(() => setCopied(false), 1500)
  }

  const download = (type) => {
    const content = type === 'md' ? md : `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px">${html}</body></html>`
    downloadBlob(new Blob([content], { type: 'text/plain' }), type === 'md' ? 'document.md' : 'document.html')
  }

  return (
    <ToolLayout icon="✍️" name="Markdown Editor" desc="Write Markdown and preview it in real time">

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {['split', 'edit', 'preview'].map(v => (
          <button key={v} className={styles.copyBtn} style={{ marginTop: 0, borderColor: view === v ? 'var(--accent)' : undefined, color: view === v ? 'var(--accent2)' : undefined }}
            onClick={() => setView(v)}>
            {v === 'split' ? '⬛⬛ Split' : v === 'edit' ? '✏️ Editor' : '👁 Preview'}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className={styles.copyBtn} style={{ marginTop: 0 }} onClick={() => copy('md')}>{copied === 'md' ? '✅' : '📋 Copy MD'}</button>
        <button className={styles.copyBtn} style={{ marginTop: 0 }} onClick={() => download('md')}>⬇️ .md</button>
        <button className={styles.copyBtn} style={{ marginTop: 0 }} onClick={() => download('html')}>⬇️ .html</button>
      </div>

      {/* Quick format buttons */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {[
          ['B', '**text**'], ['I', '*text*'], ['H1', '# '], ['H2', '## '],
          ['Code', '`code`'], ['Link', '[text](url)'], ['List', '- item']
        ].map(([label, insert]) => (
          <button key={label} className={styles.copyBtn} style={{ marginTop: 0, fontSize: 11, padding: '4px 8px' }}
            onClick={() => setMd(m => m + '\n' + insert)}>
            {label}
          </button>
        ))}
        <button className={styles.copyBtn} style={{ marginTop: 0, fontSize: 11, padding: '4px 8px', color: '#ff4d4d' }}
          onClick={() => setMd('')}>🗑️ Clear</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: view === 'split' ? '1fr 1fr' : '1fr', gap: 12 }}>
        {(view === 'edit' || view === 'split') && (
          <div>
            <div className={styles.controlLabel} style={{ marginBottom: 6 }}>Markdown</div>
            <textarea className={styles.textArea}
              style={{ minHeight: 400, fontFamily: 'monospace', fontSize: 13 }}
              value={md} onChange={e => setMd(e.target.value)} />
          </div>
        )}
        {(view === 'preview' || view === 'split') && (
          <div>
            <div className={styles.controlLabel} style={{ marginBottom: 6 }}>Preview</div>
            <div style={{
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: 16, minHeight: 400,
              color: 'var(--text)', lineHeight: 1.7, fontSize: 14
            }} dangerouslySetInnerHTML={{ __html: `<p style="margin:8px 0">${html}</p>` }} />
          </div>
        )}
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
        {md.split(/\s+/).filter(Boolean).length} words • {md.length} characters
      </div>
    </ToolLayout>
  )
}
