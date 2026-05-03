import { useState, useRef, useEffect, useCallback } from 'react'

/* ─────────────────────────────────────────────
   SCRIPT LOADERS
───────────────────────────────────────────── */
function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`) && window.pdfjsLib && src.includes('pdf.min')) return res()
    if (document.querySelector(`script[src="${src}"]`) && window.PDFLib && src.includes('pdf-lib')) return res()
    const s = document.createElement('script')
    s.src = src
    s.onload = res
    s.onerror = rej
    document.head.appendChild(s)
  })
}

async function getPdfJs() {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js')
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  return window.pdfjsLib
}

async function getPdfLib() {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js')
  return window.PDFLib
}

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
let _uid = 1
const uid = () => _uid++
const SCALE = 1.6

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{overflow:hidden;height:100%}

.app{display:flex;flex-direction:column;position:fixed;inset:0;font-family:'Inter',sans-serif;background:#dde1e7;overflow:hidden;z-index:9990}

/* ── TOP BAR ── */
.bar{
  display:flex;align-items:center;gap:6px;padding:0 14px;height:48px;
  background:#0f172a;border-bottom:1px solid #1e293b;flex-shrink:0;z-index:100;
  overflow-x:auto;
}
.bar::-webkit-scrollbar{height:0}
.logo{font-size:15px;font-weight:700;color:#fff;margin-right:6px;white-space:nowrap;letter-spacing:-.3px}
.logo b{color:#3b82f6}
.bsep{width:1px;height:20px;background:#1e293b;flex-shrink:0}
.btn{
  display:inline-flex;align-items:center;gap:5px;padding:5px 11px;
  border-radius:6px;font-size:12px;font-weight:500;border:1px solid #1e293b;
  color:#94a3b8;background:transparent;cursor:pointer;white-space:nowrap;
  font-family:inherit;transition:all .12s;
}
.btn:hover{background:#1e293b;color:#e2e8f0}
.btn:disabled{opacity:.35;cursor:not-allowed}
.btn-open{background:#3b82f6;color:#fff;border-color:#3b82f6;font-weight:600}
.btn-open:hover{background:#2563eb;border-color:#2563eb}
.btn-add{background:#059669;color:#fff;border-color:#059669;font-weight:600}
.btn-add:hover{background:#047857;border-color:#047857}
.btn-add.armed{background:#dc2626;border-color:#dc2626;animation:pulse 1s infinite}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 #dc262640}50%{box-shadow:0 0 0 6px #dc262600}}
.btn-save{background:#7c3aed;color:#fff;border-color:#7c3aed;font-weight:600;margin-left:auto;flex-shrink:0}
.btn-save:hover:not(:disabled){background:#6d28d9;border-color:#6d28d9}
.spin{width:11px;height:11px;border:2px solid #ffffff44;border-top-color:#fff;border-radius:50%;animation:sp .5s linear infinite;display:inline-block}
@keyframes sp{to{transform:rotate(360deg)}}
.pnav{display:flex;align-items:center;gap:3px}
.pnav input{width:32px;background:#1e293b;border:1px solid #334155;border-radius:4px;padding:2px 4px;font-size:11px;color:#e2e8f0;text-align:center;outline:none;font-family:monospace}
.pnav span{font-size:11px;color:#475569}
.pnav button{width:22px;height:22px;border-radius:4px;border:1px solid #1e293b;background:transparent;color:#94a3b8;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center}
.pnav button:hover:not(:disabled){background:#1e293b;color:#e2e8f0}
.pnav button:disabled{opacity:.25;cursor:default}
.zrow{display:flex;align-items:center;gap:3px}
.zlbl{font-size:10px;color:#64748b;min-width:32px;text-align:center;font-family:monospace}

/* ── BODY ── */
.body{display:flex;flex:1;overflow:hidden;min-height:0}

/* ── PAGES PANEL ── */
.panel{width:88px;background:#0f172a;border-right:1px solid #1e293b;overflow-y:auto;flex-shrink:0;padding:8px 6px;display:flex;flex-direction:column;gap:5px}
.panel::-webkit-scrollbar{width:3px}
.panel::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
.ptitle{font-size:9px;color:#334155;text-transform:uppercase;letter-spacing:1px;padding-bottom:4px;font-weight:700}
.pthumb{cursor:pointer;border:1.5px solid #1e293b;border-radius:4px;overflow:hidden;background:#1e293b;position:relative;transition:border-color .12s}
.pthumb:hover{border-color:#3b82f6}
.pthumb.on{border-color:#3b82f6;box-shadow:0 0 0 2px #3b82f625}
.pthumb img{display:block;width:100%}
.pthumb-n{position:absolute;bottom:2px;right:3px;font-size:8.5px;color:#94a3b8;background:#0f172acc;padding:1px 3px;border-radius:2px}
.pthumb-ph{height:72px;display:flex;align-items:center;justify-content:center;color:#334155;font-size:9px}

/* ── WORKSPACE ── */
.ws{flex:1;overflow:auto;display:flex;align-items:flex-start;justify-content:center;padding:24px 20px;background:#dde1e7;min-height:0}
.ws::-webkit-scrollbar{width:7px;height:7px}
.ws::-webkit-scrollbar-thumb{background:#94a3b8;border-radius:4px}

/* ── PAGE CONTAINER ── */
.pgwrap{position:relative;display:inline-block;flex-shrink:0;box-shadow:0 4px 28px rgba(0,0,0,.28);border-radius:1px}
.pgwrap.armed{cursor:crosshair}
canvas{display:block}

/* ── TEXT OVERLAY ITEMS ── */
/* Both existing-text hits and new boxes share .titem */
.titem{
  position:absolute;
  cursor:text;
  border:1px solid transparent;
  border-radius:2px;
  transition:border-color .1s;
  /* NO background by default — completely invisible */
}
.titem:hover{ border-color:#3b82f688; }
.titem.active{
  border-color:#3b82f6 !important;
  box-shadow:0 0 0 2px #3b82f630;
  z-index:20 !important;
}

/* The inner label shown when modified/added but NOT actively editing */
.titem-label{
  position:absolute;inset:0;
  padding:0 2px;
  white-space:pre;
  overflow:hidden;
  pointer-events:none;
  line-height:1.25;
}

/* The textarea shown when actively editing */
.titem-ta{
  position:absolute;inset:-2px;
  width:calc(100% + 4px);height:calc(100% + 4px);
  border:none;outline:none;resize:none;overflow:hidden;
  padding:0 2px;
  background:#ffffffee;
  line-height:1.25;
  direction:ltr !important;
  unicode-bidi:plaintext !important;
  font-family:inherit;
  border-radius:2px;
  cursor:text;
}

/* new boxes have a visible move handle */
.titem.newbox{ cursor:move; min-width:40px; min-height:20px; }
.titem.newbox:not(.active){ border:1px dashed #3b82f666; background:transparent; }
.titem.newbox.active{ border-style:solid; }
.titem.newbox .titem-ta{ cursor:text; }

/* ── FORMAT BAR ── */
.fbar{
  position:fixed;z-index:9999;
  display:flex;align-items:center;gap:2px;
  background:#0f172a;border:1px solid #1e293b;
  border-radius:8px;padding:4px 7px;
  box-shadow:0 8px 32px rgba(0,0,0,.5);
  pointer-events:all;
}
.fi{width:26px;height:24px;border-radius:4px;border:none;background:transparent;color:#94a3b8;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;font-family:inherit;transition:all .1s;flex-shrink:0}
.fi:hover{background:#1e293b;color:#e2e8f0}
.fi.on{background:#1d4ed820;color:#60a5fa}
.fi.del{color:#f87171}
.fi.del:hover{background:#7f1d1d30}
.fsep{width:1px;height:14px;background:#1e293b;margin:0 2px;flex-shrink:0}
.fsz{width:38px;background:#1e293b;border:1px solid #334155;border-radius:3px;padding:2px 3px;font-size:11px;color:#e2e8f0;outline:none;text-align:center;font-family:monospace}
.fcol{width:20px;height:20px;border-radius:50%;border:2px solid #334155;cursor:pointer;padding:0;overflow:hidden;flex-shrink:0}
.ffont{background:#1e293b;border:1px solid #334155;border-radius:3px;padding:2px 4px;font-size:10px;color:#e2e8f0;outline:none;font-family:inherit;cursor:pointer;max-width:82px}

/* ── DROP ZONE ── */
.dz{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;width:420px;min-height:280px;border:2px dashed #334155;border-radius:12px;background:#1e293b;text-align:center;margin:auto;padding:44px 32px;transition:all .15s;cursor:pointer}
.dz:hover,.dz.over{border-color:#3b82f6;background:#1e3a5f}
.dz svg{opacity:.4}
.dz h2{font-size:16px;font-weight:700;color:#e2e8f0}
.dz p{font-size:12px;color:#64748b}
.dz label{display:inline-flex;align-items:center;gap:6px;padding:8px 20px;background:#3b82f6;border:none;border-radius:7px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
.dz label:hover{background:#2563eb}

/* ── LOADER ── */
.ldwrap{display:flex;flex-direction:column;align-items:center;gap:10px;margin:auto;color:#64748b;font-size:13px}
.ldring{width:40px;height:40px;border:3px solid #1e293b;border-top-color:#3b82f6;border-radius:50%;animation:sp .7s linear infinite}

/* ── STATUS BAR ── */
.sbar{display:flex;align-items:center;justify-content:space-between;padding:0 14px;height:26px;background:#0f172a;border-top:1px solid #1e293b;font-size:10.5px;color:#334155;flex-shrink:0;gap:8px}
.sdot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#22c55e;margin-right:4px;flex-shrink:0}
.sbar .hint{color:#3b82f6;font-weight:500}

/* ── TOAST ── */
.toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#dc2626;color:#fff;padding:8px 16px;border-radius:6px;font-size:12px;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,.3);white-space:nowrap}
`

