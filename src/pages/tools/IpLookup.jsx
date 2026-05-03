import { useState, useEffect } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

export default function IpLookup() {
  const [ip, setIp] = useState('')
  const [result, setResult] = useState(null)
  const [myIp, setMyIp] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => setMyIp(d.ip))
      .catch(() => {})
  }, [])

  const lookup = async (lookupIp) => {
    const target = (lookupIp || ip || '').trim()
    if (!target) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`https://ipapi.co/${target}/json/`)
      const data = await res.json()
      if (data.error) throw new Error(data.reason || 'Invalid IP')
      setResult(data)
    } catch (e) {
      setError('❌ ' + (e.message || 'Lookup failed'))
    }
    setLoading(false)
  }

  const fields = result ? [
    { label: 'IP Address', value: result.ip, icon: '🌐' },
    { label: 'Country', value: `${result.country_name} ${result.country_code}`, icon: '🏳️' },
    { label: 'Region', value: result.region, icon: '📍' },
    { label: 'City', value: result.city, icon: '🏙️' },
    { label: 'Postal Code', value: result.postal, icon: '📮' },
    { label: 'Timezone', value: result.timezone, icon: '🕐' },
    { label: 'ISP / Org', value: result.org, icon: '🏢' },
    { label: 'ASN', value: result.asn, icon: '🔌' },
    { label: 'Latitude', value: result.latitude, icon: '📐' },
    { label: 'Longitude', value: result.longitude, icon: '📐' },
    { label: 'Currency', value: result.currency_name, icon: '💰' },
    { label: 'Calling Code', value: '+' + result.country_calling_code, icon: '📞' },
  ].filter(f => f.value) : []

  return (
    <ToolLayout icon="🌐" name="IP Lookup" desc="Look up location and ISP details of any IP address">

      {myIp && (
        <div className={styles.hint} style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🖥️ Tumhara IP: <strong style={{ color: 'var(--accent2)' }}>{myIp}</strong></span>
          <button className={styles.copyBtn} style={{ marginTop: 0 }} onClick={() => lookup(myIp)}>
            Look Up My IP
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input className={styles.controlInput} style={{ flex: 1 }}
          value={ip} onChange={e => setIp(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && lookup()}
          placeholder="Enter an IP address (e.g. 8.8.8.8) or leave blank to check your own IP" />
        <button className={styles.actionBtn} style={{ width: 'auto', padding: '0 24px', marginTop: 0 }}
          onClick={() => lookup()} disabled={loading}>
          {loading ? <span className={styles.spinner} /> : '🔍'}
        </button>
      </div>

      {error && <div style={{ color: '#ff4d4d', marginBottom: 12, fontSize: 14 }}>{error}</div>}

      {result && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
            {fields.map((f, i) => (
              <div key={i} style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '12px 16px',
                display: 'flex', gap: 10, alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: 20 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>{f.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{f.value}</div>
                </div>
              </div>
            ))}
          </div>

          {result.latitude && result.longitude && (
            <a href={`https://www.openstreetmap.org/?mlat=${result.latitude}&mlon=${result.longitude}&zoom=10`}
              target="_blank" rel="noopener noreferrer">
              <button className={styles.actionBtn} style={{ marginTop: 16 }}>
                🗺️ Map pe dekho
              </button>
            </a>
          )}
        </>
      )}

      <div style={{ marginTop: 20 }}>
        <div className={styles.fileListTitle}>Common IPs to try</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['8.8.8.8 (Google)', '1.1.1.1 (Cloudflare)', '208.67.222.222 (OpenDNS)'].map(s => {
            const ipOnly = s.split(' ')[0]
            return (
              <button key={ipOnly} className={styles.copyBtn} style={{ marginTop: 0 }}
                onClick={() => { setIp(ipOnly); lookup(ipOnly) }}>
                {s}
              </button>
            )
          })}
        </div>
      </div>
    </ToolLayout>
  )
}
