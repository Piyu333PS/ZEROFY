import { useState, useRef } from 'react'
import { downloadDataUrl } from '../../utils/download'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

const LAYOUTS = [
  { id: '2h', label: '2 Side by Side', cols: 2, rows: 1 },
  { id: '2v', label: '2 Stacked', cols: 1, rows: 2 },
  { id: '3h', label: '3 Horizontal', cols: 3, rows: 1 },
  { id: '4g', label: '4 Grid (2x2)', cols: 2, rows: 2 },
  { id: '3L', label: '3 Left+Right Stack', cols: null, rows: null, custom: true },
]

export default function ImageCollage() {
  const [images, setImages] = useState([])
  const [layout, setLayout] = useState('2h')
  const [gap, setGap] = useState(8)
  const [bgColor, setBgColor] = useState('#000000')
  const [cellW, setCellW] = useState(400)
  const [cellH, setCellH] = useState(300)
  const [result, setResult] = useState(null)
  const [processing, setProcessing] = useState(false)
  const canvasRef = useRef(null)

  const handleFiles = (e) => {
    const files = [...e.target.files]
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const img = new Image()
        img.onload = () => setImages(prev => [...prev, { src: ev.target.result, w: img.naturalWidth, h: img.naturalHeight, name: file.name }])
        img.src = ev.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (i) => setImages(prev => prev.filter((_, idx) => idx !== i))

  const generate = () => {
    const lo = LAYOUTS.find(l => l.id === layout)
    if (!lo || images.length === 0) return
    setProcessing(true)

    const cols = lo.cols || 2, rows = lo.rows || Math.ceil(images.length / cols)
    const totalW = cols * cellW + (cols + 1) * gap
    const totalH = rows * cellH + (rows + 1) * gap

    const canvas = canvasRef.current
    canvas.width = totalW
    canvas.height = totalH
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, totalW, totalH)

    let loaded = 0
    const total = Math.min(images.length, cols * rows)

    images.slice(0, total).forEach((imgData, idx) => {
      const col = idx % cols
      const row = Math.floor(idx / cols)
      const x = gap + col * (cellW + gap)
      const y = gap + row * (cellH + gap)

      const img = new Image()
      img.onload = () => {
        // Cover fit
        const scale = Math.max(cellW / img.naturalWidth, cellH / img.naturalHeight)
        const sw = cellW / scale, sh = cellH / scale
        const sx = (img.naturalWidth - sw) / 2, sy = (img.naturalHeight - sh) / 2
        ctx.drawImage(img, sx, sy, sw, sh, x, y, cellW, cellH)
        loaded++
        if (loaded === total) {
          setResult(canvas.toDataURL('image/jpeg', 0.92))
          setProcessing(false)
        }
      }
      img.src = imgData.src
    })
  }

  const download = () => {
    if (!result) return
    downloadDataUrl(result, 'collage.jpg')
  }

  const lo = LAYOUTS.find(l => l.id === layout)
  const needed = (lo?.cols || 2) * (lo?.rows || 1)

  return (
    <ToolLayout icon="🖼️" name="Image Collage" desc="Multiple images ko ek collage mein combine karo">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
        <label className={styles.controlLabel}>Images upload karo ({images.length} selected)</label>
        <input type="file" accept="image/*" multiple onChange={handleFiles}
          style={{ color: 'var(--text2)', fontSize: 13 }} />
      </div>

      {images.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {images.map((img, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={img.src} alt={img.name} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
              <button onClick={() => removeImage(i)} style={{
                position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%',
                background: '#ff4d4d', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 11,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Layout</label>
          <select className={styles.controlSelect} value={layout} onChange={e => setLayout(e.target.value)}>
            {LAYOUTS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Each Cell Width</label>
          <input className={styles.controlInput} type="number" value={cellW} onChange={e => setCellW(+e.target.value)} />
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Each Cell Height</label>
          <input className={styles.controlInput} type="number" value={cellH} onChange={e => setCellH(+e.target.value)} />
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Gap: {gap}px</label>
          <input type="range" min={0} max={40} value={gap} onChange={e => setGap(+e.target.value)}
            style={{ width: '100%', accentColor: 'var(--accent)' }} />
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Background Color</label>
          <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
            style={{ width: '100%', height: 40, borderRadius: 'var(--radius)', border: '1px solid var(--border)', cursor: 'pointer' }} />
        </div>
      </div>

      {images.length < needed && (
        <div className={styles.hint}>💡 Is layout ke liye {needed} images chahiye, abhi {images.length} hain</div>
      )}

      <button className={styles.actionBtn} onClick={generate} disabled={processing || images.length === 0}>
        {processing ? <><span className={styles.spinner} /> Generating...</> : '🖼️ Collage Banao'}
      </button>

      {result && (
        <div style={{ marginTop: 20 }}>
          <img src={result} alt="collage" style={{ maxWidth: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'block' }} />
          <button className={styles.actionBtn} onClick={download} style={{ marginTop: 12 }}>⬇️ Download Collage</button>
        </div>
      )}
    </ToolLayout>
  )
}
