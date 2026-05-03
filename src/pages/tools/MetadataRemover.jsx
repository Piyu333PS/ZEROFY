import { useState, useCallback } from 'react'
import { downloadDataUrl } from '../../utils/download'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

export default function MetadataRemover() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])

  const onFiles = useCallback((e) => {
    const f = Array.from(e.target.files || []).filter(f =>
      f.type.startsWith('image/') || f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)
    )
    setFiles(f)
    setResults([])
  }, [])

  const removeMetadata = async () => {
    if (files.length === 0) return
    setLoading(true)
    const done = []

    for (const file of files) {
      try {
        const img = new Image()
        const url = URL.createObjectURL(file)
        await new Promise((res, rej) => {
          img.onload = res
          img.onerror = rej
          img.src = url
        })

        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(url)

        const ext = file.name.match(/\.(png|gif|webp)$/i) ? 'image/png' : 'image/jpeg'
        const quality = ext === 'image/jpeg' ? 0.95 : undefined

        const blob = await new Promise(res => canvas.toBlob(res, ext, quality))
        const outUrl = URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.href = outUrl
        a.download = 'clean_' + file.name.replace(/\.[^/.]+$/, '') + (ext === 'image/jpeg' ? '.jpg' : '.png')
        downloadDataUrl(outUrl, a.download)
        // original click removed

        done.push({ name: file.name, size: file.size, newSize: blob.size, ok: true })
      } catch (e) {
        done.push({ name: file.name, ok: false, error: e.message })
      }
    }

    setResults(done)
    setLoading(false)
  }

  const fmtSize = b => b > 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + ' MB' : (b / 1024).toFixed(0) + ' KB'

  return (
    <ToolLayout icon="🧹" name="Metadata Remover" desc="Remove EXIF data, GPS location and camera info from images — protect your privacy">
      <div>
        <div style={{
          background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.3)',
          borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 24, fontSize: 13, color: 'var(--text2)'
        }}>
          ⚠️ Images mein GPS location, camera model, date/time, aur personal info hoti hai — ye tool sab hata deta hai.
        </div>

        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 12, border: '2px dashed var(--border2)', borderRadius: 'var(--radius-lg)',
          padding: '32px 24px', cursor: 'pointer', marginBottom: 24, background: 'var(--bg2)'
        }}>
          <span style={{ fontSize: 40 }}>🧹</span>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Images choose karo</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>JPG, PNG, WebP — multiple select kar sakte ho</div>
          </div>
          <input type="file" accept="image/*" multiple onChange={onFiles} style={{ display: 'none' }} />
        </label>

        {files.length > 0 && (
          <>
            <div style={{ marginBottom: 16 }}>
              {files.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 14px', background: 'var(--bg3)', borderRadius: 8,
                  marginBottom: 8, fontSize: 13, border: '1px solid var(--border)'
                }}>
                  <span>🖼️</span>
                  <span style={{ flex: 1, color: 'var(--text2)' }}>{f.name}</span>
                  <span style={{ color: 'var(--text3)' }}>{fmtSize(f.size)}</span>
                </div>
              ))}
            </div>

            <button className={styles.actionBtn} onClick={removeMetadata} disabled={loading}>
              {loading ? <><span className={styles.spinner} /> Processing...</> : `🧹 Metadata Hatao (${files.length} file)`}
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
                {r.ok
                  ? `✅ ${r.name} — Metadata hata di! (${fmtSize(r.size)} → ${fmtSize(r.newSize)})`
                  : `❌ ${r.name} — Error: ${r.error}`
                }
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
