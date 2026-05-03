import { useState, useCallback, useRef } from 'react'
import { PDFDocument } from 'pdf-lib'
import ToolLayout from '../../components/ToolLayout'
import { downloadBlob } from '../../utils/download'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

.ip-root {
  --bg: #0E0D1A;
  --card: #17162A;
  --card2: #1F1D35;
  --border: rgba(255,255,255,0.08);
  --border-hi: rgba(139,127,255,0.4);
  --text: #F0EEFF;
  --text2: #A09CC8;
  --text3: #5C5880;
  --accent: #7C6FFF;
  --accent2: #A78BFA;
  --green: #34D399;
  --red: #F87171;
  --yellow: #FBBF24;
  font-family: 'DM Sans', sans-serif;
  color: var(--text);
  min-height: 100vh;
  background: var(--bg);
  padding-bottom: 60px;
}
.ip-root * { box-sizing: border-box; }

/* ── Drop Zone ── */
.ip-dropzone {
  position: relative;
  border: 2px dashed rgba(139,127,255,0.35);
  border-radius: 20px;
  padding: 52px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s ease;
  background: radial-gradient(ellipse at center, rgba(124,111,255,0.06) 0%, transparent 70%);
  overflow: hidden;
}
.ip-dropzone::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(124,111,255,0.12) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.25s;
}
.ip-dropzone.dragging {
  border-color: var(--accent);
  background: radial-gradient(ellipse at center, rgba(124,111,255,0.15) 0%, transparent 70%);
  transform: scale(1.01);
}
.ip-dropzone.dragging::before { opacity: 1; }
.ip-dropzone:hover {
  border-color: rgba(139,127,255,0.55);
}
.ip-drop-icon {
  width: 72px; height: 72px;
  background: linear-gradient(135deg, rgba(124,111,255,0.2), rgba(167,139,250,0.2));
  border: 1px solid rgba(139,127,255,0.3);
  border-radius: 20px;
  display: flex; align-items: center; justify-content: center;
  font-size: 32px;
  margin: 0 auto 18px;
  position: relative; z-index: 1;
  box-shadow: 0 0 40px rgba(124,111,255,0.2);
}
.ip-drop-title {
  font-family: 'Syne', sans-serif;
  font-size: 18px; font-weight: 700;
  color: var(--text);
  margin-bottom: 6px;
  position: relative; z-index: 1;
}
.ip-drop-sub {
  font-size: 13px; color: var(--text3);
  margin-bottom: 18px;
  position: relative; z-index: 1;
}
.ip-browse-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 22px;
  background: linear-gradient(135deg, #7C6FFF, #A78BFA);
  border: none; border-radius: 12px;
  color: #fff; font-size: 13px; font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(124,111,255,0.4);
  position: relative; z-index: 1;
  transition: all 0.2s;
}
.ip-browse-btn:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 6px 28px rgba(124,111,255,0.5); }
.ip-file-types {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  margin-top: 16px;
  position: relative; z-index: 1;
}
.ip-type-pill {
  font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
  padding: 3px 9px; border-radius: 20px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--text3);
}

/* ── Controls Bar ── */
.ip-controls {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 18px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  margin: 16px 0;
  flex-wrap: wrap;
}
.ip-ctrl-label {
  font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--text3);
  white-space: nowrap;
}
.ip-ctrl-select {
  flex: 1; min-width: 130px;
  background: var(--card2); border: 1px solid rgba(255,255,255,0.12);
  border-radius: 9px; color: var(--text);
  padding: 8px 12px; font-size: 13px; font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer; outline: none;
  transition: border-color 0.15s;
}
.ip-ctrl-select:focus { border-color: var(--accent); }
.ip-ctrl-divider { width: 1px; height: 28px; background: var(--border); flex-shrink: 0; }
.ip-stat {
  display: flex; flex-direction: column; align-items: center;
  padding: 0 10px;
}
.ip-stat-val {
  font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800;
  color: var(--accent);
  line-height: 1;
}
.ip-stat-label { font-size: 10px; color: var(--text3); margin-top: 2px; }

