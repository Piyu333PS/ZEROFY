import { useState, useRef } from 'react'
import { downloadDataUrl } from '../../utils/download'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

export default function ImageResizer() {
  const [original, setOriginal] = useState(null)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [keepRatio, setKeepRatio] = useState(true)
  const [format, setFormat] = useState('image/jpeg')
  const [quality, setQuality] = useState(90)
  const [result, setResult] = useState(null)
  const [processing, setProcessing] = useState(false)
  const canvasRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        setOriginal({ src: ev.target.result, w: img.naturalWidth, h: img.naturalHeight, name: file.name, size: file.size })
        setWidth(img.naturalWidth)
        setHeight(img.naturalHeight)
        setResult(null)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile({ target: { files: [file] } })
  }

  const handleWidthChange = (val) => {
    setWidth(val)
    if (keepRatio && original && val) {
      setHeight(Math.round((val / original.w) * original.h))
    }
  }

  const handleHeightChange = (val) => {
    setHeight(val)
    if (keepRatio && original && val) {
      setWidth(Math.round((val / original.h) * original.w))
    }
  }

  const resize = () => {
    if (!original || !width || !height) return
    setProcessing(true)
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      canvas.width = +width
      canvas.height = +height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, +width, +height)
      const dataUrl = canvas.toDataURL(format, quality / 100)
      const byteStr = atob(dataUrl.split(',')[1])
      const newSize = byteStr.length
      setResult({ dataUrl, size: newSize, w: +width, h: +height })
      setProcessing(false)
    }
    img.src = original.src
  }

  const download = () => {
    if (!result) return
    const ext = format.split('/')[1]
    downloadDataUrl(result.dataUrl, `resized_${width}x${height}.${ext}`)
  }

  const fmt = (bytes) => bytes > 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(2) + ' MB' : (bytes / 1024).toFixed(1) + ' KB'

  return (
    <ToolLayout icon="📐" name="Image Resizer" desc="Resize your image — optionally maintain aspect ratio">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {!original ? (
        <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          style={{
            border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)',
            padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
            transition: 'border-color 0.2s'
          }}
          onClick={() => document.getElementById('img-upload').click()}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🖼️</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Drop an image or click to upload</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>JPG, PNG, WebP, GIF</div>
          <input id="img-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <img src={original.src} alt="original" style={{
              maxWidth: 200, maxHeight: 150, borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', objectFit: 'contain'
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{original.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                Original: {original.w} × {original.h}px • {fmt(original.size)}
              </div>
              <button className={styles.copyBtn} style={{ marginTop: 12 }}
                onClick={() => { setOriginal(null); setResult(null) }}>
                🔄 Change Image
              </button>
            </div>
          </div>

          <div className={styles.controls} style={{ marginTop: 20 }}>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Width (px)</label>
              <input className={styles.controlInput} type="number" value={width} onChange={e => handleWidthChange(e.target.value)} />
            </div>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Height (px)</label>
              <input className={styles.controlInput} type="number" value={height} onChange={e => handleHeightChange(e.target.value)} />
            </div>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Format</label>
              <select className={styles.controlSelect} value={format} onChange={e => setFormat(e.target.value)}>
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WebP</option>
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text2)', marginBottom: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={keepRatio} onChange={e => setKeepRatio(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
            Lock aspect ratio
          </label>

          {format !== 'image/png' && (
            <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
              <label className={styles.controlLabel}>Quality: {quality}%</label>
              <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(+e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </div>
          )}

          <button className={styles.actionBtn} onClick={resize} disabled={processing}>
            {processing ? <><span className={styles.spinner} /> Processing...</> : '📐 Resize'}
          </button>

          {result && (
            <div style={{ marginTop: 20 }}>
              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <span className={styles.statNum}>{result.w}×{result.h}</span>
                  <span className={styles.statLbl}>New size</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNum}>{fmt(result.size)}</span>
                  <span className={styles.statLbl}>File size</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statNum}>{((1 - result.size / original.size) * 100).toFixed(0)}%</span>
                  <span className={styles.statLbl}>Size saved</span>
                </div>
              </div>
              <img src={result.dataUrl} alt="resized" style={{
                maxWidth: '100%', maxHeight: 300, borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', marginTop: 12, display: 'block'
              }} />
              <button className={styles.actionBtn} onClick={download} style={{ marginTop: 12 }}>
                ⬇️ Download
              </button>
            </div>
          )}
        </>
      )}
    </ToolLayout>
  )
}
