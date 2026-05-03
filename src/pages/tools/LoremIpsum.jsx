import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

const WORDS = `lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum`.split(' ')

function randomWord() { return WORDS[Math.floor(Math.random() * WORDS.length)] }

function generateSentence() {
  const len = 8 + Math.floor(Math.random() * 10)
  const words = Array.from({ length: len }, (_, i) => i === 0 ? randomWord().charAt(0).toUpperCase() + randomWord().slice(1) : randomWord())
  return words.join(' ') + '.'
}

function generateParagraph() {
  const count = 4 + Math.floor(Math.random() * 4)
  return Array.from({ length: count }, generateSentence).join(' ')
}

export default function LoremIpsum() {
  const [type, setType] = useState('paragraphs')
  const [count, setCount] = useState(3)
  const [startWithLorem, setStartWithLorem] = useState(true)
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)

  const generate = () => {
    let result = ''
    if (type === 'words') {
      const words = Array.from({ length: count }, randomWord)
      if (startWithLorem && count >= 2) { words[0] = 'Lorem'; words[1] = 'ipsum' }
      result = words.join(' ')
    } else if (type === 'sentences') {
      const sentences = Array.from({ length: count }, generateSentence)
      if (startWithLorem) sentences[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
      result = sentences.join(' ')
    } else {
      const paras = Array.from({ length: count }, generateParagraph)
      if (startWithLorem) paras[0] = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
      result = paras.join('\n\n')
    }
    setOutput(result)
  }

  const copy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <ToolLayout icon="📄" name="Lorem Ipsum Generator" desc="Generate placeholder text — in words, sentences or paragraphs">

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Type</label>
          <select className={styles.controlSelect} value={type} onChange={e => setType(e.target.value)}>
            <option value="words">Words</option>
            <option value="sentences">Sentences</option>
            <option value="paragraphs">Paragraphs</option>
          </select>
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Count ({count})</label>
          <input type="range" min={1} max={type === 'words' ? 200 : type === 'sentences' ? 20 : 10}
            value={count} onChange={e => setCount(+e.target.value)}
            style={{ width: '100%', accentColor: 'var(--accent)' }} />
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text2)', marginBottom: 16, cursor: 'pointer' }}>
        <input type="checkbox" checked={startWithLorem} onChange={e => setStartWithLorem(e.target.checked)}
          style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
        "Lorem ipsum..." se start karo
      </label>

      <button className={styles.actionBtn} onClick={generate}>
        ✨ Generate {count} {type}
      </button>

      {output && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>{output.split(/\s+/).filter(Boolean).length} words</span>
            <button className={styles.copyBtn} style={{ marginTop: 0 }} onClick={copy}>
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          </div>
          <textarea
            className={styles.outputArea}
            style={{ minHeight: 200 }}
            value={output}
            readOnly
          />
        </div>
      )}
    </ToolLayout>
  )
}