/* ── Image Grid ── */
.ip-grid-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.ip-grid-title {
  font-family: 'Syne', sans-serif;
  font-size: 14px; font-weight: 700; color: var(--text2);
}
.ip-clear-btn {
  font-size: 12px; font-weight: 600; color: var(--red);
  background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25);
  padding: 4px 12px; border-radius: 8px; cursor: pointer;
  font-family: 'DM Sans', sans-serif; transition: all 0.15s;
}
.ip-clear-btn:hover { background: rgba(248,113,113,0.2); }

.ip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.ip-img-card {
  position: relative;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.2s;
  cursor: grab;
  group: true;
}
.ip-img-card:hover { border-color: rgba(139,127,255,0.4); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
.ip-img-card:active { cursor: grabbing; }

.ip-img-thumb {
  width: 100%; aspect-ratio: 4/3;
  object-fit: cover;
  display: block;
}
.ip-img-info {
  padding: 8px 10px;
}
.ip-img-name {
  font-size: 11px; font-weight: 600; color: var(--text2);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ip-img-size { font-size: 10px; color: var(--text3); margin-top: 2px; }

.ip-img-num {
  position: absolute; top: 8px; left: 8px;
  width: 22px; height: 22px; border-radius: 6px;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.15);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 800; color: var(--accent);
  font-family: 'Syne', sans-serif;
}
.ip-img-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; gap: 8px;
  opacity: 0; transition: opacity 0.2s;
}
.ip-img-card:hover .ip-img-overlay { opacity: 1; }
.ip-ov-btn {
  width: 32px; height: 32px; border-radius: 8px;
  background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25);
  color: #fff; font-size: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; font-family: 'DM Sans', sans-serif;
}
.ip-ov-btn:hover { background: rgba(255,255,255,0.28); transform: scale(1.08); }
.ip-ov-btn.del:hover { background: rgba(248,113,113,0.5); border-color: var(--red); }
.ip-ov-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

/* ── Generate Button ── */
.ip-gen-wrap {
  position: sticky; bottom: 20px;
  z-index: 10;
  display: flex; justify-content: center;
}
.ip-gen-btn {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 16px 36px;
  background: linear-gradient(135deg, #7C6FFF 0%, #A78BFA 50%, #7C6FFF 100%);
  background-size: 200% 100%;
  border: none; border-radius: 16px;
  color: #fff; font-size: 16px; font-weight: 700;
  font-family: 'Syne', sans-serif;
  cursor: pointer;
  box-shadow: 0 8px 32px rgba(124,111,255,0.5), 0 0 0 1px rgba(255,255,255,0.1);
  transition: all 0.25s;
  letter-spacing: -0.02em;
}
.ip-gen-btn:hover:not(:disabled) {
  background-position: 100% 0;
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(124,111,255,0.65), 0 0 0 1px rgba(255,255,255,0.15);
}
.ip-gen-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

/* ── Progress ── */
.ip-progress-wrap {
  margin: 16px 0;
  background: var(--card); border: 1px solid var(--border);
  border-radius: 12px; padding: 16px 20px;
}
.ip-progress-label {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px;
  font-size: 13px; font-weight: 600; color: var(--text2);
}
.ip-progress-bar {
  height: 6px; border-radius: 3px;
  background: rgba(255,255,255,0.08);
  overflow: hidden;
}
.ip-progress-fill {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, #7C6FFF, #A78BFA);
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(124,111,255,0.5);
}

/* ── Success ── */
.ip-success {
  display: flex; align-items: center; gap: 14px;
  padding: 18px 20px;
  background: rgba(52,211,153,0.08);
  border: 1px solid rgba(52,211,153,0.3);
  border-radius: 14px;
  margin-top: 16px;
}
.ip-success-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: rgba(52,211,153,0.15);
  border: 1px solid rgba(52,211,153,0.35);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; flex-shrink: 0;
}
.ip-success-text { flex: 1; }
.ip-success-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--green); }
.ip-success-sub { font-size: 12px; color: var(--text3); margin-top: 2px; }

