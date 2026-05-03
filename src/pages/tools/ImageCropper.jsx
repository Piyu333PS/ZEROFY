import { useState, useRef, useEffect } from 'react'
import { downloadDataUrl } from '../../utils/download'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

export default function ImageCropper() {
  const [original, setOriginal] = useState(null)
  const [cropBox, setCropBox] = useState({ x: 50, y: 50, w: 200, h: 150 })
  const [dragging, setDragging] = useState(null)
  const [result, setResult] = useState(null)
  const [format, setFormat] = useState('image/jpeg')
  const canvasRef = useRef(null)
  const previewCanvasRef = useRef(null)
  const containerRef = useRef(null)
  const imgRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        setOriginal({ src: ev.target.result, w: img.naturalWidth, h: img.naturalHeight, name: file.name })
        setCropBox({ x: 20, y: 20, w: Math.min(300, img.naturalWidth * 0.6), h: Math.min(200, img.naturalHeight * 0.6) })
        setResult(null)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const getScale = () => {
    if (!imgRef.current || !original) return 1
    return original.w / imgRef.current.offsetWidth
  }

  const startDrag = (e, type) => {
    e.preventDefault()
    const rect = containerRef.current.getBoundingClientRect()
    setDragging({ type, startX: e.clientX - rect.left, startY: e.clientY - rect.top, box: { ...cropBox } })
  }

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const rect = containerRef.current.getBoundingClientRect()
      const dx = e.clientX - rect.left - dragging.startX
      const dy = e.clientY - rect.top - dragging.startY
      const scale = getScale()
      const imgW = imgRef.current?.offsetWidth || 400
      const imgH = imgRef.current?.offsetHeight || 300

      if (dragging.type === 'move') {
        setCropBox(prev => ({
          ...prev,
          x: Math.max(0, Math.min(imgW - prev.w, dragging.box.x + dx)),
          y: Math.max(0, Math.min(imgH - prev.h, dragging.box.y + dy)),
        }))
      } else if (dragging.type === 'resize') {
        const newW = Math.max(40, dragging.box.w + dx)
        const newH = Math.max(30, dragging.box.h + dy)
        setCropBox(prev => ({
          ...prev,
          w: Math.min(newW, imgW - prev.x),
          h: Math.min(newH, imgH - prev.y),
        }))
      }
    }
    const onUp = () => setDragging(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging])

  const crop = () => {
    if (!original || !imgRef.current) return
    const scale = getScale()
    const canvas = canvasRef.current
    const cx = cropBox.x * scale, cy = cropBox.y * scale
    const cw = cropBox.w * scale, ch = cropBox.h * scale
    canvas.width = cw; canvas.height = ch
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch)
      const dataUrl = canvas.toDataURL(format, 0.92)
      setResult({ dataUrl, w: Math.round(cw), h: Math.round(ch) })
    }
    img.src = original.src
  }

  const download = () => {
    if (!result) return
    const ext = format.split('/')[1]
    downloadDataUrl(result.dataUrl, `cropped.${ext}`)
  }

  return (
    <ToolLayout icon="✂️" name="Image Cropper" desc="Select any area of your image and crop it">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {!original ? (
        <div style={{
          border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)',
          padding: '48px 24px', textAlign: 'center', cursor: 'pointer'
        }} onClick={() => document.getElementById('crop-upload').click()}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✂️</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Choose an image</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>JPG, PNG, WebP</div>
          <input id="crop-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      ) : (
        <>
          <div className={styles.hint} style={{ marginBottom: 12 }}>
            💡 Drag to move the crop box, resize from corners
          </div>

          <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', userSelect: 'none' }}>
            <img ref={imgRef} src={original.src} alt="original"
              style={{ maxWidth: '100%', maxHeight: 400, display: 'block', borderRadius: 'var(--radius)' }}
              draggable={false} />
            {/* Crop overlay */}
            <div style={{
              position: 'absolute', left: cropBox.x, top: cropBox.y,
              width: cropBox.w, height: cropBox.h,
              border: '2px solid var(--accent)',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
              cursor: 'move', boxSizing: 'border-box'
            }} onMouseDown={e => startDrag(e, 'move')}>
              {/* Resize handle */}
              <div style={{
                position: 'absolute', bottom: -6, right: -6,
                width: 14, height: 14, background: 'var(--accent)',
                borderRadius: 3, cursor: 'se-resize'
              }} onMouseDown={e => { e.stopPropagation(); startDrag(e, 'resize') }} />
              {/* Dimensions label */}
              <div style={{
                position: 'absolute', top: -24, left: 0, fontSize: 11,
                background: 'var(--accent)', color: '#fff', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap'
              }}>
                {Math.round(cropBox.w * getScale())} × {Math.round(cropBox.h * getScale())}
              </div>
            </div>
          </div>

          <div className={styles.controls} style={{ marginTop: 16 }}>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Output Format</label>
              <select className={styles.controlSelect} value={format} onChange={e => setFormat(e.target.value)}>
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WebP</option>
              </select>
            </div>
          </div>

          <button className={styles.actionBtn} onClick={crop}>✂️ Crop</button>

          {result && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>
                Cropped: {result.w} × {result.h}px
              </div>
              <img src={result.dataUrl} alt="cropped"
                style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'block' }} />
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
