import { useState, useRef, useEffect } from 'react'
import { downloadBlob } from '../../utils/download'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

export default function RingtoneMaker() {
  const [file, setFile] = useState(null)
  const [audioDuration, setAudioDuration] = useState(0)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(30)
  const [fade, setFade] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const audioRef = useRef(null)

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setResult(null)
    const url = URL.createObjectURL(f)
    const audio = new Audio(url)
    audio.onloadedmetadata = () => {
      const dur = Math.floor(audio.duration)
      setAudioDuration(dur)
      setStart(0)
      setEnd(Math.min(30, dur))
    }
  }

  const make = async () => {
    if (!file) return
    setProcessing(true)
    try {
      const audioCtx = new AudioContext()
      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

      const sampleRate = audioBuffer.sampleRate
      const startSample = Math.floor(start * sampleRate)
      const endSample = Math.floor(end * sampleRate)
      const length = endSample - startSample
      const numChannels = audioBuffer.numberOfChannels

      const offline = new OfflineAudioContext(numChannels, length, sampleRate)
      const source = offline.createBufferSource()

      // Trim buffer
      const trimmed = offline.createBuffer(numChannels, length, sampleRate)
      for (let ch = 0; ch < numChannels; ch++) {
        const data = audioBuffer.getChannelData(ch).slice(startSample, endSample)
        trimmed.copyToChannel(data, ch)
      }
      source.buffer = trimmed

      if (fade) {
        const gainNode = offline.createGain()
        gainNode.gain.setValueAtTime(0, 0)
        gainNode.gain.linearRampToValueAtTime(1, Math.min(2, (end - start) * 0.1))
        gainNode.gain.setValueAtTime(1, Math.max(0, (end - start) - Math.min(2, (end - start) * 0.1)))
        gainNode.gain.linearRampToValueAtTime(0, end - start)
        source.connect(gainNode)
        gainNode.connect(offline.destination)
      } else {
        source.connect(offline.destination)
      }

      source.start()
      const rendered = await offline.startRendering()

      // WAV
      const numCh = rendered.numberOfChannels
      const len = rendered.length * numCh * 2
      const ab = new ArrayBuffer(44 + len)
      const view = new DataView(ab)
      const ws = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)) }
      ws(0, 'RIFF'); view.setUint32(4, 36 + len, true); ws(8, 'WAVE')
      ws(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true)
      view.setUint16(22, numCh, true); view.setUint32(24, sampleRate, true)
      view.setUint32(28, sampleRate * numCh * 2, true); view.setUint16(32, numCh * 2, true)
      view.setUint16(34, 16, true); ws(36, 'data'); view.setUint32(40, len, true)
      let offset = 44
      for (let i = 0; i < rendered.length; i++) {
        for (let ch = 0; ch < numCh; ch++) {
          const s = Math.max(-1, Math.min(1, rendered.getChannelData(ch)[i]))
          view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
          offset += 2
        }
      }
      const blob = new Blob([ab], { type: 'audio/wav' })
      setResult({ url: URL.createObjectURL(blob), blob, size: blob.size })
    } catch (e) { alert('Error: ' + e.message) }
    setProcessing(false)
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const fmtSize = (b) => (b / 1024).toFixed(0) + ' KB'

  return (
    <ToolLayout icon="📱" name="Ringtone Maker" desc="Create a ringtone from any MP3 — trim and save it">

      <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
        <label className={styles.controlLabel}>Audio/MP3 File Upload karo</label>
        <input type="file" accept="audio/*" onChange={handleFile} style={{ color: 'var(--text2)', fontSize: 13 }} />
      </div>

      {file && (
        <>
          <div className={styles.hint} style={{ marginBottom: 16 }}>
            📁 {file.name} — Total Duration: {fmt(audioDuration)}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className={styles.controlLabel}>Start: {fmt(start)}</span>
              <span className={styles.controlLabel}>End: {fmt(end)}</span>
              <span style={{ fontSize: 13, color: 'var(--accent2)', fontWeight: 600 }}>
                Duration: {end - start}s
              </span>
            </div>

            <div className={styles.controlGroup} style={{ marginBottom: 8 }}>
              <label className={styles.controlLabel}>Start Time</label>
              <input type="range" min={0} max={audioDuration - 1} value={start}
                onChange={e => { const v = +e.target.value; setStart(v); if (end <= v) setEnd(Math.min(audioDuration, v + 1)) }}
                style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </div>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>End Time</label>
              <input type="range" min={start + 1} max={Math.min(audioDuration, start + 40)} value={end}
                onChange={e => setEnd(+e.target.value)}
                style={{ width: '100%', accentColor: 'var(--green)' }} />
            </div>
          </div>

          {/* Quick presets */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {[15, 20, 30, 40].map(s => (
              <button key={s} className={styles.copyBtn} style={{ marginTop: 0 }}
                onClick={() => setEnd(Math.min(audioDuration, start + s))}>
                {s}s
              </button>
            ))}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text2)', marginBottom: 20, cursor: 'pointer' }}>
            <input type="checkbox" checked={fade} onChange={e => setFade(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
            Fade in/out lagao (professional sound)
          </label>

          <button className={styles.actionBtn} onClick={make} disabled={processing}>
            {processing ? <><span className={styles.spinner} /> Creating...</> : '📱 Ringtone Banao'}
          </button>
        </>
      )}

      {result && (
        <div style={{ marginTop: 20 }}>
          <div className={styles.success}>✅ Ringtone ready! ({end - start}s, {fmtSize(result.size)})</div>
          <audio controls src={result.url} style={{ width: '100%', marginTop: 12 }} />
          <button className={styles.actionBtn} style={{ marginTop: 12 }} onClick={() => downloadBlob(result.blob, 'ringtone.wav')}>⬇️ Download Ringtone</button>
        </div>
      )}
    </ToolLayout>
  )
}
