import { useState, useRef, useEffect } from 'react'
import { downloadDataUrl } from '../../utils/download'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

const FILTERS = [
  { key: 'brightness', label: 'Brightness', min: 0, max: 200, default: 100, unit: '%' },
  { key: 'contrast', label: 'Contrast', min: 0, max: 200, default: 100, unit: '%' },
  { key: 'saturation', label: 'Saturation', min: 0, max: 200, default: 100, unit: '%' },
  { key: 'hue', label: 'Hue Rotate', min: 0, max: 360, default: 0, unit: 'deg' },
  { key: 'blur', label: 'Blur', min: 0, max: 10, default: 0, unit: 'px' },
  { key: 'sepia', label: 'Sepia', min: 0, max: 100, default: 0, unit: '%' },
  { key: 'grayscale', label: 'Grayscale', min: 0, max: 100, default: 0, unit: '%' },
  { key: 'invert', label: 'Invert', min: 0, max: 100, default: 0, unit: '%' },
]

const defaults = Object.fromEntries(FILTERS.map(f => [f.key, f.default]))

export default function ColorAdjuster() {
  const [original, setOriginal] = useState(null)
  const [adj, setAdj] = useState(defaults)
  const [format, setFormat] = useState('image/jpeg')
  const canvasRef = useRef(null)
  const imgRef = useRef(null)

  const filterStr = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%) hue-rotate(${adj.hue}deg) blur(${adj.blur}px) sepia(${adj.sepia}%) grayscale(${adj.grayscale}%) invert(${adj.invert}%)`

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setOriginal({ src: ev.target.result, name: file.name })
    reader.readAsDataURL(file)
  }

  const reset = () => setAdj(defaults)

  const download = () => {
    if (!original || !imgRef.current) return
    const canvas = canvasRef.current
    const img = imgRef.current
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.filter = filterStr
    ctx.drawImage(img, 0, 0)
    const dataUrl = canvas.toDataURL(format, 0.92)
    downloadDataUrl(dataUrl, `adjusted.${format.split('/')[1]}`)
  }

  const isDefault = JSON.stringify(adj) === JSON.stringify(defaults)

  return (
    <ToolLayout icon="🎨" name="Color Adjuster" desc="Adjust brightness, contrast, saturation, hue and effects of your image">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {!original ? (
        <div style={{
          border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)',
          padding: '48px 24px', textAlign: 'center', cursor: 'pointer'
        }} onClick={() => document.getElementById('color-upload').click()}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Upload an image</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>JPG, PNG, WebP</div>
          <input id="color-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      ) : (
        <>
          {/* Preview */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className={styles.controlLabel} style={{ marginBottom: 6 }}>Original</div>
              <img src={original.src} alt="original" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className={styles.controlLabel} style={{ marginBottom: 6 }}>Adjusted</div>
              <img ref={imgRef} src={original.src} alt="adjusted"
                style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 'var(--radius)', border: '1px solid var(--border)', filter: filterStr }} />
            </div>
          </div>

          {/* Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FILTERS.map(f => (
              <div key={f.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label className={styles.controlLabel}>{f.label}</label>
                  <span style={{ fontSize: 12, color: 'var(--accent2)', fontWeight: 600 }}>
                    {adj[f.key]}{f.unit}
                    {adj[f.key] !== f.default && (
                      <button onClick={() => setAdj(prev => ({ ...prev, [f.key]: f.default }))}
                        style={{ marginLeft: 6, background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 11 }}>
                        reset
                      </button>
                    )}
                  </span>
                </div>
                <input type="range" min={f.min} max={f.max} value={adj[f.key]}
                  onChange={e => setAdj(prev => ({ ...prev, [f.key]: +e.target.value }))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button className={styles.copyBtn} onClick={reset} disabled={isDefault}>🔄 Reset All</button>
            <select className={styles.controlSelect} style={{ flex: 1 }} value={format} onChange={e => setFormat(e.target.value)}>
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>

          <button className={styles.actionBtn} onClick={download} style={{ marginTop: 12 }}>
            ⬇️ Download Adjusted Image
          </button>
        </>
      )}
    </ToolLayout>
  )
}
