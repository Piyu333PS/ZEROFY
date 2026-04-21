import { useState } from 'react'
import { downloadDataUrl } from '../../utils/download'
import imageCompression from 'browser-image-compression'
import ToolLayout from '../../components/ToolLayout'
import FileUpload from '../../components/FileUpload'
import styles from '../ToolPage.module.css'

export default function ImageCompressor() {
  const [files, setFiles] = useState([])
  const [quality, setQuality] = useState(75)
  const [maxWidth, setMaxWidth] = useState(1920)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])

  const addFiles = (f) => { setFiles(prev => [...prev, ...f]); setResults([]) }

  const compress = async () => {
    setLoading(true)
    const res = []
    for (const file of files) {
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 10,
          maxWidthOrHeight: maxWidth,
          useWebWorker: true,
          initialQuality: quality / 100,
        })
        res.push({
          name: file.name,
          originalSize: file.size,
          compressedSize: compressed.size,
          url: URL.createObjectURL(compressed),
          blob: compressed,
        })
      } catch (e) {
        res.push({ name: file.name, error: e.message })
      }
    }
    setResults(res)
    setLoading(false)
  }

  const downloadAll = () => {
    results.filter(r => !r.error).forEach((r, i) => {
      setTimeout(() => downloadDataUrl(r.url, 'compressed_' + r.name), i * 400)
    })
  }

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  return (
    <ToolLayout icon="🗜️" name="Image Compressor" desc="JPG, PNG, WebP images ka size kam karo — quality almost same rahegi">
      <FileUpload
        onFiles={addFiles}
        accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] }}
        multiple
        label="Images drag karo ya choose karo (JPG, PNG, WebP)"
      />

      {files.length > 0 && (
        <>
          <div className={styles.controls}>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Quality: {quality}%</label>
              <input
                type="range" min="10" max="100" value={quality}
                onChange={e => setQuality(+e.target.value)}
                className={styles.controlInput}
              />
            </div>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Max Width: {maxWidth}px</label>
              <input
                type="range" min="400" max="4000" step="100" value={maxWidth}
                onChange={e => setMaxWidth(+e.target.value)}
                className={styles.controlInput}
              />
            </div>
          </div>

          <button className={styles.actionBtn} onClick={compress} disabled={loading}>
            {loading ? <><span className={styles.spinner} /> Compress ho raha hai...</> : `🗜️ ${files.length} Images Compress Karo`}
          </button>
        </>
      )}

      {results.length > 0 && (
        <div className={styles.fileList} style={{ marginTop: 24 }}>
          <h3 className={styles.fileListTitle}>Results</h3>
          {results.map((r, i) => (
            <div key={i} className={styles.fileItem}>
              <span className={styles.fileIcon}>🖼️</span>
              <div className={styles.fileInfo}>
                <div className={styles.fileName}>{r.name}</div>
                {r.error
                  ? <div style={{ color: '#ff6b6b', fontSize: 12 }}>Error: {r.error}</div>
                  : (
                    <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>Pehle: {formatSize(r.originalSize)}</span>
                      <span style={{ fontSize: 12, color: 'var(--green)' }}>Baad: {formatSize(r.compressedSize)}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent2)' }}>
                        {Math.round((1 - r.compressedSize / r.originalSize) * 100)}% kam hua!
                      </span>
                    </div>
                  )
                }
              </div>
              {!r.error && (
                <a href={r.url} download={'compressed_' + r.name} onClick={e => { e.preventDefault(); downloadDataUrl(r.url, 'compressed_' + r.name) }} style={{
                  background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid var(--green)',
                  borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 500, flexShrink: 0
                }}>
                  ⬇ Download
                </a>
              )}
            </div>
          ))}
          {results.length > 1 && (
            <button className={styles.actionBtn} onClick={downloadAll} style={{ marginTop: 12 }}>
              ⬇ Sabhi Download Karo
            </button>
          )}
        </div>
      )}
    </ToolLayout>
  )
}
