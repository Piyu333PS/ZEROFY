import { useState, useRef, useCallback, useEffect } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

// ─── Image Processing ─────────────────────────────────────────────────────────

function applyFilter(canvas, mode) {
  const ctx = canvas.getContext('2d')
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = imgData.data
  if (mode === 'bw') {
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      d[i] = d[i + 1] = d[i + 2] = gray > 140 ? 255 : 0
    }
  } else if (mode === 'grayscale') {
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      d[i] = d[i + 1] = d[i + 2] = gray
    }
  } else if (mode === 'enhanced') {
    const factor = 1.4, bias = -20
    for (let i = 0; i < d.length; i += 4) {
      d[i]     = Math.min(255, Math.max(0, d[i]     * factor + bias))
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] * factor + bias))
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] * factor + bias))
    }
  }
  ctx.putImageData(imgData, 0, 0)
}

function sharpenCanvas(canvas) {
  const ctx = canvas.getContext('2d')
  const w = canvas.width, h = canvas.height
  const src = ctx.getImageData(0, 0, w, h)
  const dst = ctx.createImageData(w, h)
  const s = src.data, o = dst.data
  const k = [0, -1, 0, -1, 5, -1, 0, -1, 0]
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4
      for (let c = 0; c < 3; c++) {
        let v = k[0]*s[((y-1)*w+(x-1))*4+c] + k[1]*s[((y-1)*w+x)*4+c] + k[2]*s[((y-1)*w+(x+1))*4+c]
              + k[3]*s[(y*w+(x-1))*4+c]     + k[4]*s[(y*w+x)*4+c]     + k[5]*s[(y*w+(x+1))*4+c]
              + k[6]*s[((y+1)*w+(x-1))*4+c] + k[7]*s[((y+1)*w+x)*4+c] + k[8]*s[((y+1)*w+(x+1))*4+c]
        o[idx + c] = Math.min(255, Math.max(0, v))
      }
      o[idx + 3] = 255
    }
  }
  ctx.putImageData(dst, 0, 0)
}

function processImage(file, settings) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const MAX = 2400
      let w = img.width, h = img.height
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else       { w = Math.round(w * MAX / h); h = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      applyFilter(canvas, settings.mode)
      if (settings.sharpen) sharpenCanvas(canvas)
      const dataUrl = canvas.toDataURL('image/jpeg', settings.quality / 100)
      canvas.toBlob(blob => resolve({ blob, url: URL.createObjectURL(blob), w, h, dataUrl }),
        'image/jpeg', settings.quality / 100)
    }
    img.src = URL.createObjectURL(file)
  })
}

async function makePdf(pages) {
  const { PDFDocument } = await import('pdf-lib')
  const pdfDoc = await PDFDocument.create()
  for (const page of pages) {
    const bytes = await fetch(page.url).then(r => r.arrayBuffer())
    const img = await pdfDoc.embedJpg(bytes)
    const a4W = 595, a4H = 842
    const ratio = Math.min(a4W / img.width, a4H / img.height)
    const pw = img.width * ratio, ph = img.height * ratio
    const pdfPage = pdfDoc.addPage([pw, ph])
    pdfPage.drawImage(img, { x: 0, y: 0, width: pw, height: ph })
  }
  const bytes = await pdfDoc.save()
  return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
}

