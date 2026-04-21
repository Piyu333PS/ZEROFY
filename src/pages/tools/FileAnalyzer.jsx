import { useState, useCallback } from 'react'

// ─── Parsers ──────────────────────────────────────────────────
function detectType(name) {
  if (name.endsWith('.json')) return 'json'
  if (name.endsWith('.xml')) return 'xml'
  return 'txt'
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

// ─── Deep Analysis ────────────────────────────────────────────
function analyzeJSON(obj, depth = 0) {
  let totalKeys = 0, totalArrays = 0, totalObjects = 0
  let totalStrings = 0, totalNumbers = 0, totalBooleans = 0, nulls = 0
  let maxDepth = depth
  const paths = []

  function walk(o, d, path) {
    if (d > maxDepth) maxDepth = d
    if (Array.isArray(o)) {
      totalArrays++
      o.forEach((item, i) => walk(item, d + 1, `${path}[${i}]`))
    } else if (o && typeof o === 'object') {
      totalObjects++
      for (const [k, v] of Object.entries(o)) {
        totalKeys++
        const p = path ? `${path}.${k}` : k
        paths.push(p)
        walk(v, d + 1, p)
      }
    } else {
      if (typeof o === 'string') totalStrings++
      else if (typeof o === 'number') totalNumbers++
      else if (typeof o === 'boolean') totalBooleans++
      else if (o === null) nulls++
    }
  }
  walk(obj, depth, '')

  return { totalKeys, totalArrays, totalObjects, totalStrings, totalNumbers, totalBooleans, nulls, maxDepth, paths }
}

function analyzeXML(raw) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(raw, 'application/xml')
  const err = doc.querySelector('parsererror')
  if (err) throw new Error('Invalid XML')

  let elements = 0, attributes = 0, textNodes = 0, maxDepth = 0
  const tagNames = {}

  function walk(node, depth) {
    if (depth > maxDepth) maxDepth = depth
    if (node.nodeType === 1) {
      elements++
      tagNames[node.nodeName] = (tagNames[node.nodeName] || 0) + 1
      attributes += node.attributes.length
      for (const child of node.childNodes) walk(child, depth + 1)
    } else if (node.nodeType === 3 && node.nodeValue.trim()) {
      textNodes++
    }
  }
  walk(doc.documentElement, 0)

  const root = doc.documentElement.nodeName
  return { elements, attributes, textNodes, maxDepth, tagNames, root, obj: xmlToObj(doc.documentElement) }
}

