import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

export default function ImageToText() {
  const [image, setImage] = useState(null)
  const [text, setText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState('')
  const [copied, setCopied] = useState(false)
  const [lang, setLang] = useState('eng')

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setImage({ src: ev.target.result, name: file.name })
    reader.readAsDataURL(file)
    setText('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile({ target: { files: [file] } })
  }

  const extract = async () => {
    if (!image) return
    setProcessing(true)
    setText('')
    try {
      // Dynamically load Tesseract.js from CDN
      if (!window.Tesseract) {
        setProgress('Loading OCR engine...')
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      setProgress('Initializing...')
      const worker = await window.Tesseract.createWorker(lang, 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(`Recognizing: ${Math.round(m.progress * 100)}%`)
          } else {
            setProgress(m.status)
          }
        }
      })

      const { data: { text: result } } = await worker.recognize(image.src)
      await worker.terminate()
      setText(result.trim())
      setProgress('')
    } catch (e) {
      setProgress('')
      setText('❌ Error: ' + e.message + '\n\nNote: Tesseract.js CDN load nahi ho paya. Internet connection check karo.')
    }
    setProcessing(false)
  }

  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <ToolLayout icon="🔤" name="Image → Text (OCR)" desc="Extract text from any image or screenshot — powered by Tesseract.js">

      <div className={styles.controls} style={{ marginBottom: 16 }}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Language</label>
          <select className={styles.controlSelect} value={lang} onChange={e => setLang(e.target.value)}>
            <option value="eng">English</option>
            <option value="hin">Hindi</option>
            <option value="eng+hin">English + Hindi</option>
          </select>
        </div>
      </div>

      {!image ? (
        <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center', cursor: 'pointer' }}
          onClick={() => document.getElementById('ocr-upload').click()}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔤</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Image drop karo ya click karo</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>JPG, PNG, WebP, BMP — screenshot bhi kaam karta hai</div>
          <input id="ocr-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap' }}>
            <img src={image.src} alt="uploaded" style={{ maxWidth: 200, maxHeight: 150, borderRadius: 'var(--radius)', border: '1px solid var(--border)', objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{image.name}</div>
              <button className={styles.copyBtn} onClick={() => { setImage(null); setText('') }}>🔄 Change Image</button>
            </div>
          </div>

          <button className={styles.actionBtn} onClick={extract} disabled={processing}>
            {processing
              ? <><span className={styles.spinner} /> {progress || 'Processing...'}</>
              : '🔍 Text Extract'}
          </button>
        </>
      )}

      {text && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className={styles.controlLabel}>Extracted Text ({text.split(/\s+/).filter(Boolean).length} words)</div>
            <button className={styles.copyBtn} style={{ marginTop: 0 }} onClick={copy}>{copied ? '✅ Copied' : '📋 Copy'}</button>
          </div>
          <textarea className={styles.outputArea} style={{ minHeight: 200 }} value={text} onChange={e => setText(e.target.value)} />
        </div>
      )}

      <div className={styles.hint} style={{ marginTop: 16 }}>
        💡 Best results ke liye: clear, high-resolution image use karo. Handwritten text ke liye accuracy kam ho sakti hai.
      </div>
    </ToolLayout>
  )
}
