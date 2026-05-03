import { useState, useRef, useCallback } from 'react'
import ToolLayout from '../../components/ToolLayout'

const fmtTime = (s) => {
  if (isNaN(s) || s < 0) return '0:00.0'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const ms = Math.floor((s % 1) * 10)
  return `${m}:${sec.toString().padStart(2, '0')}.${ms}`
}

const fmtSize = b => b > 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + ' MB' : (b / 1024).toFixed(0) + ' KB'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

.vc-wrap {
  --bg: #0C0B18;
  --surface: #131224;
  --surface2: #1A1830;
  --surface3: #221F3A;
  --border: rgba(255,255,255,0.07);
  --border2: rgba(255,255,255,0.14);
  --text: #EEEAFF;
  --text2: #9B96C8;
  --text3: #524E7A;
  --accent: #6C5FFF;
  --accent2: #9B8FFF;
  --accent-glow: rgba(108,95,255,0.35);
  --red: #FF5C7A;
  --green: #2DD4A0;
  --yellow: #F5C842;
  --mono: 'JetBrains Mono', monospace;
  font-family: 'Outfit', sans-serif;
  color: var(--text);
  background: transparent;
}
.vc-wrap * { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Drop Zone ── */
.vc-drop {
  border: 2px dashed rgba(108,95,255,0.3);
  border-radius: 20px;
  padding: 60px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: radial-gradient(ellipse at 50% 60%, rgba(108,95,255,0.07) 0%, transparent 70%);
  position: relative; overflow: hidden;
}
.vc-drop::after {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 50% 40%, rgba(108,95,255,0.13) 0%, transparent 65%);
  opacity: 0; transition: opacity 0.3s;
}
.vc-drop:hover, .vc-drop.over { border-color: var(--accent); }
.vc-drop:hover::after, .vc-drop.over::after { opacity: 1; }
.vc-drop.over { transform: scale(1.01); }

.vc-drop-icon {
  width: 80px; height: 80px; border-radius: 22px; margin: 0 auto 20px;
  background: linear-gradient(135deg, rgba(108,95,255,0.18), rgba(155,143,255,0.12));
  border: 1px solid rgba(108,95,255,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 36px;
  box-shadow: 0 0 48px rgba(108,95,255,0.2);
  position: relative; z-index: 1;
}
.vc-drop h2 {
  font-size: 20px; font-weight: 700; color: var(--text);
  margin-bottom: 6px; position: relative; z-index: 1;
}
.vc-drop p {
  font-size: 13px; color: var(--text3); margin-bottom: 22px;
  position: relative; z-index: 1;
}
.vc-browse {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 11px 26px; border-radius: 12px; border: none;
  background: linear-gradient(135deg, #6C5FFF, #9B8FFF);
  color: #fff; font-size: 14px; font-weight: 600;
  font-family: 'Outfit', sans-serif;
  cursor: pointer; position: relative; z-index: 1;
  box-shadow: 0 4px 24px rgba(108,95,255,0.45);
  transition: all 0.2s;
}
.vc-browse:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(108,95,255,0.55); }
.vc-fmt-pills { display: flex; gap: 6px; justify-content: center; margin-top: 16px; position: relative; z-index: 1; }
.vc-fmt-pill {
  font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
  padding: 3px 10px; border-radius: 20px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  color: var(--text3);
}

/* ── Video Player ── */
.vc-player-wrap {
  border-radius: 16px; overflow: hidden;
  border: 1px solid var(--border);
  background: #000;
  box-shadow: 0 16px 48px rgba(0,0,0,0.6);
  margin-bottom: 20px;
}
.vc-player-wrap video {
  width: 100%; display: block; max-height: 340px; background: #000;
}

/* ── File Info Bar ── */
.vc-info-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px; margin-bottom: 16px;
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 12px; flex-wrap: wrap;
}
.vc-info-name {
  font-size: 13px; font-weight: 600; color: var(--text2);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;
}
.vc-info-pill {
  font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
  padding: 3px 10px; border-radius: 20px;
  background: rgba(108,95,255,0.14); border: 1px solid rgba(108,95,255,0.3);
  color: var(--accent2);
}
.vc-new-btn {
  margin-left: auto; font-size: 12px; font-weight: 600;
  color: var(--text3); background: rgba(255,255,255,0.05);
  border: 1px solid var(--border); border-radius: 8px;
  padding: 5px 12px; cursor: pointer; font-family: 'Outfit', sans-serif;
  transition: all 0.15s;
}
.vc-new-btn:hover { color: var(--text); background: rgba(255,255,255,0.1); }

