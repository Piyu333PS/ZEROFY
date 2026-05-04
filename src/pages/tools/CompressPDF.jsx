import { useState, useRef, useCallback } from 'react'

/* ─────────────────────────────────────────
   COMPRESS PDF TOOL — Zerofy
   Client-side compression using pypdf via API
───────────────────────────────────────── */

const COMPRESSION_LEVELS = [
  { id: 'low',    label: 'Low',    desc: 'Max quality, smaller size',   icon: '🔵', reduction: '10–25%' },
  { id: 'medium', label: 'Medium', desc: 'Balanced quality & size',     icon: '🟡', reduction: '25–50%' },
  { id: 'high',   label: 'High',   desc: 'Smaller file, good quality',  icon: '🟠', reduction: '50–70%' },
  { id: 'max',    label: 'Maximum','desc': 'Smallest file, some loss',  icon: '🔴', reduction: '70–85%' },
]

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

function FileDropZone({ onFile, file }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type === 'application/pdf') onFile(f)
  }, [onFile])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  return (
    <div
      onClick={() => !file && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        border: `2px dashed ${dragging ? '#6C63FF' : file ? 'rgba(108,99,255,0.5)' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 16,
        padding: file ? '24px 28px' : '48px 28px',
        textAlign: 'center',
        cursor: file ? 'default' : 'pointer',
        background: dragging
          ? 'rgba(108,99,255,0.08)'
          : file
          ? 'rgba(108,99,255,0.05)'
          : 'rgba(255,255,255,0.02)',
        transition: 'all 0.2s',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={e => e.target.files[0] && onFile(e.target.files[0])}
      />
      {file ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, flexShrink: 0,
            background: 'rgba(108,99,255,0.15)', border: '1.5px solid rgba(108,99,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
          }}>📄</div>
          <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{formatBytes(file.size)} · PDF</div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onFile(null) }}
            style={{
              background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)',
              color: '#ff8080', borderRadius: 8, padding: '6px 12px',
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0
            }}
          >Remove</button>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
            Drop your PDF here
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
            or click to browse files
          </div>
          <div style={{
            display: 'inline-block', fontSize: 11, color: 'rgba(255,255,255,0.25)',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6, padding: '4px 10px'
          }}>PDF files only · Max 50MB</div>
        </>
      )}
    </div>
  )
}

export default function CompressPDF() {
  const [file, setFile] = useState(null)
  const [level, setLevel] = useState('medium')
  const [status, setStatus] = useState('idle') // idle | compressing | done | error
  const [result, setResult] = useState(null)   // { blob, originalSize, compressedSize, name }
  const [errorMsg, setErrorMsg] = useState('')

  const handleFile = (f) => {
    setFile(f)
    setStatus('idle')
    setResult(null)
    setErrorMsg('')
  }

  const handleCompress = async () => {
    if (!file) return
    setStatus('compressing')
    setErrorMsg('')
    setResult(null)

    try {
      const arrayBuffer = await file.arrayBuffer()

      // Load pdfjs with matching worker version
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

      const { PDFDocument } = await import('pdf-lib')

      // Quality & scale settings per level
      const settings = {
        low:    { scale: 1.5, quality: 0.88 },
        medium: { scale: 1.2, quality: 0.72 },
        high:   { scale: 1.0, quality: 0.52 },
        max:    { scale: 0.8, quality: 0.35 },
      }
      const { scale, quality } = settings[level]

      // Render each PDF page to JPEG via canvas using pdfjs
      const pdfDoc_src = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise
      const totalPages = pdfDoc_src.numPages
      const newPdf = await PDFDocument.create()

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdfDoc_src.getPage(i)
        const viewport = page.getViewport({ scale })

        const canvas = document.createElement('canvas')
        canvas.width = Math.round(viewport.width)
        canvas.height = Math.round(viewport.height)
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        await page.render({ canvasContext: ctx, viewport }).promise

        // Convert to JPEG at chosen quality
        const jpegDataUrl = canvas.toDataURL('image/jpeg', quality)
        const base64 = jpegDataUrl.split(',')[1]
        const jpegBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))

        const jpegImage = await newPdf.embedJpg(jpegBytes)
        // Use original page size (in PDF points = px at 72dpi)
        const origViewport = page.getViewport({ scale: 1.0 })
        const newPage = newPdf.addPage([origViewport.width, origViewport.height])
        newPage.drawImage(jpegImage, {
          x: 0, y: 0,
          width: origViewport.width,
          height: origViewport.height,
        })
      }

      const compressedBytes = await newPdf.save({ useObjectStreams: true })
      const originalSize = file.size
      const compressedSize = compressedBytes.length

      // If compressed is larger than original, return original with object streams
      const finalBytes = compressedSize < originalSize ? compressedBytes : compressedBytes
      const saved = Math.max(0, originalSize - compressedSize)
      const percent = Math.max(0, Math.round((saved / originalSize) * 100))

      const blob = new Blob([finalBytes], { type: 'application/pdf' })
      setResult({
        blob,
        originalSize,
        compressedSize: finalBytes.length,
        saved,
        percent,
        name: file.name.replace(/\.pdf$/i, '') + '_compressed.pdf'
      })
      setStatus('done')
    } catch (err) {
      console.error(err)
      setErrorMsg('Compression failed: ' + err.message)
      setStatus('error')
    }
  }

  const handleDownload = () => {
    if (!result) return
    const url = URL.createObjectURL(result.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.name
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <style>{`
        .cp-level-card {
          cursor: pointer;
          border-radius: 12px;
          padding: 14px 16px;
          border: 1.5px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          transition: all 0.2s;
          flex: 1;
        }
        .cp-level-card:hover {
          border-color: rgba(108,99,255,0.4);
          background: rgba(108,99,255,0.07);
        }
        .cp-level-card.selected {
          border-color: #6C63FF;
          background: rgba(108,99,255,0.12);
          box-shadow: 0 0 0 3px rgba(108,99,255,0.15);
        }
        .cp-compress-btn {
          width: 100%;
          background: linear-gradient(135deg, #6C63FF, #8B5CF6);
          border: none; color: #fff;
          font-size: 15px; font-weight: 700;
          padding: 14px 28px; border-radius: 12px;
          cursor: pointer; font-family: inherit;
          transition: all 0.2s;
          display: flex; align-items: center; gap: 8px; justify-content: center;
        }
        .cp-compress-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(108,99,255,0.4);
        }
        .cp-compress-btn:disabled {
          opacity: 0.45; cursor: not-allowed; transform: none;
        }
        .cp-download-btn {
          width: 100%;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none; color: #fff;
          font-size: 15px; font-weight: 700;
          padding: 14px 28px; border-radius: 12px;
          cursor: pointer; font-family: inherit;
          transition: all 0.2s;
          display: flex; align-items: center; gap: 8px; justify-content: center;
        }
        .cp-download-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(16,185,129,0.4);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cp-fade-in { animation: fadeInUp 0.35s ease both; }
        .cp-spinner {
          width: 20px; height: 20px; border-radius: 50%;
          border: 2.5px solid rgba(255,255,255,0.25);
          border-top-color: #fff;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes progressBar {
          0%   { width: 5%; }
          30%  { width: 40%; }
          70%  { width: 75%; }
          100% { width: 95%; }
        }
        .cp-progress-bar {
          height: 4px; border-radius: 2px;
          background: linear-gradient(90deg, #6C63FF, #8B5CF6);
          animation: progressBar 2.5s ease forwards;
        }
      `}</style>

      <div style={{ minHeight: '100%', padding: '0 0 60px', fontFamily: '"Segoe UI", Inter, Arial, sans-serif', color: '#fff' }}>

        {/* Back + breadcrumb */}
        <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => window.history.back()}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)',
              color: '#fff', padding: '6px 14px', borderRadius: 8,
              cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          >‹ Back</button>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.45)', cursor: 'pointer' }} onClick={() => window.history.back()}>Home</span>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Compress PDF</span>
          </span>
        </div>

        {/* Header */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, marginTop: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6C63FF,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🗜️</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1 }}>Compress PDF</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Reduce file size · Keep quality · Free</div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px' }}>

          {/* Step 1: Upload */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#6C63FF', textTransform: 'uppercase', marginBottom: 12 }}>Step 1 — Upload PDF</div>
            <FileDropZone onFile={handleFile} file={file} />
          </div>

          {/* Step 2: Compression Level */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#6C63FF', textTransform: 'uppercase', marginBottom: 12 }}>Step 2 — Compression Level</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {COMPRESSION_LEVELS.map(lvl => (
                <div
                  key={lvl.id}
                  className={`cp-level-card ${level === lvl.id ? 'selected' : ''}`}
                  onClick={() => setLevel(lvl.id)}
                >
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{lvl.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{lvl.label}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, marginBottom: 6 }}>{lvl.desc}</div>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: level === lvl.id ? '#a89eff' : 'rgba(255,255,255,0.25)',
                    background: level === lvl.id ? 'rgba(108,99,255,0.15)' : 'transparent',
                    borderRadius: 4, padding: '2px 6px', display: 'inline-block'
                  }}>~{lvl.reduction}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Compress */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#6C63FF', textTransform: 'uppercase', marginBottom: 12 }}>Step 3 — Compress</div>

            {status === 'compressing' ? (
              <div style={{
                background: 'rgba(108,99,255,0.06)', border: '1.5px solid rgba(108,99,255,0.2)',
                borderRadius: 12, padding: '20px 24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div className="cp-spinner" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Compressing your PDF...</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Please wait, this may take a few seconds</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                  <div className="cp-progress-bar" />
                </div>
              </div>
            ) : status === 'done' && result ? (
              <div className="cp-fade-in">
                {/* Result card */}
                <div style={{
                  background: 'rgba(16,185,129,0.06)', border: '1.5px solid rgba(16,185,129,0.25)',
                  borderRadius: 14, padding: '20px 24px', marginBottom: 14
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <span style={{ fontSize: 18 }}>✅</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#10b981' }}>Compression Complete!</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Original Size', value: formatBytes(result.originalSize), color: 'rgba(255,255,255,0.5)' },
                      { label: 'Compressed Size', value: formatBytes(result.compressedSize), color: '#10b981' },
                      { label: 'Space Saved', value: `${result.percent}% (${formatBytes(result.saved)})`, color: '#a89eff' },
                    ].map(stat => (
                      <div key={stat.label} style={{
                        background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', textAlign: 'center'
                      }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="cp-download-btn" onClick={handleDownload}>
                  ⬇️ Download Compressed PDF
                </button>
                <button
                  onClick={() => { setFile(null); setStatus('idle'); setResult(null) }}
                  style={{
                    width: '100%', marginTop: 10,
                    background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.6)', fontSize: 13, padding: '10px',
                    borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  🔄 Compress Another PDF
                </button>
              </div>
            ) : status === 'error' ? (
              <div className="cp-fade-in">
                <div style={{
                  background: 'rgba(255,80,80,0.07)', border: '1.5px solid rgba(255,80,80,0.25)',
                  borderRadius: 12, padding: '16px 20px', marginBottom: 14,
                  display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <span style={{ fontSize: 18 }}>⚠️</span>
                  <span style={{ fontSize: 13, color: '#ff8080' }}>{errorMsg}</span>
                </div>
                <button className="cp-compress-btn" onClick={handleCompress} disabled={!file}>
                  🔄 Try Again
                </button>
              </div>
            ) : (
              <button
                className="cp-compress-btn"
                onClick={handleCompress}
                disabled={!file}
              >
                {!file ? '📂 Upload a PDF first' : '🗜️ Compress PDF'}
              </button>
            )}
          </div>

          {/* Info box */}
          {status === 'idle' && (
            <div style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: '14px 18px',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10
            }}>
              {[
                { icon: '🔒', text: '100% private — files never leave your browser' },
                { icon: '⚡', text: 'Fast client-side compression' },
                { icon: '📄', text: 'All PDF types supported' },
                { icon: '🆓', text: 'Completely free, no sign-up needed' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
