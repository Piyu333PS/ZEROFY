import { useState, useRef } from 'react'
import { downloadBlob } from '../../utils/download'
import ToolLayout from '../../components/ToolLayout'
import FileUpload from '../../components/FileUpload'
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

const fmtSize = b => b > 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + ' MB' : (b / 1024).toFixed(0) + ' KB'
const fmtTime = s => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`

export default function VideoToAudio() {
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState('')
  const [result, setResult] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [videoInfo, setVideoInfo] = useState(null)
  const videoRef = useRef()

  const onFile = (files) => {
    const f = Array.isArray(files) ? files[0] : files
    if (!f) return
    setFile(f)
    setResult(null)
    setPreviewUrl(null)
    setVideoInfo(null)

    // Get video duration/info
    const url = URL.createObjectURL(f)
    const video = document.createElement('video')
    video.src = url
    video.onloadedmetadata = () => {
      setVideoInfo({ duration: video.duration, name: f.name, size: f.size })
      URL.revokeObjectURL(url)
    }
  }

  const convert = async () => {
    if (!file) return
    setProcessing(true)
    try {
      setProgress('Video load ho raha hai...')
      const arrayBuffer = await file.arrayBuffer()

      setProgress('Audio extract ho raha hai...')
      const audioCtx = new AudioContext()
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

      setProgress('WAV file ban raha hai...')
      const wav = audioBufferToWav(audioBuffer)
      const blob = new Blob([wav], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)

      setPreviewUrl(url)
      setResult({ blob, size: blob.size, name: file.name.replace(/\.[^/.]+$/, '') + '.wav' })
      setProgress('')
    } catch (e) {
      alert('Error: ' + e.message + '\n\nNote: Some video formats cannot be decoded in the browser. Try MP4 or WebM.')
      setProgress('')
    }
    setProcessing(false)
  }

  const download = () => {
    if (!result) return
    downloadBlob(result.blob, result.name)
  }

  return (
    <ToolLayout icon="🎬" name="Video → Audio" desc="Extract audio from a video file — supports MP4, WebM, AVI">
      {!file ? (
        <FileUpload
          onFiles={onFile}
          accept={{ 'video/*': ['.mp4', '.webm', '.mov', '.avi', '.mkv'] }}
          label="Drag or choose video file (MP4, WebM, MOV)"
        />
      ) : (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
            background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '12px 16px'
          }}>
            <span style={{ fontSize: 28 }}>🎬</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{file.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                {fmtSize(file.size)}
                {videoInfo && ` · Duration: ${fmtTime(videoInfo.duration)}`}
              </div>
            </div>
            <button className={styles.copyBtn}
              onClick={() => { setFile(null); setResult(null); setPreviewUrl(null) }}
              style={{ margin: 0 }}>
              Change File
            </button>
          </div>

          {!result && (
            <button className={styles.actionBtn} onClick={convert} disabled={processing}>
              {processing
                ? <><span className={styles.spinner} /> {progress || 'Processing...'}</>
                : '🎵 Extract Audio'}
            </button>
          )}

          {result && (
            <div style={{ marginTop: 16 }}>
              <div className={styles.success}>
                ✅ Audio extract ho gaya! ({fmtSize(result.size)})
              </div>
              <audio controls src={previewUrl} style={{ width: '100%', marginTop: 12, borderRadius: 8 }} />
              <button className={styles.actionBtn} onClick={download} style={{ marginTop: 12 }}>
                ⬇️ Download WAV ({fmtSize(result.size)})
              </button>
            </div>
          )}
        </div>
      )}

      <div className={styles.hint} style={{ marginTop: 16 }}>
        💡 Output will be in WAV format. MP4/WebM are best supported. AVI/MKV may not work.
      </div>
    </ToolLayout>
  )
}