/* ── Timeline ── */
.vc-timeline-card {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 16px; padding: 18px; margin-bottom: 16px;
}
.vc-tl-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--text3); margin-bottom: 12px;
  display: flex; align-items: center; gap: 6px;
}
.vc-tl-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 6px var(--accent-glow); }

.vc-timeline {
  position: relative; height: 48px; border-radius: 10px;
  background: var(--surface3); overflow: hidden; margin-bottom: 14px;
  cursor: pointer;
}
.vc-tl-selected {
  position: absolute; top: 0; bottom: 0;
  background: rgba(108,95,255,0.22);
  border-left: 3px solid var(--accent);
  border-right: 3px solid var(--accent);
  transition: left 0.05s, width 0.05s;
}
.vc-tl-ticks {
  position: absolute; inset: 0;
  display: flex; align-items: flex-end; padding-bottom: 4px;
  pointer-events: none;
}
.vc-tl-tick {
  flex: 1; border-left: 1px solid rgba(255,255,255,0.05);
  height: 8px; align-self: flex-end;
}
.vc-tl-playhead {
  position: absolute; top: 0; bottom: 0; width: 2px;
  background: var(--red);
  box-shadow: 0 0 8px var(--red);
  pointer-events: none; transition: left 0.1s linear;
}
.vc-tl-playhead::before {
  content: '';
  position: absolute; top: 0; left: -4px;
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--red); box-shadow: 0 0 10px var(--red);
}

/* ── Range Inputs ── */
.vc-range-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
@media (max-width: 540px) { .vc-range-row { grid-template-columns: 1fr; } }

.vc-range-block {
  background: var(--surface3); border: 1px solid var(--border);
  border-radius: 12px; padding: 12px 14px;
}
.vc-range-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
}
.vc-range-label { font-size: 11px; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; }
.vc-range-time {
  font-family: var(--mono); font-size: 14px; font-weight: 600;
  color: var(--accent2);
  background: rgba(108,95,255,0.12); border: 1px solid rgba(108,95,255,0.2);
  padding: 2px 8px; border-radius: 6px;
}
input[type=range].vc-slider {
  width: 100%; height: 4px; appearance: none;
  background: rgba(255,255,255,0.1); border-radius: 2px;
  outline: none; cursor: pointer; margin-bottom: 8px;
}
input[type=range].vc-slider::-webkit-slider-thumb {
  appearance: none; width: 16px; height: 16px; border-radius: 50%;
  background: var(--accent); border: 2px solid #fff;
  box-shadow: 0 0 10px var(--accent-glow);
  cursor: pointer;
}
.vc-set-btn {
  width: 100%; padding: 7px; border-radius: 8px;
  border: 1px solid rgba(108,95,255,0.25);
  background: rgba(108,95,255,0.1); color: var(--accent2);
  font-size: 12px; font-weight: 600; font-family: 'Outfit', sans-serif;
  cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center; gap: 5px;
}
.vc-set-btn:hover { background: rgba(108,95,255,0.2); border-color: var(--accent); }