function analyzeTXT(raw) {
  const lines = raw.split('\n')
  const words = raw.split(/\s+/).filter(Boolean)
  const chars = raw.length
  const sentences = raw.split(/[.!?]+/).filter(s => s.trim()).length
  const emptyLines = lines.filter(l => !l.trim()).length
  const longestLine = lines.reduce((a, b) => b.length > a.length ? b : a, '')
  const avgWordsPerLine = Math.round(words.length / (lines.length || 1))

  // detect if it looks like CSV
  const isCSV = lines.slice(0, 3).every(l => l.includes(','))
  const isLog = lines.some(l => /\d{4}-\d{2}-\d{2}|ERROR|WARN|INFO|DEBUG/.test(l))
  const isCode = lines.some(l => /function|const|let|var|import|export|class|if\s*\(/.test(l))

  return { lines: lines.length, words: words.length, chars, sentences, emptyLines, longestLine, avgWordsPerLine, isCSV, isLog, isCode }
}

// ─── Plain language explainer ─────────────────────────────────
function explainJSON(data, stats) {
  const cards = []

  // Root type
  const rootType = Array.isArray(data) ? 'list' : 'object'
  cards.push({
    icon: rootType === 'list' ? '📋' : '📦',
    title: rootType === 'list' ? 'Ye ek List hai' : 'Ye ek Object/Record hai',
    desc: rootType === 'list'
      ? `Is file mein ${data.length} item${data.length !== 1 ? 's' : ''} hain ek list mein. Sochiye jaise ek register jisme ${data.length} entries hain.`
      : `Is file mein ek single record hai jisme multiple fields hain. Jaise ek form ka filled data.`,
    color: '#6C63FF'
  })

  // Size insight
  cards.push({
    icon: '🔢',
    title: 'Data ka size',
    desc: `Is file mein kul ${stats.totalKeys} fields hain, jisme ${stats.totalStrings} text values, ${stats.totalNumbers} numbers, aur ${stats.totalArrays} lists hain. Structure ${stats.maxDepth} levels gehri hai.`,
    color: '#00D4AA'
  })

  // Top level keys
  if (!Array.isArray(data)) {
    const keys = Object.keys(data)
    cards.push({
      icon: '🗂️',
      title: 'Main sections',
      desc: `Is file ke main fields hain: ${keys.slice(0, 6).map(k => `"${k}"`).join(', ')}${keys.length > 6 ? ` aur ${keys.length - 6} aur...` : ''}`,
      color: '#FFB347'
    })
  }

  // Arrays
  if (stats.totalArrays > 0) {
    cards.push({
      icon: '📝',
      title: 'Lists/Arrays',
      desc: `${stats.totalArrays} jagah lists hain — ye tab use hoti hain jab ek field mein multiple values hongi, jaise products ki list, users ki list wagera.`,
      color: '#FF6B9D'
    })
  }

  // Nulls warning
  if (stats.nulls > 0) {
    cards.push({
      icon: '⚠️',
      title: 'Khaali values',
      desc: `${stats.nulls} field${stats.nulls !== 1 ? 's' : ''} mein koi value nahi hai (null). Ye intentional bhi ho sakta hai ya missing data bhi.`,
      color: '#FF8C42'
    })
  }

  return cards
}

function explainXML(stats) {
  const cards = []
  cards.push({
    icon: '🌳',
    title: 'XML Tree Structure',
    desc: `Is file ka root element "<${stats.root}>" hai. Andar ${stats.elements} total elements hain jo ek tree ki tarah nested hain — ${stats.maxDepth} levels gehre.`,
    color: '#6C63FF'
  })
  cards.push({
    icon: '🏷️',
    title: 'Tags aur Attributes',
    desc: `${Object.keys(stats.tagNames).length} alag-alag tarah ke tags hain aur ${stats.attributes} attributes hain. Sabse zyada use hone wala tag: "${Object.entries(stats.tagNames).sort((a,b) => b[1]-a[1])[0]?.[0]}" (${Object.entries(stats.tagNames).sort((a,b) => b[1]-a[1])[0]?.[1]} baar).`,
    color: '#00D4AA'
  })
  cards.push({
    icon: '📝',
    title: 'Content',
    desc: `${stats.textNodes} jagah actual text content hai. Baki elements sirf structure ke liye hain (containers ki tarah).`,
    color: '#FFB347'
  })
  const topTags = Object.entries(stats.tagNames).sort((a, b) => b[1] - a[1]).slice(0, 5)
  if (topTags.length > 1) {
    cards.push({
      icon: '📊',
      title: 'Sabse common tags',
      desc: topTags.map(([tag, count]) => `<${tag}> — ${count} baar`).join(' · '),
      color: '#FF6B9D'
    })
  }
  return cards
}

function explainTXT(stats) {
  const cards = []
  let fileType = 'Plain text file'
  if (stats.isCSV) fileType = 'CSV/Spreadsheet jaisi file'
  else if (stats.isLog) fileType = 'Log file (system records)'
  else if (stats.isCode) fileType = 'Code file'

  cards.push({
    icon: stats.isCSV ? '📊' : stats.isLog ? '📋' : stats.isCode ? '💻' : '📄',
    title: fileType,
    desc: stats.isCSV
      ? `Ye file spreadsheet ki tarah hai jisme comma se values alag ki gayi hain. ${stats.lines} rows hain.`
      : stats.isLog
      ? `Ye ek log file hai jisme system ya application ke events record hain. ${stats.lines} log entries hain.`
      : stats.isCode
      ? `Ye ek code file lagti hai. ${stats.lines} lines ka code hai.`
      : `Ye ek normal text file hai ${stats.lines} lines ke saath.`,
    color: '#6C63FF'
  })

  cards.push({
    icon: '🔢',
    title: 'File ka size',
    desc: `${stats.lines} lines, ${stats.words} words, ${stats.chars} characters. Average ${stats.avgWordsPerLine} words per line. ${stats.emptyLines} empty lines hain.`,
    color: '#00D4AA'
  })

  if (stats.longestLine) {
    cards.push({
      icon: '📏',
      title: 'Sabse lambi line',
      desc: `"${stats.longestLine.slice(0, 80)}${stats.longestLine.length > 80 ? '...' : ''}" (${stats.longestLine.length} characters)`,
      color: '#FFB347'
    })
  }
  return cards
}

// ─── Render helpers ───────────────────────────────────────────
function InsightCard({ icon, title, desc, color, delay }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}30`,
      borderLeft: `3px solid ${color}`, borderRadius: 14, padding: '18px 20px',
      animation: `fadeUp 0.4s ease ${delay}s both`
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
        <div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 5 }}>{title}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6 }}>{desc}</div>
        </div>
      </div>
    </div>
  )
}

function JSONTree({ data, depth = 0 }) {
  const [collapsed, setCollapsed] = useState(depth > 1)
  const isArr = Array.isArray(data)
  const isObj = data && typeof data === 'object'
  const indent = depth * 16

  if (!isObj) {
    const color = typeof data === 'string' ? '#a8ff78' : typeof data === 'number' ? '#78c1ff' : typeof data === 'boolean' ? '#ffb347' : '#aaa'
    return <span style={{ color, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{JSON.stringify(data)}</span>
  }

  const entries = isArr ? data.map((v, i) => [i, v]) : Object.entries(data)
  const preview = entries.slice(0, 2).map(([k]) => isArr ? '' : `${k}`).join(', ') + (entries.length > 2 ? '...' : '')

  return (
    <div style={{ marginLeft: depth > 0 ? indent : 0 }}>
      <span
        onClick={() => setCollapsed(!collapsed)}
        style={{ cursor: 'pointer', color: '#6C63FF', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, userSelect: 'none' }}
      >
        {collapsed ? '▶' : '▼'} {isArr ? `[${entries.length} items]` : `{${entries.length} fields}`}
        {collapsed && <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>{preview}</span>}
      </span>
      {!collapsed && (
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', marginLeft: 8, paddingLeft: 12, marginTop: 4 }}>
          {entries.map(([k, v]) => (
            <div key={k} style={{ margin: '3px 0' }}>
              <span style={{ color: '#FFB347', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{isArr ? `[${k}]` : `"${k}"`}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 6px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>:</span>
              <JSONTree data={v} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────
export default function FileAnalyzer() {
  const [file, setFile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [activeTab, setActiveTab] = useState('insights')

  const handleFile = useCallback(async (f) => {
    const text = await f.text()
    const type = detectType(f.name)
    try {
      let parsed = null, stats = null, insights = null, error = null
      if (type === 'json') {
        parsed = JSON.parse(text)
        stats = analyzeJSON(parsed)
        insights = explainJSON(parsed, stats)
      } else if (type === 'xml') {
        stats = analyzeXML(text)
        parsed = stats.obj
        insights = explainXML(stats)
      } else {
        stats = analyzeTXT(text)
        insights = explainTXT(stats)
      }
      setFile({ name: f.name, type, raw: text, parsed })
      setAnalysis({ stats, insights })
      setActiveTab('insights')
    } catch (e) {
      setFile({ name: f.name, type, raw: text, error: e.message })
      setAnalysis(null)
    }
  }, [])

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        .fa-wrap { min-height:100vh; background:#060912; font-family:'Plus Jakarta Sans',sans-serif; }
        .fa-wrap::before {
          content:''; position:fixed; inset:0; pointer-events:none;
          background: radial-gradient(ellipse 50% 60% at 80% 10%, rgba(0,212,170,0.1) 0%, transparent 60%),
                      radial-gradient(ellipse 60% 40% at 10% 80%, rgba(108,99,255,0.1) 0%, transparent 60%);
        }
        .fa-inner { position:relative; z-index:1; max-width:820px; margin:0 auto; padding:48px 24px 80px; }
        .fa-head { text-align:center; margin-bottom:44px; animation:fadeUp 0.5s ease both; }
        .fa-eyebrow { display:inline-flex; align-items:center; gap:6px; background:rgba(0,212,170,0.1); border:1px solid rgba(0,212,170,0.25); color:#00D4AA; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:5px 14px; border-radius:100px; margin-bottom:18px; }
        .fa-title { font-size:clamp(28px,5vw,46px); font-weight:800; color:#fff; margin:0 0 10px; letter-spacing:-0.02em; }
        .fa-title em { font-style:normal; background:linear-gradient(135deg,#00D4AA,#6C63FF); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .fa-sub { color:rgba(255,255,255,0.35); font-size:14px; font-weight:300; }

        .fa-drop { border-radius:20px; padding:48px 24px; text-align:center; transition:all 0.2s; cursor:pointer; margin-bottom:28px; }
        .fa-drop.idle { background:rgba(255,255,255,0.02); border:2px dashed rgba(255,255,255,0.1); }
        .fa-drop.dragging { background:rgba(0,212,170,0.05); border:2px dashed rgba(0,212,170,0.4); }
        .fa-drop.has-file { background:rgba(0,212,170,0.04); border:1.5px solid rgba(0,212,170,0.2); }

        .fa-tabs { display:flex; gap:6px; margin-bottom:24px; }
        .fa-tab { padding:8px 20px; border-radius:100px; font-size:13px; font-weight:600; cursor:pointer; border:none; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.2s; }
        .fa-tab.active { background:linear-gradient(135deg,#00D4AA,#6C63FF); color:#fff; }
        .fa-tab.idle { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.4); }
        .fa-tab.idle:hover { background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.7); }

        .fa-insights { display:grid; gap:12px; }
        .fa-raw { background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:20px; overflow:auto; max-height:500px; }
        .fa-tree { background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:20px; overflow:auto; max-height:500px; }

        .fa-stat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:10px; margin-bottom:24px; }
        .fa-stat { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:14px 16px; text-align:center; }
        .fa-stat-n { font-size:26px; font-weight:700; color:#fff; }
        .fa-stat-l { font-size:10px; color:rgba(255,255,255,0.3); text-transform:uppercase; letter-spacing:0.08em; margin-top:3px; }

        .fa-file-badge { display:inline-flex; align-items:center; gap:8px; background:rgba(0,212,170,0.1); border:1px solid rgba(0,212,170,0.25); color:#00D4AA; padding:8px 16px; border-radius:12px; font-size:13px; font-weight:600; margin-bottom:20px; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @media(max-width:600px) { .fa-inner{padding:32px 16px 60px} }
      `}</style>

      <div className="fa-wrap">
        <div className="fa-inner">

          {/* Header */}
          <div className="fa-head">
            <div className="fa-eyebrow">🔍 AI Powered</div>
            <h1 className="fa-title">File <em>Analyzer</em></h1>
            <p className="fa-sub">JSON · XML · TXT — koi bhi file upload karo, hum aasaan Hindi mein samjhayenge</p>
          </div>

          {/* Drop Zone */}
          <div
            className={`fa-drop ${dragging ? 'dragging' : file ? 'has-file' : 'idle'}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            {file ? (
              <div>
                <div style={{ fontSize: 36, marginBottom: 8 }}>
                  {file.type === 'json' ? '{}' : file.type === 'xml' ? '</>' : '≡'}
                </div>
                <div style={{ color: '#00D4AA', fontWeight: 700, fontSize: 16 }}>{file.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 4 }}>
                  {file.type.toUpperCase()} · {(file.raw.length / 1024).toFixed(2)} KB
                </div>
                {file.error && <div style={{ color: '#ff8080', marginTop: 8, fontSize: 13 }}>⚠ {file.error}</div>}
                <label style={{ marginTop: 14, display: 'inline-block', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', padding: '6px 16px', borderRadius: 100, fontSize: 12, cursor: 'pointer' }}>
                  Dusri file choose karo
                  <input type="file" accept=".json,.xml,.txt" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
                </label>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 44, marginBottom: 12 }}>📂</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>File yahan drop karo</div>
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, marginBottom: 16 }}>JSON · XML · TXT supported</div>
                <label style={{ background: 'linear-gradient(135deg,#00D4AA,#6C63FF)', color: '#fff', padding: '10px 24px', borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-block' }}>
                  📁 Browse File
                  <input type="file" accept=".json,.xml,.txt" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
                </label>
              </div>
            )}
          </div>

          {/* Analysis */}
          {analysis && file && !file.error && (
            <div style={{ animation: 'fadeUp 0.4s ease both' }}>

              {/* Stats Row */}
              <div className="fa-stat-grid">
                {file.type === 'json' && <>
                  <div className="fa-stat"><div className="fa-stat-n" style={{ color: '#6C63FF' }}>{analysis.stats.totalKeys}</div><div className="fa-stat-l">Total Fields</div></div>
                  <div className="fa-stat"><div className="fa-stat-n" style={{ color: '#00D4AA' }}>{analysis.stats.totalArrays}</div><div className="fa-stat-l">Lists</div></div>
                  <div className="fa-stat"><div className="fa-stat-n" style={{ color: '#FFB347' }}>{analysis.stats.totalObjects}</div><div className="fa-stat-l">Objects</div></div>
                  <div className="fa-stat"><div className="fa-stat-n" style={{ color: '#FF6B9D' }}>{analysis.stats.maxDepth}</div><div className="fa-stat-l">Max Depth</div></div>
                  {analysis.stats.nulls > 0 && <div className="fa-stat"><div className="fa-stat-n" style={{ color: '#FF8C42' }}>{analysis.stats.nulls}</div><div className="fa-stat-l">Null Values</div></div>}
                </>}
                {file.type === 'xml' && <>
                  <div className="fa-stat"><div className="fa-stat-n" style={{ color: '#6C63FF' }}>{analysis.stats.elements}</div><div className="fa-stat-l">Elements</div></div>
                  <div className="fa-stat"><div className="fa-stat-n" style={{ color: '#00D4AA' }}>{analysis.stats.attributes}</div><div className="fa-stat-l">Attributes</div></div>
                  <div className="fa-stat"><div className="fa-stat-n" style={{ color: '#FFB347' }}>{Object.keys(analysis.stats.tagNames).length}</div><div className="fa-stat-l">Unique Tags</div></div>
                  <div className="fa-stat"><div className="fa-stat-n" style={{ color: '#FF6B9D' }}>{analysis.stats.maxDepth}</div><div className="fa-stat-l">Max Depth</div></div>
                </>}
                {file.type === 'txt' && <>
                  <div className="fa-stat"><div className="fa-stat-n" style={{ color: '#6C63FF' }}>{analysis.stats.lines}</div><div className="fa-stat-l">Lines</div></div>
                  <div className="fa-stat"><div className="fa-stat-n" style={{ color: '#00D4AA' }}>{analysis.stats.words}</div><div className="fa-stat-l">Words</div></div>
                  <div className="fa-stat"><div className="fa-stat-n" style={{ color: '#FFB347' }}>{analysis.stats.chars}</div><div className="fa-stat-l">Characters</div></div>
                  <div className="fa-stat"><div className="fa-stat-n" style={{ color: '#FF6B9D' }}>{analysis.stats.emptyLines}</div><div className="fa-stat-l">Empty Lines</div></div>
                </>}
              </div>

              {/* Tabs */}
              <div className="fa-tabs">
                <button className={`fa-tab ${activeTab === 'insights' ? 'active' : 'idle'}`} onClick={() => setActiveTab('insights')}>💡 Samjhao (Easy)</button>
                {file.type !== 'txt' && <button className={`fa-tab ${activeTab === 'tree' ? 'active' : 'idle'}`} onClick={() => setActiveTab('tree')}>🌳 Structure</button>}
                <button className={`fa-tab ${activeTab === 'raw' ? 'active' : 'idle'}`} onClick={() => setActiveTab('raw')}>📄 Raw File</button>
              </div>

              {/* Insights Tab */}
              {activeTab === 'insights' && (
                <div className="fa-insights">
                  {analysis.insights.map((ins, i) => (
                    <InsightCard key={i} {...ins} delay={i * 0.08} />
                  ))}
                </div>
              )}

              {/* Tree Tab */}
              {activeTab === 'tree' && file.type !== 'txt' && (
                <div className="fa-tree">
                  <JSONTree data={file.parsed} depth={0} />
                </div>
              )}

              {/* Raw Tab */}
              {activeTab === 'raw' && (
                <div className="fa-raw">
                  <pre style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {file.raw.slice(0, 5000)}{file.raw.length > 5000 ? '\n\n... (baaki content chhupa diya, file bahut badi hai)' : ''}
                  </pre>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  )
}

function InsightCard({ icon, title, desc, color, delay }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}30`,
      borderLeft: `3px solid ${color}`, borderRadius: 14, padding: '18px 20px',
      animation: `fadeUp 0.4s ease ${delay}s both`
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
        <div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 5 }}>{title}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6 }}>{desc}</div>
        </div>
      </div>
    </div>
  )
}
