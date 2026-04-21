import { useState, useCallback } from 'react'

// ─── Parsers ──────────────────────────────────────────────────
function parseContent(text, type) {
  if (type === 'json') {
    return JSON.parse(text)
  }
  if (type === 'xml') {
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'application/xml')
    const err = doc.querySelector('parsererror')
    if (err) throw new Error('Invalid XML')
    return xmlToObj(doc.documentElement)
  }
  // txt — return as lines array
  return text.split('\n').map((l, i) => ({ line: i + 1, content: l }))
}

function xmlToObj(node) {
  if (node.nodeType === 3) return node.nodeValue.trim()
  const obj = {}
  if (node.attributes?.length) {
    obj['@attributes'] = {}
    for (const a of node.attributes) obj['@attributes'][a.name] = a.value
  }
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      const v = child.nodeValue.trim()
      if (v) obj['#text'] = v
    } else {
      const key = child.nodeName
      const val = xmlToObj(child)
      if (obj[key]) {
        if (!Array.isArray(obj[key])) obj[key] = [obj[key]]
        obj[key].push(val)
      } else obj[key] = val
    }
  }
  return obj
}

function detectType(name) {
  if (name.endsWith('.json')) return 'json'
  if (name.endsWith('.xml')) return 'xml'
  return 'txt'
}

// ─── Deep diff ────────────────────────────────────────────────
function deepDiff(a, b, path = '') {
  const diffs = []
  if (typeof a !== typeof b) {
    diffs.push({ path, type: 'type_changed', from: typeof a, to: typeof b, valA: a, valB: b })
    return diffs
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const max = Math.max(a.length, b.length)
    for (let i = 0; i < max; i++) {
      if (i >= a.length) diffs.push({ path: `${path}[${i}]`, type: 'added', valB: b[i] })
      else if (i >= b.length) diffs.push({ path: `${path}[${i}]`, type: 'removed', valA: a[i] })
      else diffs.push(...deepDiff(a[i], b[i], `${path}[${i}]`))
    }
  } else if (a && b && typeof a === 'object' && !Array.isArray(a)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const k of keys) {
      const p = path ? `${path}.${k}` : k
      if (!(k in a)) diffs.push({ path: p, type: 'added', valB: b[k] })
      else if (!(k in b)) diffs.push({ path: p, type: 'removed', valA: a[k] })
      else diffs.push(...deepDiff(a[k], b[k], p))
    }
  } else if (a !== b) {
    diffs.push({ path, type: 'changed', valA: a, valB: b })
  }
  return diffs
}

function txtDiff(a, b) {
  const linesA = a.split('\n')
  const linesB = b.split('\n')
  const max = Math.max(linesA.length, linesB.length)
  const diffs = []
  for (let i = 0; i < max; i++) {
    if (i >= linesA.length) diffs.push({ line: i + 1, type: 'added', valB: linesB[i] })
    else if (i >= linesB.length) diffs.push({ line: i + 1, type: 'removed', valA: linesA[i] })
    else if (linesA[i] !== linesB[i]) diffs.push({ line: i + 1, type: 'changed', valA: linesA[i], valB: linesB[i] })
  }
  return diffs
}

function getStats(obj, type) {
  if (type === 'txt') {
    const lines = typeof obj === 'string' ? obj.split('\n') : []
    return { lines: lines.length, words: lines.join(' ').split(/\s+/).filter(Boolean).length }
  }
  const str = JSON.stringify(obj)
  const keys = str.match(/"[^"]+"\s*:/g)?.length || 0
  return { keys, size: str.length }
}

