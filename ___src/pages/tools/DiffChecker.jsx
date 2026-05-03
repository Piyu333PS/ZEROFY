import { useState, useMemo } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

function diffLines(a, b) {
  const aLines = a.split('\n')
  const bLines = b.split('\n')
  const result = []
  const maxLen = Math.max(aLines.length, bLines.length)
  for (let i = 0; i < maxLen; i++) {
    const al = aLines[i]
    const bl = bLines[i]
    if (al === undefined) result.push({ type: 'added', line: bl, num: i + 1 })
    else if (bl === undefined) result.push({ type: 'removed', line: al, num: i + 1 })
    else if (al !== bl) {
      result.push({ type: 'removed', line: al, num: i + 1 })
      result.push({ type: 'added', line: bl, num: i + 1 })
    } else {
      result.push({ type: 'same', line: al, num: i + 1 })
    }
  }
  return result
}

export default function DiffChecker() {
  const [text1, setText1] = useState('')
  const [text2, setText2] = useState('')
  const [show, setShow] = useState(false)

  const diff = useMemo(() => show ? diffLines(text1, text2) : [], [text1, text2, show])

  const added = diff.filter(d => d.type === 'added').length
  const removed = diff.filter(d => d.type === 'removed').length
  const same = diff.filter(d => d.type === 'same').length

  return (
    <ToolLayout icon="🔍" name="Diff Checker" desc="Compare two texts and see differences line by line">
      <div className={styles.splitRow} style={{ marginBottom: 16 }}>
        <div>
          <div className={styles.controlLabel} style={{ marginBottom: 8 }}>Text A (Original)</div>
          <textarea className={styles.textArea} style={{ minHeight: 200 }}
            placeholder="Paste first text here..."
            value={text1} onChange={e => { setText1(e.target.value); setShow(false) }} />
        </div>
        <div>
          <div className={styles.controlLabel} style={{ marginBottom: 8 }}>Text B (Changed)</div>
          <textarea className={styles.textArea} style={{ minHeight: 200 }}
            placeholder="Paste second text here..."
            value={text2} onChange={e => { setText2(e.target.value); setShow(false) }} />
        </div>
      </div>

      <button className={styles.actionBtn} onClick={() => setShow(true)} disabled={!text1 && !text2}>
        🔍 Difference Dekho
      </button>

      {show && diff.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className={styles.statsRow} style={{ marginBottom: 16 }}>
            <div className={styles.statCard}>
              <span className={styles.statNum} style={{ color: 'var(--green)' }}>{added}</span>
              <span className={styles.statLbl}>Lines Added</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum} style={{ color: '#ff4d4d' }}>{removed}</span>
              <span className={styles.statLbl}>Lines Removed</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{same}</span>
              <span className={styles.statLbl}>Lines Same</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            overflow: 'auto', maxHeight: 400 }}>
            {diff.map((d, i) => (
              <div key={i} style={{
                display: 'flex', gap: 0,
                background: d.type === 'added' ? 'rgba(0,212,170,0.08)' : d.type === 'removed' ? 'rgba(255,77,77,0.08)' : 'transparent',
                borderLeft: `3px solid ${d.type === 'added' ? 'var(--green)' : d.type === 'removed' ? '#ff4d4d' : 'transparent'}`,
              }}>
                <span style={{ width: 36, textAlign: 'right', padding: '3px 8px',
                  fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace', flexShrink: 0,
                  borderRight: '1px solid var(--border)' }}>{d.num}</span>
                <span style={{ width: 16, textAlign: 'center', padding: '3px 4px',
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                  color: d.type === 'added' ? 'var(--green)' : d.type === 'removed' ? '#ff4d4d' : 'transparent' }}>
                  {d.type === 'added' ? '+' : d.type === 'removed' ? '−' : ' '}
                </span>
                <pre style={{ padding: '3px 12px', fontFamily: 'monospace', fontSize: 13,
                  color: d.type === 'same' ? 'var(--text2)' : 'var(--text)', whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all', flex: 1 }}>{d.line || ' '}</pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
