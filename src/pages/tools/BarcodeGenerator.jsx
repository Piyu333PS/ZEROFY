import { useState, useRef, useEffect } from 'react'
import { downloadDataUrl } from '../../utils/download'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

// Simple CODE128-like barcode renderer using Canvas
function drawBarcode(canvas, text, options = {}) {
  if (!canvas || !text) return
  const { barWidth = 2, height = 80, fontSize = 14, showText = true } = options

  // Code 128 B encoding patterns (simplified subset)
  const CODE128B = {
    ' ':11011001100,'!':11001101100,'"':11001100110,'#':10010011000,
    '$':10010001100,'%':10001001100,'&':10011001000,"'":10011000100,
    '(':10001100100,')':11001001000,'*':11001000100,'+':11000100100,
    ',':10110011100,'-':10011011100,'.':10011001110,'/':10111001100,
    '0':10011101100,'1':10011100110,'2':11001110010,'3':11001011100,
    '4':11001001110,'5':11011100100,'6':11001110100,'7':11101101110,
    '8':11101001100,'9':11100101100,':':11100100110,';':11101100100,
    '<':11100110100,'=':11100110010,'>':11011011000,'?':11011000110,
    '@':11000110110,'A':10100011000,'B':10001011000,'C':10001000110,
    'D':10110001000,'E':10001101000,'F':10001100010,'G':11010001000,
    'H':11000101000,'I':11000100010,'J':10110111000,'K':10110001110,
    'L':10001101110,'M':10111011000,'N':10111000110,'O':10001110110,
    'P':11101110110,'Q':11010001110,'R':11000101110,'S':11011101000,
    'T':11011100010,'U':11011101110,'V':11101011000,'W':11101000110,
    'X':11100010110,'Y':11101101000,'Z':11101100010,
    'a':11100011010,'b':11101111010,'c':11001000010,'d':11110001010,
    'e':10100110000,'f':10100001100,'g':10010110000,'h':10010000110,
    'i':10000101100,'j':10000100110,'k':10110010000,'l':10110000100,
    'm':10011010000,'n':10011000010,'o':10000110100,'p':10000110010,
    'q':11000010010,'r':11001010000,'s':11110111010,'t':11000010100,
    'u':10001111010,'v':10100111100,'w':10010111100,'x':10010011110,
    'y':10111100100,'z':10011110100,
  }

  const ctx = canvas.getContext('2d')
  const totalHeight = showText ? height + fontSize + 8 : height
  const bars = []

  // Start code B: 11010010000
  bars.push(...[1,1,0,1,0,0,1,0,0,0,0])

  let checksum = 104 // START B value
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const pattern = CODE128B[char] || CODE128B[' ']
    const digits = String(pattern).split('').map(Number)
    bars.push(...digits)
    checksum += (i + 1) * (Object.keys(CODE128B).indexOf(char) + 32)
  }

  // Stop: 1100011101011
  bars.push(...[1,1,0,0,0,1,1,1,0,1,0,1,1])

  canvas.width = bars.length * barWidth + 40
  canvas.height = totalHeight
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#000000'

  const xStart = 20
  bars.forEach((bar, i) => {
    if (bar === 1) ctx.fillRect(xStart + i * barWidth, 10, barWidth, height)
  })

  if (showText) {
    ctx.font = `${fontSize}px monospace`
    ctx.textAlign = 'center'
    ctx.fillText(text, canvas.width / 2, height + fontSize + 4)
  }
}

export default function BarcodeGenerator() {
  const [text, setText] = useState('ZEROFY-2024')
  const [barWidth, setBarWidth] = useState(2)
  const [height, setHeight] = useState(80)
  const [showText, setShowText] = useState(true)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [barColor, setBarColor] = useState('#000000')
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !text) return
    const canvas = canvasRef.current
    drawBarcode(canvas, text.toUpperCase().slice(0, 40), { barWidth, height, showText })
    // Apply colors (recolor)
    const ctx = canvas.getContext('2d')
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const d = img.data
    const bg = hexToRgb(bgColor), bar = hexToRgb(barColor)
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] === 0 && d[i+1] === 0 && d[i+2] === 0) {
        d[i] = bar.r; d[i+1] = bar.g; d[i+2] = bar.b
      } else {
        d[i] = bg.r; d[i+1] = bg.g; d[i+2] = bg.b
      }
    }
    ctx.putImageData(img, 0, 0)
  }, [text, barWidth, height, showText, bgColor, barColor])

  const hexToRgb = (hex) => ({
    r: parseInt(hex.slice(1,3),16),
    g: parseInt(hex.slice(3,5),16),
    b: parseInt(hex.slice(5,7),16)
  })

  const download = () => {
    downloadDataUrl(canvasRef.current.toDataURL('image/png'), `barcode_${text}.png`)
  }

  return (
    <ToolLayout icon="📊" name="Barcode Generator" desc="Code 128 barcode generate karo — customize karke download karo">

      <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
        <label className={styles.controlLabel}>Text / Code</label>
        <input className={styles.controlInput} value={text} onChange={e => setText(e.target.value)}
          placeholder="PRODUCT-12345" maxLength={40} />
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Max 40 characters • Uppercase preferred</div>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Bar Width: {barWidth}px</label>
          <input type="range" min={1} max={4} value={barWidth} onChange={e => setBarWidth(+e.target.value)}
            style={{ width: '100%', accentColor: 'var(--accent)' }} />
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Height: {height}px</label>
          <input type="range" min={40} max={160} value={height} onChange={e => setHeight(+e.target.value)}
            style={{ width: '100%', accentColor: 'var(--accent)' }} />
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Bar Color</label>
          <input type="color" value={barColor} onChange={e => setBarColor(e.target.value)}
            style={{ width: '100%', height: 40, borderRadius: 'var(--radius)', border: '1px solid var(--border)', cursor: 'pointer' }} />
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Background</label>
          <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
            style={{ width: '100%', height: 40, borderRadius: 'var(--radius)', border: '1px solid var(--border)', cursor: 'pointer' }} />
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text2)', marginBottom: 20, cursor: 'pointer' }}>
        <input type="checkbox" checked={showText} onChange={e => setShowText(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
        Text bhi dikhao barcode ke neeche
      </label>

      {text && (
        <div style={{
          background: bgColor, padding: 20, borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', display: 'inline-block', maxWidth: '100%', overflowX: 'auto'
        }}>
          <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />
        </div>
      )}

      <button className={styles.actionBtn} onClick={download} style={{ marginTop: 16 }} disabled={!text}>
        ⬇️ PNG Download karo
      </button>
    </ToolLayout>
  )
}