// ─── File Card ────────────────────────────────────────────────
function FileCard({ index, file, onUpload, onRemove, onPaste }) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onUpload(f, index)
  }, [index, onUpload])

  const colors = ['#6C63FF', '#FF6B9D', '#00D4AA', '#FFB347']
  const color = colors[index % colors.length]

  return (
    <div style={{
      background: dragging ? `${color}15` : 'rgba(255,255,255,0.03)',
      border: `1.5px dashed ${dragging ? color : file ? color + '60' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 16, padding: 20, transition: 'all 0.2s',
      position: 'relative',
    }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{
          background: color + '22', color, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.1em', padding: '3px 10px', borderRadius: 100, textTransform: 'uppercase'
        }}>File {index + 1}</span>
        {file && <button onClick={() => onRemove(index)} style={{
          background: 'rgba(255,80,80,0.1)', border: 'none', color: '#ff8080',
          fontSize: 11, padding: '3px 10px', borderRadius: 100, cursor: 'pointer'
        }}>✕ Remove</button>}
      </div>

      {file ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>{file.type === 'json' ? '{}' : file.type === 'xml' ? '<>' : '≡'}</span>
            <div>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{file.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{file.type.toUpperCase()} · {(file.raw.length / 1024).toFixed(1)} KB</div>
            </div>
          </div>
          {file.error && <div style={{ color: '#ff8080', fontSize: 12, marginTop: 8 }}>⚠ {file.error}</div>}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>📂</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Drop file here</div>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, margin: '4px 0 10px' }}>JSON · XML · TXT</div>
          <label style={{
            background: color + '22', color, border: `1px solid ${color}44`,
            padding: '6px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', display: 'inline-block'
          }}>
            Browse
            <input type="file" accept=".json,.xml,.txt" style={{ display: 'none' }}
              onChange={e => e.target.files[0] && onUpload(e.target.files[0], index)} />
          </label>
        </div>
      )}
    </div>
  )
}

// ─── Diff Badge ───────────────────────────────────────────────
function Badge({ type }) {
  const map = {
    added:        { bg: 'rgba(0,212,120,0.15)', color: '#00d478', label: '+ Added' },
    removed:      { bg: 'rgba(255,80,80,0.12)', color: '#ff6060', label: '− Removed' },
    changed:      { bg: 'rgba(255,180,50,0.15)', color: '#ffb432', label: '~ Changed' },
    type_changed: { bg: 'rgba(160,80,255,0.15)', color: '#c084fc', label: '⚡ Type' },
  }
  const s = map[type] || map.changed
  return <span style={{ background: s.bg, color: s.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, letterSpacing: '0.05em' }}>{s.label}</span>
}

function val(v) {
  if (v === undefined) return '—'
  if (v === null) return 'null'
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 60) + (JSON.stringify(v).length > 60 ? '…' : '')
  return String(v)
}

// ─── Main Component ───────────────────────────────────────────
export default function FileComparator() {
  const [files, setFiles] = useState([null, null])
  const [result, setResult] = useState(null)
  const [comparing, setComparing] = useState(false)
  const [activeFile, setActiveFile] = useState(0)

  async function handleUpload(f, idx) {
    const text = await f.text()
    const type = detectType(f.name)
    let parsed = null, error = null
    try { parsed = type === 'txt' ? text : parseContent(text, type) }
    catch (e) { error = e.message }
    const newFiles = [...files]
    while (newFiles.length <= idx) newFiles.push(null)
    newFiles[idx] = { name: f.name, type, raw: text, parsed, error }
    setFiles(newFiles)
    setResult(null)
  }

  function handleRemove(idx) {
    const newFiles = [...files]
    newFiles[idx] = null
    setFiles(newFiles)
    setResult(null)
  }

  function addSlot() { setFiles([...files, null]) }

  function compare() {
    const valid = files.filter(f => f && !f.error)
    if (valid.length < 2) return
    setComparing(true)
    setTimeout(() => {
      const type = valid[0].type
      const allDiffs = []
      for (let i = 1; i < valid.length; i++) {
        let diffs
        if (type === 'txt') diffs = txtDiff(valid[0].raw, valid[i].raw)
        else diffs = deepDiff(valid[0].parsed, valid[i].parsed)
        allDiffs.push({ pair: `File 1 vs File ${i + 1}`, diffs, typeA: valid[0].type, typeB: valid[i].type })
      }
      setResult({ pairs: allDiffs, type, files: valid })
      setComparing(false)
    }, 400)
  }

  const validCount = files.filter(f => f && !f.error).length
  const canCompare = validCount >= 2

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .fc-wrap { min-height:100vh; background:#07080F; font-family:'Space Grotesk',sans-serif; }
        .fc-wrap::before {
          content:''; position:fixed; inset:0; pointer-events:none;
          background: radial-gradient(ellipse 60% 40% at 20% 20%, rgba(108,99,255,0.12) 0%, transparent 60%),
                      radial-gradient(ellipse 50% 50% at 80% 80%, rgba(0,212,170,0.08) 0%, transparent 60%);
        }
        .fc-inner { position:relative; z-index:1; max-width:900px; margin:0 auto; padding:48px 24px 80px; }
        .fc-head { text-align:center; margin-bottom:44px; animation:fadeUp 0.5s ease both; }
        .fc-eyebrow { display:inline-flex; align-items:center; gap:6px; background:rgba(108,99,255,0.1); border:1px solid rgba(108,99,255,0.25); color:#a89eff; font-size:11px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; padding:5px 14px; border-radius:100px; margin-bottom:18px; }
        .fc-title { font-size:clamp(28px,5vw,46px); font-weight:700; color:#fff; margin:0 0 10px; letter-spacing:-0.02em; }
        .fc-title em { font-style:normal; background:linear-gradient(135deg,#6C63FF,#00D4AA); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .fc-sub { color:rgba(255,255,255,0.38); font-size:14px; font-weight:300; }
        .fc-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:14px; margin-bottom:20px; }
        .fc-actions { display:flex; gap:12px; align-items:center; margin-bottom:32px; flex-wrap:wrap; }
        .fc-btn { padding:12px 28px; border-radius:12px; border:none; font-family:'Space Grotesk',sans-serif; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s; }
        .fc-btn-primary { background:linear-gradient(135deg,#6C63FF,#5B54E8); color:#fff; box-shadow:0 4px 20px rgba(108,99,255,0.3); }
        .fc-btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 28px rgba(108,99,255,0.45); }
        .fc-btn-primary:disabled { opacity:0.4; cursor:not-allowed; }
        .fc-btn-ghost { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.5); border:1px solid rgba(255,255,255,0.1); }
        .fc-btn-ghost:hover { background:rgba(255,255,255,0.08); color:#fff; }
        .fc-result { animation:fadeUp 0.4s ease both; }
        .fc-result-head { display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
        .fc-stat { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:14px 20px; }
        .fc-stat-num { font-size:28px; font-weight:700; color:#fff; font-variant-numeric:tabular-nums; }
        .fc-stat-label { font-size:11px; color:rgba(255,255,255,0.35); text-transform:uppercase; letter-spacing:0.08em; margin-top:2px; }
        .fc-stats-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:10px; margin-bottom:24px; }
        .fc-diff-item { background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:16px; margin-bottom:8px; transition:background 0.15s; }
        .fc-diff-item:hover { background:rgba(255,255,255,0.04); }
        .fc-path { font-family:'JetBrains Mono',monospace; font-size:12px; color:#a89eff; margin-bottom:8px; word-break:break-all; }
        .fc-vals { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:8px; }
        .fc-val-box { background:rgba(0,0,0,0.2); border-radius:8px; padding:8px 12px; font-family:'JetBrains Mono',monospace; font-size:11px; word-break:break-all; line-height:1.5; }
        .fc-val-a { border-left:2px solid rgba(255,80,80,0.5); color:#ffaaaa; }
        .fc-val-b { border-left:2px solid rgba(0,212,120,0.5); color:#aaffcc; }
        .fc-val-label { font-size:9px; text-transform:uppercase; letter-spacing:0.1em; opacity:0.5; margin-bottom:4px; }
        .fc-empty { text-align:center; padding:40px; color:rgba(255,255,255,0.3); font-size:15px; }
        .fc-empty .big { font-size:40px; margin-bottom:10px; }
        .fc-tabs { display:flex; gap:6px; margin-bottom:20px; }
        .fc-tab { padding:7px 16px; border-radius:100px; font-size:12px; font-weight:600; cursor:pointer; border:none; font-family:'Space Grotesk',sans-serif; transition:all 0.2s; }
        .fc-tab.active { background:#6C63FF; color:#fff; }
        .fc-tab.idle { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.4); }
        .fc-section { background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:24px; margin-bottom:16px; }
        .fc-section-title { font-size:13px; font-weight:700; color:rgba(255,255,255,0.6); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:16px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @media(max-width:600px) { .fc-vals{grid-template-columns:1fr} .fc-inner{padding:32px 16px 60px} }
      `}</style>

      <div className="fc-wrap">
        <div className="fc-inner">

          {/* Header */}
          <div className="fc-head">
            <div className="fc-eyebrow">⚡ Smart Comparison</div>
            <h1 className="fc-title">File <em>Comparator</em></h1>
            <p className="fc-sub">JSON · XML · TXT files ko side-by-side compare karo — instantly</p>
          </div>

          {/* File Cards */}
          <div className="fc-grid">
            {files.map((f, i) => (
              <FileCard key={i} index={i} file={f} onUpload={handleUpload} onRemove={handleRemove} />
            ))}
          </div>

          {/* Actions */}
          <div className="fc-actions">
            <button className="fc-btn fc-btn-primary" onClick={compare} disabled={!canCompare || comparing}>
              {comparing ? '⏳ Comparing...' : `⚡ Compare ${validCount} Files`}
            </button>
            {files.length < 4 && (
              <button className="fc-btn fc-btn-ghost" onClick={addSlot}>+ Add File</button>
            )}
            {result && (
              <button className="fc-btn fc-btn-ghost" onClick={() => { setFiles([null, null]); setResult(null) }}>
                ↺ Reset
              </button>
            )}
            {!canCompare && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>2 files upload karo compare karne ke liye</span>}
          </div>

          {/* Results */}
          {result && (
            <div className="fc-result">

              {/* Summary stats */}
              <div className="fc-stats-row">
                {result.pairs.map((p, i) => (
                  <div key={i} className="fc-stat">
                    <div className="fc-stat-num" style={{ color: p.diffs.length === 0 ? '#00d478' : '#FFB347' }}>
                      {p.diffs.length === 0 ? '✓' : p.diffs.length}
                    </div>
                    <div className="fc-stat-label">{p.pair} {p.diffs.length === 0 ? 'Identical!' : 'differences'}</div>
                  </div>
                ))}
                <div className="fc-stat">
                  <div className="fc-stat-num">{result.files.length}</div>
                  <div className="fc-stat-label">Files compared</div>
                </div>
                <div className="fc-stat">
                  <div className="fc-stat-num">{result.type.toUpperCase()}</div>
                  <div className="fc-stat-label">File type</div>
                </div>
              </div>

              {/* Tabs for each pair */}
              {result.pairs.length > 1 && (
                <div className="fc-tabs">
                  {result.pairs.map((p, i) => (
                    <button key={i} className={`fc-tab ${activeFile === i ? 'active' : 'idle'}`} onClick={() => setActiveFile(i)}>
                      {p.pair}
                    </button>
                  ))}
                </div>
              )}

              {result.pairs.map((pair, pi) => (
                (result.pairs.length === 1 || activeFile === pi) && (
                  <div key={pi}>
                    {pair.diffs.length === 0 ? (
                      <div className="fc-empty">
                        <div className="big">🎉</div>
                        <div style={{ color: '#00d478', fontWeight: 600 }}>Dono files bilkul same hain!</div>
                        <div style={{ fontSize: 13, marginTop: 6 }}>Koi bhi difference nahi mila</div>
                      </div>
                    ) : (
                      <div>
                        {/* Group by type */}
                        {['added', 'removed', 'changed', 'type_changed'].map(dtype => {
                          const items = pair.diffs.filter(d => d.type === dtype)
                          if (!items.length) return null
                          const labels = { added: '✚ Naye items', removed: '✖ Hataye gaye', changed: '~ Badlay hue', type_changed: '⚡ Type change' }
                          return (
                            <div key={dtype} className="fc-section">
                              <div className="fc-section-title">{labels[dtype]} ({items.length})</div>
                              {items.map((d, i) => (
                                <div key={i} className="fc-diff-item">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <Badge type={d.type} />
                                    <span className="fc-path">{d.path || `Line ${d.line}`}</span>
                                  </div>

                                  {/* Human explanation */}
                                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 8, lineHeight: 1.5 }}>
                                    {d.type === 'added' && <>📥 <strong style={{ color: '#00d478' }}>File 2 mein naya item hai</strong> jo File 1 mein nahi tha</>}
                                    {d.type === 'removed' && <>📤 <strong style={{ color: '#ff6060' }}>File 1 mein tha</strong> par File 2 mein nahi hai</>}
                                    {d.type === 'changed' && <>✏️ <strong style={{ color: '#ffb432' }}>Value alag hai</strong> dono files mein</>}
                                    {d.type === 'type_changed' && <>⚡ <strong style={{ color: '#c084fc' }}>Data type badal gaya</strong> ({d.from} → {d.to})</>}
                                  </div>

                                  <div className="fc-vals">
                                    {d.valA !== undefined && (
                                      <div className="fc-val-box fc-val-a">
                                        <div className="fc-val-label">File 1 (Pehle)</div>
                                        {val(d.valA)}
                                      </div>
                                    )}
                                    {d.valB !== undefined && (
                                      <div className="fc-val-box fc-val-b">
                                        <div className="fc-val-label">File 2 (Baad)</div>
                                        {val(d.valB)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
