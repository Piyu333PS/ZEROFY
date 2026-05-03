import { useState, useRef } from 'react'
import ToolLayout from '../../components/ToolLayout'
import FileUpload from '../../components/FileUpload'
import styles from '../ToolPage.module.css'

const fmtSize = b => {
  if (b > 1024 * 1024 * 1024) return (b / 1024 / 1024 / 1024).toFixed(2) + ' GB'
  if (b > 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + ' MB'
  return (b / 1024).toFixed(0) + ' KB'
}

const fmtTime = s => {
  if (isNaN(s) || !isFinite(s)) return '0:00'
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

const MODES = [
  { key: 'quality', label: 'Quality Control' },
  { key: 'size',    label: 'Target File Size' },
  { key: 'percent', label: 'Reduce by %' },
]

// Map quality level (1-10) to videoBitsPerSecond
// 10 = best quality, 1 = smallest file
function getBitrate(qualityLevel, videoWidth, videoHeight) {
  const pixels = (videoWidth || 1280) * (videoHeight || 720)
  // Base bitrate for 1080p at quality 10 ~ 8 Mbps
  const maxBitrate = Math.min(8000000, pixels * 5.5)
  const minBitrate = Math.max(150000,  pixels * 0.3)
  const t = (qualityLevel - 1) / 9
  return Math.round(minBitrate + t * (maxBitrate - minBitrate))
}

function qualityLevelFromCRF(crf) {
  // CRF 18 (best) -> quality 10, CRF 51 (worst) -> quality 1
  return Math.round(10 - ((crf - 18) / 33) * 9)
}

const QUALITY_LABELS = [
  { max: 20, label: 'Maximum quality (larger file)' },
  { max: 24, label: 'High quality' },
  { max: 28, label: 'Balanced — recommended ✓' },
  { max: 34, label: 'Smaller file size' },
  { max: 42, label: 'Very compressed' },
  { max: 51, label: 'Smallest possible (lower quality)' },
]

function getQualityLabel(crf) {
  return QUALITY_LABELS.find(s => crf <= s.max)?.label || 'Balanced'
}

export default function VideoCompressor() {
  const [file, setFile]             = useState(null)
  const [videoInfo, setVideoInfo]   = useState(null)
  const [mode, setMode]             = useState('quality')
  const [crf, setCrf]               = useState(28)
  const [targetMB, setTargetMB]     = useState(10)
  const [percent, setPercent]       = useState(50)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress]     = useState(0)
  const [step, setStep]             = useState('')
  const [result, setResult]         = useState(null)
  const videoRef = useRef()
  const abortRef = useRef(false)

  const onFile = files => {
    const f = Array.isArray(files) ? files[0] : files
    if (!f) return
    setFile(f)
    setResult(null)
    setProgress(0)
    setStep('')
    const url = URL.createObjectURL(f)
    const vid = document.createElement('video')
    vid.src = url
    vid.onloadedmetadata = () => {
      setVideoInfo({
        duration: vid.duration,
        width: vid.videoWidth,
        height: vid.videoHeight,
        url,
      })
      setTargetMB(Math.max(1, Math.round(f.size / 1024 / 1024 * 0.4)))
    }
  }

  // Calculate bitrate based on selected mode
  const getTargetBitrate = () => {
    const w = videoInfo?.width  || 1280
    const h = videoInfo?.height || 720

    if (mode === 'quality') {
      const ql = qualityLevelFromCRF(crf)
      return getBitrate(ql, w, h)
    }
    if (mode === 'percent') {
      const ql = Math.round(1 + ((100 - percent) / 90) * 9)
      return getBitrate(ql, w, h)
    }
    if (mode === 'size' && videoInfo?.duration) {
      // target bits = targetMB * 8 * 1024 * 1024, minus audio (~128kbps)
      const audioBits = 128000
      const videoBits = Math.max(100000, (targetMB * 8 * 1024 * 1024) / videoInfo.duration - audioBits)
      return Math.round(videoBits)
    }
    return 2000000
  }

  const getEstMB = () => {
    if (!file || !videoInfo?.duration) return null
    const br = getTargetBitrate()
    return ((br * videoInfo.duration) / 8 / 1024 / 1024).toFixed(1)
  }

  const compress = async () => {
    if (!file || !videoInfo) return
    setProcessing(true)
    setResult(null)
    abortRef.current = false

    try {
      setStep('Preparing your video...')
      setProgress(5)

      const video = document.createElement('video')
      video.src = videoInfo.url
      video.muted = true
      await new Promise(res => { video.onloadedmetadata = res; video.load() })

      const canvas = document.createElement('canvas')
      canvas.width  = videoInfo.width  || 1280
      canvas.height = videoInfo.height || 720
      const ctx = canvas.getContext('2d')

      // Seek to start
      await new Promise(res => { video.onseeked = res; video.currentTime = 0 })

      setStep('Starting compression...')
      setProgress(10)

      const canvasStream = canvas.captureStream(30)

      // Try to capture audio too
      let mediaStream = canvasStream
      try {
        if (video.captureStream) {
          const vs = video.captureStream()
          vs.getAudioTracks().forEach(t => mediaStream.addTrack(t))
        }
      } catch { /* audio capture not supported, video-only */ }

      const targetBitrate = getTargetBitrate()
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : 'video/webm'

      const chunks = []
      const recorder = new MediaRecorder(mediaStream, {
        mimeType,
        videoBitsPerSecond: targetBitrate,
        audioBitsPerSecond: 128000,
      })
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }

      const duration = videoInfo.duration

      await new Promise((resolve, reject) => {
        recorder.onstop = resolve
        recorder.onerror = reject
        recorder.start(250)

        video.currentTime = 0

        const drawFrame = () => {
          if (abortRef.current) { recorder.stop(); video.pause(); return }

          const t = video.currentTime
          const pct = Math.min(99, Math.round(10 + (t / duration) * 88))
          setProgress(pct)
          setStep(`Compressing... ${Math.round((t / duration) * 100)}%`)

          if (t >= duration - 0.1 || video.ended) {
            video.pause()
            recorder.stop()
            return
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          requestAnimationFrame(drawFrame)
        }

        video.onplay = () => requestAnimationFrame(drawFrame)
        video.play().catch(reject)
      })

      if (abortRef.current) {
        setProcessing(false)
        setStep('')
        setProgress(0)
        return
      }

      setStep('Finishing up...')
      setProgress(99)

      const blob = new Blob(chunks, { type: mimeType })
      const url  = URL.createObjectURL(blob)
      const ext  = mimeType.includes('mp4') ? 'mp4' : 'webm'
      const saved = Math.max(0, (100 - blob.size / file.size * 100)).toFixed(1)

      setResult({ blob, url, size: blob.size, saved, ext,
        name: file.name.replace(/\.[^.]+$/, '') + `_compressed.${ext}` })
      setProgress(100)
      setStep('Done!')
    } catch (e) {
      console.error(e)
      setStep('Something went wrong. Please try a different video.')
      setProgress(0)
    }
    setProcessing(false)
  }

  const download = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result.url
    a.download = result.name
    a.click()
  }

  const reset = () => {
    abortRef.current = true
    setFile(null); setVideoInfo(null); setResult(null); setProgress(0); setStep('')
  }

  const origMB = file ? file.size / 1024 / 1024 : 100

  return (
    <ToolLayout
      icon="🗜️"
      name="Video Compressor"
      desc="Reduce your video file size — choose your own quality or target size"
    >
      {!file ? (
        <>
          <FileUpload
            onFiles={onFile}
            accept={{ 'video/*': ['.mp4', '.mkv', '.mov', '.avi', '.webm'] }}
            label="Drop your video here — MP4, MKV, MOV, AVI, WebM supported"
            maxSize={2 * 1024 * 1024 * 1024}
          />
          <div className={styles.hint} style={{ marginTop: 16 }}>
            🔒 <strong>100% Private</strong> — Your video never leaves your device. Everything runs locally in your browser. No uploads, no servers.
          </div>
        </>
      ) : (
        <div>
          {/* File info card */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
            background: 'var(--bg3)', borderRadius: 'var(--radius)',
            padding: '12px 16px', border: '1px solid var(--border)'
          }}>
            <span style={{ fontSize: 28 }}>🎬</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                {fmtSize(file.size)}
                {videoInfo && ` · ${videoInfo.width}×${videoInfo.height} · ${fmtTime(videoInfo.duration)}`}
              </div>
            </div>
            <button
              className={styles.copyBtn}
              onClick={reset}
              disabled={processing}
              style={{
                margin: 0, flexShrink: 0,
                opacity: processing ? 0.4 : 1,
                cursor: processing ? 'not-allowed' : 'pointer',
                pointerEvents: processing ? 'none' : 'auto',
              }}
            >
              Change File
            </button>
          </div>

          {/* Mode tabs */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 8 }}>
              How do you want to compress?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {MODES.map(({ key, label }) => (
                <button key={key} onClick={() => setMode(key)} style={{
                  flex: 1, padding: '9px 4px', fontSize: 12, fontWeight: 600,
                  borderRadius: 'var(--radius)',
                  border: mode === key ? 'none' : '1px solid var(--border)',
                  background: mode === key ? 'var(--grad)' : 'var(--bg3)',
                  color: mode === key ? '#fff' : 'var(--text2)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality mode */}
          {mode === 'quality' && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Quality level</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent2)' }}>{getQualityLabel(crf)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>Smaller</span>
                <input type="range" min="18" max="51" step="1" value={crf}
                  onChange={e => setCrf(Number(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>Better</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8, textAlign: 'center' }}>
                Estimated output: <strong style={{ color: 'var(--text2)' }}>~{getEstMB()} MB</strong>
              </div>
            </div>
          )}

          {/* Target size mode */}
          {mode === 'size' && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Target file size</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent2)' }}>{targetMB} MB</span>
              </div>
              <input type="range" min="1" max={Math.max(2, Math.round(origMB))} step="1"
                value={targetMB} onChange={e => setTargetMB(Number(e.target.value))} style={{ width: '100%' }} />
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8, textAlign: 'center' }}>
                {fmtSize(file.size)} → <strong style={{ color: 'var(--text2)' }}>~{targetMB} MB</strong>
              </div>
            </div>
          )}

          {/* Percent mode */}
          {mode === 'percent' && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Reduce size by</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent2)' }}>{percent}%</span>
              </div>
              <input type="range" min="10" max="90" step="5" value={percent}
                onChange={e => setPercent(Number(e.target.value))} style={{ width: '100%' }} />
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8, textAlign: 'center' }}>
                {fmtSize(file.size)} → <strong style={{ color: 'var(--text2)' }}>~{(origMB * (1 - percent / 100)).toFixed(1)} MB</strong>
              </div>
            </div>
          )}

          {/* Compress button */}
          {!result && (
            <button className={styles.actionBtn} onClick={compress} disabled={processing}>
              {processing
                ? <><span className={styles.spinner} /> Please wait...</>
                : '🗜️ Compress Video'}
            </button>
          )}

          {/* Progress section */}
          {processing && (
            <div style={{
              marginTop: 16, padding: '16px 20px',
              background: 'var(--bg3)', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>
                  {progress < 10 ? '⚙️' : progress < 99 ? '🗜️' : '✅'}
                </span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{step}</span>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: 10, background: 'var(--surface2)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'var(--grad)',
                  borderRadius: 6,
                  transition: 'width 0.3s ease',
                  boxShadow: '0 0 10px rgba(59,130,246,0.5)'
                }} />
              </div>

              {/* % label */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                  {progress < 10 ? 'Preparing...' : progress < 99 ? 'Compressing your video...' : 'Almost done...'}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent2)' }}>{progress}%</span>
              </div>

              <div style={{
                fontSize: 12, color: 'var(--text3)', marginTop: 12,
                textAlign: 'center', padding: '8px 0',
                borderTop: '1px solid var(--border)'
              }}>
                ☕ Large videos may take a few minutes. Please keep this tab open and don't close it.
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={{ marginTop: 16 }}>
              <div className={styles.success}>
                ✅ Done! Your video has been compressed successfully.
              </div>
              <div className={styles.statsRow} style={{ marginTop: 12 }}>
                <div className={styles.statCard}>
                  <span className={styles.statNum}>{fmtSize(file.size)}</span>
                  <span className={styles.statLbl}>Original size</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNum}>{fmtSize(result.size)}</span>
                  <span className={styles.statLbl}>New size</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNum}>{result.saved}%</span>
                  <span className={styles.statLbl}>Space saved</span>
                </div>
              </div>
              {/* File summary card — replaces heavy video preview */}
              <div style={{
                marginTop: 12, padding: '14px 16px',
                background: 'var(--bg3)', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 32 }}>🎬</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                    {result.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
                    {fmtSize(file.size)} → <strong style={{ color: 'var(--accent2)' }}>{fmtSize(result.size)}</strong>
                    &nbsp;·&nbsp;Saved {result.saved}%
                  </div>
                </div>
              </div>
              <button className={styles.actionBtn} onClick={download} style={{ marginTop: 12 }}>
                ⬇️ Download Compressed Video ({fmtSize(result.size)})
              </button>
              <button className={styles.copyBtn} onClick={reset}
                style={{ width: '100%', marginTop: 8, textAlign: 'center' }}>
                🔄 Compress Another Video
              </button>
            </div>
          )}

          {!processing && !result && (
            <div className={styles.hint} style={{ marginTop: 16 }}>
              🔒 <strong>100% Private</strong> — Your video stays on your device. Output will be in WebM/MP4 format. Compression time depends on video length and your device speed.
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  )
}
