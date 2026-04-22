import { useState, useEffect, useRef } from 'react'
import { downloadDataUrl } from '../../utils/download'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

function loadQRLib() {
  return new Promise((resolve, reject) => {
    if (window.QRCode) return resolve()
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function makeQR(text, size) {
  const div = document.createElement('div')
  div.style.cssText = 'position:absolute;left:-9999px;top:-9999px'
  document.body.appendChild(div)
  try {
    new window.QRCode(div, {
      text, width: size, height: size,
      colorDark: '#6c63ff', colorLight: '#0a0a0f',
      correctLevel: window.QRCode.CorrectLevel.H
    })
    const canvas = div.querySelector('canvas')
    const url = canvas ? canvas.toDataURL('image/png') : null
    document.body.removeChild(div)
    return url
  } catch {
    document.body.removeChild(div)
    return null
  }
}

export default function QRGenerator() {
  const [text, setText] = useState('https://zerofy.app')
  const [size, setSize] = useState(256)
  const [type, setType] = useState('url')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)

  const prefixes = { url: '', email: 'mailto:', phone: 'tel:', sms: 'sms:', text: '' }

  const generate = async (t, s, tp) => {
    if (!t.trim()) return
    setLoading(true)
    try {
      await loadQRLib()
      const fullText = (prefixes[tp] || '') + t
      const url = makeQR(fullText, s)
      if (url) setQrDataUrl(url)
    } catch { }
    setLoading(false)
  }

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => generate(text, size, type), 500)
  }, [text, size, type])

  const download = () => {
    if (!qrDataUrl) return
    downloadDataUrl(qrDataUrl, 'zerofy_qr.png')
  }

  return (
    <ToolLayout icon="📱" name="QR Code Maker" desc="Kisi bhi URL, text, phone number ka QR code banao — bilkul free">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'start' }}>
        <div>
          <div className={styles.controls}>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className={styles.controlSelect}>
                <option value="url">URL / Website</option>
                <option value="email">Email</option>
                <option value="phone">Phone Number</option>
                <option value="sms">SMS</option>
                <option value="text">Plain Text</option>
              </select>
            </div>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel}>Size: {size}×{size}px</label>
              <input type="range" min="128" max="512" step="64" value={size}
                onChange={e => setSize(+e.target.value)} className={styles.controlInput} />
            </div>
          </div>
          <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
            <label className={styles.controlLabel}>
              {type === 'url' ? 'URL daalo' : type === 'email' ? 'Email address' : type === 'phone' ? 'Phone number' : 'Text daalo'}
            </label>
            <input value={text} onChange={e => setText(e.target.value)}
              className={styles.controlInput}
              placeholder={type === 'url' ? 'https://...' : type === 'email' ? 'example@gmail.com' : type === 'phone' ? '+91 98765 43210' : 'Koi bhi text...'} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>
            💡 QR code device pe generate hota hai — koi data bahar nahi jaata.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: '#0a0a0f', border: '2px solid var(--border2)', borderRadius: 16, padding: 16,
            width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {loading ? <span className={styles.spinner} style={{ width: 28, height: 28 }} />
              : qrDataUrl ? <img src={qrDataUrl} alt="QR" style={{ width: 168, height: 168 }} />
              : <span style={{ color: 'var(--text3)', fontSize: 13 }}>QR yahan dikhega</span>}
          </div>
          {qrDataUrl && (
            <button className={styles.actionBtn} style={{ padding: '10px 24px', fontSize: 14 }} onClick={download}>
              ⬇ Download PNG
            </button>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
