import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) { h = s = 0 }
  else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function generateShades(hex) {
  const { r, g, b } = hexToRgb(hex)
  return [10, 25, 50, 75, 90].map(pct => {
    const nr = Math.round(r + (255 - r) * (1 - pct / 100))
    const ng = Math.round(g + (255 - g) * (1 - pct / 100))
    const nb = Math.round(b + (255 - b) * (1 - pct / 100))
    return '#' + [nr, ng, nb].map(v => v.toString(16).padStart(2, '0')).join('')
  })
}

export default function ColorPicker() {
  const [color, setColor] = useState('#6c63ff')
  const [copied, setCopied] = useState('')

  const { r, g, b } = hexToRgb(color)
  const hsl = rgbToHsl(r, g, b)
  const shades = generateShades(color)

  const copy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const CopyBtn = ({ value, label, k }) => (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      padding: '12px 16px', cursor: 'pointer', transition: 'all 0.2s' }}
      onClick={() => copy(value, k)}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'monospace', fontSize: 14, color: copied === k ? 'var(--green)' : 'var(--text)' }}>
        {copied === k ? '✅ Copied!' : value}
      </div>
    </div>
  )

  return (
    <ToolLayout icon="🎨" name="Color Picker" desc="Copy HEX, RGB, HSL values and generate color shades">
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 200, height: 200, background: color, borderRadius: 20,
            border: '3px solid var(--border2)', boxShadow: `0 20px 60px ${color}44` }} />
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            style={{ width: 200, height: 48, borderRadius: 12, border: '1px solid var(--border2)',
              background: 'transparent', cursor: 'pointer', padding: 4 }} />
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <CopyBtn value={color.toUpperCase()} label="HEX" k="hex" />
            <CopyBtn value={`rgb(${r}, ${g}, ${b})`} label="RGB" k="rgb" />
            <CopyBtn value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} label="HSL" k="hsl" />
            <CopyBtn value={`rgba(${r}, ${g}, ${b}, 1)`} label="RGBA" k="rgba" />
          </div>

          <div>
            <div className={styles.fileListTitle} style={{ marginBottom: 10 }}>Shades</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {shades.map((s, i) => (
                <div key={i} title={s} onClick={() => copy(s, 'shade' + i)}
                  style={{ flex: 1, height: 40, background: s, borderRadius: 8, cursor: 'pointer',
                    border: copied === 'shade' + i ? '2px solid var(--text)' : '2px solid transparent',
                    transition: 'all 0.2s' }} />
              ))}
              <div style={{ flex: 1, height: 40, background: color, borderRadius: 8, cursor: 'pointer',
                border: '2px solid var(--border2)' }} title="Selected" />
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {['10%', '25%', '50%', '75%', '90%'].map(l => (
                <div key={l} style={{ flex: 1, fontSize: 9, textAlign: 'center', color: 'var(--text3)' }}>{l}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.hint} style={{ marginTop: 20 }}>
        💡 Choose from the color wheel or type directly in the HEX field. Click any value to copy.
      </div>
    </ToolLayout>
  )
}
