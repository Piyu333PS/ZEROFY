import { useState, useMemo } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

export default function WordCounter() {
  const [text, setText] = useState('')

  const stats = useMemo(() => {
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length
    const chars = text.length
    const charsNoSpace = text.replace(/\s/g, '').length
    const sentences = text === '' ? 0 : (text.match(/[.!?]+/g) || []).length
    const paragraphs = text === '' ? 0 : text.split(/\n\s*\n/).filter(p => p.trim()).length || (text.trim() ? 1 : 0)
    const readTime = Math.ceil(words / 200)
    const uniqueWords = new Set(text.toLowerCase().match(/\b\w+\b/g) || []).size
    return { words, chars, charsNoSpace, sentences, paragraphs, readTime, uniqueWords }
  }, [text])

  const topWords = useMemo(() => {
    const matches = text.toLowerCase().match(/\b[a-zA-Z\u0900-\u097F]{3,}\b/g) || []
    const freq = {}
    matches.forEach(w => { freq[w] = (freq[w] || 0) + 1 })
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [text])

  return (
    <ToolLayout icon="🔢" name="Word Counter" desc="Words, characters, sentences sab count karo — reading time bhi bata dega">
      <textarea
        className={styles.textArea}
        style={{ minHeight: 200 }}
        placeholder="Yahan apna text paste karo ya likhna shuru karo..."
        value={text}
        onChange={e => setText(e.target.value)}
      />

      <div className={styles.statsRow}>
        {[
          { num: stats.words, lbl: 'Words' },
          { num: stats.chars, lbl: 'Characters' },
          { num: stats.charsNoSpace, lbl: 'Chars (no space)' },
          { num: stats.sentences, lbl: 'Sentences' },
          { num: stats.paragraphs, lbl: 'Paragraphs' },
          { num: stats.uniqueWords, lbl: 'Unique Words' },
          { num: stats.readTime + ' min', lbl: 'Reading Time' },
        ].map((s, i) => (
          <div key={i} className={styles.statCard}>
            <span className={styles.statNum}>{s.num}</span>
            <span className={styles.statLbl}>{s.lbl}</span>
          </div>
        ))}
      </div>

      {topWords.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div className={styles.fileListTitle}>Top Words</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {topWords.map(([word, count]) => (
              <span key={word} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 100, padding: '4px 12px', fontSize: 13
              }}>
                {word} <strong style={{ color: 'var(--accent2)', marginLeft: 4 }}>{count}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {text && (
        <button className={styles.copyBtn} onClick={() => setText('')} style={{ marginTop: 16 }}>
          🗑️ Clear
        </button>
      )}
    </ToolLayout>
  )
}
