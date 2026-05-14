import { useState, useRef, useEffect, useCallback } from 'react'
import { downloadDataUrl } from '../../utils/download'
import ToolLayout from '../../components/ToolLayout'

const SIZES = [
  { label: 'Passport (India)', w: 35, h: 45, unit: 'mm', dpi: 600 },
  { label: 'Passport (US 2x2")', w: 51, h: 51, unit: 'mm', dpi: 600 },
  { label: 'Visa Photo', w: 35, h: 45, unit: 'mm', dpi: 600 },
  { label: 'ID Card', w: 25, h: 35, unit: 'mm', dpi: 300 },
  { label: 'Stamp Size', w: 20, h: 25, unit: 'mm', dpi: 300 },
  { label: 'Custom', w: 0, h: 0, unit: 'px', dpi: 300 },
]

const MM_TO_PX = (mm, dpi) => Math.round((mm / 25.4) * dpi)

const FONTS = ['Arial', 'Georgia', 'Courier New', 'Times New Roman', 'Verdana', 'Impact']

export default function PassportSizeMaker() {
  const [original, setOriginal] = useState(null)
  const [selectedSize, setSelectedSize] = useState(0)
  const [customW, setCustomW] = useState(400)
  const [customH, setCustomH] = useState(500)
  const [format, setFormat] = useState('image/jpeg')
  const [result, setResult] = useState(null)
  const [processing, setProcessing] = useState(false)

  // Crop state
  const [cropMode, setCropMode] = useState(false)
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, w: 200, h: 200 })
  const [dragging, setDragging] = useState(null)
  const [croppedSrc, setCroppedSrc] = useState(null)

  // Text overlay
  const [texts, setTexts] = useState([])
  const [textInput, setTextInput] = useState('')
  const [textColor, setTextColor] = useState('#ffffff')
  const [textSize, setTextSize] = useState(18)
  const [textFont, setTextFont] = useState('Arial')
  const [textBold, setTextBold] = useState(false)
  const [textPos, setTextPos] = useState('bottom-center')

  const canvasRef = useRef(null)
  const previewRef = useRef(null)
  const imgRef = useRef(null)
  const containerRef = useRef(null)

  const size = SIZES[selectedSize]

  const getOutW = () => selectedSize === 5 ? +customW : MM_TO_PX(size.w, size.dpi)
  const getOutH = () => selectedSize === 5 ? +customH : MM_TO_PX(size.h, size.dpi)

  const handleFile = (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        setOriginal({ src: ev.target.result, w: img.naturalWidth, h: img.naturalHeight })
        setCroppedSrc(null)
        setResult(null)
        setCropBox({ x: 20, y: 20, w: Math.min(200, img.naturalWidth * 0.6), h: Math.min(200, img.naturalHeight * 0.6) })
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  // Crop drag logic
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
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const dx = e.clientX - rect.left - dragging.startX
      const dy = e.clientY - rect.top - dragging.startY
      const imgW = imgRef.current?.offsetWidth || 400
      const imgH = imgRef.current?.offsetHeight || 500

      if (dragging.type === 'move') {
        setCropBox(prev => ({
          ...prev,
          x: Math.max(0, Math.min(imgW - prev.w, dragging.box.x + dx)),
          y: Math.max(0, Math.min(imgH - prev.h, dragging.box.y + dy)),
        }))
      } else {
        const newW = Math.max(40, dragging.box.w + dx)
        const newH = Math.max(40, dragging.box.h + dy)
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

  const applyCrop = () => {
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
      setCroppedSrc(canvas.toDataURL('image/jpeg', 0.95))
      setCropMode(false)
    }
    img.src = original.src
  }

  const addText = () => {
    if (!textInput.trim()) return
    setTexts(prev => [...prev, {
      id: Date.now(), text: textInput, color: textColor,
      size: textSize, font: textFont, bold: textBold, pos: textPos
    }])
    setTextInput('')
  }

  const removeText = (id) => setTexts(prev => prev.filter(t => t.id !== id))

  const getTextCoords = (pos, canvasW, canvasH, fontSize) => {
    const pad = 12
    const positions = {
      'top-left': [pad, fontSize + pad],
      'top-center': [canvasW / 2, fontSize + pad],
      'top-right': [canvasW - pad, fontSize + pad],
      'bottom-left': [pad, canvasH - pad],
      'bottom-center': [canvasW / 2, canvasH - pad],
      'bottom-right': [canvasW - pad, canvasH - pad],
      'center': [canvasW / 2, canvasH / 2],
    }
    return positions[pos] || [canvasW / 2, canvasH - pad]
  }

  const getTextAlign = (pos) => {
    if (pos.includes('left')) return 'left'
    if (pos.includes('right')) return 'right'
    return 'center'
  }

  const generate = () => {
    const src = croppedSrc || original?.src
    if (!src) return
    setProcessing(true)
    const outW = getOutW(), outH = getOutH()
    const canvas = canvasRef.current
    canvas.width = outW; canvas.height = outH
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      // Draw image (cover fit)
      const imgAR = img.width / img.height
      const outAR = outW / outH
      let sx, sy, sw, sh
      if (imgAR > outAR) {
        sh = img.height; sw = sh * outAR
        sx = (img.width - sw) / 2; sy = 0
      } else {
        sw = img.width; sh = sw / outAR
        sx = 0; sy = (img.height - sh) / 2
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH)

      // Draw texts
      texts.forEach(t => {
        const scaledSize = Math.round(t.size * (outW / 300))
        ctx.font = `${t.bold ? 'bold ' : ''}${scaledSize}px ${t.font}`
        ctx.textAlign = getTextAlign(t.pos)
        const [tx, ty] = getTextCoords(t.pos, outW, outH, scaledSize)
        // Shadow for readability
        ctx.shadowColor = 'rgba(0,0,0,0.7)'
        ctx.shadowBlur = 4
        ctx.fillStyle = t.color
        ctx.fillText(t.text, tx, ty)
        ctx.shadowBlur = 0
      })

      const dataUrl = canvas.toDataURL(format, 0.95)
      setResult(dataUrl)
      setProcessing(false)

      // Update preview
      if (previewRef.current) previewRef.current.src = dataUrl
    }
    img.src = src
  }

  const download = () => {
    if (!result) return
    const ext = format.split('/')[1]
    const label = size.label.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    downloadDataUrl(result, `${label}_photo.${ext}`)
  }

  const s = {
    wrap: { fontFamily: 'system-ui, sans-serif' },
    uploadZone: {
      border: '2px dashed var(--border)', borderRadius: 16,
      padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
      background: 'var(--surface)', transition: 'border-color 0.2s'
    },
    card: {
      background: 'var(--surface)', borderRadius: 14,
      border: '1px solid var(--border2)', padding: 16, marginBottom: 14
    },
    label: { fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' },
    sizeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
    sizeBtn: (active) => ({
      padding: '8px 6px', borderRadius: 10, border: `2px solid ${active ? 'var(--accent)' : 'var(--border2)'}`,
      background: active ? 'var(--accent)' + '18' : 'var(--surface2)',
      color: active ? 'var(--accent)' : 'var(--text2)',
      fontSize: 11, fontWeight: 600, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s'
    }),
    row: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
    inp: {
      background: 'var(--surface2)', border: '1px solid var(--border2)',
      borderRadius: 8, padding: '7px 10px', color: 'var(--text)', fontSize: 13,
      outline: 'none', flex: 1, minWidth: 80
    },
    btn: (color) => ({
      background: color || 'var(--accent)', color: '#fff',
      border: 'none', borderRadius: 10, padding: '9px 18px',
      fontSize: 13, fontWeight: 600, cursor: 'pointer'
    }),
    posGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 },
    posBtn: (active) => ({
      padding: '5px', borderRadius: 6,
      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border2)'}`,
      background: active ? 'var(--accent)' : 'transparent',
      color: active ? '#fff' : 'var(--text3)',
      fontSize: 11, cursor: 'pointer', textAlign: 'center'
    }),
    textTag: {
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'var(--surface2)', borderRadius: 8,
      padding: '5px 10px', fontSize: 12, marginTop: 6
    }
  }

  const posOptions = [
    { key: 'top-left', label: '↖' }, { key: 'top-center', label: '↑' }, { key: 'top-right', label: '↗' },
    { key: 'center', label: '⊙' }, { key: 'bottom-left', label: '↙' }, { key: 'bottom-center', label: '↓' },
  ]

  return (
    <ToolLayout icon="🪪" name="Passport Size Photo Maker" desc="Resize photo to standard sizes & add text overlay">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {!original ? (
        <div style={s.uploadZone}
          onClick={() => document.getElementById('pp-upload').click()}
          onDrop={e => { e.preventDefault(); handleFile(e) }}
          onDragOver={e => e.preventDefault()}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🪪</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Upload Photo</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>JPG, PNG, WebP — click or drag & drop</div>
          <input id="pp-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      ) : (
        <div style={s.wrap}>

          {/* Image preview + crop */}
          <div style={{ ...s.card, display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {cropMode ? (
              <div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
                  💡 Drag box to move • Corner to resize
                </div>
                <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', userSelect: 'none' }}>
                  <img ref={imgRef} src={original.src} alt="original"
                    style={{ maxWidth: 340, maxHeight: 380, display: 'block', borderRadius: 10 }} draggable={false} />
                  <div style={{
                    position: 'absolute', left: cropBox.x, top: cropBox.y,
                    width: cropBox.w, height: cropBox.h,
                    border: '2.5px solid var(--accent)',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                    cursor: 'move', boxSizing: 'border-box'
                  }} onMouseDown={e => startDrag(e, 'move')}>
                    <div style={{
                      position: 'absolute', bottom: -7, right: -7,
                      width: 14, height: 14, background: 'var(--accent)',
                      borderRadius: 4, cursor: 'se-resize'
                    }} onMouseDown={e => { e.stopPropagation(); startDrag(e, 'resize') }} />
                    <div style={{
                      position: 'absolute', top: -22, left: 0, fontSize: 10,
                      background: 'var(--accent)', color: '#fff',
                      padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap'
                    }}>
                      {Math.round(cropBox.w * getScale())} × {Math.round(cropBox.h * getScale())}px
                    </div>
                  </div>
                </div>
                <div style={{ ...s.row, marginTop: 10 }}>
                  <button style={s.btn()} onClick={applyCrop}>✂️ Apply Crop</button>
                  <button style={s.btn('var(--surface2)')} onClick={() => setCropMode(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ ...s.row, alignItems: 'center' }}>
                <img src={croppedSrc || original.src} alt="preview"
                  style={{ width: 90, height: 110, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    {original.w} × {original.h}px
                    {croppedSrc && <span style={{ color: 'var(--accent)', marginLeft: 8, fontSize: 11 }}>✂️ Cropped</span>}
                  </div>
                  <div style={{ ...s.row, gap: 8 }}>
                    <button style={{ ...s.btn('var(--surface2)'), color: 'var(--text2)', fontSize: 12 }}
                      onClick={() => setCropMode(true)}>✂️ Crop</button>
                    {croppedSrc && (
                      <button style={{ ...s.btn('var(--surface2)'), color: 'var(--text3)', fontSize: 12 }}
                        onClick={() => setCroppedSrc(null)}>↩ Reset</button>
                    )}
                    <button style={{ ...s.btn('var(--surface2)'), color: 'var(--text3)', fontSize: 12 }}
                      onClick={() => { setOriginal(null); setCroppedSrc(null); setResult(null) }}>🔄 Change</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!cropMode && <>
            {/* Size selector */}
            <div style={s.card}>
              <span style={s.label}>📐 Output Size</span>
              <div style={s.sizeGrid}>
                {SIZES.map((sz, i) => (
                  <button key={i} style={s.sizeBtn(selectedSize === i)} onClick={() => setSelectedSize(i)}>
                    {sz.label}
                    {sz.w > 0 && <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{sz.w}×{sz.h}{sz.unit}</div>}
                  </button>
                ))}
              </div>
              {selectedSize === 5 && (
                <div style={{ ...s.row, marginTop: 12 }}>
                  <div style={{ flex: 1 }}>
                    <span style={s.label}>Width (px)</span>
                    <input style={s.inp} type="number" value={customW} onChange={e => setCustomW(e.target.value)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={s.label}>Height (px)</span>
                    <input style={s.inp} type="number" value={customH} onChange={e => setCustomH(e.target.value)} />
                  </div>
                </div>
              )}
              {selectedSize !== 5 && (
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
                  Output: {getOutW()} × {getOutH()}px at {size.dpi} DPI
                </div>
              )}
            </div>

            {/* Text overlay */}
            <div style={s.card}>
              <span style={s.label}>✍️ Text Overlay (optional)</span>
              <div style={s.row}>
                <input style={{ ...s.inp, flex: 2 }} placeholder="e.g. John Doe, DOB: 01/01/1990"
                  value={textInput} onChange={e => setTextInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addText()} />
                <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
                  style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 6 }} />
              </div>
              <div style={{ ...s.row, marginTop: 10 }}>
                <select style={{ ...s.inp, flex: 1 }} value={textFont} onChange={e => setTextFont(e.target.value)}>
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <input style={{ ...s.inp, width: 60, flex: 'none' }} type="number" value={textSize}
                  onChange={e => setTextSize(+e.target.value)} min={8} max={72} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, cursor: 'pointer', color: 'var(--text2)' }}>
                  <input type="checkbox" checked={textBold} onChange={e => setTextBold(e.target.checked)}
                    style={{ accentColor: 'var(--accent)' }} />
                  Bold
                </label>
              </div>

              {/* Position picker */}
              <div style={{ marginTop: 12 }}>
                <span style={{ ...s.label, marginBottom: 6 }}>Position</span>
                <div style={s.posGrid}>
                  {posOptions.map(p => (
                    <button key={p.key} style={s.posBtn(textPos === p.key)} onClick={() => setTextPos(p.key)}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <button style={{ ...s.btn(), marginTop: 12, fontSize: 12 }} onClick={addText}>+ Add Text</button>

              {texts.map(t => (
                <div key={t.id} style={s.textTag}>
                  <span style={{ color: t.color, fontWeight: t.bold ? 700 : 400, fontFamily: t.font, fontSize: 13 }}>
                    {t.text}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 4 }}>({t.pos})</span>
                  <button onClick={() => removeText(t.id)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 15 }}>×</button>
                </div>
              ))}
            </div>

            {/* Format + Generate */}
            <div style={s.card}>
              <span style={s.label}>💾 Output Format</span>
              <div style={s.row}>
                {['image/jpeg', 'image/png'].map(f => (
                  <button key={f} style={s.sizeBtn(format === f)} onClick={() => setFormat(f)}>
                    {f.split('/')[1].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button style={{ ...s.btn(), width: '100%', padding: '13px', fontSize: 15, borderRadius: 12 }}
              onClick={generate} disabled={processing}>
              {processing ? '⏳ Generating...' : '🪪 Generate Photo'}
            </button>

            {result && (
              <div style={{ ...s.card, marginTop: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, marginBottom: 12 }}>
                  ✅ {size.label} — {getOutW()}×{getOutH()}px
                </div>
                <img ref={previewRef} src={result} alt="result"
                  style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 10, border: '2px solid var(--border)', objectFit: 'contain' }} />
                <div style={{ marginTop: 14 }}>
                  <button style={{ ...s.btn(), width: '100%', padding: '11px', borderRadius: 10 }} onClick={download}>
                    ⬇️ Download Photo
                  </button>
                </div>
              </div>
            )}
          </>}
        </div>
      )}
    </ToolLayout>
  )
}
