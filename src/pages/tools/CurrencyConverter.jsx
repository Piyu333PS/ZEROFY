import { useState, useEffect } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦' },
  { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'MYR', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  { code: 'NZD', name: 'New Zealand Dollar', flag: '🇳🇿' },
  { code: 'KRW', name: 'South Korean Won', flag: '🇰🇷' },
  { code: 'THB', name: 'Thai Baht', flag: '🇹🇭' },
  { code: 'PKR', name: 'Pakistani Rupee', flag: '🇵🇰' },
  { code: 'BDT', name: 'Bangladeshi Taka', flag: '🇧🇩' },
  { code: 'NPR', name: 'Nepali Rupee', flag: '🇳🇵' },
]

// Approximate offline rates vs USD (fallback)
const FALLBACK_RATES = {
  USD:1, INR:83.5, EUR:0.92, GBP:0.79, JPY:149.5, AUD:1.53, CAD:1.36,
  CHF:0.88, CNY:7.24, SAR:3.75, AED:3.67, SGD:1.34, HKD:7.82, MYR:4.72,
  NZD:1.63, KRW:1330, THB:35.2, PKR:278, BDT:110, NPR:133
}

export default function CurrencyConverter() {
  const [amount, setAmount] = useState(1)
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('INR')
  const [rates, setRates] = useState(FALLBACK_RATES)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    // Free open exchange API (no key needed)
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(data => {
        if (data.rates) {
          setRates(data.rates)
          setLastUpdated(new Date().toLocaleTimeString())
          setUsingFallback(false)
        }
      })
      .catch(() => {
        setUsingFallback(true)
      })
      .finally(() => setLoading(false))
  }, [])

  const convert = (amt, f, t) => {
    if (!rates[f] || !rates[t]) return 0
    const inUSD = amt / rates[f]
    return (inUSD * rates[t]).toFixed(4)
  }

  const result = convert(amount, from, to)
  const reverse = convert(1, to, from)

  const swap = () => { setFrom(to); setTo(from) }

  const popularPairs = [
    ['USD', 'INR'], ['USD', 'EUR'], ['GBP', 'INR'],
    ['EUR', 'INR'], ['USD', 'AED'], ['USD', 'SAR']
  ]

  return (
    <ToolLayout icon="💱" name="Currency Converter" desc="Live exchange rates ke saath 20+ currencies convert karo">

      {loading && <div className={styles.hint}>📡 Live rates load ho rahe hain...</div>}
      {!loading && usingFallback && (
        <div className={styles.hint}>⚠️ Live rates unavailable — approximate rates use ho rahe hain</div>
      )}
      {!loading && !usingFallback && lastUpdated && (
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>✅ Live rates • Updated: {lastUpdated}</div>
      )}

      {/* Amount input */}
      <div className={styles.controlGroup} style={{ marginBottom: 16 }}>
        <label className={styles.controlLabel}>Amount</label>
        <input className={styles.controlInput} type="number" value={amount}
          onChange={e => setAmount(+e.target.value)} min={0} style={{ fontSize: 24, fontWeight: 700 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'end', marginBottom: 20 }}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>From</label>
          <select className={styles.controlSelect} value={from} onChange={e => setFrom(e.target.value)}>
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
          </select>
        </div>
        <button onClick={swap} style={{
          background: 'var(--accent-glow)', border: '2px solid var(--accent)',
          borderRadius: '50%', width: 40, height: 40, cursor: 'pointer',
          fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 2
        }}>⇌</button>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>To</label>
          <select className={styles.controlSelect} value={to} onChange={e => setTo(e.target.value)}>
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Result */}
      <div style={{
        background: 'var(--bg3)', border: '2px solid var(--accent)',
        borderRadius: 'var(--radius-lg)', padding: '24px', textAlign: 'center', marginBottom: 20
      }}>
        <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 8 }}>
          {amount} {from} =
        </div>
        <div style={{ fontSize: 40, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent2)' }}>
          {Number(result).toLocaleString('en-IN', { maximumFractionDigits: 2 })} {to}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>
          1 {to} = {reverse} {from}
        </div>
      </div>

      {/* Quick pairs */}
      <div>
        <div className={styles.fileListTitle}>Popular Pairs</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
          {popularPairs.map(([f, t]) => (
            <button key={f + t} className={styles.copyBtn} style={{ marginTop: 0, textAlign: 'center' }}
              onClick={() => { setFrom(f); setTo(t) }}>
              {f} → {t}
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                1 {f} = {Number(convert(1, f, t)).toFixed(2)} {t}
              </div>
            </button>
          ))}
        </div>
      </div>
    </ToolLayout>
  )
}
