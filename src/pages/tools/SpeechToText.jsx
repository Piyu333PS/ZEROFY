import { useState, useRef } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

export default function SpeechToText() {
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [lang, setLang] = useState('hi-IN')
  const [copied, setCopied] = useState(false)
  const recognitionRef = useRef(null)

  const langs = [
    { code: 'hi-IN', label: 'Hindi (हिन्दी)' },
    { code: 'en-IN', label: 'English (India)' },
    { code: 'en-US', label: 'English (US)' },
    { code: 'mr-IN', label: 'Marathi (मराठी)' },
    { code: 'gu-IN', label: 'Gujarati (ગુજરાતી)' },
    { code: 'ta-IN', label: 'Tamil (தமிழ்)' },
    { code: 'te-IN', label: 'Telugu (తెలుగు)' },
    { code: 'bn-IN', label: 'Bengali (বাংলা)' },
  ]

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Aapka browser speech recognition support nahi karta. Chrome use karo.'); return }
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = lang
    let final = text

    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' '
        else interim += e.results[i][0].transcript
      }
      setText(final + interim)
    }

    rec.onerror = (e) => { console.error(e); setListening(false) }
    rec.onend = () => { setText(final); setListening(false) }
    recognitionRef.current = rec
    rec.start()
    setListening(true)
  }

  const stop = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ToolLayout icon="🎤" name="Speech to Text" desc="Bolkar text likho — Hindi, English aur 6 aur languages mein">
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Language / Bhasha</label>
          <select value={lang} onChange={e => setLang(e.target.value)} className={styles.controlSelect}>
            {langs.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 16 }}>
        <textarea className={styles.textArea} style={{ minHeight: 200 }}
          placeholder="Yahan text appear hoga jab tum bologe..."
          value={text} onChange={e => setText(e.target.value)} />
        {listening && (
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,77,77,0.15)', border: '1px solid rgba(255,77,77,0.4)',
            borderRadius: 100, padding: '4px 12px', fontSize: 12, color: '#ff6b6b' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4d4d',
              animation: 'pulse-glow 1s infinite' }} />
            Recording...
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {!listening ? (
          <button className={styles.actionBtn} onClick={start}>
            🎤 Recording Shuru Karo
          </button>
        ) : (
          <button className={styles.actionBtn} onClick={stop}
            style={{ background: '#ff4d4d' }}>
            ⏹ Stop Karo
          </button>
        )}
        {text && (
          <>
            <button className={styles.copyBtn} onClick={copy} style={{ padding: '12px 20px' }}>
              {copied ? '✅ Copied!' : '📋 Copy Text'}
            </button>
            <button className={styles.copyBtn} onClick={() => setText('')} style={{ padding: '12px 20px' }}>
              🗑️ Clear
            </button>
          </>
        )}
      </div>

      <div className={styles.hint} style={{ marginTop: 16 }}>
        💡 Chrome browser mein best kaam karta hai. Microphone permission allow karna hoga. Hindi mein bolne ke liye "Hindi (हिन्दी)" select karo.
      </div>
    </ToolLayout>
  )
}