/* ── Clip Summary ── */
.vc-clip-summary {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
  background: rgba(108,95,255,0.08); border: 1px solid rgba(108,95,255,0.2);
  border-radius: 12px; flex-wrap: wrap;
}
.vc-clip-stat { display: flex; flex-direction: column; align-items: center; flex: 1; }
.vc-clip-val { font-family: var(--mono); font-size: 16px; font-weight: 700; color: var(--accent2); }
.vc-clip-lbl { font-size: 10px; color: var(--text3); margin-top: 2px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
.vc-divider { width: 1px; height: 36px; background: var(--border); }

/* ── Action Buttons ── */
.vc-actions { display: flex; gap: 10px; margin-top: 16px; }
.vc-cut-btn {
  flex: 1; padding: 15px 20px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #6C5FFF 0%, #9B8FFF 100%);
  color: #fff; font-size: 15px; font-weight: 700;
  font-family: 'Outfit', sans-serif; cursor: pointer;
  box-shadow: 0 6px 28px rgba(108,95,255,0.45);
  transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; gap: 10px;
}
.vc-cut-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(108,95,255,0.6); }
.vc-cut-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

/* ── Progress ── */
.vc-progress-card {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 14px; padding: 18px; margin-top: 16px;
}
.vc-progress-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.vc-progress-msg { font-size: 13px; font-weight: 600; color: var(--text2); }
.vc-progress-pct { font-family: var(--mono); font-size: 13px; color: var(--accent); font-weight: 700; }
.vc-bar { height: 6px; border-radius: 3px; background: rgba(255,255,255,0.07); overflow: hidden; }
.vc-bar-fill {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, #6C5FFF, #9B8FFF);
  box-shadow: 0 0 12px rgba(108,95,255,0.5);
  transition: width 0.4s ease;
}