/* ── Spinner ── */
@keyframes ip-spin { to { transform: rotate(360deg); } }
.ip-spinner {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  animation: ip-spin 0.7s linear infinite;
  flex-shrink: 0;
}

/* ── Slide up ── */
@keyframes ip-up { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
.ip-animate { animation: ip-up 0.3s ease forwards; }
`

export default function ImagesToPdf() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [pageSize, setPageSize] = useState('fit')
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()

  const addFiles = useCallback((files) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'))
    const newImgs = imgs.map(f => ({ file: f, url: URL.createObjectURL(f), id: Math.random() }))
    setImages(prev => [...prev, ...newImgs])
    setDone(false)
  }, [])

  const onFiles = useCallback((e) => addFiles(e.target.files || []), [addFiles])

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const remove = (id) => setImages(prev => prev.filter(i => i.id !== id))
  const moveUp = (idx) => { if (idx === 0) return; setImages(prev => { const a = [...prev]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; return a }) }
  const moveDown = (idx) => { setImages(prev => { if (idx === prev.length - 1) return prev; const a = [...prev]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; return a }) }

  const totalSize = images.reduce((s, i) => s + i.file.size, 0)
  const fmtSize = (b) => b > 1024*1024 ? (b/1024/1024).toFixed(1)+' MB' : (b/1024).toFixed(0)+' KB'

  const generate = async () => {
    if (!images.length) return
    setLoading(true); setProgress(0)
    try {
      const pdfDoc = await PDFDocument.create()
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        const ab = await img.file.arrayBuffer()
        const canvas = document.createElement('canvas')
        const image = new Image()
        await new Promise(res => { image.onload = res; image.src = img.url })
        canvas.width = image.naturalWidth; canvas.height = image.naturalHeight
        canvas.getContext('2d').drawImage(image, 0, 0)
        const pngBlob = await new Promise(res => canvas.toBlob(res, 'image/png'))
        const pngBuf = await pngBlob.arrayBuffer()
        const pdfImg = await pdfDoc.embedPng(pngBuf)
        const { width, height } = pdfImg
        let pw, ph
        if (pageSize === 'a4') { pw = 595; ph = 842 }
        else if (pageSize === 'letter') { pw = 612; ph = 792 }
        else { pw = width; ph = height }
        const page = pdfDoc.addPage([pw, ph])
        const scale = Math.min(pw / width, ph / height)
        const dw = width * scale, dh = height * scale
        page.drawImage(pdfImg, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh })
        setProgress(Math.round(((i + 1) / images.length) * 100))
      }
      const pdfBytes = await pdfDoc.save()
      downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'images.pdf')
      setDone(true)
    } catch (e) { alert('Error: ' + e.message) }
    setLoading(false)
  }

  return (
    <ToolLayout icon="📷" name="Images → PDF" desc="Combine multiple images into a single PDF">
      <style>{CSS}</style>
      <div className="ip-root" style={{ background: 'transparent', paddingBottom: 0 }}>

        {/* Drop Zone */}
        <div
          className={`ip-dropzone${dragging ? ' dragging' : ''}`}
          onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} style={{ display: 'none' }} />
          <div className="ip-drop-icon">🖼️</div>
          <div className="ip-drop-title">{dragging ? 'Drop your images here!' : 'Drag & Drop your images here'}</div>
          <div className="ip-drop-sub">Or browse from your device</div>
          <button className="ip-browse-btn" onClick={e => { e.stopPropagation(); fileRef.current?.click() }}>
            📂 Browse Files

          </button>
          <div className="ip-file-types">
            {['JPG', 'PNG', 'WEBP', 'GIF', 'BMP', 'SVG'].map(t => (
              <span key={t} className="ip-type-pill">{t}</span>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="ip-controls">
          <span className="ip-ctrl-label">Page Size</span>
          <select className="ip-ctrl-select" value={pageSize} onChange={e => setPageSize(e.target.value)}>
            <option value="fit">📐 Match Image Size</option>
            <option value="a4">📄 A4 (595 × 842 pt)</option>
            <option value="letter">📋 Letter (612 × 792 pt)</option>
          </select>

          {images.length > 0 && (
            <>
              <div className="ip-ctrl-divider" />
              <div className="ip-stat">
                <div className="ip-stat-val">{images.length}</div>
                <div className="ip-stat-label">Images</div>
              </div>
              <div className="ip-ctrl-divider" />
              <div className="ip-stat">
                <div className="ip-stat-val" style={{ fontSize: 15 }}>{fmtSize(totalSize)}</div>
                <div className="ip-stat-label">Total</div>
              </div>
            </>
          )}
        </div>

        {/* Image Grid */}
        {images.length > 0 && (
          <div className="ip-animate">
            <div className="ip-grid-header">
              <div className="ip-grid-title">🖼️ {images.length} Image{images.length > 1 ? 's' : ''} — This will be the order in your PDF</div>
              <button className="ip-clear-btn" onClick={() => { setImages([]); setDone(false) }}>🗑 Clear All</button>
            </div>

            <div className="ip-grid">
              {images.map((img, idx) => (
                <div key={img.id} className="ip-img-card">
                  <div className="ip-img-num">{idx + 1}</div>
                  <img className="ip-img-thumb" src={img.url} alt={img.file.name} />
                  <div className="ip-img-info">
                    <div className="ip-img-name">{img.file.name}</div>
                    <div className="ip-img-size">{fmtSize(img.file.size)}</div>
                  </div>
                  <div className="ip-img-overlay">
                    <button className="ip-ov-btn" onClick={() => moveUp(idx)} disabled={idx === 0} title="Move up">↑</button>
                    <button className="ip-ov-btn" onClick={() => moveDown(idx)} disabled={idx === images.length - 1} title="Move down">↓</button>
                    <button className="ip-ov-btn del" onClick={() => remove(img.id)} title="Remove">✕</button>
                  </div>
                </div>
              ))}

              {/* Add more card */}
              <div
                className="ip-img-card"
                style={{ border: '2px dashed rgba(139,127,255,0.25)', background: 'rgba(124,111,255,0.04)', cursor: 'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:140, gap:8 }}
                onClick={() => fileRef.current?.click()}
              >
                <div style={{ fontSize: 28 }}>＋</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>Add More</div>
              </div>
            </div>

            {/* Progress */}
            {loading && (
              <div className="ip-progress-wrap ip-animate">
                <div className="ip-progress-label">
                  <span>Creating PDF…</span>
                  <span style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{progress}%</span>
                </div>
                <div className="ip-progress-bar">
                  <div className="ip-progress-fill" style={{ width: progress + '%' }} />
                </div>
              </div>
            )}

            {/* Generate Button */}
            <div className="ip-gen-wrap">
              <button className="ip-gen-btn" onClick={generate} disabled={loading}>
                {loading
                  ? <><div className="ip-spinner" /> Creating PDF…</>
                  : <>✨ Convert {images.length} Image{images.length > 1 ? 's' : ''} to PDF</>
                }
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {done && (
          <div className="ip-success ip-animate">
            <div className="ip-success-icon">✅</div>
            <div className="ip-success-text">
              <div className="ip-success-title">PDF Downloaded Successfully!</div>
              <div className="ip-success-sub">{images.length} image{images.length > 1 ? 's' : ''} combined into one PDF — check your downloads folder</div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
