import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PRO_FEATURES, PLAN_THEME, PLANS, savingsVsMonthly } from '../data/proPlans'

const plans = PLANS.map(p => ({ ...p, ...PLAN_THEME[p.id] }))

const faqs = [
  {
    q: 'Do I need a credit card to sign up?',
    a: 'No credit card is required to create an account. You only need to pay when you choose a plan.',
  },
  {
    q: 'Do you have a coupon code?',
    a: 'If you have a coupon or a sales code, enter it on the checkout page. Coupons work with one-time payment.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Yes. If you chose Auto Pay, cancel it any time from Settings → Billing & plan. You keep Pro until the end of the period you have paid for. A one-time payment does not renew, so there is nothing to cancel.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'UPI, credit and debit cards, and net banking — all processed by Razorpay.',
  },
  {
    q: 'What happens after my plan expires?',
    a: 'Your account moves to the free plan. All your invoices, clients and reports stay as they are. You can renew any time to create more invoices.',
  },
  {
    q: 'Is my payment secure?',
    a: 'Yes. All payments are processed through Razorpay, which is PCI-DSS compliant and fully encrypted.',
  },
]

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState(null)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [gstEnabled, setGstEnabled] = useState(false)
  const navigate = useNavigate()
  const { token } = useAuth()

  // Whether GST is added on top of these prices is decided on the server
  useEffect(() => {
    fetch(`${API}/api/payment/plans`).then(r => r.json()).then(d => setGstEnabled(Boolean(d.gstEnabled))).catch(() => {})
  }, [])

  // Choosing a plan opens the checkout page: billing details on the left, order summary on the right
  const handlePlanClick = (planId) => {
    if (!token) {
      try { sessionStorage.setItem('zerofy-after-login', `/checkout?plan=${planId}`) } catch { /* ignore */ }
      setShowAuthPrompt(true)
      return
    }
    navigate(`/checkout?plan=${planId}`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg, #0D1B2E)',
      color: 'var(--text, #f1f5f9)',
      fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
      paddingBottom: 80,
    }}>

      {/* Back Button */}
      <div style={{ padding: "16px 24px 0" }}>
        <button
          onClick={() => window.history.back()}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "7px 16px", borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            color: "#B8B4E0", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}
        >
          ‹ Back
        </button>
      </div>

      {/* Hero */}
      <div style={{
        textAlign: 'center',
        padding: '48px 24px 52px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 320,
          background: 'radial-gradient(ellipse at center, rgba(239,160,47,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-block',
          background: 'rgba(239,160,47,0.1)',
          border: '1px solid rgba(239,160,47,0.25)',
          borderRadius: 100,
          padding: '6px 18px',
          fontSize: 13,
          color: '#F6B24E',
          fontWeight: 600,
          marginBottom: 20,
          letterSpacing: '0.04em',
        }}>
          Zerofy Pro
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display, "Syne", sans-serif)',
          fontSize: 'clamp(32px, 6vw, 54px)',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 16,
          background: 'linear-gradient(135deg, #f1f5f9 0%, #F6B24E 60%, #EFA02F 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Simple pricing for your billing
        </h1>

        <p style={{
          color: 'var(--text2, #94a3b8)',
          fontSize: 17,
          maxWidth: 460,
          margin: '0 auto 28px',
          lineHeight: 1.65,
        }}>
          Start free with 3 invoices. Go Pro for unlimited invoices — pay monthly, or save with the yearly plan.
        </p>

      </div>

      {/* Plans Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        maxWidth: 700,
        margin: '0 auto',
        padding: '0 24px',
      }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              background: plan.soft,
              border: `1px solid ${plan.border}`,
              borderRadius: 20,
              padding: '36px 28px',
              position: 'relative',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: plan.id === 'yearly'
                ? '0 0 40px rgba(239,160,47,0.12)'
                : 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = plan.id === 'yearly'
                ? '0 12px 50px rgba(239,160,47,0.22)'
                : '0 8px 32px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = plan.id === 'yearly'
                ? '0 0 40px rgba(239,160,47,0.12)'
                : 'none'
            }}
          >
            {plan.badge && (
              <div style={{
                position: 'absolute',
                top: -13, left: '50%',
                transform: 'translateX(-50%)',
                background: plan.id === 'yearly'
                  ? 'linear-gradient(135deg, #EFA02F, #F6B24E)'
                  : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                color: '#12263F',
                fontSize: 12, fontWeight: 700,
                padding: '4px 16px',
                borderRadius: 100,
                whiteSpace: 'nowrap',
                letterSpacing: '0.03em',
              }}>
                {plan.badge}
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontFamily: 'var(--font-display, "Syne", sans-serif)',
                fontSize: 22, fontWeight: 800, marginBottom: 6,
              }}>
                {plan.name}
              </div>
              <div style={{ color: 'var(--text2, #94a3b8)', fontSize: 13, lineHeight: 1.5 }}>
                {plan.desc}
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{
                  fontFamily: 'var(--font-display, "Syne", sans-serif)',
                  fontSize: 46, fontWeight: 800, lineHeight: 1,
                }}>
                  ₹{plan.price.toLocaleString('en-IN')}
                </span>
                <span style={{ color: 'var(--text2, #94a3b8)', fontSize: 14 }}>
                  {plan.period}
                </span>
              </div>
              {plan.listPrice > plan.price && (
                <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text2, #94a3b8)' }}>
                  <span style={{ textDecoration: 'line-through' }}>₹{plan.listPrice.toLocaleString('en-IN')}</span>
                  <span style={{ marginLeft: 8, color: '#34D399', fontWeight: 700 }}>Launch offer</span>
                </div>
              )}
              {savingsVsMonthly(plan.id) > 0 && (
                <div style={{
                  display: 'inline-block', marginTop: 10,
                  fontSize: 12, fontWeight: 700, padding: '3px 10px',
                  borderRadius: 100, color: plan.accent,
                  background: `${plan.accent}22`, border: `1px solid ${plan.accent}44`,
                }}>
                  Save {savingsVsMonthly(plan.id)}% vs monthly
                </div>
              )}
            </div>

            <button
              onClick={() => handlePlanClick(plan.id)}
              style={{
                width: '100%',
                padding: '13px 0',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 26,
                transition: 'opacity 0.2s, transform 0.15s',
                background: plan.ctaStyle === 'blue' ? 'rgba(239,160,47,0.15)' : plan.gradient,
                color: plan.ctaStyle === 'blue' ? '#EFA02F' : '#12263F',
                boxShadow: plan.ctaStyle === 'gradient'
                  ? '0 4px 18px rgba(139,127,255,0.35)'
                  : 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'scale(0.98)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
            >
              {plan.cta}
            </button>

            <div style={{
              fontSize: 13, color: plan.accent, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span></span> Unlimited invoices — see below
            </div>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', color: '#64748b', fontSize: 12.5, margin: '18px auto 0', padding: '0 24px' }}>
        {gstEnabled ? 'Prices are before GST. 18% GST is added at checkout, and you get a GST invoice.' : 'You pay exactly the price shown. No extra charges.'}
      </p>

      {/* Shared Pro feature list — one place, no repeats across plans */}
      <div style={{
        maxWidth: 980, margin: '28px auto 0', padding: '0 24px',
      }}>
        <div style={{
          background: 'rgba(52,211,153,0.05)',
          border: '1px solid rgba(52,211,153,0.2)',
          borderRadius: 20, padding: '28px 32px',
        }}>
          <h3 style={{
            fontSize: 15, fontWeight: 700, color: '#34D399',
            margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            Every plan gives you the same Pro access
          </h3>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px 24px',
          }}>
            {PRO_FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text2, #94a3b8)' }}>
                <span style={{ fontSize: 15 }}>{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 36, flexWrap: 'wrap',
        margin: '48px auto 0', padding: '0 24px', maxWidth: 700,
      }}>
        {[
          { icon: '', text: 'Secure payments via Razorpay' },
          { icon: '↩', text: '7-day money-back guarantee' },
          { icon: '🇮🇳', text: 'UPI, Cards & Net Banking accepted' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13 }}>
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 640, margin: '64px auto 0', padding: '0 24px' }}>
        <h2 style={{
          fontFamily: 'var(--font-display, "Syne", sans-serif)',
          fontSize: 28, fontWeight: 800,
          textAlign: 'center', marginBottom: 32,
        }}>
          Frequently Asked Questions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqs.map((faq, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${openFaq === i ? 'rgba(239,160,47,0.3)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 14,
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%', padding: '16px 20px',
                  background: 'none', border: 'none',
                  color: 'var(--text, #f1f5f9)',
                  fontSize: 15, fontWeight: 600,
                  textAlign: 'left', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                }}
              >
                <span>{faq.q}</span>
                <span style={{
                  fontSize: 18, color: '#F6B24E', flexShrink: 0,
                  transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)',
                  transition: 'transform 0.2s',
                }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{
                  padding: '0 20px 16px',
                  color: 'var(--text2, #94a3b8)',
                  fontSize: 14, lineHeight: 1.65,
                }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Auth Prompt Modal */}
      {showAuthPrompt && (
        <>
          <div onClick={() => setShowAuthPrompt(false)} style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)'
          }} />
          <div style={{
            position: 'fixed', inset: 0, zIndex: 2001,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
          }}>
            <div style={{
              background: '#1A1830',
              border: '1px solid rgba(239,160,47,0.4)',
              borderRadius: 20, padding: '36px 28px',
              maxWidth: 380, width: '100%',
              textAlign: 'center',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}></div>
              <h2 style={{
                fontSize: 20, fontWeight: 800, marginBottom: 8,
                background: 'linear-gradient(135deg, #EFA02F, #F6B24E)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>Login to Continue</h2>
              <p style={{ color: '#9A96C0', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
                Please log in or create a free account first. You will come straight back to checkout.
              </p>
              <button
                onClick={() => { setShowAuthPrompt(false); navigate('/') }}
                style={{
                  width: '100%', padding: '13px',
                  borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #EFA02F, #F6B24E)',
                  color: '#12263F', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', marginBottom: 10
                }}
              >
                Login / Register
              </button>
              <button
                onClick={() => setShowAuthPrompt(false)}
                style={{
                  background: 'none', border: 'none', color: '#5A5578',
                  fontSize: 13, cursor: 'pointer'
                }}
              >
                Maybe later
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bottom */}
      <div style={{ textAlign: 'center', marginTop: 56, padding: '0 24px' }}>
        <p style={{ color: '#475569', fontSize: 13, marginBottom: 16 }}>
          Have a question? We are here to help.
        </p>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          color: '#F6B24E', textDecoration: 'none',
          fontSize: 14, fontWeight: 600,
          border: '1px solid rgba(239,160,47,0.3)',
          borderRadius: 100, padding: '10px 22px',
          transition: 'background 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,160,47,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}
