import { useState, useEffect } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

export default function TextToSpeech() {
  const [text, setText] = useState('')
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState('')
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [volume, setVolume] = useState(1)
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const load = () => {
      const v = speechSynthesis.getVoices()
      setVoices(v)
      if (v.length && !selectedVoice) setSelectedVoice(v[0].name)
    }
    speechSynthesis.onvoiceschanged = load
    load()
    return () => speechSynthesis.cancel()
  }, [])

  const speak = () => {
    if (!text.trim()) return
    speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    const voice = voices.find(v => v.name === selectedVoice)
    if (voice) utt.voice = voice
    utt.rate = rate
    utt.pitch = pitch
    utt.volume = volume
    utt.onstart = () => { setSpeaking(true); setPaused(false) }
    utt.onend = () => { setSpeaking(false); setPaused(false) }
    utt.onerror = () => setSpeaking(false)
    speechSynthesis.speak(utt)
  }

  const pause = () => { speechSynthesis.pause(); setPaused(true) }
  const resume = () => { speechSynthesis.resume(); setPaused(false) }
  const stop = () => { speechSynthesis.cancel(); setSpeaking(false); setPaused(false) }

  return (
    <ToolLayout icon="🔊" name="Text to Speech" desc="Likha hua text sunao — alag alag voices aur speed mein">
      <textarea className={styles.textArea} style={{ minHeight: 160 }}
        placeholder="Yahan text likhon ya paste karo..."
        value={text} onChange={e => setText(e.target.value)} />

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Voice</label>
          <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} className={styles.controlSelect}>
            {voices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
          </select>
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Speed: {rate}x</label>
          <input type="range" min="0.5" max="2" step="0.1" value={rate}
            onChange={e => setRate(+e.target.value)} className={styles.controlInput} />
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Pitch: {pitch}</label>
          <input type="range" min="0.5" max="2" step="0.1" value={pitch}
            onChange={e => setPitch(+e.target.value)} className={styles.controlInput} />
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Volume: {Math.round(volume * 100)}%</label>
          <input type="range" min="0" max="1" step="0.1" value={volume}
            onChange={e => setVolume(+e.target.value)} className={styles.controlInput} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {!speaking ? (
          <button className={styles.actionBtn} onClick={speak} disabled={!text.trim()}>
            ▶ Sunao
          </button>
        ) : (
          <>
            {!paused
              ? <button className={styles.actionBtn} onClick={pause}>⏸ Pause</button>
              : <button className={styles.actionBtn} onClick={resume}>▶ Resume</button>
            }
            <button className={styles.copyBtn} onClick={stop} style={{ padding: '12px 24px' }}>⏹ Stop</button>
          </>
        )}
      </div>

      {speaking && (
        <div className={styles.success} style={{ marginTop: 16 }}>
          🔊 {paused ? 'Paused...' : 'Bol raha hai...'}
        </div>
      )}

      <div className={styles.hint} style={{ marginTop: 16 }}>
        💡 Ye tool browser ki built-in speech synthesis use karta hai. Alag devices pe alag voices milte hain.
      </div>
    </ToolLayout>
  )
}
