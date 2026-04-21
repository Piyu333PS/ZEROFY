import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'
import FileUpload from '../../components/FileUpload'
import styles from '../ToolPage.module.css'
import { downloadDataUrl } from '../../utils/download'

export default function PdfToJpg() {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [quality, setQuality] = useState(90)
  const [scale, setScale] = useState(2)

  const loadPdfJs = () => new Promise((resolve, reject) => {
    if (window.pdfjsLib) return resolve(window.pdfjsLib)
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      resolve(window.pdfjsLib)
    }
    script.onerror = () => reject(new Error('pdfjs-dist load nahi hua'))
    document.head.appendChild(script)
  })

  const convert = async (files) => {
    if (!files[0]) return
    setLoading(true); setPages([])
    try {
      const pdfjsLib = await loadPdfJs()
      setProgress('PDF load ho raha hai...')
      const arrayBuffer = await files[0].arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const results = []
      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress(`Page ${i} / ${pdf.numPages} convert ho raha hai...`)
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
        results.push({ dataUrl: canvas.toDataURL('image/jpeg', quality / 100), page: i })
      }
      setPages(results)
      setProgress('')
    } catch (e) {
      alert('Error: ' + e.message)
      setProgress('')
    }
    setLoading(false)
  }

  const download = (p) => downloadDataUrl(p.dataUrl, `page_${p.page}.jpg`)
  const downloadAll = () => pages.forEach((p, i) => setTimeout(() => download(p), i * 300))

  return (
    <ToolLayout icon="🖼️" name="PDF → JPG" desc="PDF ke har page ko JPG image mein convert karo">
      <FileUpload onFiles={convert} accept={{ 'application/pdf': ['.pdf'] }} label="PDF file choose karo" />

      <div className={styles.controls} style={{ marginTop: 16 }}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Quality: {quality}%</label>
          <input type="range" min={50} max={100} value={quality}
            onChange={e => setQuality(+e.target.value)}
            style={{ width: '100%', accentColor: 'var(--accent)' }} />
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Resolution: {scale}x</label>
          <input type="range" min={1} max={3} step={0.5} value={scale}
            onChange={e => setScale(+e.target.value)}
            style={{ width: '100%', accentColor: 'var(--accent)' }} />
        </div>
      </div>

      {loading && (
        <div className={styles.hint} style={{ marginTop: 12 }}>
          <span className={styles.spinner} style={{ display: 'inline-block', marginRight: 8 }} />
          {progress || 'Processing...'}
        </div>
      )}

      {pages.length > 0 && (
        <>
          <button className={styles.actionBtn} onClick={downloadAll} style={{ margin: '16px 0' }}>
            ⬇️ Sab Pages Download Karo ({pages.length})
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {pages.map(p => (
              <div key={p.page} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <img src={p.dataUrl} alt={`Page ${p.page}`} style={{ width: '100%', display: 'block' }} />
                <button className={styles.actionBtn}
                  style={{ margin: 8, width: 'calc(100% - 16px)', padding: '8px' }}
                  onClick={() => download(p)}>
                  ⬇️ Page {p.page}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </ToolLayout>
  )
}