/* ── Result ── */
.vc-result-card {
  background: rgba(45,212,160,0.06); border: 1px solid rgba(45,212,160,0.25);
  border-radius: 16px; padding: 18px; margin-top: 18px;
}
.vc-result-header {
  display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
}
.vc-result-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: rgba(45,212,160,0.15); border: 1px solid rgba(45,212,160,0.3);
  display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
}
.vc-result-title { font-size: 15px; font-weight: 700; color: var(--green); }
.vc-result-sub { font-size: 12px; color: var(--text3); margin-top: 2px; }
.vc-result-video {
  width: 100%; border-radius: 10px; background: #000;
  display: block; max-height: 280px; margin-bottom: 14px;
  border: 1px solid var(--border);
}
.vc-dl-btn {
  width: 100%; padding: 13px; border-radius: 12px; border: none;
  background: linear-gradient(135deg, #2DD4A0, #1fa87e);
  color: #fff; font-size: 14px; font-weight: 700;
  font-family: 'Outfit', sans-serif; cursor: pointer;
  box-shadow: 0 4px 20px rgba(45,212,160,0.35);
  transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.vc-dl-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(45,212,160,0.5); }

/* ── Hint ── */
.vc-hint {
  display: flex; align-items: flex-start; gap: 10px;
  margin-top: 16px; padding: 12px 16px;
  background: rgba(245,200,66,0.07); border: 1px solid rgba(245,200,66,0.18);
  border-radius: 12px;
}
.vc-hint-icon { font-size: 15px; flex-shrink: 0; margin-top: 1px; }
.vc-hint p { font-size: 12px; color: var(--text3); line-height: 1.6; }
.vc-hint strong { color: var(--yellow); }

/* ── Spinner ── */
@keyframes vc-spin { to { transform: rotate(360deg); } }
.vc-spinner {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
  animation: vc-spin 0.7s linear infinite; flex-shrink: 0;
}

/* ── Animations ── */
@keyframes vc-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.vc-up { animation: vc-up 0.3s ease forwards; }
`

export default function VideoCutter() {
  const [file, setFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [duration, setDuration] = useState(0)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState('')
  const [progressPct, setProgressPct] = useState(0)
  const [result, setResult] = useState(null)
  const [resultUrl, setResultUrl] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [dragging, setDragging] = useState(false)
  const videoRef = useRef()
  const fileRef = useRef()

  const loadFile = useCallback((f) => {
    if (!f) return
    const url = URL.createObjectURL(f)
    setFile(f); setVideoUrl(url)
    setResult(null); setResultUrl(null); setStart(0); setEnd(0)
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('video/')) loadFile(f)
  }, [loadFile])

  const onLoadedMetadata = () => {
    const dur = videoRef.current?.duration || 0
    setDuration(dur); setEnd(dur)
  }
  const onTimeUpdate = () => setCurrentTime(videoRef.current?.currentTime || 0)

  const cut = async () => {
    if (!file) return
    setProcessing(true); setProgressPct(0)
    setProgress('Loading video...')
    try {
      const video = document.createElement('video')
      video.src = videoUrl; video.muted = false
      await new Promise(res => { video.onloadedmetadata = res })

      setProgress('Setting up recorder...')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      await new Promise(res => { video.onseeked = res; video.currentTime = start })
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 360

      const canvasStream = canvas.captureStream(30)
      let stream = canvasStream
      try {
        if (video.captureStream) {
          const vs = video.captureStream()
          vs.getAudioTracks().forEach(t => stream.addTrack(t))
        }
      } catch { }

      const chunks = []
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4'

      const recorder = new MediaRecorder(stream, { mimeType })
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }

      setProgress('Cutting your video...')
      const clipLen = end - start

      await new Promise((resolve, reject) => {
        recorder.onstop = resolve; recorder.onerror = reject
        recorder.start(100)
        video.currentTime = start
        video.play()

        const drawFrame = () => {
          if (video.currentTime >= end || video.ended) {
            video.pause(); recorder.stop(); return
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const pct = Math.min(100, Math.round(((video.currentTime - start) / clipLen) * 100))
          setProgressPct(pct)
          requestAnimationFrame(drawFrame)
        }
        video.onseeked = () => { video.play().then(drawFrame) }
      })

      setProgress('Saving file...')
      setProgressPct(100)
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
      const blob = new Blob(chunks, { type: mimeType })
      setResult({ blob, size: blob.size, ext })
      setResultUrl(URL.createObjectURL(blob))
      setProgress('')
    } catch (e) { alert('Error: ' + e.message); setProgress('') }
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
  const ticks = Array.from({ length: 20 })

  return (
    <ToolLayout icon="✂️" name="Video Cutter" desc="Cut any part of a video and download it">
      <style>{CSS}</style>
      <div className="vc-wrap">

        {!file ? (
          /* ── Drop Zone ── */
          <div
            className={`vc-drop${dragging ? ' over' : ''}`}
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }}
              onChange={e => loadFile(e.target.files[0])} />
            <div className="vc-drop-icon">🎬</div>
            <h2>{dragging ? 'Drop it here!' : 'Drop your video here'}</h2>
            <p>Or choose from your device</p>
            <button className="vc-browse" onClick={e => { e.stopPropagation(); fileRef.current?.click() }}>
              📁 Browse Video
            </button>
            <div className="vc-fmt-pills">
              {['MP4', 'WebM', 'MOV', 'MKV'].map(f => <span key={f} className="vc-fmt-pill">{f}</span>)}
            </div>
          </div>
        ) : (
          <div className="vc-up">
            {/* File info bar */}
            <div className="vc-info-bar">
              <span style={{ fontSize: 16 }}>🎬</span>
              <span className="vc-info-name">{file.name}</span>
              <span className="vc-info-pill">{fmtSize(file.size)}</span>
              <span className="vc-info-pill">{fmtTime(duration)}</span>
              <button className="vc-new-btn" onClick={() => { setFile(null); setVideoUrl(null); setResult(null) }}>
                ↩ New Video
              </button>
            </div>

            {/* Video Player */}
            <div className="vc-player-wrap">
              <video
                ref={videoRef}
                src={videoUrl}
                onLoadedMetadata={onLoadedMetadata}
                onTimeUpdate={onTimeUpdate}
                controls
              />
            </div>

            {duration > 0 && (
              <>
                {/* Timeline */}
                <div className="vc-timeline-card">
                  <div className="vc-tl-label">
                    <span className="vc-tl-dot" />
                    Timeline — Drag sliders to select clip range
                  </div>

                  <div className="vc-timeline">
                    {ticks.map((_, i) => <div key={i} className="vc-tl-tick" />)}
                    <div className="vc-tl-selected" style={{
                      left: `${(start / duration) * 100}%`,
                      width: `${((end - start) / duration) * 100}%`
                    }} />
                    <div className="vc-tl-playhead" style={{ left: `${(currentTime / duration) * 100}%` }} />
                  </div>

                  {/* Range sliders */}
                  <div className="vc-range-row">
                    <div className="vc-range-block">
                      <div className="vc-range-header">
                        <span className="vc-range-label">▶ Start</span>
                        <span className="vc-range-time">{fmtTime(start)}</span>
                      </div>
                      <input type="range" className="vc-slider"
                        min={0} max={duration} step={0.1} value={start}
                        onChange={e => setStart(Math.min(+e.target.value, end - 0.5))}
                      />
                      <button className="vc-set-btn" onClick={() => setStart(Math.min(currentTime, end - 0.1))}>
                        ⏱ Set to current ({fmtTime(currentTime)})
                      </button>
                    </div>
                    <div className="vc-range-block">
                      <div className="vc-range-header">
                        <span className="vc-range-label">⏹ End</span>
                        <span className="vc-range-time">{fmtTime(end)}</span>
                      </div>
                      <input type="range" className="vc-slider"
                        min={0} max={duration} step={0.1} value={end}
                        onChange={e => setEnd(Math.max(+e.target.value, start + 0.5))}
                      />
                      <button className="vc-set-btn" onClick={() => setEnd(Math.max(currentTime, start + 0.1))}>
                        ⏱ Set to current ({fmtTime(currentTime)})
                      </button>
                    </div>
                  </div>

                  {/* Clip Summary */}
                  <div className="vc-clip-summary">
                    <div className="vc-clip-stat">
                      <div className="vc-clip-val">{fmtTime(start)}</div>
                      <div className="vc-clip-lbl">Start</div>
                    </div>
                    <div className="vc-divider" />
                    <div className="vc-clip-stat">
                      <div className="vc-clip-val" style={{ color: 'var(--yellow)' }}>{fmtTime(clipDuration)}</div>
                      <div className="vc-clip-lbl">Clip Length</div>
                    </div>
                    <div className="vc-divider" />
                    <div className="vc-clip-stat">
                      <div className="vc-clip-val">{fmtTime(end)}</div>
                      <div className="vc-clip-lbl">End</div>
                    </div>
                  </div>
                </div>

                {/* Cut Button */}
                <div className="vc-actions">
                  <button className="vc-cut-btn" onClick={cut} disabled={processing}>
                    {processing
                      ? <><div className="vc-spinner" /> {progress || 'Processing...'}</>
                      : <>✂️ Cut & Download Clip</>
                    }
                  </button>
                </div>

                {/* Progress Bar */}
                {processing && (
                  <div className="vc-progress-card vc-up">
                    <div className="vc-progress-top">
                      <span className="vc-progress-msg">{progress}</span>
                      <span className="vc-progress-pct">{progressPct}%</span>
                    </div>
                    <div className="vc-bar">
                      <div className="vc-bar-fill" style={{ width: progressPct + '%' }} />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Result */}
            {result && (
              <div className="vc-result-card vc-up">
                <div className="vc-result-header">
                  <div className="vc-result-icon">✅</div>
                  <div>
                    <div className="vc-result-title">Clip Ready!</div>
                    <div className="vc-result-sub">
                      {fmtTime(clipDuration)} clip · {fmtSize(result.size)} · {result.ext.toUpperCase()}
                    </div>
                  </div>
                </div>
                <video className="vc-result-video" controls src={resultUrl} />
                <button className="vc-dl-btn" onClick={download}>
                  ⬇️ Download Clip ({result.ext.toUpperCase()} · {fmtSize(result.size)})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Hint */}
        <div className="vc-hint">
          <span className="vc-hint-icon">💡</span>
          <p>
            <strong>How to use:</strong> Play the video and pause at the point you want.
            Then click <strong>"Set to current"</strong> to mark your start or end point.
            Supports MP4 and WebM best.
          </p>
        </div>
      </div>
    </ToolLayout>
  )
}
