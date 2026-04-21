import { useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import ToolLayout from '../../components/ToolLayout'
import FileUpload from '../../components/FileUpload'
import styles from '../ToolPage.module.css'
import { downloadBlob } from '../../utils/download'

export default function MergePDF() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const addFiles = (newFiles) => { setFiles(prev => [...prev, ...newFiles]); setDone(false) }
  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i))
  const moveUp = (i) => { if (i === 0) return; setFiles(prev => { const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a }) }
  const moveDown = (i) => { setFiles(prev => { if (i === prev.length - 1) return prev; const a = [...prev]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a }) }

  const merge = async () => {
    if (files.length < 2) return
    setLoading(true)
    try {
      const merged = await PDFDocument.create()
      for (const file of files) {
        const bytes = await file.arrayBuffer()
        const pdf = await PDFDocument.load(bytes)
        const pages = await merged.copyPages(pdf, pdf.getPageIndices())
        pages.forEach(p => merged.addPage(p))
      }
      const bytes = await merged.save()
      downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'merged.pdf')
      setDone(true)
    } catch (e) {
      alert('Error: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <ToolLayout icon="📄" name="Merge PDF" desc="Multiple PDF files ko ek PDF mein combine karo">
      <FileUpload onFiles={addFiles} accept={{ 'application/pdf': ['.pdf'] }} multiple label="PDF files drag karo ya choose karo" />
      {files.length > 0 && (
        <div className={styles.fileList}>
          <h3 className={styles.fileListTitle}>Files ({files.length}) — Order arrows se change karo</h3>
          {files.map((f, i) => (
            <div key={i} className={styles.fileItem}>
              <span className={styles.fileNum}>{i + 1}</span>
              <span className={styles.fileIcon}>📄</span>
              <div className={styles.fileInfo}>
                <div className={styles.fileName}>{f.name}</div>
                <div className={styles.fileSize}>{(f.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <div className={styles.fileActions}>
                <button onClick={() => moveUp(i)} disabled={i === 0}>↑</button>
                <button onClick={() => moveDown(i)} disabled={i === files.length - 1}>↓</button>
                <button onClick={() => removeFile(i)} className={styles.removeBtn}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {files.length >= 2 && (
        <button className={styles.actionBtn} onClick={merge} disabled={loading}>
          {loading ? <><span className={styles.spinner} /> Merge ho raha hai...</> : `⚡ ${files.length} PDFs Merge Karo`}
        </button>
      )}
      {files.length === 1 && <p className={styles.hint}>ℹ️ Kam se kam 2 PDF files select karo</p>}
      {done && <div className={styles.success}>✅ Merge ho gaya! File download ho gayi.</div>}
    </ToolLayout>
  )
}
