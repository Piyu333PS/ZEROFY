import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

const CATEGORIES = {
  length: {
    label: '📏 Length', units: {
      m: 1, km: 1000, cm: 0.01, mm: 0.001, inch: 0.0254,
      feet: 0.3048, yard: 0.9144, mile: 1609.344
    }
  },
  weight: {
    label: '⚖️ Weight', units: {
      kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592,
      oz: 0.028349, tonne: 1000
    }
  },
  temperature: {
    label: '🌡️ Temperature', special: true,
    units: { celsius: 'C', fahrenheit: 'F', kelvin: 'K' }
  },
  area: {
    label: '📐 Area', units: {
      'm²': 1, 'km²': 1e6, 'cm²': 0.0001, 'ft²': 0.092903,
      acre: 4046.856, hectare: 10000
    }
  },
  speed: {
    label: '🚀 Speed', units: {
      'm/s': 1, 'km/h': 0.277778, mph: 0.44704, knot: 0.514444
    }
  },
  volume: {
    label: '🧪 Volume', units: {
      L: 1, mL: 0.001, 'ft³': 28.3168, 'in³': 0.016387,
      gallon: 3.78541, pint: 0.473176, cup: 0.236588
    }
  },
  data: {
    label: '💾 Data', units: {
      B: 1, KB: 1024, MB: 1048576, GB: 1073741824,
      TB: 1099511627776
    }
  },
  time: {
    label: '⏱️ Time', units: {
      second: 1, minute: 60, hour: 3600, day: 86400,
      week: 604800, month: 2629746, year: 31556952
    }
  },
}

function convertTemp(val, from, to) {
  let c
  if (from === 'celsius') c = val
  else if (from === 'fahrenheit') c = (val - 32) * 5 / 9
  else c = val - 273.15
  if (to === 'celsius') return c
  if (to === 'fahrenheit') return c * 9 / 5 + 32
  return c + 273.15
}

export default function UnitConverter() {
  const [cat, setCat] = useState('length')
  const [fromUnit, setFromUnit] = useState('')
  const [toUnit, setToUnit] = useState('')
  const [input, setInput] = useState('')

  const catData = CATEGORIES[cat]
  const unitKeys = Object.keys(catData.units)

  const from = fromUnit || unitKeys[0]
  const to = toUnit || unitKeys[1]

  const result = (() => {
    const v = parseFloat(input)
    if (isNaN(v)) return ''
    if (catData.special) {
      return convertTemp(v, from, to).toFixed(4).replace(/\.?0+$/, '')
    }
    const inBase = v * catData.units[from]
    return (inBase / catData.units[to]).toFixed(6).replace(/\.?0+$/, '')
  })()

  const handleCatChange = (c) => {
    setCat(c)
    setFromUnit('')
    setToUnit('')
    setInput('')
  }

  return (
    <ToolLayout icon="📏" name="Unit Converter" desc="Convert length, weight, temperature, area, speed, volume and data units">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {Object.entries(CATEGORIES).map(([key, c]) => (
          <button key={key} onClick={() => handleCatChange(key)}
            className={`${styles.copyBtn} ${cat === key ? styles.actionBtn : ''}`}
            style={cat === key ? { background: 'var(--accent)', color: '#fff', border: 'none', margin: 0, padding: '8px 16px' } : { margin: 0 }}>
            {c.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center' }}>
        <div>
          <select value={from} onChange={e => setFromUnit(e.target.value)} className={styles.controlSelect}
            style={{ marginBottom: 10 }}>
            {unitKeys.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <input value={input} onChange={e => setInput(e.target.value)}
            className={styles.controlInput} placeholder="Value daalo..." type="number" />
        </div>

        <div style={{ fontSize: 24, color: 'var(--accent2)', textAlign: 'center', fontWeight: 300 }}>→</div>

        <div>
          <select value={to} onChange={e => setToUnit(e.target.value)} className={styles.controlSelect}
            style={{ marginBottom: 10 }}>
            {unitKeys.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <div style={{
            background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)',
            padding: '10px 14px', fontSize: 16, fontWeight: 600, color: result ? 'var(--accent2)' : 'var(--text3)',
            minHeight: 42, display: 'flex', alignItems: 'center'
          }}>
            {result || 'Result...'}
          </div>
        </div>
      </div>

      {result && input && (
        <div className={styles.success} style={{ marginTop: 20 }}>
          {input} {from} = <strong>{result} {to}</strong>
        </div>
      )}
    </ToolLayout>
  )
}
