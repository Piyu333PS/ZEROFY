import { useState, useRef, useEffect } from 'react'
import { downloadDataUrl } from '../../utils/download'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

export default function WatermarkImage() {
  const [original, setOriginal] = useState(null)
  const [text, setText] = useState('© Zerofy')
  const [fontSize, setFontSize] = useState(32)
  const [color, setColor] = useState('#ffffff')
  const [opacity, setOpacity] = useState(70)
  const [position, setPosition] = useState('bottom-right')
  const [repeat, setRepeat] = useState(false)
  const [format, setFormat] = useState('image/jpeg')
  const canvasRef = useRef(null)
  const [preview, setPreview] = useState(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setOriginal({ src: ev.target.result, name: file.name })
    reader.readAsDataURL(file)
  }

  const hexToRgba = (hex, a) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${a / 100})`
  }

  const applyWatermark = (forDownload = false) => {
    if (!original || !text.trim()) return null
    const canvas = canvasRef.current
    const img = new Image()
    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.fillStyle = hexToRgba(color, opacity)
      ctx.textBaseline = 'middle'

      if (repeat) {
        ctx.save()
        ctx.rotate(-Math.PI / 6)
        const spacing = fontSize * 4
        for (let x = -canvas.width; x < canvas.width * 2; x += spacing) {
          for (let y = -canvas.height; y < canvas.height * 2; y += spacing) {
            ctx.fillText(text, x, y)
          }
        }
        ctx.restore()
      } else {
        const padding = 20
        const tw = ctx.measureText(text).width
        let x, y
        const pos = position
        if (pos.includes('left')) x = padding
        else if (pos.includes('right')) x = canvas.width - tw - padding
        else x = (canvas.width - tw) / 2

        if (pos.includes('top')) y = padding + fontSize / 2
        else if (pos.includes('bottom')) y = canvas.height - padding - fontSize / 2
        else y = canvas.height / 2

        ctx.fillText(text, x, y)
      }

      const dataUrl = canvas.toDataURL(format, 0.92)
      if (forDownload) {
        const a = document.createElement('a')
        a.href = dataUrl
        downloadDataUrl(dataUrl, `watermarked.${format.split('/')[1]}`)
        return
      } else {
        setPreview(dataUrl)
      }
    }
    img.src = original.src
  }

  useEffect(() => { if (original) applyWatermark() }, [original, text, fontSize, color, opacity, position, repeat, format])

  const POSITIONS = ['top-left', 'top-center', 'top-right', 'center', 'bottom-left', 'bottom-center', 'bottom-right']

  return (
    <ToolLayout icon="💧" name="Watermark Image" desc="Add a custom text watermark to your image — customize position and style">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {!original ? (
        <div style={{
          border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)',
          padding: '48px 24px', textAlign: 'center', cursor: 'pointer'
        }} onClick={() => document.getElementById('wm-upload').click()}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💧</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Upload an image</div>
          <input id="wm-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      ) : (
        <>
          <div className={styles.controls}>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Watermark Text</label>
              <input className={styles.controlInput} value={text} onChange={e => setText(e.target.value)} placeholder="© Your Name" />
            </div>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Font Size: {fontSize}px</label>
              <input type="range" min={12} max={120} value={fontSize} onChange={e => setFontSize(+e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </div>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Color</label>
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                style={{ width: '100%', height: 40, borderRadius: 'var(--radius)', border: '1px solid var(--border)', cursor: 'pointer' }} />
            </div>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Opacity: {opacity}%</label>
              <input type="range" min={10} max={100} value={opacity} onChange={e => setOpacity(+e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </div>
          </div>

          <div className={styles.controlGroup} style={{ marginBottom: 12 }}>
            <label className={styles.controlLabel}>Position</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, maxWidth: 240 }}>
              {POSITIONS.map(p => (
                <button key={p} onClick={() => setPosition(p)} disabled={repeat} style={{
                  padding: '6px', fontSize: 10, borderRadius: 6,
                  border: '2px solid', cursor: 'pointer',
                  borderColor: position === p ? 'var(--accent)' : 'var(--border)',
                  background: position === p ? 'var(--accent-glow)' : 'var(--bg3)',
                  color: position === p ? 'var(--accent2)' : 'var(--text3)',
                  opacity: repeat ? 0.4 : 1
                }}>
                  {p.replace(/-/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text2)', marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={repeat} onChange={e => setRepeat(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
            Repeat pattern (poori image pe)
          </label>

          {preview && (
            <img src={preview} alt="preview" style={{
              maxWidth: '100%', maxHeight: 300, borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', display: 'block', marginBottom: 12
            }} />
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <select className={styles.controlSelect} style={{ flex: 1 }} value={format} onChange={e => setFormat(e.target.value)}>
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
            <button className={styles.copyBtn} style={{ marginTop: 0 }}
              onClick={() => { setOriginal(null); setPreview(null) }}>Change Image</button>
          </div>

          <button className={styles.actionBtn} onClick={() => applyWatermark(true)} style={{ marginTop: 12 }}>
            ⬇️ Download with Watermark
          </button>
        </>
      )}
    </ToolLayout>
  )
}
