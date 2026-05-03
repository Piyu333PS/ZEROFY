import { useState, useRef, useEffect } from 'react'
import { downloadBlob } from '../../utils/download'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

export default function AudioRecorder() {
  const [status, setStatus] = useState('idle') // idle, recording, paused, done
  const [recordings, setRecordings] = useState([])
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState('')
  const mediaRecorder = useRef(null)
  const chunks = useRef([])
  const timerRef = useRef(null)
  const streamRef = useRef(null)
  const analyserRef = useRef(null)
  const animRef = useRef(null)
  const canvasRef = useRef(null)

  const startTimer = () => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
  }

  const stopTimer = () => { clearInterval(timerRef.current) }

  const drawWave = () => {
    if (!analyserRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const bufLen = analyserRef.current.frequencyBinCount
    const data = new Uint8Array(bufLen)
    analyserRef.current.getByteTimeDomainData(data)

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#6c63ff'
    ctx.lineWidth = 2
    ctx.beginPath()
    const slice = canvas.width / bufLen
    let x = 0
    for (let i = 0; i < bufLen; i++) {
      const v = data[i] / 128
      const y = (v * canvas.height) / 2
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      x += slice
    }
    ctx.stroke()
    animRef.current = requestAnimationFrame(drawWave)
  }

  const start = async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser

      chunks.current = []
      mediaRecorder.current = new MediaRecorder(stream)
      mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data)
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        const name = `Recording_${new Date().toLocaleTimeString().replace(/:/g, '-')}`
        setRecordings(prev => [...prev, { url, blob, name, size: blob.size, duration }])
        setStatus('done')
        cancelAnimationFrame(animRef.current)
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d')
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
      }
      mediaRecorder.current.start()
      setStatus('recording')
      setDuration(0)
      startTimer()
      drawWave()
    } catch (e) {
      setError('❌ Microphone access denied! Please allow microphone permission.')
    }
  }

  const pause = () => {
    mediaRecorder.current?.pause()
    stopTimer()
    cancelAnimationFrame(animRef.current)
    setStatus('paused')
  }

  const resume = () => {
    mediaRecorder.current?.resume()
    startTimer()
    drawWave()
    setStatus('recording')
  }

  const stop = () => {
    mediaRecorder.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    stopTimer()
    setStatus('done')
  }

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const fmtSize = (b) => b > 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + ' MB' : (b / 1024).toFixed(0) + ' KB'

  useEffect(() => () => { stopTimer(); cancelAnimationFrame(animRef.current) }, [])

  return (
    <ToolLayout icon="🎤" name="Audio Recorder" desc="Record audio directly from your microphone">

      {/* Timer & Waveform */}
      <div style={{
        textAlign: 'center', padding: '32px 0',
        background: 'var(--bg3)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', marginBottom: 20
      }}>
        <div style={{ fontSize: 56, fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: 2 }}>
          {fmt(duration)}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4, marginBottom: 12 }}>
          {status === 'idle' && 'Record shuru karne ke liye button dabao'}
          {status === 'recording' && '🔴 Recording...'}
          {status === 'paused' && '⏸ Paused'}
          {status === 'done' && '✅ Recording complete'}
        </div>
        <canvas ref={canvasRef} width={300} height={60}
          style={{ display: status === 'recording' ? 'block' : 'none', margin: '0 auto' }} />
      </div>

      {error && <div style={{ color: '#ff4d4d', marginBottom: 12, fontSize: 14 }}>{error}</div>}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
        {status === 'idle' || status === 'done' ? (
          <button className={styles.actionBtn} style={{ maxWidth: 200 }} onClick={start}>
            🎤 Start Recording
          </button>
        ) : (
          <>
            {status === 'recording' ? (
              <button className={styles.actionBtn} onClick={pause}
                style={{ background: 'var(--orange)', flex: 1, maxWidth: 150 }}>⏸ Pause</button>
            ) : (
              <button className={styles.actionBtn} onClick={resume}
                style={{ background: 'var(--green)', flex: 1, maxWidth: 150 }}>▶ Resume</button>
            )}
            <button className={styles.actionBtn} onClick={stop}
              style={{ background: '#ff4d4d', flex: 1, maxWidth: 150 }}>⏹ Stop</button>
          </>
        )}
      </div>

      {/* Recordings list */}
      {recordings.length > 0 && (
        <div>
          <div className={styles.fileListTitle}>Recordings ({recordings.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recordings.map((rec, i) => (
              <div key={i} className={styles.fileItem}>
                <span style={{ fontSize: 24 }}>🎵</span>
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{rec.name}</div>
                  <div className={styles.fileSize}>{fmtSize(rec.size)}</div>
                  <audio controls src={rec.url} style={{ width: '100%', marginTop: 8, height: 32 }} />
                </div>
                <div className={styles.fileActions}>
                  <button title="Download" onClick={() => downloadBlob(rec.blob, rec.name + '.webm')}>⬇️</button>
                  <button className={styles.removeBtn} onClick={() => setRecordings(prev => prev.filter((_, idx) => idx !== i))} title="Delete">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
