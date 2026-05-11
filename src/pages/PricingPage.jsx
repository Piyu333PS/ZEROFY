import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const plans = [
  {
    id: 'monthly',
    name: 'Monthly',
    emoji: '⚡',
    price: 49,
    period: '/month',
    desc: 'Billed every month. Cancel anytime.',
    color: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.25)',
    badge: null,
    features: [
      'Unlimited invoice generation',
      'All tools unlocked',
      'Unlimited file processing',
      'Max 100MB file size',
      'No watermarks',
      'Priority support',
    ],
    cta: 'Get Started',
    ctaStyle: 'blue',
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    emoji: '🔥',
    price: 129,
    period: '/3 months',
    desc: 'Save vs monthly. Billed every 3 months.',
    color: 'linear-gradient(135deg, rgba(96,165,250,0.12) 0%, rgba(167,139,250,0.14) 100%)',
    border: 'rgba(167,139,250,0.5)',
    badge: '🔥 Most Popular',
    features: [
      'Unlimited invoice generation',
      'All tools unlocked',
      'Unlimited file processing',
      'Max 100MB file size',
      'No watermarks',
      'Priority support',
    ],
    cta: 'Get Started',
    ctaStyle: 'gradient',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    emoji: '💰',
    price: 399,
    period: '/year',
    desc: 'Best value. Save over 30% vs monthly.',
    color: 'rgba(251,191,36,0.07)',
    border: 'rgba(251,191,36,0.3)',
    badge: '💰 Best Value',
    features: [
      'Unlimited invoice generation',
      'All tools unlocked',
      'Unlimited file processing',
      'Max 100MB file size',
      'No watermarks',
      'Priority support',
    ],
    cta: 'Get Started',
    ctaStyle: 'gold',
  },
]

