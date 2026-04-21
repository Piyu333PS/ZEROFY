import { useState } from 'react'
import { downloadBlob } from '../../utils/download'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels
  const length = buffer.length * numChannels * 2
  const ab = new ArrayBuffer(44 + length)
  const view = new DataView(ab)
  const sampleRate = buffer.sampleRate
  const writeStr = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)) }
  writeStr(0, 'RIFF'); view.setUint32(4, 36 + length, true); writeStr(8, 'WAVE')
  writeStr(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true); view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * 2, true); view.setUint16(32, numChannels * 2, true)
  view.setUint16(34, 16, true); writeStr(36, 'data'); view.setUint32(40, length, true)
  let offset = 44
  for (let i = 0; i < buffer.length; i++)
    for (let ch = 0; ch < numChannels; ch++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true); offset += 2
    }
  return ab
}

function downloadAudio(audioBuffer, filename) {
  const wav = audioBufferToWav(audioBuffer)
  const blob = new Blob([wav], { type: 'audio/wav' })
  downloadBlob(blob, filename.replace(/\.[^/.]+$/, '') + '.wav')
  return blob.size
}

const fmtSize = b => b > 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + ' MB' : (b / 1024).toFixed(0) + ' KB'

export default function VolumeBooster() {
  const [file, setFile] = useState(null)
  const [boost, setBoost] = useState(2)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setPreviewUrl(null)
  }

  const process = async () => {
    if (!file) return
    setProcessing(true)
    try {
      const audioCtx = new AudioContext()
      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate)
      const source = offlineCtx.createBufferSource()
      source.buffer = audioBuffer
      const gainNode = offlineCtx.createGain()
      gainNode.gain.value = boost
      source.connect(gainNode)
      gainNode.connect(offlineCtx.destination)
      source.start()
      const rendered = await offlineCtx.startRendering()

      // Preview
      const wav = audioBufferToWav(rendered)
      const blob = new Blob([wav], { type: 'audio/wav' })
      setPreviewUrl(URL.createObjectURL(blob))
      setResult({ buffer: rendered, size: blob.size })
    } catch (e) { alert('Error: ' + e.message) }
    setProcessing(false)
  }

  const download = () => {
    if (!result) return
    downloadAudio(result.buffer, `boosted_${boost}x_${file.name}`)
  }

  return (
    <ToolLayout icon="🔊" name="Volume Booster" desc="Audio file ka volume badhao — 2x, 3x, 5x tak">
      <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
        <label className={styles.controlLabel}>Audio File Upload karo</label>
        <input type="file" accept="audio/*" onChange={handleFile} style={{ color: 'var(--text2)', fontSize: 13 }} />
      </div>

      {file && (
        <>
          <div className={styles.hint} style={{ marginBottom: 16 }}>📁 {file.name} ({fmtSize(file.size)})</div>
          <div className={styles.controlGroup} style={{ marginBottom: 20 }}>
            <label className={styles.controlLabel}>
              Volume Boost: <strong style={{ color: 'var(--accent2)' }}>{boost}x</strong>
              {boost >= 3 && <span style={{ color: '#ffd700', marginLeft: 8, fontSize: 12 }}>⚠️ Distortion ho sakta hai</span>}
            </label>
            <input type="range" min={1} max={5} step={0.1} value={boost}
              onChange={e => setBoost(+e.target.value)} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)' }}>
              <span>1x</span><span>3x</span><span>5x</span>
            </div>
          </div>
          <div className={styles.statsRow}>
            {[1, 1.5, 2, 3].map(b => (
              <button key={b} className={styles.copyBtn} style={{ marginTop: 0, borderColor: boost === b ? 'var(--accent)' : undefined }}
                onClick={() => setBoost(b)}>{b}x</button>
            ))}
          </div>
          <button className={styles.actionBtn} onClick={process} disabled={processing} style={{ marginTop: 16 }}>
            {processing ? <><span className={styles.spinner} /> Processing...</> : '🔊 Volume Boost karo'}
          </button>
        </>
      )}

      {result && (
        <div style={{ marginTop: 20 }}>
          <div className={styles.success}>✅ Volume {boost}x boost ho gaya! ({fmtSize(result.size)})</div>
          <audio controls src={previewUrl} style={{ width: '100%', marginTop: 12 }} />
          <button className={styles.actionBtn} onClick={download} style={{ marginTop: 12 }}>
            ⬇️ Download WAV ({fmtSize(result.size)})
          </button>
        </div>
      )}
      <div className={styles.hint} style={{ marginTop: 16 }}>
        💡 2x se zyada boost karne pe distortion aa sakta hai. Pehle sunke check karo.
      </div>
    </ToolLayout>
  )
}
