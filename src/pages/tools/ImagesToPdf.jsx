import { useState, useCallback } from 'react'
import { PDFDocument } from 'pdf-lib'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'
import { downloadBlob } from '../../utils/download'

export default function ImagesToPdf() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [pageSize, setPageSize] = useState('fit')

  const onFiles = useCallback((e) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'))
    const newImgs = files.map(f => ({ file: f, url: URL.createObjectURL(f), id: Math.random() }))
    setImages(prev => [...prev, ...newImgs]); setDone(false)
  }, [])

  const remove = (id) => setImages(prev => prev.filter(i => i.id !== id))
  const moveUp = (idx) => { if (idx === 0) return; setImages(prev => { const a = [...prev]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; return a }) }
  const moveDown = (idx) => { setImages(prev => { if (idx === prev.length - 1) return prev; const a = [...prev]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; return a }) }

  const generate = async () => {
    if (!images.length) return
    setLoading(true)
    try {
      const pdfDoc = await PDFDocument.create()
      for (const img of images) {
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
      }
      const pdfBytes = await pdfDoc.save()
      downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'images.pdf')
      setDone(true)
    } catch (e) { alert('Error: ' + e.message) }
    setLoading(false)
  }

  return (
    <ToolLayout icon="📷" name="Images → PDF" desc="Multiple images ko ek PDF mein combine karo">
      <div style={{ marginBottom: 16 }}>
        <input type="file" accept="image/*" multiple onChange={onFiles} style={{ color: 'var(--text2)' }} />
      </div>
      <div className={styles.controls} style={{ marginBottom: 16 }}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Page Size</label>
          <select className={styles.controlSelect} value={pageSize} onChange={e => setPageSize(e.target.value)}>
            <option value="fit">Image size ke hisaab se</option>
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
          </select>
        </div>
      </div>
      {images.length > 0 && (
        <>
          <div className={styles.fileList}>
            <div className={styles.fileListTitle}>Images ({images.length}) — Order change kar sakte ho</div>
            {images.map((img, idx) => (
              <div key={img.id} className={styles.fileItem}>
                <img src={img.url} alt="" style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 4 }} />
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{img.file.name}</div>
                  <div className={styles.fileSize}>{(img.file.size/1024).toFixed(0)} KB</div>
                </div>
                <div className={styles.fileActions}>
                  <button onClick={() => moveUp(idx)} disabled={idx === 0}>↑</button>
                  <button onClick={() => moveDown(idx)} disabled={idx === images.length - 1}>↓</button>
                  <button onClick={() => remove(img.id)} className={styles.removeBtn}>✕</button>
                </div>
              </div>
            ))}
          </div>
          <button className={styles.actionBtn} onClick={generate} disabled={loading}>
            {loading ? <><span className={styles.spinner} /> PDF ban rahi hai...</> : `📄 ${images.length} Images se PDF Banao`}
          </button>
        </>
      )}
      {done && <div className={styles.success}>✅ PDF download ho gayi! {images.length} images combine ki gayi.</div>}
    </ToolLayout>
  )
}