const faqs = [
  {
    q: 'Do I need a credit card to sign up?',
    a: 'No credit card is required to create an account. You only need to pay when you choose a plan.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Yes, absolutely. You can cancel at any time with no questions asked and no hidden fees.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept UPI, Credit/Debit Cards, Net Banking, and Paytm — all powered by Razorpay.',
  },
  {
    q: 'What happens after my plan expires?',
    a: 'After your plan expires, your account moves to the free tier. You can renew anytime to restore full access.',
  },
  {
    q: 'Is my payment secure?',
    a: 'Yes. All payments are processed through Razorpay, which is PCI-DSS compliant and fully encrypted.',
  },
]

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Razorpay script ek baar load karo
const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve()
  const s = document.createElement('script')
  s.src = 'https://checkout.razorpay.com/v1/checkout.js'
  s.onload = resolve
  s.onerror = () => reject(new Error('Failed to load payment gateway'))
  document.head.appendChild(s)
})

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState(null)
  const [payLoading, setPayLoading] = useState(null)
  const [payError, setPayError] = useState('')
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [pendingPlan, setPendingPlan] = useState(null)
  const [autoPayEnabled, setAutoPayEnabled] = useState(true) // 🆕 Auto Pay toggle
  const navigate = useNavigate()
  const { token, user } = useAuth()

  const handlePlanClick = async (planId) => {
    if (!token) {
      setPendingPlan(planId)
      setShowAuthPrompt(true)
      return
    }
    if (autoPayEnabled) {
      await startAutoPayment(planId)
    } else {
      await startPayment(planId)
    }
  }

  // ─── Manual (one-time) payment — purana code same ───────────────
  const startPayment = async (planId) => {
    setPayLoading(planId)
    setPayError('')
    try {
      const orderRes = await fetch(`${API}/api/payment/create-order`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order')

      await loadRazorpay()

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Zerofy Pro',
        description: orderData.planName,
        order_id: orderData.orderId,
        theme: { color: '#8B7FFF' },
        handler: async (response) => {
          const verifyRes = await fetch(`${API}/api/payment/verify`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId,
            })
          })
          const verifyData = await verifyRes.json()
          if (verifyRes.ok && verifyData.success) {
            alert('🎉 ' + verifyData.message)
            navigate('/')
          } else {
            setPayError('Payment verification failed. Please contact support.')
          }
          setPayLoading(null)
        },
        modal: { ondismiss: () => setPayLoading(null) }
      })
      rzp.on('payment.failed', (r) => {
        setPayError(r.error?.description || 'Payment fail ho gayi.')
        setPayLoading(null)
      })
      rzp.open()
    } catch (err) {
      setPayError(err.message || 'Something went wrong. Please try again.')
      setPayLoading(null)
    }
  }

  // ─── 🆕 Auto Pay (subscription) payment ─────────────────────────
  const startAutoPayment = async (planId) => {
    setPayLoading(planId)
    setPayError('')
    try {
      // 1. Subscription create karo backend pe
      const subRes = await fetch(`${API}/api/payment/create-subscription`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })
      const subData = await subRes.json()
      if (!subRes.ok) throw new Error(subData.error || 'Subscription create nahi hua')

      await loadRazorpay()

      // 2. Razorpay subscription checkout kholo
      const rzp = new window.Razorpay({
        key: subData.keyId,
        subscription_id: subData.subscriptionId,  // order_id ki jagah subscription_id
        name: 'Zerofy Pro',
        description: `${subData.planName} — Auto Pay`,
        theme: { color: '#8B7FFF' },
        handler: async (response) => {
          // 3. Pehli payment verify karo
          const verifyRes = await fetch(`${API}/api/payment/verify-subscription`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
            })
          })
          const verifyData = await verifyRes.json()
          if (verifyRes.ok && verifyData.success) {
            alert('🎉 ' + verifyData.message)
            navigate('/')
          } else {
            setPayError('Subscription verification failed. Please contact support.')
          }
          setPayLoading(null)
        },
        modal: { ondismiss: () => setPayLoading(null) }
      })
      rzp.on('payment.failed', (r) => {
        setPayError(r.error?.description || 'Payment fail ho gayi.')
        setPayLoading(null)
      })
      rzp.open()
    } catch (err) {
      setPayError(err.message || 'Something went wrong. Please try again.')
      setPayLoading(null)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg, #0f1117)',
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
          background: 'radial-gradient(ellipse at center, rgba(167,139,250,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-block',
          background: 'rgba(167,139,250,0.1)',
          border: '1px solid rgba(167,139,250,0.25)',
          borderRadius: 100,
          padding: '6px 18px',
          fontSize: 13,
          color: '#A78BFA',
          fontWeight: 600,
          marginBottom: 20,
          letterSpacing: '0.04em',
        }}>
          ⚡ Zerofy Pro
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display, "Syne", sans-serif)',
          fontSize: 'clamp(32px, 6vw, 54px)',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 16,
          background: 'linear-gradient(135deg, #f1f5f9 0%, #A78BFA 60%, #60A5FA 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Simple, Honest Pricing
        </h1>

        <p style={{
          color: 'var(--text2, #94a3b8)',
          fontSize: 17,
          maxWidth: 460,
          margin: '0 auto 28px',
          lineHeight: 1.65,
        }}>
          One Pro plan. Three flexible billing options. No hidden fees, no surprises.
        </p>

        {/* 🆕 Auto Pay Toggle */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 100, padding: '8px 20px',
        }}>
          <span style={{ fontSize: 13, color: autoPayEnabled ? 'var(--text2)' : '#f1f5f9', fontWeight: autoPayEnabled ? 400 : 600 }}>
            One-time
          </span>

          {/* Toggle switch */}
          <div
            onClick={() => setAutoPayEnabled(!autoPayEnabled)}
            style={{
              width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
              background: autoPayEnabled ? '#8B7FFF' : 'rgba(255,255,255,0.15)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute', top: 3,
              left: autoPayEnabled ? 23 : 3,
              width: 18, height: 18, borderRadius: '50%',
              background: '#fff', transition: 'left 0.2s',
            }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: autoPayEnabled ? '#f1f5f9' : 'var(--text2)', fontWeight: autoPayEnabled ? 600 : 400 }}>
              Auto Pay
            </span>
            {autoPayEnabled && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px',
                borderRadius: 100, background: 'rgba(52,211,153,0.15)',
                color: '#34D399', border: '1px solid rgba(52,211,153,0.3)',
              }}>
                Recommended
              </span>
            )}
          </div>
        </div>

        {/* Auto Pay info */}
        {autoPayEnabled && (
          <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
            🔄 Automatically renews — cancel anytime from billing page
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        maxWidth: 980,
        margin: '0 auto',
        padding: '0 24px',
      }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              background: plan.color,
              border: `1px solid ${plan.border}`,
              borderRadius: 20,
              padding: '36px 28px',
              position: 'relative',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: plan.id === 'quarterly'
                ? '0 0 40px rgba(167,139,250,0.12)'
                : 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = plan.id === 'quarterly'
                ? '0 12px 50px rgba(167,139,250,0.22)'
                : '0 8px 32px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = plan.id === 'quarterly'
                ? '0 0 40px rgba(167,139,250,0.12)'
                : 'none'
            }}
          >
            {plan.badge && (
              <div style={{
                position: 'absolute',
                top: -13, left: '50%',
                transform: 'translateX(-50%)',
                background: plan.id === 'quarterly'
                  ? 'linear-gradient(135deg, #60A5FA, #A78BFA)'
                  : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                color: '#fff',
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
              <div style={{ fontSize: 34, marginBottom: 10 }}>{plan.emoji}</div>
              <div style={{
                fontFamily: 'var(--font-display, "Syne", sans-serif)',
                fontSize: 22, fontWeight: 800, marginBottom: 6,
              }}>
                {plan.name}
              </div>
              <div style={{ color: 'var(--text2, #94a3b8)', fontSize: 13, lineHeight: 1.5 }}>
                {autoPayEnabled ? `Auto renews every ${plan.period.replace('/', '')}` : plan.desc}
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{
                  fontFamily: 'var(--font-display, "Syne", sans-serif)',
                  fontSize: 46, fontWeight: 800, lineHeight: 1,
                }}>
                  ₹{plan.price}
                </span>
                <span style={{ color: 'var(--text2, #94a3b8)', fontSize: 14 }}>
                  {plan.period}
                </span>
              </div>
            </div>

            <button
              onClick={() => handlePlanClick(plan.id)}
              disabled={payLoading === plan.id}
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
                background: plan.ctaStyle === 'gradient'
                  ? 'linear-gradient(135deg, #60A5FA, #A78BFA)'
                  : plan.ctaStyle === 'gold'
                    ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'
                    : 'rgba(96,165,250,0.15)',
                color: plan.ctaStyle === 'blue' ? '#60A5FA' : '#fff',
                boxShadow: plan.ctaStyle === 'gradient'
                  ? '0 4px 18px rgba(139,127,255,0.35)'
                  : 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'scale(0.98)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
            >
              {payLoading === plan.id
                ? '⏳ Processing...'
                : autoPayEnabled ? `🔄 Start Auto Pay` : plan.cta}
            </button>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {plan.features.map((f, i) => (
                <li key={i} style={{
                  fontSize: 14,
                  color: 'var(--text2, #94a3b8)',
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    background: plan.id === 'quarterly'
                      ? 'rgba(167,139,250,0.2)'
                      : plan.id === 'yearly'
                        ? 'rgba(251,191,36,0.15)'
                        : 'rgba(96,165,250,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: plan.id === 'quarterly' ? '#A78BFA' : plan.id === 'yearly' ? '#fbbf24' : '#60A5FA',
                    fontWeight: 700,
                  }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Trust strip */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 36, flexWrap: 'wrap',
        margin: '48px auto 0', padding: '0 24px', maxWidth: 700,
      }}>
        {[
          { icon: '🔒', text: 'Secure payments via Razorpay' },
          { icon: '↩️', text: 'Cancel anytime' },
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
                border: `1px solid ${openFaq === i ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.07)'}`,
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
                  fontSize: 18, color: '#A78BFA', flexShrink: 0,
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

      {/* Payment Error */}
      {payError && (
        <div style={{ maxWidth: 500, margin: '24px auto 0', padding: '0 24px' }}>
          <div style={{
            padding: '12px 16px', borderRadius: 10, fontSize: 13,
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171',
          }}>
            ⚠️ {payError}
          </div>
        </div>
      )}

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
              border: '1px solid rgba(167,139,250,0.4)',
              borderRadius: 20, padding: '36px 28px',
              maxWidth: 380, width: '100%',
              textAlign: 'center',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>👤</div>
              <h2 style={{
                fontSize: 20, fontWeight: 800, marginBottom: 8,
                background: 'linear-gradient(135deg, #60A5FA, #A78BFA)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>Login to Continue</h2>
              <p style={{ color: '#9A96C0', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
                Please log in to proceed with payment. Select your plan after logging in.
              </p>
              <button
                onClick={() => { setShowAuthPrompt(false); navigate('/') }}
                style={{
                  width: '100%', padding: '13px',
                  borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #60A5FA, #A78BFA)',
                  color: '#fff', fontSize: 15, fontWeight: 700,
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
                Baad mein karta hoon
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
          color: '#A78BFA', textDecoration: 'none',
          fontSize: 14, fontWeight: 600,
          border: '1px solid rgba(167,139,250,0.3)',
          borderRadius: 100, padding: '10px 22px',
          transition: 'background 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(167,139,250,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          ← Back to Tools
        </Link>
      </div>
    </div>
  )
}