async function extractTextFromPages(pages, lang, onProgress) {
  if (!window.Tesseract) {
    onProgress('OCR engine load ho raha hai...')
    await new Promise((res, rej) => {
      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
      s.onload = res; s.onerror = rej
      document.head.appendChild(s)
    })
  }
  let fullText = ''
  for (let i = 0; i < pages.length; i++) {
    onProgress(`Page ${i + 1}/${pages.length} read ho raha hai...`)
    const worker = await window.Tesseract.createWorker(lang, 1, {
      logger: m => {
        if (m.status === 'recognizing text')
          onProgress(`Page ${i+1}/${pages.length}: ${Math.round(m.progress * 100)}%`)
      }
    })
    const { data: { text } } = await worker.recognize(pages[i].dataUrl)
    await worker.terminate()
    fullText += (i > 0 ? '\n\n--- Page ' + (i + 1) + ' ---\n\n' : '') + text.trim()
  }
  return fullText
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MODES = [
  { id: 'bw',        label: '⬛ B&W',       desc: 'Printed text' },
  { id: 'grayscale', label: '🔲 Grayscale', desc: 'Handwriting' },
  { id: 'enhanced',  label: '✨ Enhanced',  desc: 'Colour docs' },
  { id: 'original',  label: '🎨 Original',  desc: 'No change' },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DocumentScanner() {
  const [step, setStep]           = useState('scan')   // 'scan' | 'export'
  const [pages, setPages]         = useState([])
  const [mode, setMode]           = useState('bw')
  const [sharpen, setSharpen]     = useState(true)
  const [quality, setQuality]     = useState(90)
  const [processing, setProc]     = useState(false)
  const [procMsg, setProcMsg]     = useState('')
  const [camOpen, setCamOpen]     = useState(false)
  const [camErr, setCamErr]       = useState('')
  const [stream, setStream]       = useState(null)
  const [flashAnim, setFlash]     = useState(false)
  const [exportType, setExport]   = useState(null)
  const [mergeAll, setMerge]      = useState(true)
  const [ocrLang, setOcrLang]     = useState('eng')
  const [ocrText, setOcrText]     = useState('')
  const [exportUrl, setExportUrl] = useState(null)
  const [exportDone, setExportDone] = useState(false)
  const [copied, setCopied]       = useState(false)

  const fileRef  = useRef()
  const videoRef = useRef()
  const canvasRef = useRef()

  useEffect(() => () => stream?.getTracks().forEach(t => t.stop()), [stream])

  const addPages = useCallback(async (files) => {
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!imgs.length) return
    setProc(true); setProcMsg('Scan enhance ho raha hai...')
    const newPages = []
    for (const file of imgs) {
      const result = await processImage(file, { mode, sharpen, quality })
      newPages.push({ file, ...result, name: file.name, id: Date.now() + Math.random() })
    }
    setPages(prev => [...prev, ...newPages])
    setProc(false); setProcMsg('')
  }, [mode, sharpen, quality])

  const onFileChange = e => addPages(e.target.files)
  const onDrop = e => { e.preventDefault(); addPages(e.dataTransfer.files) }

  const openCamera = async () => {
    setCamErr('')
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      })
      setStream(s); setCamOpen(true)
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s }, 80)
    } catch {
      setCamErr('Camera permission nahi mila. Browser mein camera allow karo.')
    }
  }

  const closeCamera = () => {
    stream?.getTracks().forEach(t => t.stop())
    setStream(null); setCamOpen(false)
  }

  const capture = () => {
    const video = videoRef.current, canvas = canvasRef.current
    if (!video || !canvas) return
    setFlash(true); setTimeout(() => setFlash(false), 180)
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(async blob => {
      const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' })
      setProc(true); setProcMsg('Enhancing...')
      const result = await processImage(file, { mode, sharpen, quality })
      setPages(prev => [...prev, { file, ...result, name: file.name, id: Date.now() + Math.random() }])
      setProc(false); setProcMsg('')
    }, 'image/jpeg', 0.95)
  }

  const removePage = id => setPages(prev => prev.filter(p => p.id !== id))
  const moveUp     = i  => setPages(prev => { const a = [...prev]; [a[i-1],a[i]]=[a[i],a[i-1]]; return a })
  const moveDown   = i  => setPages(prev => { const a = [...prev]; [a[i],a[i+1]]=[a[i+1],a[i]]; return a })

  const goToExport = () => { setExportUrl(null); setExportDone(false); setExportType(null); setOcrText(''); setStep('export') }
  const scanMore   = () => setStep('scan')
  const startFresh = () => { setPages([]); setStep('scan'); setExportUrl(null); setExportDone(false); setExportType(null); setOcrText('') }

  const doExport = async (type) => {
    setExport(type); setExportDone(false); setExportUrl(null); setProc(true)
    try {
      if (type === 'pdf') {
        setProcMsg('Creating PDF...')
        const pagesForPdf = mergeAll ? pages : [pages[0]]
        const url = await makePdf(pagesForPdf)
        setExportUrl(url); setExportDone(true)
      } else if (type === 'jpg') {
        const toDownload = mergeAll ? pages : [pages[0]]
        toDownload.forEach((p, i) => setTimeout(() => {
          const a = document.createElement('a'); a.href = p.url
          a.download = toDownload.length > 1 ? `scan_page_${i+1}.jpg` : 'scanned_document.jpg'
          a.click()
        }, i * 350))
        setExportDone(true)
      } else if (type === 'txt') {
        const text = await extractTextFromPages(
          mergeAll ? pages : [pages[0]], ocrLang, msg => setProcMsg(msg))
        setOcrText(text); setExportDone(true)
      }
    } catch (e) { setProcMsg('Error: ' + e.message) }
    setProc(false); setProcMsg('')
  }

  const downloadTxt = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([ocrText], { type: 'text/plain;charset=utf-8' }))
    a.download = 'scanned_text.txt'; a.click()
  }
  const copyTxt = () => { navigator.clipboard.writeText(ocrText); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <ToolLayout icon="📷" name="Document Scanner"
      desc="Scan documents from camera or gallery — export as JPG, PDF or Text">

      {/* ════════════════════ STEP 1: SCAN ════════════════════ */}
      {step === 'scan' && (
        <>
          {/* Settings */}
          <div style={C.card}>
            <div style={C.sLabel}>Scan Mode</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
              {MODES.map(m => (
                <button key={m.id} onClick={() => setMode(m.id)} style={{
                  ...C.modeBtn,
                  borderColor: mode===m.id ? 'var(--accent)' : 'var(--border)',
                  background:  mode===m.id ? 'var(--accent-glow)' : 'var(--surface)',
                  color:       mode===m.id ? 'var(--accent2)' : 'var(--text2)',
                  fontWeight:  mode===m.id ? 600 : 400,
                }}>
                  <div>{m.label}</div>
                  <div style={{ fontSize:10, marginTop:2, color:'var(--text3)' }}>{m.desc}</div>
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', color:'var(--text2)', fontSize:13 }}>
                <input type="checkbox" checked={sharpen} onChange={e => setSharpen(e.target.checked)} style={{ accentColor:'var(--accent)' }} />
                ✨ Sharpen
              </label>
              <div style={{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:160 }}>
                <span style={{ fontSize:13, color:'var(--text2)', whiteSpace:'nowrap' }}>Quality: {quality}%</span>
                <input type="range" min={60} max={100} step={5} value={quality}
                  onChange={e => setQuality(+e.target.value)} style={{ flex:1, accentColor:'var(--accent)' }} />
              </div>
            </div>
          </div>

          {/* Capture buttons */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            <button onClick={openCamera} style={C.capBtn(false)}>
              <span style={{ fontSize:30 }}>📸</span>
              <span style={{ fontWeight:700, fontSize:15 }}>Camera se Scan</span>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)' }}>Live capture</span>
            </button>
            <div onDragOver={e=>e.preventDefault()} onDrop={onDrop}
              onClick={() => fileRef.current?.click()} style={C.capBtn(true)}>
              <span style={{ fontSize:30 }}>🖼️</span>
              <span style={{ fontWeight:700, fontSize:15, color:'var(--text)' }}>Gallery Upload</span>
              <span style={{ fontSize:12, color:'var(--text3)' }}>Drag ya click karo</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={onFileChange} />
          </div>

          {camErr && <div style={C.errBox}>{camErr}</div>}

          {processing && (
            <div style={{ textAlign:'center', padding:'14px 0', color:'var(--accent2)', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
              <span className={styles.spinner} /> {procMsg}
            </div>
          )}

          {/* Pages grid */}
          {pages.length > 0 && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'8px 0 12px' }}>
                <div style={{ fontSize:14, color:'var(--text2)', fontWeight:500 }}>
                  📑 {pages.length} Page{pages.length > 1 ? 's' : ''} scanned
                </div>
                <button onClick={startFresh} style={C.ghost}>🗑️ Sabhi hatao</button>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10, marginBottom:20 }}>
                {pages.map((p, i) => (
                  <div key={p.id} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
                    <div style={{ position:'relative' }}>
                      <img src={p.url} alt={`Page ${i+1}`} style={{ width:'100%', aspectRatio:'3/4', objectFit:'cover', display:'block' }} />
                      <div style={{ position:'absolute', top:5, left:5, background:'rgba(0,0,0,0.65)', color:'#fff', fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:20 }}>{i+1}</div>
                    </div>
                    <div style={{ padding:'6px 8px', display:'flex', gap:4 }}>
                      {i > 0 && <button onClick={() => moveUp(i)} style={C.mini}>↑</button>}
                      {i < pages.length - 1 && <button onClick={() => moveDown(i)} style={C.mini}>↓</button>}
                      <button onClick={() => removePage(p.id)} style={{ ...C.mini, color:'var(--pink)', marginLeft:'auto' }}>✕</button>
                    </div>
                  </div>
                ))}
                <div onClick={() => fileRef.current?.click()} style={C.addTile}>
                  <span style={{ fontSize:26 }}>➕</span>
                  <span style={{ fontSize:12 }}>Aur add</span>
                </div>
              </div>

              <button className={styles.actionBtn} onClick={goToExport} style={{ marginTop:0 }}>
                ✅ Done — Save Options Dekho ({pages.length} page{pages.length > 1 ? 's' : ''})
              </button>
            </>
          )}

          {pages.length === 0 && (
            <div style={{ marginTop:24, padding:'16px 18px', background:'rgba(108,99,255,0.07)', border:'1px solid rgba(108,99,255,0.18)', borderRadius:'var(--radius)' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--accent2)', marginBottom:8 }}>⚡ Yahan kya special hai?</div>
              <div style={{ fontSize:13, color:'var(--text3)', lineHeight:1.9 }}>
                📸 Scan karo → ek click mein <b style={{color:'var(--text2)'}}>PDF, JPG ya Text file</b> choose karo<br/>
                📄 Multiple pages → <b style={{color:'var(--text2)'}}>automatically ek PDF</b> mein merge hoga<br/>
                🔤 OCR — Hindi + English text extract karo<br/>
                🎨 Auto-enhance — printed docs, handwriting, colour docs ke liye alag modes
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════════════ STEP 2: EXPORT ════════════════════ */}
      {step === 'export' && (
        <>
          {/* Thumbnail strip */}
          <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:8, marginBottom:18 }}>
            {pages.map((p, i) => (
              <div key={p.id} style={{ flexShrink:0, position:'relative' }}>
                <img src={p.url} alt="" style={{ height:70, width:52, objectFit:'cover', borderRadius:6, border:'1px solid var(--border)' }} />
                <div style={{ position:'absolute', bottom:3, left:0, right:0, textAlign:'center', fontSize:10, color:'#fff', fontWeight:700, textShadow:'0 1px 3px rgba(0,0,0,0.9)' }}>{i+1}</div>
              </div>
            ))}
            <button onClick={scanMore} style={{ flexShrink:0, width:52, height:70, borderRadius:6, border:'2px dashed var(--border)', background:'none', color:'var(--text3)', fontSize:20, cursor:'pointer' }}>➕</button>
          </div>

          {/* Merge question */}
          {pages.length > 1 && (
            <div style={{ ...C.card, marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:12 }}>
                📄 {pages.length} pages hain — kaise save karna hai?
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  { val:true,  icon:'📚', label:'Sabhi pages ek saath', sub:'Single PDF / saari JPG ek baar mein' },
                  { val:false, icon:'📄', label:'Sirf pehla page',       sub:'Single file' },
                ].map(opt => (
                  <button key={String(opt.val)} onClick={() => setMerge(opt.val)} style={{
                    padding:'14px 10px', borderRadius:10, cursor:'pointer', textAlign:'center', fontSize:13,
                    border:`1.5px solid ${mergeAll===opt.val ? 'var(--accent)' : 'var(--border)'}`,
                    background: mergeAll===opt.val ? 'var(--accent-glow)' : 'var(--surface)',
                    color: mergeAll===opt.val ? 'var(--accent2)' : 'var(--text2)',
                    fontWeight: mergeAll===opt.val ? 600 : 400,
                  }}>
                    <div style={{ fontSize:22, marginBottom:4 }}>{opt.icon}</div>
                    {opt.label}
                    <div style={{ fontSize:11, marginTop:3, color:'var(--text3)' }}>{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Format cards */}
          <div style={C.sLabel}>Kaunse format mein save karna hai?</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>

            {/* PDF */}
            <div style={{ ...C.fCard, borderColor: exportType==='pdf'?'var(--accent)':'var(--border)', background: exportType==='pdf'?'var(--accent-glow)':'var(--bg3)' }}>
              <div style={{ fontSize:32, marginBottom:6 }}>📄</div>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>PDF</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:12, lineHeight:1.5 }}>
                {mergeAll && pages.length > 1 ? `${pages.length} pages → ek PDF` : 'Best for sharing'}
              </div>
              <button onClick={() => doExport('pdf')} disabled={processing} style={C.expBtn('#6c63ff','#fff')}>
                {processing && exportType==='pdf' ? <><span className={styles.spinner}/> Ban raha hai...</> : '⬇ PDF Download'}
              </button>
            </div>

            {/* JPG */}
            <div style={{ ...C.fCard, borderColor: exportType==='jpg'?'var(--green)':'var(--border)', background: exportType==='jpg'?'rgba(0,212,170,0.08)':'var(--bg3)' }}>
              <div style={{ fontSize:32, marginBottom:6 }}>🖼️</div>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>JPG Image</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:12, lineHeight:1.5 }}>
                {mergeAll && pages.length > 1 ? `${pages.length} images download` : 'High quality image'}
              </div>
              <button onClick={() => doExport('jpg')} disabled={processing} style={C.expBtn('#00d4aa','#000')}>
                {processing && exportType==='jpg' ? <><span className={styles.spinner}/></> : '⬇ JPG Download'}
              </button>
            </div>

            {/* TXT OCR */}
            <div style={{ ...C.fCard, borderColor: exportType==='txt'?'var(--yellow)':'var(--border)', background: exportType==='txt'?'rgba(255,215,0,0.07)':'var(--bg3)' }}>
              <div style={{ fontSize:32, marginBottom:6 }}>🔤</div>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>Text (OCR)</div>
              <select value={ocrLang} onChange={e => setOcrLang(e.target.value)} style={C.select}>
                <option value="eng">English</option>
                <option value="hin">Hindi</option>
                <option value="eng+hin">Hindi + English</option>
              </select>
              <button onClick={() => doExport('txt')} disabled={processing} style={{ ...C.expBtn('#ffd700','#000'), marginTop:6 }}>
                {processing && exportType==='txt' ? <><span className={styles.spinner}/> {procMsg}</> : '🔍 Text Extract'}
              </button>
            </div>
          </div>

          {/* Success states */}
          {exportDone && exportType === 'pdf' && exportUrl && (
            <a href={exportUrl} download={mergeAll && pages.length > 1 ? 'scanned_merged.pdf' : 'scanned_document.pdf'} style={C.successLink}>
              ✅ PDF ready! — Click karke download karo 📄
            </a>
          )}
          {exportDone && exportType === 'jpg' && (
            <div style={{ ...C.successLink, cursor:'default' }}>
              ✅ {mergeAll && pages.length > 1 ? `${pages.length} JPG files download ho rahe hain!` : 'JPG download ho gaya!'}
            </div>
          )}
          {exportDone && exportType === 'txt' && ocrText && (
            <div style={{ marginTop:4 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <span style={{ fontSize:13, color:'var(--text2)' }}>✅ {ocrText.split(/\s+/).filter(Boolean).length} words extract hue</span>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={copyTxt} style={{ ...C.ghost, color: copied ? 'var(--green)' : 'var(--text2)' }}>{copied ? '✅ Copied' : '📋 Copy'}</button>
                  <button onClick={downloadTxt} style={{ ...C.ghost, color:'var(--accent2)' }}>⬇ .txt</button>
                </div>
              </div>
              <textarea value={ocrText} onChange={e => setOcrText(e.target.value)}
                style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:14, color:'var(--text)', fontSize:13, minHeight:160, outline:'none', resize:'vertical', fontFamily:'var(--font-body)', lineHeight:1.6 }} />
            </div>
          )}

          <div style={{ display:'flex', gap:10, marginTop:18 }}>
            <button onClick={scanMore} style={{ ...C.ghost, flex:1, padding:'11px', display:'flex', justifyContent:'center' }}>📸 Aur pages scan karo</button>
            <button onClick={startFresh} style={{ ...C.ghost, flex:1, padding:'11px', display:'flex', justifyContent:'center' }}>🔄 Naya scan shuru karo</button>
          </div>
        </>
      )}

      {/* ════════════════════ CAMERA MODAL ════════════════════ */}
      {camOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.96)', zIndex:9999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
          {flashAnim && <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.35)', pointerEvents:'none', zIndex:10001 }} />}
          <video ref={videoRef} autoPlay playsInline muted
            style={{ maxWidth:'94vw', maxHeight:'66vh', borderRadius:12, border:'2px solid var(--border2)' }} />
          <canvas ref={canvasRef} style={{ display:'none' }} />
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <button onClick={capture} style={{ background:'var(--accent)', color:'#fff', border:'none', borderRadius:100, padding:'14px 36px', fontSize:16, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 24px var(--accent-glow)' }}>
              📷 Capture
            </button>
            <button onClick={closeCamera} style={{ background:'var(--surface2)', color:'var(--text2)', border:'1px solid var(--border2)', borderRadius:100, padding:'14px 22px', cursor:'pointer', fontSize:15 }}>✕</button>
          </div>
          {pages.length > 0 && (
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <span style={{ fontSize:12, color:'var(--text3)' }}>{pages.length} page{pages.length>1?'s':''} captured</span>
              <button onClick={() => { closeCamera(); goToExport() }} style={{ background:'var(--green)', color:'#000', border:'none', borderRadius:100, padding:'8px 18px', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                ✅ Done — Save Karo
              </button>
            </div>
          )}
          <div style={{ color:'var(--text3)', fontSize:12, textAlign:'center' }}>
            Document flat rakho • Achhi roshni mein • Capture dabao
          </div>
        </div>
      )}
    </ToolLayout>
  )
}

// ─── Style constants ──────────────────────────────────────────────────────────
const C = {
  card:    { background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'16px 18px', marginBottom:16 },
  sLabel:  { fontSize:12, fontWeight:600, color:'var(--text3)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 },
  modeBtn: { padding:'10px 6px', borderRadius:10, border:'1.5px solid', fontSize:12, textAlign:'center', cursor:'pointer', transition:'all 0.15s' },
  mini:    { background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'3px 8px', fontSize:12, color:'var(--text2)', cursor:'pointer' },
  ghost:   { background:'none', border:'1px solid var(--border)', color:'var(--text3)', borderRadius:8, padding:'7px 14px', fontSize:13, cursor:'pointer' },
  errBox:  { background:'rgba(255,77,77,0.1)', border:'1px solid rgba(255,77,77,0.3)', borderRadius:'var(--radius)', padding:'11px 14px', color:'#ff6b6b', fontSize:13, marginBottom:12 },
  addTile: { border:'2px dashed var(--border)', borderRadius:10, aspectRatio:'3/4', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, cursor:'pointer', color:'var(--text3)', fontSize:12 },
  fCard:   { border:'1.5px solid', borderRadius:'var(--radius)', padding:'16px 12px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', transition:'all 0.15s' },
  expBtn:  (bg, col) => ({ width:'100%', background:bg, color:col, border:'none', borderRadius:8, padding:'9px 0', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }),
  select:  { width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'5px 8px', color:'var(--text)', fontSize:11, outline:'none', marginBottom:2 },
  successLink: { display:'flex', alignItems:'center', justifyContent:'center', marginTop:10, padding:'13px', background:'rgba(0,212,170,0.1)', border:'1px solid rgba(0,212,170,0.35)', borderRadius:'var(--radius)', color:'var(--green)', fontWeight:600, fontSize:14, textDecoration:'none' },
  capBtn:  (outline) => ({ background: outline?'var(--bg3)':'var(--accent)', border: outline?'2px dashed var(--border2)':'none', borderRadius:'var(--radius)', padding:'22px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:6, cursor:'pointer', color: outline?'var(--text2)':'#fff', boxShadow: outline?'none':'0 4px 20px rgba(108,99,255,0.4)' }),
}
