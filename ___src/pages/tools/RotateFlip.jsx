import { useState, useRef } from 'react'
import { downloadDataUrl } from '../../utils/download'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

export default function RotateFlip() {
  const [original, setOriginal] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [format, setFormat] = useState('image/jpeg')
  const canvasRef = useRef(null)
  const imgRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setOriginal({ src: ev.target.result, name: file.name })
      setRotation(0); setFlipH(false); setFlipV(false)
    }
    reader.readAsDataURL(file)
  }

  const rotate = (deg) => setRotation(r => (r + deg + 360) % 360)

  const getTransform = () => {
    let t = `rotate(${rotation}deg)`
    if (flipH) t += ' scaleX(-1)'
    if (flipV) t += ' scaleY(-1)'
    return t
  }

  const download = () => {
    if (!original || !imgRef.current) return
    const img = imgRef.current
    const canvas = canvasRef.current
    const isRotated90 = rotation === 90 || rotation === 270
    canvas.width = isRotated90 ? img.naturalHeight : img.naturalWidth
    canvas.height = isRotated90 ? img.naturalWidth : img.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    if (flipH) ctx.scale(-1, 1)
    if (flipV) ctx.scale(1, -1)
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
    ctx.restore()
    const dataUrl = canvas.toDataURL(format, 0.92)
    downloadDataUrl(dataUrl, `rotated.${format.split('/')[1]}`)
  }

  const btnStyle = (active) => ({
    flex: 1, padding: '12px', borderRadius: 'var(--radius)',
    border: '2px solid', cursor: 'pointer', fontWeight: 600, fontSize: 14,
    borderColor: active ? 'var(--accent)' : 'var(--border)',
    background: active ? 'var(--accent-glow)' : 'var(--bg3)',
    color: active ? 'var(--accent2)' : 'var(--text2)',
  })

  return (
    <ToolLayout icon="🔄" name="Rotate & Flip" desc="Rotate and flip your image — 90°, 180° or mirror">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {!original ? (
        <div style={{
          border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)',
          padding: '48px 24px', textAlign: 'center', cursor: 'pointer'
        }} onClick={() => document.getElementById('rf-upload').click()}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔄</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Image upload karo</div>
          <input id="rf-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      ) : (
        <>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img ref={imgRef} src={original.src} alt="preview" style={{
              maxWidth: '100%', maxHeight: 300, borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', transition: 'transform 0.3s ease',
              transform: getTransform()
            }} />
          </div>

          {/* Rotation buttons */}
          <div style={{ marginBottom: 12 }}>
            <div className={styles.controlLabel} style={{ marginBottom: 8 }}>Rotate</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={btnStyle(false)} onClick={() => rotate(-90)}>↺ 90° Left</button>
              <button style={btnStyle(false)} onClick={() => rotate(90)}>↻ 90° Right</button>
              <button style={btnStyle(false)} onClick={() => rotate(180)}>↕ 180°</button>
            </div>
          </div>

          {/* Flip buttons */}
          <div style={{ marginBottom: 20 }}>
            <div className={styles.controlLabel} style={{ marginBottom: 8 }}>Flip</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={btnStyle(flipH)} onClick={() => setFlipH(f => !f)}>↔ Horizontal</button>
              <button style={btnStyle(flipV)} onClick={() => setFlipV(f => !f)}>↕ Vertical</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <div className={styles.controlLabel} style={{ whiteSpace: 'nowrap' }}>Format:</div>
            <select className={styles.controlSelect} value={format} onChange={e => setFormat(e.target.value)}>
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
            <button className={styles.copyBtn} style={{ marginTop: 0 }}
              onClick={() => { setOriginal(null); setRotation(0); setFlipH(false); setFlipV(false) }}>
              🔄 Change
            </button>
          </div>

          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>
            Current: {rotation}° rotation {flipH ? '+ H-flip' : ''} {flipV ? '+ V-flip' : ''}
          </div>

          <button className={styles.actionBtn} onClick={download}>⬇️ Download</button>
        </>
      )}
    </ToolLayout>
  )
}
