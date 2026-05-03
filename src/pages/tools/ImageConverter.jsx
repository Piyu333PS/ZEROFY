import { useState, useRef } from 'react'
import { downloadDataUrl } from '../../utils/download'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

const FORMATS = ['JPEG', 'PNG', 'WebP', 'BMP', 'ICO']
const MIME = { JPEG: 'image/jpeg', PNG: 'image/png', WebP: 'image/webp', BMP: 'image/bmp', ICO: 'image/png' }

export default function ImageConverter() {
  const [images, setImages] = useState([])
  const [toFormat, setToFormat] = useState('WebP')
  const [quality, setQuality] = useState(85)
  const [results, setResults] = useState([])
  const [processing, setProcessing] = useState(false)
  const canvasRef = useRef(null)

  const handleFiles = (e) => {
    const files = [...(e.target.files || e.dataTransfer?.files || [])]
    setResults([])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setImages(prev => [...prev, { src: ev.target.result, name: file.name, size: file.size }])
      }
      reader.readAsDataURL(file)
    })
  }

  const convert = async () => {
    if (!images.length) return
    setProcessing(true)
    setResults([])
    const canvas = canvasRef.current
    const newResults = []

    for (const img of images) {
      await new Promise(resolve => {
        const image = new Image()
        image.onload = () => {
          canvas.width = image.naturalWidth
          canvas.height = image.naturalHeight
          const ctx = canvas.getContext('2d')
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          if (toFormat === 'JPEG') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height) }
          ctx.drawImage(image, 0, 0)
          const mime = MIME[toFormat]
          const dataUrl = canvas.toDataURL(mime, quality / 100)
          const byteStr = atob(dataUrl.split(',')[1])
          const origName = img.name.replace(/\.[^/.]+$/, '') + '.' + toFormat.toLowerCase().replace('jpeg', 'jpg')
          newResults.push({ dataUrl, name: origName, size: byteStr.length, orig: img.size })
          resolve()
        }
        image.src = img.src
      })
    }

    setResults(newResults)
    setProcessing(false)
  }

  const downloadAll = () => {
    results.forEach((r, i) => {
      setTimeout(() => downloadDataUrl(r.dataUrl, r.name), i * 400)
    })
  }

  const fmtSize = (b) => b > 1024*1024 ? (b/1024/1024).toFixed(2)+' MB' : (b/1024).toFixed(1)+' KB'

  return (
    <ToolLayout icon="🔄" name="Image Converter" desc="Convert JPG, PNG, WebP, BMP images in batch">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div onDrop={e => { e.preventDefault(); handleFiles(e) }}
        onDragOver={e => e.preventDefault()}
        style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', textAlign: 'center', cursor: 'pointer', marginBottom: 16 }}
        onClick={() => document.getElementById('conv-upload').click()}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🔄</div>
        <div style={{ fontWeight: 600 }}>{images.length > 0 ? `${images.length} file(s) selected` : 'Drop images or click to upload'}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Multiple files ek saath select kar sakte ho</div>
        <input id="conv-upload" type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFiles} />
      </div>

      {images.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {images.map((img, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={img.src} alt={img.name} style={{ width: 70, height: 55, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} style={{
                  position: 'absolute', top: -6, right: -6, width: 18, height: 18,
                  borderRadius: '50%', background: '#ff4d4d', border: 'none', color: '#fff',
                  cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>✕</button>
              </div>
            ))}
          </div>

          <div className={styles.controls}>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Convert to</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {FORMATS.map(f => (
                  <button key={f} onClick={() => setToFormat(f)} style={{
                    padding: '8px 14px', borderRadius: 'var(--radius)', border: '2px solid', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                    borderColor: toFormat === f ? 'var(--accent)' : 'var(--border)',
                    background: toFormat === f ? 'var(--accent-glow)' : 'var(--bg3)',
                    color: toFormat === f ? 'var(--accent2)' : 'var(--text2)',
                  }}>{f}</button>
                ))}
              </div>
            </div>
            {['JPEG', 'WebP'].includes(toFormat) && (
              <div className={styles.controlGroup}>
                <label className={styles.controlLabel}>Quality: {quality}%</label>
                <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(+e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--accent)' }} />
              </div>
            )}
          </div>

          <button className={styles.actionBtn} onClick={convert} disabled={processing}>
            {processing ? <><span className={styles.spinner} /> Converting...</> : `🔄 ${images.length} file(s) — Convert`}
          </button>
        </>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className={styles.fileListTitle}>Results ({results.length} files)</div>
            {results.length > 1 && (
              <button className={styles.copyBtn} style={{ marginTop: 0 }} onClick={downloadAll}>⬇️ Download All</button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map((r, i) => (
              <div key={i} className={styles.fileItem}>
                <img src={r.dataUrl} alt={r.name} style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 6 }} />
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{r.name}</div>
                  <div className={styles.fileSize}>
                    {fmtSize(r.size)}
                    <span style={{ marginLeft: 8, color: r.size < r.orig ? 'var(--green)' : '#ffd700' }}>
                      ({r.size < r.orig ? '▼ ' : '▲ '}{Math.abs(((r.size - r.orig) / r.orig) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
                <a href={r.dataUrl} download={r.name} onClick={e => { e.preventDefault(); downloadDataUrl(r.dataUrl, r.name) }}>
                  <button style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--accent2)', fontSize: 13 }}>
                    ⬇️
                  </button>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
