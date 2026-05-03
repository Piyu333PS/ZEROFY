import { useState } from 'react'
import { downloadBlob } from '../../utils/download'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

export default function HeicConverter() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [format, setFormat] = useState('jpeg')
  const [quality, setQuality] = useState(90)

  const onFiles = (e) => {
    const f = Array.from(e.target.files || [])
    setFiles(f)
    setResults([])
  }

  const loadHeic2Any = () => new Promise((resolve, reject) => {
    if (window.heic2any) return resolve(window.heic2any)
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/heic2any/0.0.4/heic2any.min.js'
    script.onload = () => resolve(window.heic2any)
    script.onerror = reject
    document.head.appendChild(script)
  })

  const convert = async () => {
    if (files.length === 0) return
    setLoading(true)
    const done = []

    try {
      const heic2any = await loadHeic2Any()

      for (const file of files) {
        try {
          const blob = await heic2any({
            blob: file,
            toType: `image/${format}`,
            quality: quality / 100
          })

          const outBlob = Array.isArray(blob) ? blob[0] : blob
          const url = URL.createObjectURL(outBlob)
          const a = document.createElement('a')
          a.href = url
          downloadBlob(outBlob, file.name.replace(/\.(heic|heif)$/i, `.${format}`))
          done.push({ name: file.name, ok: true, size: outBlob.size })
        } catch (e) {
          done.push({ name: file.name, ok: false, error: e.message })
        }
      }
    } catch (e) {
      alert('Failed to load library. Please check your internet connection.')
    }

    setResults(done)
    setLoading(false)
  }

  const fmtSize = b => b > 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + ' MB' : (b / 1024).toFixed(0) + ' KB'

  return (
    <ToolLayout icon="📷" name="HEIC Converter" desc="Convert iPhone HEIC/HEIF photos to JPG or PNG">
      <div>
        <div style={{
          background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.3)',
          borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 24, fontSize: 13, color: 'var(--text2)'
        }}>
          📱 Convert HEIC photos from iPhone to JPG/PNG — compatible with Windows and Android.
        </div>

        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 12, border: '2px dashed var(--border2)', borderRadius: 'var(--radius-lg)',
          padding: '32px 24px', cursor: 'pointer', marginBottom: 24, background: 'var(--bg2)'
        }}>
          <span style={{ fontSize: 40 }}>📷</span>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Choose HEIC files</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>.heic ya .heif files — multiple select kar sakte ho</div>
          </div>
          <input type="file" accept=".heic,.heif,image/heic,image/heif" multiple onChange={onFiles} style={{ display: 'none' }} />
        </label>

        {/* Settings */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 13, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Output Format</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['jpeg', 'png', 'webp'].map(f => (
                <button key={f} onClick={() => setFormat(f)} style={{
                  padding: '6px 14px', borderRadius: 8, border: '1px solid',
                  borderColor: format === f ? 'var(--accent)' : 'var(--border)',
                  background: format === f ? 'var(--accent)' : 'var(--bg3)',
                  color: format === f ? '#fff' : 'var(--text2)',
                  fontSize: 13, cursor: 'pointer', fontWeight: 500, textTransform: 'uppercase'
                }}>{f}</button>
              ))}
            </div>
          </div>
          {format !== 'png' && (
            <div>
              <label style={{ fontSize: 13, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Quality: {quality}%</label>
              <input type="range" min="60" max="100" value={quality}
                onChange={e => setQuality(+e.target.value)} style={{ width: 140 }} />
            </div>
          )}
        </div>

        {files.length > 0 && (
          <>
            <div style={{ marginBottom: 16 }}>
              {files.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 14px', background: 'var(--bg3)', borderRadius: 8,
                  marginBottom: 8, fontSize: 13, border: '1px solid var(--border)'
                }}>
                  <span>📷</span>
                  <span style={{ flex: 1, color: 'var(--text2)' }}>{f.name}</span>
                  <span style={{ color: 'var(--text3)' }}>{fmtSize(f.size)}</span>
                </div>
              ))}
            </div>
            <button className={styles.actionBtn} onClick={convert} disabled={loading}>
              {loading ? <><span className={styles.spinner} /> Convert ho raha hai...</> : `🔄 Convert to ${format.toUpperCase()} (${files.length} file)`}
            </button>
          </>
        )}

        {results.length > 0 && (
          <div style={{ marginTop: 20 }}>
            {results.map((r, i) => (
              <div key={i} style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 8, fontSize: 13,
                background: r.ok ? 'rgba(99,153,34,0.1)' : 'rgba(226,75,74,0.1)',
                border: `1px solid ${r.ok ? 'rgba(99,153,34,0.3)' : 'rgba(226,75,74,0.3)'}`
              }}>
                {r.ok ? `✅ ${r.name} → converted! (${fmtSize(r.size)})` : `❌ ${r.name} — ${r.error}`}
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