const FONTS = ['Arial','Times New Roman','Courier New','Georgia','Verdana','Trebuchet MS']

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function PdfTextEditor() {
  // PDF state
  const [pdfBytes,   setPdfBytes]   = useState(null)
  const [fileName,   setFileName]   = useState('')
  const [totalPages, setTotalPages] = useState(0)
  const [page,       setPage]       = useState(1)
  const [scale,      setScale]      = useState(SCALE)

  // UI state
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [thumbs,   setThumbs]   = useState({})
  const [armed,    setArmed]    = useState(false)   // add-text mode

  // Items: both extracted pdf text + new boxes
  // shape: {id, page, x, y, w, h, text, origText, fontSize, fontFamily, bold, italic, color, isNew}
  const [items,    setItems]    = useState([])
  const [activeId, setActiveId] = useState(null)   // currently editing
  const [fbar,     setFbar]     = useState(null)   // {id, x, y}

  // Refs
  const canvasRef  = useRef(null)
  const wrapRef    = useRef(null)
  const pdfRef     = useRef(null)
  const renderJob  = useRef(null)
  const taRefs     = useRef({})
  const dragRef    = useRef(null)
  const fbarActive = useRef(false)   // true while mouse is inside fbar

  const pageItems = items.filter(it => it.page === page)
  const activeItem = fbar ? items.find(i => i.id === fbar.id) : null

  /* ── error auto-dismiss ── */
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(''), 3500)
    return () => clearTimeout(t)
  }, [error])

  /* ── render canvas ── */
  const renderCanvas = useCallback(async (pg, sc) => {
    if (!pdfRef.current || !canvasRef.current) return
    try { renderJob.current?.cancel() } catch {}
    try {
      const pdfPage  = await pdfRef.current.getPage(pg)
      const vp       = pdfPage.getViewport({ scale: sc })
      const canvas   = canvasRef.current
      const ctx      = canvas.getContext('2d')
      canvas.width   = vp.width
      canvas.height  = vp.height
      ctx.fillStyle  = '#fff'
      ctx.fillRect(0, 0, vp.width, vp.height)
      renderJob.current = pdfPage.render({ canvasContext: ctx, viewport: vp })
      await renderJob.current.promise
    } catch (e) {
      if (e?.name !== 'RenderingCancelledException') console.error(e)
    }
  }, [])

  useEffect(() => {
    if (pdfRef.current) renderCanvas(page, scale)
  }, [page, scale, renderCanvas])

  /* ── extract text from all pages ── */
  const extractAllText = async (doc, sc) => {
    const all = []
    for (let pg = 1; pg <= doc.numPages; pg++) {
      try {
        const pdfPage = await doc.getPage(pg)
        const vp      = pdfPage.getViewport({ scale: sc })
        const content = await pdfPage.getTextContent()

        // Sort top→bottom, left→right
        const raw = content.items
          .filter(it => it.str?.trim())
          .sort((a, b) => {
            const dy = b.transform[5] - a.transform[5]
            return Math.abs(dy) > 2 ? dy : a.transform[4] - b.transform[4]
          })

        // Cluster into line-groups
        const clusters = []
        for (const it of raw) {
          const [a,b,,, tx, ty] = it.transform
          const fs = Math.max(6, Math.round(Math.sqrt(a*a + b*b)))
          const x  = Math.round(tx * sc)
          const y  = Math.round(vp.height - ty * sc - fs * sc * 1.1)
          const w  = Math.max(8, Math.round((it.width || fs * it.str.length * 0.55) * sc))
          const h  = Math.round(fs * sc * 1.4)

          // Merge into previous cluster if same line
          const prev = clusters[clusters.length - 1]
          const gap  = fs * sc * 3
          if (prev && Math.abs(prev._ty - ty) < fs * 0.6 && x <= prev.x + prev.w + gap) {
            prev.text += it.str
            prev.w     = Math.max(prev.w, (x + w) - prev.x)
          } else {
            clusters.push({
              id: uid(), page: pg,
              x, y, w, h, _ty: ty,
              text: it.str, origText: it.str,
              fontSize: Math.round(fs * sc * 0.72),
              fontFamily: 'Arial',
              bold:   /bold|700|800|900/i.test(it.fontName || ''),
              italic: /italic|oblique/i.test(it.fontName || ''),
              color: '#000000',
              isNew: false,
            })
          }
        }
        all.push(...clusters)
      } catch {}
    }
    return all
  }

  /* ── thumbnails ── */
  const makeThumbs = async (doc) => {
    for (let pg = 1; pg <= Math.min(doc.numPages, 30); pg++) {
      try {
        const p  = await doc.getPage(pg)
        const vp = p.getViewport({ scale: 0.18 })
        const c  = document.createElement('canvas')
        c.width = vp.width; c.height = vp.height
        const ctx = c.getContext('2d')
        ctx.fillStyle = '#fff'; ctx.fillRect(0,0,c.width,c.height)
        await p.render({ canvasContext: ctx, viewport: vp }).promise
        setThumbs(t => ({ ...t, [pg]: c.toDataURL() }))
      } catch {}
    }
  }

  /* ── load PDF ── */
  const loadPdf = async (buffer, name) => {
    setLoading(true); setError('')
    setItems([]); setActiveId(null); setFbar(null); setThumbs({}); setArmed(false)
    try {
      const pdfjs = await getPdfJs()
      const doc   = await pdfjs.getDocument({ data: buffer.slice(0) }).promise
      pdfRef.current = doc
      setTotalPages(doc.numPages)
      setPage(1)
      setPdfBytes(buffer)
      setFileName(name)
      setTimeout(async () => {
        await renderCanvas(1, SCALE)
        const extracted = await extractAllText(doc, SCALE)
        setItems(extracted)
        makeThumbs(doc)
      }, 60)
    } catch {
      setError('Could not load PDF. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onFile = f => {
    if (!f || f.type !== 'application/pdf') { setError('Please select a valid PDF file.'); return }
    const r = new FileReader()
    r.onload = e => loadPdf(e.target.result, f.name)
    r.readAsArrayBuffer(f)
  }

  /* ── update / delete ── */
  const upd = useCallback((id, patch) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it)), [])

  const del = useCallback(id => {
    setItems(prev => prev.map(it => it.id === id
      ? (it.isNew ? null : { ...it, text: '', _deleted: true })
      : it
    ).filter(Boolean))
    setActiveId(null); setFbar(null)
  }, [])

  /* ── format bar position ── */
  const openFbar = (id, el) => {
    if (!el) return
    const r = el.getBoundingClientRect()
    setFbar({
      id,
      x: Math.min(window.innerWidth - 400, Math.max(8, r.left)),
      y: Math.max(52, r.top - 42),
    })
  }

  /* ── place new box on click ── */
  const onCanvasClick = e => {
    if (!armed) return
    const isTarget = e.target === canvasRef.current || e.target === wrapRef.current
    if (!isTarget) return
    const rect = canvasRef.current.getBoundingClientRect()
    const id = uid()
    setItems(prev => [...prev, {
      id, page,
      x: e.clientX - rect.left - 2,
      y: e.clientY - rect.top  - 2,
      w: 120, h: 28,
      text: '', origText: null,
      fontSize: 13, fontFamily: 'Arial',
      bold: false, italic: false, color: '#000000',
      isNew: true,
    }])
    setActiveId(id)
    setArmed(false)
    setTimeout(() => {
      const ta = taRefs.current[id]
      if (ta) {
        ta.focus()
        openFbar(id, ta.parentElement)
      }
    }, 40)
  }

  /* ── drag new boxes ── */
  const onBoxMouseDown = (e, id) => {
    if (e.target.tagName === 'TEXTAREA') return
    e.preventDefault(); e.stopPropagation()
    const it = items.find(i => i.id === id)
    if (!it) return
    dragRef.current = { id, sx: e.clientX, sy: e.clientY, ox: it.x, oy: it.y }
    setActiveId(id)
  }

  useEffect(() => {
    const mv = e => {
      if (!dragRef.current) return
      const { id, sx, sy, ox, oy } = dragRef.current
      upd(id, { x: ox + e.clientX - sx, y: oy + e.clientY - sy })
    }
    const up = () => { dragRef.current = null }
    window.addEventListener('mousemove', mv)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up) }
  }, [upd])

  /* ── keyboard shortcuts ── */
  useEffect(() => {
    const fn = e => {
      if (document.activeElement?.tagName === 'TEXTAREA') return
      if (e.key === 'Escape') { setActiveId(null); setFbar(null); setArmed(false) }
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeId) del(activeId)
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [activeId, del])

  /* ── auto-resize textarea ── */
  const autoSize = el => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 4 + 'px'
    el.style.width  = 'auto'
    // measure
    const m = document.createElement('span')
    Object.assign(m.style, {
      position: 'fixed', visibility: 'hidden', whiteSpace: 'pre',
      fontSize: el.style.fontSize, fontFamily: el.style.fontFamily,
      fontWeight: el.style.fontWeight, fontStyle: el.style.fontStyle,
    })
    const lines = el.value.split('\n')
    m.textContent = lines.reduce((a,b) => a.length > b.length ? a : b, '') || ' '
    document.body.appendChild(m)
    el.style.width = Math.max(40, m.offsetWidth + 16) + 'px'
    document.body.removeChild(m)
  }

  /* ── save / download PDF ── */
  const save = async () => {
    if (!pdfBytes) return
    setSaving(true)
    try {
      const { PDFDocument, rgb, StandardFonts } = await getPdfLib()
      const doc = await PDFDocument.load(pdfBytes)

      for (let pg = 1; pg <= doc.getPageCount(); pg++) {
        const pdfPage   = doc.getPage(pg - 1)
        const { width: PW, height: PH } = pdfPage.getSize()
        const pdfJsPg   = await pdfRef.current.getPage(pg)
        const vp        = pdfJsPg.getViewport({ scale })
        const SX = PW / vp.width
        const SY = PH / vp.height

        const hex2rgb = h => {
          const c = h.replace('#','')
          return { r: parseInt(c.slice(0,2),16)/255, g: parseInt(c.slice(2,4),16)/255, b: parseInt(c.slice(4,6),16)/255 }
        }
        const embedFont = async (bold, italic) => {
          const k = bold && italic ? StandardFonts.HelveticaBoldOblique
                  : bold   ? StandardFonts.HelveticaBold
                  : italic ? StandardFonts.HelveticaOblique
                           : StandardFonts.Helvetica
          return doc.embedFont(k)
        }

        const pgItems = items.filter(it => it.page === pg)

        // 1. White-out changed/deleted original text
        for (const it of pgItems) {
          if (it.isNew) continue
          const changed = it.text !== it.origText || it._deleted
          if (!changed) continue
          const rx = it.x * SX
          const rw = it.w * SX + 2
          const rh = it.h * SY + 2
          const ry = PH - it.y * SY - rh + 2
          pdfPage.drawRectangle({
            x: Math.max(0, rx - 1), y: Math.max(0, ry),
            width: rw, height: rh,
            color: rgb(1, 1, 1),
            opacity: 1,
          })
        }

        // 2. Draw updated existing text
        for (const it of pgItems) {
          if (it.isNew || it._deleted || it.text === it.origText || !it.text.trim()) continue
          const font = await embedFont(it.bold, it.italic)
          const sz   = Math.max(4, it.fontSize * SY * 1.38)
          const { r, g, b } = hex2rgb(it.color)
          it.text.split('\n').forEach((line, i) => {
            if (!line.trim()) return
            try {
              pdfPage.drawText(line, {
                x:    Math.max(0, it.x * SX),
                y:    Math.max(0, PH - it.y * SY - sz - i * sz * 1.2),
                size: sz, font, color: rgb(r, g, b),
              })
            } catch {}
          })
        }

        // 3. Draw new boxes
        for (const it of pgItems) {
          if (!it.isNew || !it.text.trim()) continue
          const font = await embedFont(it.bold, it.italic)
          const sz   = Math.max(4, it.fontSize * SY * 1.38)
          const { r, g, b } = hex2rgb(it.color)
          it.text.split('\n').forEach((line, i) => {
            if (!line.trim()) return
            try {
              pdfPage.drawText(line, {
                x:    Math.max(0, it.x * SX),
                y:    Math.max(0, PH - it.y * SY - sz - i * sz * 1.2),
                size: sz, font, color: rgb(r, g, b),
              })
            } catch {}
          })
        }
      }

      const out = await doc.save()
      const url = URL.createObjectURL(new Blob([out], { type: 'application/pdf' }))
      Object.assign(document.createElement('a'), {
        href: url,
        download: fileName.replace(/\.pdf$/i, '') + '_edited.pdf',
      }).click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e); setError('Download failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <>
      <style>{STYLE}</style>
      <div className="app">

        {/* TOP BAR */}
        <div className="bar">
          <span className="logo">PDF<b>Edit</b></span>

          <div className="bsep"/>

          <button
            className="btn"
            onClick={() => window.history.back()}
            style={{ color: '#94a3b8', borderColor: '#1e293b' }}
          >
            ‹ Back
          </button>

          <div className="bsep"/>

          <label className="btn btn-open">
            📂 Open PDF
            <input type="file" accept=".pdf" style={{display:'none'}} onChange={e => onFile(e.target.files[0])} />
          </label>

          {pdfBytes && <>
            <div className="bsep"/>

            <button
              className={`btn btn-add ${armed ? 'armed' : ''}`}
              onClick={() => { setArmed(a => !a); setActiveId(null); setFbar(null) }}
            >
              {armed ? '🎯 Click on PDF…' : '➕ Add Text'}            </button>

            <div className="bsep"/>

            <div className="pnav">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)}>‹</button>
              <input type="number" min={1} max={totalPages} value={page}
                onChange={e => setPage(Math.min(totalPages, Math.max(1, +e.target.value)))}/>
              <span>/ {totalPages}</span>
              <button disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>›</button>
            </div>

            <div className="bsep"/>

            <div className="zrow">
              <button className="btn" onClick={() => setScale(s => Math.max(0.5, +(s-.25).toFixed(2)))}>−</button>
              <span className="zlbl">{Math.round(scale*100)}%</span>
              <button className="btn" onClick={() => setScale(s => Math.min(3.0, +(s+.25).toFixed(2)))}>+</button>
            </div>

            <button className="btn btn-save" onClick={save} disabled={saving}>
              {saving ? <><span className="spin"/> Saving…</> : '⬇ Download PDF'}
            </button>
          </>}
        </div>

        {/* BODY */}
        <div className="body">

          {/* Pages panel */}
          {pdfBytes && (
            <div className="panel">
              <div className="ptitle">Pages</div>
              {Array.from({length: totalPages}, (_, i) => i+1).map(pg => (
                <div key={pg} className={`pthumb ${page===pg?'on':''}`} onClick={() => setPage(pg)}>
                  {thumbs[pg]
                    ? <img src={thumbs[pg]} alt={`p${pg}`}/>
                    : <div className="pthumb-ph">…</div>}
                  <div className="pthumb-n">{pg}</div>
                </div>
              ))}
            </div>
          )}

          {/* Workspace */}
          <div className="ws" onMouseDown={e => {
            if (e.target === e.currentTarget) { setActiveId(null); setFbar(null) }
          }}>

            {/* Drop zone */}
            {!pdfBytes && !loading && (
              <div
                className={`dz ${dragOver?'over':''}`}
                onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={e=>{e.preventDefault();setDragOver(false);onFile(e.dataTransfer.files[0])}}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                <h2>PDF Editor</h2>
                <p>Click any text to edit it, or add new text anywhere.<br/>Download — the result looks completely original.</p>
                <label>
                  📂 Open PDF File
                  <input type="file" accept=".pdf" style={{display:'none'}} onChange={e=>onFile(e.target.files[0])}/>
                </label>
              </div>
            )}

            {/* Loader */}
            {loading && (
              <div className="ldwrap">
                <div className="ldring"/>
                <span>Loading PDF…</span>
              </div>
            )}

            {/* Page + overlays */}
            {pdfBytes && !loading && (
              <div
                ref={wrapRef}
                className={`pgwrap ${armed?'armed':''}`}
                onClick={onCanvasClick}
              >
                <canvas ref={canvasRef}/>

                {pageItems.map(it => {
                  const isActive   = activeId === it.id
                  const isModified = it.isNew ? it.text.trim().length > 0 : it.text !== it.origText

                  const fontCss = {
                    fontSize:   it.fontSize + 'px',
                    fontFamily: it.fontFamily || 'Arial',
                    fontWeight: it.bold   ? 'bold'   : 'normal',
                    fontStyle:  it.italic ? 'italic' : 'normal',
                    color:      it.color  || '#000',
                  }

                  return (
                    <div
                      key={it.id}
                      className={`titem ${it.isNew ? 'newbox' : ''} ${isActive ? 'active' : ''}`}
                      style={{
                        left:   it.x,
                        top:    it.y,
                        width:  isActive ? 'auto' : it.w,
                        minWidth: it.w,
                        height: it.h,
                        zIndex: isActive ? 20 : (isModified ? 5 : 1),
                        // When modified+inactive: white bg covers original, shows new text
                        background: (!isActive && isModified) ? '#fff' : 'transparent',
                      }}
                      onMouseDown={e => it.isNew ? onBoxMouseDown(e, it.id) : undefined}
                      onClick={e => {
                        if (armed) return
                        e.stopPropagation()
                        setActiveId(it.id)
                        openFbar(it.id, e.currentTarget)
                        setTimeout(() => {
                          const ta = taRefs.current[it.id]
                          if (ta) { ta.focus(); ta.select?.() }
                        }, 20)
                      }}
                    >
                      {/* When active: show editable textarea */}
                      {isActive && (
                        <textarea
                          ref={el => { if (el) taRefs.current[it.id] = el; else delete taRefs.current[it.id] }}
                          className="titem-ta"
                          value={it.text}
                          autoFocus
                          spellCheck={false}
                          dir="ltr"
                          style={{ ...fontCss, direction:'ltr', unicodeBidi:'plaintext' }}
                          onChange={e => {
                            upd(it.id, { text: e.target.value })
                            autoSize(e.target)
                          }}
                          onFocus={e => {
                            openFbar(it.id, e.currentTarget.parentElement)
                            setTimeout(() => autoSize(e.target), 10)
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              if (fbarActive.current) {
                                // refocus textarea so user can keep typing after format change
                                taRefs.current[it.id]?.focus()
                                return
                              }
                              setActiveId(null)
                              setFbar(f => f?.id === it.id ? null : f)
                            }, 120)
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Escape') {
                              e.target.blur()
                              setActiveId(null)
                              setFbar(null)
                            }
                            e.stopPropagation()
                          }}
                          onMouseDown={e => e.stopPropagation()}
                        />
                      )}

                      {/* When inactive + modified: show new text as overlay (white bg covers original) */}
                      {!isActive && isModified && (
                        <div
                          className="titem-label"
                          style={{
                            ...fontCss,
                            background: '#fff',
                            // Slightly wider to cover any overflow of original text
                            width: '100%',
                          }}
                        >
                          {it.text}
                        </div>
                      )}
                    </div>
                  )
                })}

                {armed && (
                  <div style={{
                    position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)',
                    background:'#0f172add', color:'#e2e8f0', fontSize:12, padding:'6px 16px',
                    borderRadius:20, pointerEvents:'none', border:'1px solid #3b82f6',
                    whiteSpace:'nowrap',
                  }}>
                    🎯 Click anywhere to place text
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* STATUS BAR */}
        {pdfBytes && (
          <div className="sbar">
            <span><span className="sdot"/>📄 {fileName}</span>
            <span className="hint">
              {armed
                ? '🎯 Add Text: Click anywhere on the PDF to place text'
                : '✏️ Click on any text to edit it  •  Use "Add Text" button to add new text'}
            </span>
            <span>Page {page}/{totalPages} · {pageItems.filter(i=>i.text!==i.origText||i.isNew).length} edits</span>
          </div>
        )}

        {/* FORMAT BAR */}
        {fbar && activeItem && (
          <div
            className="fbar"
            style={{ left: fbar.x, top: fbar.y }}
            onMouseEnter={() => { fbarActive.current = true }}
            onMouseLeave={() => { fbarActive.current = false }}
            onMouseDown={e => e.preventDefault()}
          >
            {/* Font family - only for new boxes */}
            {activeItem.isNew && <>
              <select className="ffont" value={activeItem.fontFamily||'Arial'}
                onChange={e => upd(fbar.id, {fontFamily: e.target.value})}>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <div className="fsep"/>
            </>}

            {/* Bold */}
            <button className={`fi ${activeItem.bold?'on':''}`}
              onMouseDown={e => { e.preventDefault(); upd(fbar.id, {bold: !activeItem.bold}) }}>
              <b>B</b>
            </button>

            {/* Italic */}
            <button className={`fi ${activeItem.italic?'on':''}`}
              onMouseDown={e => { e.preventDefault(); upd(fbar.id, {italic: !activeItem.italic}) }}>
              <i>I</i>
            </button>

            <div className="fsep"/>

            {/* Font size */}
            <input className="fsz" type="number" min={6} max={144} value={activeItem.fontSize}
              onMouseDown={e => e.stopPropagation()}
              onChange={e => {
                upd(fbar.id, {fontSize: Math.max(6, +e.target.value)})
                setTimeout(() => {
                  autoSize(taRefs.current[fbar.id])
                  taRefs.current[fbar.id]?.focus()
                }, 10)
              }}
            />

            <div className="fsep"/>

            {/* Color */}
            <input type="color" className="fcol" value={activeItem.color||'#000000'}
              onMouseDown={e => e.stopPropagation()}
              onChange={e => upd(fbar.id, {color: e.target.value})}
            />

            <div className="fsep"/>

            {/* Delete */}
            <button className="fi del" title="Delete"
              onMouseDown={e => { e.preventDefault(); del(fbar.id) }}>
              🗑
            </button>
          </div>
        )}

        {error && <div className="toast">⚠️ {error}</div>}
      </div>
    </>
  )
}
