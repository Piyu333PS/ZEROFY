import { useState } from 'react'
import { Link } from 'react-router-dom'

const plans = [
  {
    id: 'free',
    name: 'Free',
    emoji: '🆓',
    price: { monthly: 0, yearly: 0 },
    desc: 'Shuruaat ke liye bilkul sahi',
    color: 'rgba(148,163,184,0.15)',
    border: 'rgba(148,163,184,0.2)',
    badge: null,
    features: [
      '✅ Sabhi basic tools',
      '✅ 5 files per day',
      '✅ Max 10MB file size',
      '✅ Standard processing speed',
      '❌ No watermark removal',
      '❌ No batch processing',
      '❌ No priority support',
    ],
    cta: 'Abhi Use Karo',
    ctaStyle: 'outline',
  },
  {
    id: 'pro',
    name: 'Pro',
    emoji: '⚡',
    price: { monthly: 199, yearly: 149 },
    desc: 'Power users ke liye',
    color: 'linear-gradient(135deg, rgba(96,165,250,0.15) 0%, rgba(167,139,250,0.15) 100%)',
    border: 'rgba(167,139,250,0.5)',
    badge: '🔥 Most Popular',
    features: [
      '✅ Sabhi tools unlocked',
      '✅ Unlimited files',
      '✅ Max 100MB file size',
      '✅ 5x faster processing',
      '✅ No watermarks',
      '✅ Batch processing',
      '✅ Priority support',
    ],
    cta: 'Pro Shuru Karo',
    ctaStyle: 'gradient',
  },
  {
    id: 'team',
    name: 'Team',
    emoji: '👥',
    price: { monthly: 499, yearly: 399 },
    desc: 'Teams aur businesses ke liye',
    color: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.3)',
    badge: null,
    features: [
      '✅ Sab kuch Pro mein',
      '✅ 5 team members',
      '✅ Max 500MB file size',
      '✅ API access',
      '✅ Custom branding',
      '✅ Dedicated support',
      '✅ Usage analytics',
    ],
    cta: 'Team Plan Lo',
    ctaStyle: 'gold',
  },
]

const faqs = [
  {
    q: 'Kya free plan mein credit card chahiye?',
    a: 'Bilkul nahi! Free plan ke liye koi payment info nahi chahiye. Bas sign up karo aur use karo.',
  },
  {
    q: 'Kya main kabhi bhi cancel kar sakta hoon?',
    a: 'Haan, aap kisi bhi waqt cancel kar sakte ho. Koi hidden charges nahi hain.',
  },
  {
    q: 'Payment ke kaunse methods accept hote hain?',
    a: 'Hum UPI, Credit/Debit Card, Net Banking aur Paytm accept karte hain — Razorpay ke through.',
  },
  {
    q: 'Yearly plan mein kitni savings hogi?',
    a: 'Yearly plan mein aapko approximately 25% discount milta hai monthly plan ke mukable mein.',
  },
]

