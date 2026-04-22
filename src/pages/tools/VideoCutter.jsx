import { useState, useRef, useEffect } from 'react'
import ToolLayout from '../../components/ToolLayout'
import FileUpload from '../../components/FileUpload'
import styles from '../ToolPage.module.css'

const fmtTime = (s) => {
  if (isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const ms = Math.floor((s % 1) * 10)
  return `${m}:${sec.toString().padStart(2, '0')}.${ms}`
}

const fmtSize = b => b > 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + ' MB' : (b / 1024).toFixed(0) + ' KB'

export default function VideoCutter() {
  const [file, setFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [duration, setDuration] = useState(0)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState('')
  const [result, setResult] = useState(null)
  const [resultUrl, setResultUrl] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const videoRef = useRef()

  const onFile = (files) => {
    const f = Array.isArray(files) ? files[0] : files
    if (!f) return
    const url = URL.createObjectURL(f)
    setFile(f)
    setVideoUrl(url)
    setResult(null)
    setResultUrl(null)
    setStart(0)
    setEnd(0)
  }

  const onLoadedMetadata = () => {
    const dur = videoRef.current?.duration || 0
    setDuration(dur)
    setEnd(dur)
  }

  const onTimeUpdate = () => {
    setCurrentTime(videoRef.current?.currentTime || 0)
  }

  const setStartToCurrent = () => setStart(Math.min(currentTime, end - 0.1))
  const setEndToCurrent = () => setEnd(Math.max(currentTime, start + 0.1))

  const cut = async () => {
    if (!file) return
    setProcessing(true)
    setProgress('Video load ho raha hai...')
    try {
      // Use MediaRecorder + video element approach for browser-based cutting
      const video = document.createElement('video')
      video.src = videoUrl
      video.muted = false

      await new Promise((res) => { video.onloadedmetadata = res })

      setProgress('Recording setup ho raha hai...')

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      await new Promise((res) => {
        video.onseeked = res
        video.currentTime = start
      })

      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 360

      const canvasStream = canvas.captureStream(30)

      // Add audio track from video if possible
      let stream = canvasStream
      try {
        if (video.captureStream) {
          const videoStream = video.captureStream()
          const audioTracks = videoStream.getAudioTracks()
          audioTracks.forEach(t => stream.addTrack(t))
        }
      } catch { /* audio capture not supported */ }

      const chunks = []
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/mp4'

      const recorder = new MediaRecorder(stream, { mimeType })
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }

      setProgress('Video cut ho raha hai...')

      await new Promise((resolve, reject) => {
        recorder.onstop = resolve
        recorder.onerror = reject
        recorder.start(100)

        video.currentTime = start
        video.play()

        const drawFrame = () => {
          if (video.currentTime >= end || video.ended) {
            video.pause()
            recorder.stop()
            return
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          requestAnimationFrame(drawFrame)
        }

        video.onseeked = () => {
          video.play().then(drawFrame)
        }
      })

      setProgress('File ban rahi hai...')
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
      const blob = new Blob(chunks, { type: mimeType })
      const url = URL.createObjectURL(blob)
      setResult({ blob, size: blob.size, ext })
      setResultUrl(url)
      setProgress('')
    } catch (e) {
      alert('Error: ' + e.message)
      setProgress('')
    }
    setProcessing(false)
  }

  const download = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = resultUrl
    a.download = `cut_${file.name.replace(/\.[^/.]+$/, '')}.${result.ext}`
    a.click()
  }

  const clipDuration = end - start

  return (
    <ToolLayout icon="✂️" name="Video Cutter" desc="Video ka koi bhi hissa cut karke download karo">
      {!file ? (
        <FileUpload
          onFiles={onFile}
          accept={{ 'video/*': ['.mp4', '.webm', '.mov'] }}
          label="Video file drag karo (MP4, WebM, MOV)"
        />
      ) : (
        <div>
          <div style={{ marginBottom: 16 }}>
            <video
              ref={videoRef}
              src={videoUrl}
              onLoadedMetadata={onLoadedMetadata}
              onTimeUpdate={onTimeUpdate}
              controls
              style={{ width: '100%', borderRadius: 'var(--radius)', background: '#000', maxHeight: 320 }}
            />
          </div>

          {duration > 0 && (
            <>
              {/* Timeline bar */}
              <div style={{
                position: 'relative', height: 40, background: 'var(--bg3)',
                borderRadius: 8, marginBottom: 16, overflow: 'hidden'
              }}>
                {/* Selected region */}
                <div style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: `${(start / duration) * 100}%`,
                  width: `${((end - start) / duration) * 100}%`,
                  background: 'rgba(108,99,255,0.4)',
                  borderLeft: '2px solid var(--accent)',
                  borderRight: '2px solid var(--accent)',
                }} />
                {/* Current time indicator */}
                <div style={{
                  position: 'absolute', top: 0, bottom: 0, width: 2,
                  background: '#ff6584',
                  left: `${(currentTime / duration) * 100}%`,
                }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>
                    Start: <strong>{fmtTime(start)}</strong>
                  </label>
                  <input type="range" min={0} max={duration} step={0.1} value={start}
                    onChange={e => setStart(Math.min(+e.target.value, end - 0.5))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }} />
                  <button className={styles.copyBtn} style={{ marginTop: 6, fontSize: 12 }}
                    onClick={setStartToCurrent}>
                    ⏱ Current time set karo ({fmtTime(currentTime)})
                  </button>
                </div>
                <div className={styles.controlGroup}>
                  <label className={styles.controlLabel}>
                    End: <strong>{fmtTime(end)}</strong>
                  </label>
                  <input type="range" min={0} max={duration} step={0.1} value={end}
                    onChange={e => setEnd(Math.max(+e.target.value, start + 0.5))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }} />
                  <button className={styles.copyBtn} style={{ marginTop: 6, fontSize: 12 }}
                    onClick={setEndToCurrent}>
                    ⏱ Current time set karo ({fmtTime(currentTime)})
                  </button>
                </div>
              </div>

              <div className={styles.success} style={{ marginBottom: 16 }}>
                ✂️ Selected clip: <strong>{fmtTime(start)}</strong> → <strong>{fmtTime(end)}</strong>
                &nbsp;({fmtTime(clipDuration)} ka clip)
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className={styles.copyBtn}
                  onClick={() => { setFile(null); setVideoUrl(null) }}
                  style={{ margin: 0 }}>
                  🔄 New Video
                </button>
                <button className={styles.actionBtn} style={{ flex: 1 }} onClick={cut} disabled={processing}>
                  {processing
                    ? <><span className={styles.spinner} /> {progress || 'Processing...'}</>
                    : '✂️ Cut & Download Karo'}
                </button>
              </div>
            </>
          )}

          {result && (
            <div style={{ marginTop: 20 }}>
              <div className={styles.success}>✅ Video cut ho gayi! ({fmtSize(result.size)})</div>
              <video controls src={resultUrl}
                style={{ width: '100%', marginTop: 12, borderRadius: 8, background: '#000', maxHeight: 300 }} />
              <button className={styles.actionBtn} onClick={download} style={{ marginTop: 12 }}>
                ⬇️ Download ({result.ext.toUpperCase()}, {fmtSize(result.size)})
              </button>
            </div>
          )}
        </div>
      )}

      <div className={styles.hint} style={{ marginTop: 16 }}>
        💡 Video ko pehle play karo, jahan se cut karna hai wahan pause karo, phir "Current time set karo" click karo.
        WebM/MP4 best support hai.
      </div>
    </ToolLayout>
  )
}
