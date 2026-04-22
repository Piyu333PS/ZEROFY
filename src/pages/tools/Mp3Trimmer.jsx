import { useState, useRef, useEffect } from 'react'
import { downloadBlob } from '../../utils/download'
import ToolLayout from '../../components/ToolLayout'
import FileUpload from '../../components/FileUpload'
import styles from '../ToolPage.module.css'

export default function Mp3Trimmer() {
  const [file, setFile] = useState(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [duration, setDuration] = useState(0)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const audioRef = useRef()

  const onFile = ([f]) => {
    setFile(f)
    const url = URL.createObjectURL(f)
    setAudioUrl(url)
    setDone(false)
  }

  const onLoad = () => {
    const dur = audioRef.current.duration
    setDuration(dur)
    setStart(0)
    setEnd(Math.floor(dur))
  }

  const fmt = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const trim = async () => {
    if (!file) return
    setLoading(true)
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioContext()
      const buf = await file.arrayBuffer()
      const decoded = await ctx.decodeAudioData(buf)

      const startSample = Math.floor(start * decoded.sampleRate)
      const endSample = Math.floor(end * decoded.sampleRate)
      const length = endSample - startSample
      const trimmed = ctx.createBuffer(decoded.numberOfChannels, length, decoded.sampleRate)

      for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
        const src = decoded.getChannelData(ch)
        const dst = trimmed.getChannelData(ch)
        for (let i = 0; i < length; i++) dst[i] = src[startSample + i]
      }

      // Convert to WAV
      const wavBuf = bufferToWav(trimmed)
      const blob = new Blob([wavBuf], { type: 'audio/wav' })
      downloadBlob(blob, 'trimmed_' + file.name.replace(/\.[^/.]+$/, '') + '.wav')
      setDone(true)
    } catch (e) {
      alert('Error: ' + e.message)
    }
    setLoading(false)
  }

  function bufferToWav(buffer) {
    const numCh = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const numSamples = buffer.length * numCh
    const arr = new Float32Array(numSamples)
    for (let ch = 0; ch < numCh; ch++) {
      const data = buffer.getChannelData(ch)
      for (let i = 0; i < buffer.length; i++) arr[i * numCh + ch] = data[i]
    }
    const int16 = new Int16Array(numSamples)
    for (let i = 0; i < numSamples; i++) int16[i] = Math.max(-32768, Math.min(32767, arr[i] * 32767))
    const wavHeader = createWavHeader(int16.byteLength, sampleRate, numCh)
    const out = new Uint8Array(wavHeader.byteLength + int16.byteLength)
    out.set(new Uint8Array(wavHeader), 0)
    out.set(new Uint8Array(int16.buffer), wavHeader.byteLength)
    return out.buffer
  }

  function createWavHeader(dataSize, sampleRate, numCh) {
    const buf = new ArrayBuffer(44)
    const view = new DataView(buf)
    const writeStr = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)) }
    writeStr(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true)
    writeStr(8, 'WAVE'); writeStr(12, 'fmt ')
    view.setUint32(16, 16, true); view.setUint16(20, 1, true)
    view.setUint16(22, numCh, true); view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numCh * 2, true); view.setUint16(32, numCh * 2, true)
    view.setUint16(34, 16, true); writeStr(36, 'data')
    view.setUint32(40, dataSize, true)
    return buf
  }

  return (
    <ToolLayout icon="✂️" name="MP3 Trimmer" desc="Audio file ka koi bhi hissa cut karke download karo">
      {!file ? (
        <FileUpload onFiles={onFile}
          accept={{ 'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.aac'] }}
          label="Audio file drag karo (MP3, WAV, OGG, M4A)" />
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
            background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '12px 16px' }}>
            <span style={{ fontSize: 24 }}>🎵</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{file.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Duration: {fmt(duration)}</div>
            </div>
            <button className={styles.copyBtn} onClick={() => { setFile(null); setAudioUrl('') }} style={{ margin: 0 }}>
              Change File
            </button>
          </div>

          <audio ref={audioRef} src={audioUrl} onLoadedMetadata={onLoad} controls
            style={{ width: '100%', marginBottom: 24, borderRadius: 8 }} />

          {duration > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>Start: {fmt(start)}</label>
                  <input type="range" min="0" max={duration} step="0.1" value={start}
                    onChange={e => setStart(Math.min(+e.target.value, end - 0.1))}
                    className={styles.controlInput} />
                </div>
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>End: {fmt(end)}</label>
                  <input type="range" min="0" max={duration} step="0.1" value={end}
                    onChange={e => setEnd(Math.max(+e.target.value, start + 0.1))}
                    className={styles.controlInput} />
                </div>
              </div>

              <div className={styles.success} style={{ marginBottom: 16 }}>
                ✂️ Selected: <strong>{fmt(start)}</strong> se <strong>{fmt(end)}</strong> tak
                ({fmt(end - start)} ka clip)
              </div>

              <button className={styles.actionBtn} onClick={trim} disabled={loading}>
                {loading ? <><span className={styles.spinner} /> Trim ho raha hai...</> : '✂️ Trim & Download Karo'}
              </button>
            </div>
          )}

          {done && <div className={styles.success} style={{ marginTop: 12 }}>✅ Download ho gayi!</div>}
        </div>
      )}
    </ToolLayout>
  )
}