export default function PricingPage() {
  const [billing, setBilling] = useState('monthly')
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg, #0f1117)',
      color: 'var(--text, #f1f5f9)',
      fontFamily: 'var(--font-body, "DM Sans", sans-serif)',
      paddingBottom: 80,
    }}>

      {/* Hero */}
      <div style={{
        textAlign: 'center',
        padding: '64px 24px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 300,
          background: 'radial-gradient(ellipse at center, rgba(167,139,250,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-block',
          background: 'rgba(167,139,250,0.12)',
          border: '1px solid rgba(167,139,250,0.3)',
          borderRadius: 100,
          padding: '6px 18px',
          fontSize: 13,
          color: '#A78BFA',
          fontWeight: 600,
          marginBottom: 20,
          letterSpacing: '0.03em',
        }}>
          ⚡ Zerofy Pricing
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display, "Syne", sans-serif)',
          fontSize: 'clamp(32px, 6vw, 56px)',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: 16,
          background: 'linear-gradient(135deg, #f1f5f9 0%, #A78BFA 60%, #60A5FA 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Simple, Transparent Pricing
        </h1>

        <p style={{
          color: 'var(--text2, #94a3b8)',
          fontSize: 17,
          maxWidth: 480,
          margin: '0 auto 36px',
          lineHeight: 1.6,
        }}>
          Free se shuru karo, zaroorat hone par upgrade karo. Koi surprise charges nahi.
        </p>

        {/* Billing Toggle */}
        <div style={{
          display: 'inline-flex',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 100,
          padding: 4,
          gap: 4,
          position: 'relative',
        }}>
          {['monthly', 'yearly'].map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              style={{
                padding: '8px 22px',
                borderRadius: 100,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.2s',
                background: billing === b
                  ? 'linear-gradient(135deg, #60A5FA, #A78BFA)'
                  : 'transparent',
                color: billing === b ? '#fff' : 'var(--text2, #94a3b8)',
              }}
            >
              {b === 'monthly' ? 'Monthly' : 'Yearly'}
              {b === 'yearly' && (
                <span style={{
                  marginLeft: 6,
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 100,
                  padding: '2px 7px',
                  fontSize: 11,
                  fontWeight: 700,
                }}>
                  -25%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        maxWidth: 1000,
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
              padding: '32px 28px',
              position: 'relative',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: plan.id === 'pro'
                ? '0 0 40px rgba(167,139,250,0.15)'
                : 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = plan.id === 'pro'
                ? '0 8px 50px rgba(167,139,250,0.25)'
                : '0 8px 30px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = plan.id === 'pro'
                ? '0 0 40px rgba(167,139,250,0.15)'
                : 'none'
            }}
          >
            {/* Badge */}
            {plan.badge && (
              <div style={{
                position: 'absolute',
                top: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #60A5FA, #A78BFA)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 16px',
                borderRadius: 100,
                whiteSpace: 'nowrap',
                letterSpacing: '0.03em',
              }}>
                {plan.badge}
              </div>
            )}

            {/* Plan header */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{plan.emoji}</div>
              <div style={{
                fontFamily: 'var(--font-display, "Syne", sans-serif)',
                fontSize: 22,
                fontWeight: 800,
                marginBottom: 4,
              }}>
                {plan.name}
              </div>
              <div style={{ color: 'var(--text2, #94a3b8)', fontSize: 13 }}>{plan.desc}</div>
            </div>

            {/* Price */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{
                  fontFamily: 'var(--font-display, "Syne", sans-serif)',
                  fontSize: 42,
                  fontWeight: 800,
                  lineHeight: 1,
                }}>
                  {plan.price[billing] === 0 ? 'Free' : `₹${plan.price[billing]}`}
                </span>
                {plan.price[billing] > 0 && (
                  <span style={{ color: 'var(--text2, #94a3b8)', fontSize: 14 }}>
                    /{billing === 'monthly' ? 'mo' : 'mo'}
                  </span>
                )}
              </div>
              {plan.price[billing] > 0 && billing === 'yearly' && (
                <div style={{ color: '#A78BFA', fontSize: 12, marginTop: 4, fontWeight: 500 }}>
                  Billed yearly · ₹{plan.price[billing] * 12}/yr
                </div>
              )}
            </div>

            {/* CTA Button */}
            <button
              style={{
                width: '100%',
                padding: '13px 0',
                borderRadius: 12,
                border: plan.ctaStyle === 'outline'
                  ? '1px solid rgba(255,255,255,0.15)'
                  : 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 24,
                transition: 'opacity 0.2s, transform 0.15s',
                background: plan.ctaStyle === 'gradient'
                  ? 'linear-gradient(135deg, #60A5FA, #A78BFA)'
                  : plan.ctaStyle === 'gold'
                    ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'
                    : 'rgba(255,255,255,0.07)',
                color: plan.ctaStyle === 'outline' ? 'var(--text2, #94a3b8)' : '#fff',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'scale(0.98)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)' }}
            >
              {plan.cta}
            </button>

            {/* Features */}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plan.features.map((f, i) => (
                <li key={i} style={{
                  fontSize: 14,
                  color: f.startsWith('❌') ? 'var(--text3, #475569)' : 'var(--text2, #94a3b8)',
                  lineHeight: 1.4,
                }}>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div style={{ maxWidth: 640, margin: '64px auto 0', padding: '0 24px' }}>
        <h2 style={{
          fontFamily: 'var(--font-display, "Syne", sans-serif)',
          fontSize: 28,
          fontWeight: 800,
          textAlign: 'center',
          marginBottom: 32,
        }}>
          Aksar Pooche Jaane Wale Sawaal
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
                overflow: 'hidden',
                transition: 'border-color 0.2s',
                borderColor: openFaq === i ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.07)',
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text, #f1f5f9)',
                  fontSize: 15,
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span>{faq.q}</span>
                <span style={{
                  fontSize: 18,
                  color: '#A78BFA',
                  flexShrink: 0,
                  transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)',
                  transition: 'transform 0.2s',
                }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{
                  padding: '0 20px 16px',
                  color: 'var(--text2, #94a3b8)',
                  fontSize: 14,
                  lineHeight: 1.6,
                }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        textAlign: 'center',
        marginTop: 64,
        padding: '0 24px',
      }}>
        <p style={{ color: 'var(--text2, #94a3b8)', fontSize: 14, marginBottom: 16 }}>
          Koi sawaal hai? Hum yahan hain!
        </p>
        <Link to="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          color: '#A78BFA',
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 600,
          border: '1px solid rgba(167,139,250,0.3)',
          borderRadius: 100,
          padding: '10px 22px',
          transition: 'background 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(167,139,250,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          ← Wapas Tools Par Jao
        </Link>
      </div>
    </div>
  )
}
