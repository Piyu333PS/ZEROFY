import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const PLAN_LABELS = {
  monthly: { name: 'Pro Monthly', period: '1 Month', color: '#60A5FA' },
  quarterly: { name: 'Pro Quarterly', period: '3 Months', color: '#A78BFA' },
  yearly: { name: 'Pro Yearly', period: '1 Year', color: '#fbbf24' },
}

export default function BillingPage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { navigate('/'); return }
    fetch(`${API}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { setInfo(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  if (!user) { navigate('/'); return null }

  const planInfo = info?.lastPlanId ? PLAN_LABELS[info.lastPlanId] : null

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const daysLeft = (expiry) => {
    if (!expiry) return 0
    const diff = new Date(expiry) - new Date()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const cardStyle = {
    background: 'var(--bg2, #1a1a2e)',
    border: '1px solid var(--border2, rgba(255,255,255,0.08))',
    borderRadius: 16, padding: '28px 24px', marginBottom: 20
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #0f1117)', padding: '48px 24px 80px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 14, marginBottom: 16, padding: 0 }}>
            ← Back
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)', margin: 0 }}>💳 Billing & Plan</h1>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text2)', padding: 40 }}>Loading...</div>
        ) : (
          <>
            {/* Current Plan */}
            <div style={{
              ...cardStyle,
              border: info?.isPro
                ? `1px solid ${planInfo?.color || 'rgba(167,139,250,0.4)'}44`
                : '1px solid var(--border2)',
              background: info?.isPro
                ? 'linear-gradient(135deg, rgba(96,165,250,0.06), rgba(167,139,250,0.08))'
                : 'var(--bg2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Current Plan
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                    {info?.isPro ? (planInfo?.name || 'Zerofy Pro') : 'Free Plan'}
                  </div>
                  {info?.isPro && planInfo && (
                    <div style={{ fontSize: 13, color: planInfo.color, marginTop: 4, fontWeight: 600 }}>
                      {planInfo.period} Plan
                    </div>
                  )}
                </div>
                <div style={{
                  padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                  background: info?.isPro ? 'rgba(251,191,36,0.12)' : 'rgba(148,163,184,0.1)',
                  color: info?.isPro ? '#fbbf24' : 'var(--text3)',
                  border: `1px solid ${info?.isPro ? 'rgba(251,191,36,0.3)' : 'rgba(148,163,184,0.2)'}`,
                }}>
                  {info?.isPro ? '✦ Active' : 'Free'}
                </div>
              </div>

              {info?.isPro && info?.proExpiry && (
                <div style={{ marginTop: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 16px', flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Expires On</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{formatDate(info.proExpiry)}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 16px', flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Days Left</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: daysLeft(info.proExpiry) <= 7 ? '#F87171' : '#34D399' }}>
                      {daysLeft(info.proExpiry)} days
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Usage Stats */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16, marginTop: 0 }}>📊 Usage</h2>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[
                  { label: 'Invoices Generated', value: info?.invoiceCount || 0, limit: info?.isPro ? '∞' : '3', icon: '🧾' },
                  { label: 'Member Since', value: formatDate(info?.createdAt), icon: '📅', full: true },
                ].map((stat, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                    padding: '14px 16px', flex: stat.full ? '1 1 100%' : '1 1 140px'
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>{stat.icon} {stat.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                      {stat.value}
                      {stat.limit && <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}> / {stat.limit}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Features */}
            {info?.isPro ? (
              <div style={{ ...cardStyle, borderColor: 'rgba(52,211,153,0.2)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#34D399', marginBottom: 14, marginTop: 0 }}>✅ Pro Benefits Active</h2>
                {[
                  'Unlimited invoice generation',
                  'All tools unlocked',
                  'Unlimited file processing',
                  'Max 100MB file size',
                  'No watermarks',
                  'Priority support',
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ color: '#34D399', fontSize: 14 }}>✓</span>
                    <span style={{ fontSize: 14, color: 'var(--text2)' }}>{f}</span>
                  </div>
                ))}
                <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(52,211,153,0.06)', borderRadius: 10, fontSize: 13, color: 'var(--text3)' }}>
                  {daysLeft(info?.proExpiry) <= 7 && daysLeft(info?.proExpiry) > 0 ? (
                    <span style={{ color: '#F87171' }}>⚠️ Plan {daysLeft(info?.proExpiry)} days left until expiry! <Link to="/pricing" style={{ color: '#60A5FA' }}>Renew Now →</Link></span>
                  ) : (
                    <span>Plan renew karne ke liye <Link to="/pricing" style={{ color: '#60A5FA' }}>Pricing page pe jao →</Link></span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ ...cardStyle, borderColor: 'rgba(167,139,250,0.25)', background: 'linear-gradient(135deg, rgba(96,165,250,0.04), rgba(167,139,250,0.06))' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8, marginTop: 0 }}>⚡ Upgrade to Pro</h2>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.6 }}>
                  Unlimited invoices, all tools unlocked, no limits — starting at just ₹19/month.
                </p>
                <Link to="/pricing" style={{
                  display: 'inline-block', padding: '11px 28px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #60A5FA, #A78BFA)',
                  color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none',
                  boxShadow: '0 4px 18px rgba(139,127,255,0.3)'
                }}>
                  ⚡ View Plans →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
