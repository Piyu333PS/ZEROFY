import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthModal from '../../components/AuthModal'
import { GOODS_HSN, UQC_CODES, SERVICES_SAC, CURRENCIES, TEMPLATES } from '../../data/invoiceCodes'
import { CSS } from '../../data/invoiceMakerStyles'
import { InvoicePreview } from '../../components/invoice/InvoicePreview'
import { openPrintWindow, shareViaWhatsApp as shareInvoiceViaWhatsApp, shareViaEmail as shareInvoiceViaEmail } from '../../utils/invoiceShare'

/* ─── Utilities ──────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 9)
const today = () => new Date().toISOString().slice(0, 10)
// ─── Cloud API Helpers ────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const apiFetch = (path, token, options = {}) =>
  fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  }).then(r => r.json())

// Businesses
const fetchBusinesses = (token) =>
  apiFetch('/api/invoices/businesses', token).then(d => d.businesses || []).catch(() => [])

const saveBusinesses = (businesses, token) =>
  apiFetch('/api/invoices/businesses', token, { method: 'PUT', body: { businesses } }).catch(() => {})

// Invoices
const fetchInvoices = (token) =>
  apiFetch('/api/invoices', token).then(d => d.invoices || []).catch(() => [])

const saveInvoice = (invoice, token) =>
  apiFetch('/api/invoices', token, { method: 'POST', body: invoice }).catch(() => {})

const updateInvoice = (id, data, token) =>
  apiFetch(`/api/invoices/${id}`, token, { method: 'PUT', body: data }).catch(() => {})

const deleteInvoice = (id, token) =>
  apiFetch(`/api/invoices/${id}`, token, { method: 'DELETE' }).catch(() => {})
const fmt = (n, sym = '₹') => `${sym}${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/* ─── GST Data ───────────────────────────────────────────────── */
const GST_RATES = [0, 0.1, 0.25, 1.5, 3, 5, 7.5, 12, 18, 28]


const defaultItem = () => ({ id: uid(), type: 'goods', hsnSac: '', desc: ``, qty: '', uqc: 'PCS', rate: '', gstRate: 18 })

function useCSS() {
  useEffect(() => {
    const id = 'ig-styles-v2'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = CSS
      document.head.appendChild(s)
    }
  }, [])
}

/* ─── HSN/SAC Picker ─────────────────────────────────────────── */
function CodePicker({ type, value, onSelect }) {
  const [q, setQ] = useState(value || '')
  const [open, setOpen] = useState(false)
  const list = type === 'goods' ? GOODS_HSN : SERVICES_SAC
  const key = type === 'goods' ? 'hsn' : 'sac'

  const filtered = useCallback(() => {
    const trim = q.trim()
    if (!trim) return list.slice(0, 50)
    const lq = trim.toLowerCase()
    const results = []
    for (let i = 0; i < list.length; i++) {
      const item = list[i]
      // HSN/SAC code match (starts with) — highest priority
      if (item[key].startsWith(trim)) { results.unshift(item); continue }
      // HSN/SAC code contains
      if (item[key].includes(trim)) { results.push(item); continue }
      // Description match
      if (item.desc.toLowerCase().includes(lq)) { results.push(item) }
      if (results.length >= 80) break
    }
    return results.slice(0, 80)
  }, [q, list, key])()

  const label = type === 'goods' ? 'HSN' : 'SAC'

  return (
    <div className="code-search">
      <input
        className="inp"
        value={q}
        placeholder={`Search ${label} code or name…`}
        onChange={e => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
      />
      {open && (
        <div className="code-drop">
          {!q.trim() && (
            <div style={{ padding: '6px 12px', fontSize: 10, color: '#7A75A0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              Type HSN/SAC code or item name to search ({list.length.toLocaleString()} entries)
            </div>
          )}
          {filtered.length === 0
            ? <div className="code-opt" style={{ color: 'var(--text3)', cursor: 'default' }}>No results found for "{q}"</div>
            : filtered.map(i => (
              <div key={i[key] + i.desc} className="code-opt" onMouseDown={() => { onSelect(i); setQ(i[key]); setOpen(false) }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="code-opt-code">{label}: {i[key]}</div>
                  <div className="code-opt-main">{i.desc}</div>
                </div>
                <div className="code-badge" style={{ marginLeft: 8, flexShrink: 0 }}>{i.gst}%</div>
              </div>
            ))
          }
          {filtered.length >= 80 && (
            <div style={{ padding: '6px 12px', fontSize: 10, color: '#7A75A0', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              Type more to narrow results…
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Business Modal ─────────────────────────────────────────── */
function BizModal({ businesses, onSave, onClose }) {
  const empty = { name: '', email: '', phone: '', altPhone: '', altEmail: '', gst: '', addr: '', prefix: 'INV' }
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-h">
          <div className="modal-title">🏢 Business Profiles</div>
          <button className="btn btn-icon btn-ghost" onClick={onClose} style={{ fontSize: 18 }}>×</button>
        </div>
        {!editing && (
          <>
            {businesses.map(b => (
              <div key={b.id} className="saved-item" style={{ marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{b.email}{b.gst ? ` · GSTIN: ${b.gst}` : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm" onClick={() => { setEditing(b.id); setForm({ ...b }) }}>Edit</button>
                  <button className="btn btn-sm" style={{ color: 'var(--red)', borderColor: 'rgba(248,113,113,0.25)', background: 'rgba(248,113,113,0.08)' }}
                    onClick={() => { if (window.confirm('Delete?')) onSave(null, b.id) }}>Del</button>
                </div>
              </div>
            ))}
            <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              onClick={() => { setEditing('new'); setForm(empty) }}>+ Add New Business</button>
          </>
        )}
        {editing && (
          <div style={{ animation: 'slideUp 0.2s ease' }}>
            <div className="sec-label"><span className="sec-dot" />{editing === 'new' ? 'New Business' : 'Edit Business'}</div>
            <div className="grid-2">
              <div className="field"><label className="lbl">Business Name *</label><input className="inp" value={form.name} onChange={set('name')} placeholder="My Company Pvt Ltd" /></div>
              <div className="field"><label className="lbl">Email</label><input className="inp" value={form.email} onChange={set('email')} placeholder="hello@company.com" /></div>
              <div className="field"><label className="lbl">Phone</label><input className="inp" value={form.phone} onChange={set('phone')} placeholder="+91 98000 00000" /></div>
              <div className="field"><label className="lbl">GSTIN / PAN</label><input className="inp" value={form.gst} onChange={set('gst')} placeholder="22AAAAA0000A1Z5" /></div>
              <div className="field"><label className="lbl">Invoice Prefix</label><input className="inp" value={form.prefix} onChange={set('prefix')} placeholder="INV" /></div>
              <div className="field"><label className="lbl">Alt. Phone <span style={{ fontSize: 9, color: 'var(--text3)' }}>(optional)</span></label><input className="inp" value={form.altPhone || ''} onChange={set('altPhone')} placeholder="+91 98000 00001" /></div>
              <div className="field"><label className="lbl">Alt. Email <span style={{ fontSize: 9, color: 'var(--text3)' }}>(optional)</span></label><input className="inp" value={form.altEmail || ''} onChange={set('altEmail')} placeholder="alt@company.com" /></div>
            </div>
            <div className="field"><label className="lbl">Address</label><textarea className="inp" value={form.addr} onChange={set('addr')} placeholder="Street, City, State, PIN" /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-accent" onClick={() => {
                if (!form.name.trim()) return alert('Business name required')
                onSave({ ...form, id: editing === 'new' ? uid() : editing })
                setEditing(null)
              }}>Save</button>
              <button className="btn" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Upgrade Payment Flow (Razorpay inline) ─────────────────── */
const UPGRADE_PLANS = [
  { id: 'monthly',   label: '₹49/month',   desc: `Monthly`,   amount: 49,  badge: null,           days: 30 },
  { id: 'quarterly', label: '₹129/quarter', desc: `Quarterly`, amount: 129, badge: '🔥 Popular',  days: 90 },
  { id: 'yearly',    label: '₹399/year',   desc: `Yearly`,    amount: 399, badge: '💰 Best Value', days: 365 },
]

function UpgradePaymentFlow({ token, API, onSuccess, onClose }) {
  const [selected, setSelected] = useState('quarterly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [coupon, setCoupon] = useState('')
  const [couponStatus, setCouponStatus] = useState(null) // { valid, desc, finalAmount, discountAmount }
  const [couponLoading, setCouponLoading] = useState(false)

  const selectedPlan = UPGRADE_PLANS.find(p => p.id === selected)

  const validateCoupon = async () => {
    if (!coupon.trim()) return
    setCouponLoading(true)
    setCouponStatus(null)
    try {
      const res = await fetch(`${API}/api/payment/validate-coupon`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: coupon, planId: selected })
      })
      const data = await res.json()
      if (res.ok) setCouponStatus({ valid: true, desc: data.desc, finalAmount: data.finalAmount, discountAmount: data.discountAmount })
      else setCouponStatus({ valid: false, desc: data.error || 'Invalid coupon' })
    } catch {
      setCouponStatus({ valid: false, desc: `Network error` })
    } finally {
      setCouponLoading(false)
    }
  }

  // Reset coupon when plan changes
  useEffect(() => { setCouponStatus(null); setCoupon('') }, [selected])

  const handlePayment = async () => {
    setLoading(true)
    setError('')
    try {
      // 1. Create order on backend
      const orderRes = await fetch(`${API}/api/payment/create-order`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selected, couponCode: coupon || undefined })
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order')

      // 2. Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://checkout.razorpay.com/v1/checkout.js'
          s.onload = resolve
          s.onerror = () => reject(new Error('Failed to load payment gateway'))
          document.head.appendChild(s)
        })
      }

      // 3. Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Zerofy Pro',
        description: orderData.planName,
        order_id: orderData.orderId,
        theme: { color: '#8B7FFF' },
        handler: async (response) => {
          // 4. Verify payment on backend
          const verifyRes = await fetch(`${API}/api/payment/verify`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: selected,
            })
          })
          const verifyData = await verifyRes.json()
          if (verifyRes.ok && verifyData.success) {
            onSuccess()
          } else {
            setError('Payment verification failed. Please contact support.')
          }
        },
        modal: { ondismiss: () => setLoading(false) }
      })
      rzp.on('payment.failed', (r) => {
        setError(r.error?.description || 'Payment failed. Please try again.')
        setLoading(false)
      })
      rzp.open()
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const displayAmount = couponStatus?.valid
    ? (couponStatus.finalAmount / 100).toFixed(0)
    : selectedPlan?.amount

  return (
    <div style={{ textAlign: 'left' }}>
      {/* Plan Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {UPGRADE_PLANS.map(plan => (
          <button
            key={plan.id}
            onClick={() => setSelected(plan.id)}
            style={{
              padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
              border: selected === plan.id ? '2px solid rgba(167,139,250,0.7)' : '1px solid rgba(255,255,255,0.1)',
              background: selected === plan.id
                ? 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(167,139,250,0.18))'
                : 'rgba(255,255,255,0.03)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                border: `2px solid ${selected === plan.id ? '#A78BFA' : 'rgba(255,255,255,0.25)'}`,
                background: selected === plan.id ? '#A78BFA' : 'transparent',
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selected === plan.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{plan.desc}</div>
                {plan.badge && <div style={{ fontSize: 10, color: '#A78BFA', fontWeight: 700 }}>{plan.badge}</div>}
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#60A5FA', flexShrink: 0 }}>{plan.label}</div>
          </button>
        ))}
      </div>

      {/* Coupon code */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          className="inp"
          placeholder="Coupon code (optional)"
          value={coupon}
          onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponStatus(null) }}
          style={{ fontSize: 13, flex: 1 }}
        />
        <button
          onClick={validateCoupon}
          disabled={couponLoading || !coupon.trim()}
          style={{
            padding: '9px 14px', borderRadius: 8, border: '1px solid rgba(167,139,250,0.4)',
            background: 'rgba(167,139,250,0.12)', color: '#C4BCFF',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
            opacity: couponLoading || !coupon.trim() ? 0.5 : 1,
          }}
        >
          {couponLoading ? '...' : 'Apply'}
        </button>
      </div>
      {couponStatus && (
        <div style={{
          marginBottom: 12, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: couponStatus.valid ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
          border: `1px solid ${couponStatus.valid ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
          color: couponStatus.valid ? '#34D399' : '#F87171',
        }}>
          {couponStatus.valid
            ? `✅ ${couponStatus.desc} — You save ₹${(couponStatus.discountAmount / 100).toFixed(0)}!`
            : `❌ ${couponStatus.desc}`}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: 12, padding: '10px 12px', borderRadius: 8, fontSize: 12,
          background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Pay button */}
      <button
        onClick={handlePayment}
        disabled={loading}
        style={{
          width: '100%', padding: '14px',
          borderRadius: 12, border: 'none',
          background: loading ? 'rgba(139,127,255,0.4)' : 'linear-gradient(135deg, #60A5FA, #A78BFA)',
          color: '#fff', fontSize: 15, fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 18px rgba(139,127,255,0.45)',
          marginBottom: 10, transition: 'all 0.2s',
        }}
      >
        {loading ? '⏳ Processing...' : `⚡ Pay ₹${displayAmount} — Activate Pro`}
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#5A5578', fontSize: 12, cursor: 'pointer', padding: '4px 0' }}
        >
          Maybe later
        </button>
        <a
          href="/pricing"
          style={{ color: '#7A75A0', fontSize: 12, textDecoration: 'none' }}
          onClick={onClose}
        >
          View all plans →
        </a>
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function InvoiceMaker() {
  useCSS()
  const navigate = useNavigate()

  const [businesses, setBusinesses] = useState([])
  const [savedInvoices, setSavedInvoices] = useState([])
  const [cloudLoaded, setCloudLoaded] = useState(false)
  const [activeBizId, setActiveBizId] = useState(null)
  const [status, setStatus] = useState('draft')
  const [showBizModal, setShowBizModal] = useState(false)
  const [template, setTemplate] = useState('modern')
  const [currency, setCurrency] = useState('₹')
  const [discPct, setDiscPct] = useState(0)
  const [taxPct, setTaxPct] = useState(18)
  const [items, setItems] = useState([defaultItem()])
  const [invNo, setInvNo] = useState('')
  const [generating, setGenerating] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState(null) // saved invoice preview ke liye
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareInvoice, setShareInvoice] = useState(null)
  const pendingGenerate = useRef(false)
  const [invoiceCount, setInvoiceCount] = useState(0)
  const [isPro, setIsPro] = useState(false)
  const FREE_LIMIT = 3
  const { token } = useAuth()
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  useEffect(() => {
    if (!token) return
    fetch(`${API}/api/invoices/status`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        setInvoiceCount(d.invoiceCount || 0)
        setIsPro(d.isPro || false)
      })
      .catch(() => {})
  }, [token])

  const [f, setF] = useState({
    bizName: '', bizEmail: '', bizPhone: '', bizAltPhone: '', bizAltEmail: '', bizGst: '', bizAddr: '',
    clientName: '', clientEmail: '', clientPhone: '', clientGst: '', clientAddr: '',
    notes: '', date: today(),
  })
  const sf = k => e => setF(p => ({ ...p, [k]: e.target.value }))

  // ── Cloud Load on login ────────────────────────────────────
  useEffect(() => {
    if (!token) return
    let cancelled = false
    let attempt = 0

    const load = () => {
      attempt++
      Promise.all([
        fetchBusinesses(token),
        fetchInvoices(token)
      ]).then(([bizData, invData]) => {
        if (cancelled) return
        console.log(`Zerofy: cloud load attempt ${attempt} — businesses:`, bizData.length, 'invoices:', invData.length)
        if (bizData.length === 0 && attempt === 1) {
          console.warn('Zerofy: businesses list khaali aayi, retry kar rahe hain...')
          setTimeout(load, 1200)
          return
        }
        setBusinesses(bizData)
        setSavedInvoices(invData)
        setCloudLoaded(true)
      }).catch(err => {
        console.error('Zerofy: cloud data load fail hua', err)
        if (!cancelled) setCloudLoaded(true)
      })
    }
    load()
    return () => { cancelled = true }
  }, [token])

  // ── Cloud Save businesses on change ───────────────────────
  useEffect(() => {
    if (!token || !cloudLoaded) return
    saveBusinesses(businesses, token)
  }, [businesses, token, cloudLoaded])

  const genInvNo = useCallback((biz) => {
    const prefix = biz?.prefix || 'INV'
    const year = new Date().getFullYear()
    const existing = savedInvoices.filter(i => i.bizId === (biz?.id || null))
    const lastNum = existing.reduce((max, inv) => {
      const m = inv.no?.match(/(\d+)$/)
      return m ? Math.max(max, parseInt(m[1])) : max
    }, 0)
    return `${prefix}-${year}-${String(lastNum + 1).padStart(3, '0')}`
  }, [savedInvoices])

  useEffect(() => {
    if (!invNo) setInvNo(genInvNo(businesses.find(b => b.id === activeBizId)))
  }, [activeBizId, businesses]) // eslint-disable-line

  const loadBusiness = id => {
    setActiveBizId(id)
    localStorage.setItem('zerofy-last-biz-id', id)
    const biz = businesses.find(b => b.id === id)
    if (!biz) return
    setF(p => ({ ...p, bizName: biz.name, bizEmail: biz.email || '', bizPhone: biz.phone || '', bizAltPhone: biz.altPhone || '', bizAltEmail: biz.altEmail || '', bizGst: biz.gst || '', bizAddr: biz.addr || '' }))
    setInvNo(genInvNo(biz))
  }

  // Naya invoice khulte hi pichhli baar use hui business automatically select ho jaye,
  // taaki har baar business details dobara type na karni padein
  useEffect(() => {
    if (!cloudLoaded || activeBizId || businesses.length === 0) {
      console.log('Zerofy: auto-select skip —', { cloudLoaded, activeBizId, businessCount: businesses.length })
      return
    }
    const lastId = localStorage.getItem('zerofy-last-biz-id')
    const toLoad = businesses.find(b => b.id === lastId) || businesses[0]
    console.log('Zerofy: auto-selecting business —', toLoad?.name)
    if (toLoad) loadBusiness(toLoad.id)
  }, [cloudLoaded, businesses]) // eslint-disable-line

  const handleBizSave = (biz, deleteId) => {
    if (deleteId) { setBusinesses(p => p.filter(b => b.id !== deleteId)); if (activeBizId === deleteId) setActiveBizId(null); return }
    setBusinesses(p => p.find(b => b.id === biz.id) ? p.map(b => b.id === biz.id ? biz : b) : [...p, biz])
  }

  // Bug fix: business details typed directly in the form (without going through
  // "+ Add Business") were never saved to the businesses list, so they'd vanish
  // on the next visit. Auto-save/update the business whenever an invoice is
  // generated, so it's remembered and auto-selected next time.
  const upsertBusinessFromForm = () => {
    const existing = businesses.find(b => b.id === activeBizId)
      || businesses.find(b => b.name.trim().toLowerCase() === f.bizName.trim().toLowerCase())
    const bizData = {
      id: existing ? existing.id : uid(),
      name: f.bizName.trim(),
      email: f.bizEmail || '',
      phone: f.bizPhone || '',
      altPhone: f.bizAltPhone || '',
      altEmail: f.bizAltEmail || '',
      gst: f.bizGst || '',
      addr: f.bizAddr || '',
      prefix: existing?.prefix || 'INV',
    }
    setBusinesses(p => existing ? p.map(b => b.id === bizData.id ? bizData : b) : [...p, bizData])
    setActiveBizId(bizData.id)
    localStorage.setItem('zerofy-last-biz-id', bizData.id)
    return bizData.id
  }

  const updateItem = (id, k, v) => setItems(p => p.map(i => i.id === id ? { ...i, [k]: v } : i))
  const removeItem = id => setItems(p => p.length > 1 ? p.filter(i => i.id !== id) : p)

  const sub = items.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0), 0)
  const disc = sub * (discPct / 100)
  const gstTotal = items.reduce((s, i) => s + (parseFloat(i.qty)||0)*(parseFloat(i.rate)||0)*((i.gstRate||0)/100), 0)
  const tax = gstTotal
  const total = sub - disc + gstTotal

  useEffect(() => {
    if (token && pendingGenerate.current) {
      pendingGenerate.current = false
      generateInvoice()
    }
  }, [token])

  const generateInvoice = async () => {
    if (!f.bizName.trim()) { alert('Please enter your Business Name.'); return }
    if (!f.clientName.trim()) { alert('Please enter Client Name.'); return }
    if (items.every(i => !i.desc && !i.rate)) { alert('Please add at least one item.'); return }

    // Login required
    if (!token) {
      pendingGenerate.current = true
      setShowAuthModal(true)
      return
    }

    // Check invoice limit with backend
    try {
      const res = await fetch(`${API}/api/invoices/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (res.status === 403 && data.error === 'free_limit_reached') {
        setShowUpgradeModal(true)
        return
      }
      if (res.ok) {
        setInvoiceCount(data.invoiceCount)
      }
    } catch (err) {
      console.error('Invoice count error:', err)
      return
    }

    setGenerating(true)
    await new Promise(r => setTimeout(r, 600))

    // Bug fix: persist the business details typed in the form so they're
    // remembered next time, even if the user never opened "+ Add Business".
    const bizId = upsertBusinessFromForm()

    const inv = {
      id: uid(), ts: Date.now(), no: invNo,
      bizId, bizName: f.bizName,
      clientName: f.clientName, clientEmail: f.clientEmail,
      clientAddr: f.clientAddr, clientPhone: f.clientPhone, clientGst: f.clientGst,
      bizEmail: f.bizEmail, bizPhone: f.bizPhone, bizAltPhone: f.bizAltPhone || '', bizAltEmail: f.bizAltEmail || '', bizAddr: f.bizAddr, bizGst: f.bizGst,
      date: f.date, notes: f.notes,
      total: fmt(total, currency),
      status: 'sent',
      template, currency, discPct, taxPct,
      items: [...items],
    }
    const updatedInvoices = [inv, ...savedInvoices.filter(i => i.no !== invNo)].slice(0, 100)
    setSavedInvoices(updatedInvoices)

    // ── Cloud mein save karo ──────────────────────────────────
    if (token) {
      saveInvoice(inv, token)
    }

    // Bug fix: print dialog opens in its own tab and no longer blocks the
    // app — we don't wait on it, and we no longer show a modal that had to
    // be dismissed before the rest of Zerofy became usable again.
    openPrintWindow(inv)

    setGenerating(false)
    // Straight back to the dashboard — no confirmation modal in the way.
    navigate('/app')
  }

  // Bug fix: Preview now only opens the preview modal — it no longer shares
  // or prints anything by itself, so it can't be confused with WhatsApp/Email.
  const previewSavedInvoice = (inv) => {
    setPreviewInvoice(inv)
    setShowPreviewModal(true)
  }

  // Bug fix: WhatsApp/Email now render straight from the invoice object
  // (via the shared invoiceShare utils) instead of grabbing whatever
  // preview happened to be on screen — so they always act on the exact
  // invoice that was clicked, and they no longer just "look like Preview".
  const shareViaWhatsApp = (inv) => shareInvoiceViaWhatsApp(inv)
  const shareViaEmail = (inv) => shareInvoiceViaEmail(inv)

  const statusMeta = { draft: '#818CF8', sent: '#38BDF8', paid: '#34D399', overdue: '#F87171', cancelled: '#9CA3AF' }
  const invData = { ...f, no: invNo }
  const t = TEMPLATES.find(t => t.key === template) || TEMPLATES[0]

  return (
    <div className="ig-root">
      {/* BACK / BREADCRUMB BAR */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 20px',
        background: '#16152A',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <button
          onClick={() => window.history.back()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.06)',
            color: '#B8B4E0', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#F0EEFF'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#B8B4E0'; }}
        >
          ‹ Back
        </button>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Home</span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>›</span>
        <span style={{ color: '#B8B4E0', fontSize: 13 }}>Invoice Generator</span>
      </div>

      {/* TOP BAR */}
      <div className="ig-top">
        <div className="ig-brand">
          <div className="ig-icon">🧾</div>
          <div>
            <div className="ig-name">Invoice Generator</div>
            <div className="ig-sub">GST-ready · Instant PDF · Multi-business</div>
          </div>
        </div>
        <div className="ig-actions">
          <button className="btn" onClick={() => setShowBizModal(true)}>
            🏢 Businesses {businesses.length > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 10 }}>{businesses.length}</span>}
          </button>
          <select className="inp" value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: 'auto', padding: '8px 12px' }}>
            {CURRENCIES.map(c => <option key={c.sym} value={c.sym}>{c.sym} {c.code}</option>)}
          </select>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="ig-layout">

        {/* LEFT — FORM */}
        <div className="ig-left">

          {/* Invoice No + Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div className="inv-no" style={{ marginBottom: 0 }}>
              🧾 <input value={invNo} onChange={e => setInvNo(e.target.value)} />
            </div>
            <input type="date" className="inp" value={f.date} onChange={sf('date')} style={{ width: 'auto', flex: '0 0 auto' }} />
          </div>
          <div className="status-strip">
            {Object.entries(statusMeta).map(([k, c]) => (
              <button key={k} className="s-pill" onClick={() => setStatus(k)}
                style={{ background: status === k ? c + '22' : 'transparent', borderColor: status === k ? c : 'var(--border)', color: status === k ? c : 'var(--text3)' }}>
                <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: status === k ? c : 'var(--text3)', marginRight: 5, verticalAlign: 'middle' }} />
                {k}
              </button>
            ))}
          </div>
          <hr className="divider" />

          {/* Business Selector */}
          {businesses.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div className="sec-label"><span className="sec-dot" />Your Business</div>
              <div className="biz-pills">
                {businesses.map(b => (
                  <button key={b.id} className={`biz-pill ${activeBizId === b.id ? 'on' : ''}`} onClick={() => loadBusiness(b.id)}>
                    {activeBizId === b.id && '✓ '}{b.name}
                  </button>
                ))}
                <button className="biz-pill" style={{ color: 'var(--accent)', borderColor: 'rgba(124,111,255,0.3)', background: 'var(--accent-dim)' }}
                  onClick={() => setShowBizModal(true)}>+ Add</button>
              </div>
            </div>
          )}

          {/* From + Bill To */}
          <div className="grid-2">
            <div className="ig-card">
              <div className="sec-label"><span className="sec-dot" />From (Your Business)</div>
              <div className="field"><label className="lbl">Business Name *</label><input className="inp" value={f.bizName} onChange={sf('bizName')} placeholder="Your Company Pvt Ltd" /></div>
              <div className="field"><label className="lbl">Email</label><input className="inp" value={f.bizEmail} onChange={sf('bizEmail')} placeholder="hello@company.com" /></div>
              <div className="field"><label className="lbl">Phone</label><input className="inp" value={f.bizPhone} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setF(p => ({ ...p, bizPhone: v })) }} placeholder="10-digit number" maxLength={10} inputMode="numeric" pattern="[0-9]*" /></div>
              <div className="field"><label className="lbl">GSTIN / PAN</label><input className="inp" value={f.bizGst} onChange={sf('bizGst')} placeholder="22AAAAA0000A1Z5" /></div>
              <div className="field"><label className="lbl">Alt. Phone <span style={{ fontSize: 9, color: 'var(--text3)' }}>(optional)</span></label><input className="inp" value={f.bizAltPhone} onChange={sf('bizAltPhone')} placeholder="+91 98000 00001" /></div>
              <div className="field"><label className="lbl">Alt. Email <span style={{ fontSize: 9, color: 'var(--text3)' }}>(optional)</span></label><input className="inp" value={f.bizAltEmail} onChange={sf('bizAltEmail')} placeholder="alt@company.com" /></div>
              <div className="field"><label className="lbl">Address</label><textarea className="inp" rows={2} value={f.bizAddr} onChange={sf('bizAddr')} placeholder="Street, City, State, PIN" /></div>
            </div>
            <div className="ig-card">
              <div className="sec-label"><span className="sec-dot" style={{ background: 'var(--blue)' }} />Bill To (Client)</div>
              <div className="field"><label className="lbl">Client Name *</label><input className="inp" value={f.clientName} onChange={sf('clientName')} placeholder="Client Company" /></div>
              <div className="field"><label className="lbl">Email</label><input className="inp" value={f.clientEmail} onChange={sf('clientEmail')} placeholder="client@email.com" /></div>
              <div className="field"><label className="lbl">Phone</label><input className="inp" value={f.clientPhone} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setF(p => ({ ...p, clientPhone: v })) }} placeholder="10-digit number" maxLength={10} inputMode="numeric" pattern="[0-9]*" /></div>
              <div className="field"><label className="lbl">GSTIN / PAN</label><input className="inp" value={f.clientGst} onChange={sf('clientGst')} placeholder="Client GSTIN" /></div>
              <div className="field"><label className="lbl">Address</label><textarea className="inp" rows={2} value={f.clientAddr} onChange={sf('clientAddr')} placeholder="Client address" /></div>
            </div>
          </div>

          {/* Items */}
          <div className="ig-card" style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="sec-label" style={{ margin: 0 }}><span className="sec-dot" style={{ background: 'var(--yellow)' }} />Line Items</div>
              <button className="btn btn-sm btn-accent" onClick={() => setItems(p => [...p, defaultItem()])}>+ Add Item</button>
            </div>
            <div className="items-head">
              <div>Type</div>
              <div>Description</div>
              <div>HSN / SAC</div>
              <div style={{ textAlign: 'center' }}>GST %</div>
              <div style={{ textAlign: 'center' }}>UQC</div>
              <div style={{ textAlign: 'center' }}>Qty</div>
              <div style={{ textAlign: 'right' }}>Rate</div>
              <div style={{ textAlign: 'right' }}>Amount</div>
              <div />
            </div>
            {items.map(it => (
              <div key={it.id} className="item-row">
                {/* Type */}
                <div>
                  <select className="inp" value={it.type}
                    onChange={e => { updateItem(it.id, 'type', e.target.value); updateItem(it.id, 'hsnSac', ''); updateItem(it.id, 'desc', '') }}>
                    <option value="goods">🟡 Goods</option>
                    <option value="service">🔵 Service</option>
                  </select>
                </div>
                {/* Description */}
                <div>
                  <input className="inp" value={it.desc} onChange={e => updateItem(it.id, 'desc', e.target.value)} placeholder="Item description…" />
                  {it.hsnSac && (
                    <div style={{ marginTop: 3, fontSize: 10, color: '#9A96C0' }}>
                      {it.type === 'goods' ? 'HSN' : 'SAC'}: <span style={{ color: '#C4BCFF', fontWeight: 700 }}>{it.hsnSac}</span>
                    </div>
                  )}
                </div>
                {/* HSN/SAC */}
                <div>
                  <CodePicker type={it.type} value={it.hsnSac}
                    onSelect={sel => {
                      const key = it.type === 'goods' ? 'hsn' : 'sac'
                      updateItem(it.id, 'hsnSac', sel[key])
                      updateItem(it.id, 'gstRate', sel.gst)
                      if (!it.desc) updateItem(it.id, 'desc', sel.desc)
                    }}
                  />
                </div>
                {/* GST Rate — dropdown + manual override */}
                <div className="gst-rate-wrap">
                  <select className="inp" value={it.gstRate}
                    onChange={e => updateItem(it.id, 'gstRate', parseFloat(e.target.value))}
                    style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}
                    title="Select GST rate or type custom below"
                  >
                    {GST_RATES.map(r => (
                      <option key={r} value={r}>{r}%</option>
                    ))}
                    {!GST_RATES.includes(it.gstRate) && (
                      <option value={it.gstRate}>{it.gstRate}% (custom)</option>
                    )}
                  </select>
                  <input
                    className="gst-manual-inp"
                    type="number" min="0" max="100" step="0.01"
                    value={it.gstRate}
                    onChange={e => {
                      const v = e.target.value === '' ? 0 : parseFloat(e.target.value)
                      if (!isNaN(v) && v >= 0 && v <= 100) updateItem(it.id, 'gstRate', v)
                    }}
                    placeholder="Custom %"
                    title="Type any GST rate manually"
                  />
                </div>
                {/* UQC */}
                <div>
                  <select className="inp" value={it.uqc || 'PCS'}
                    onChange={e => updateItem(it.id, 'uqc', e.target.value)}
                    style={{ textAlign: 'center', fontSize: 11, padding: '7px 4px' }}
                    title="Unit Quantity Code"
                  >
                    {UQC_CODES.map(u => (
                      <option key={u.code} value={u.code}>{u.label}</option>
                    ))}
                  </select>
                </div>
                {/* Qty */}
                <div>
                  <input className="inp" type="number" min="0" value={it.qty}
                    onChange={e => updateItem(it.id, 'qty', e.target.value === '' ? '' : +e.target.value)}
                    placeholder="Qty"
                    style={{ textAlign: 'center' }} />
                </div>
                {/* Rate */}
                <div>
                  <input className="inp" type="number" min="0" value={it.rate}
                    onChange={e => updateItem(it.id, 'rate', e.target.value)}
                    placeholder="0.00" style={{ textAlign: 'right' }} />
                </div>
                {/* Amount (auto) */}
                <div style={{ paddingTop: 8, textAlign: 'right' }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12, fontWeight: 700,
                    color: (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0) > 0 ? 'var(--accent)' : 'var(--text3)'
                  }}>
                    {fmt((parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0), currency)}
                  </span>
                </div>
                {/* Remove */}
                <div style={{ paddingTop: 8 }}>
                  <button className="btn btn-icon btn-ghost btn-sm" onClick={() => removeItem(it.id)}
                    style={{ color: 'var(--red)', fontSize: 16, lineHeight: 1 }}>×</button>
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="totals">
              <div className="t-row"><span>Subtotal (excl. GST)</span><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(sub, currency)}</span></div>
              <div className="t-row">
                <span>Discount <input type="number" min="0" max="100" value={discPct} onChange={e => setDiscPct(+e.target.value)} className="pct-inp" />%</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: discPct > 0 ? 'var(--green)' : 'var(--text3)' }}>−{fmt(disc, currency)}</span>
              </div>
              <div className="t-row">
                <span>GST (as per HSN/SAC)</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(gstTotal, currency)}</span>
              </div>
              <div className="t-row grand"><span>Total</span><span>{fmt(total, currency)}</span></div>
            </div>
          </div>

          {/* Notes */}
          <div className="ig-card">
            <div className="sec-label"><span className="sec-dot" style={{ background: 'var(--green)' }} />Notes (optional)</div>
            <textarea className="inp" rows={3} value={f.notes} onChange={sf('notes')} placeholder="Bank details, payment instructions, thank you note…" />
          </div>

          {/* Saved invoices */}
          {savedInvoices.length > 0 && (
            <div className="saved-list">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div className="sec-label" style={{ margin: 0 }}><span className="sec-dot" />Recent Invoices ({savedInvoices.length})</div>
                <button className="btn btn-sm btn-ghost" onClick={async () => {
                  if (window.confirm('Clear all saved invoices?')) {
                    if (token) {
                      await Promise.all(savedInvoices.map(inv => deleteInvoice(inv._id || inv.id, token)))
                    }
                    setSavedInvoices([])
                  }
                }}>Clear</button>
              </div>
              {savedInvoices.slice(0, 5).map(inv => (
                <div key={inv.id} className="saved-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="s-no">{inv.no}</div>
                      <div className="s-client">{inv.clientName || '—'} · {inv.date}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ background: statusMeta[inv.status] + '22', color: statusMeta[inv.status], fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{inv.status}</span>
                      <span className="s-amt">{inv.total}</span>
                    </div>
                  </div>
                  {/* Preview / WhatsApp / Email — each does its own distinct action now */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn btn-sm btn-green" onClick={() => previewSavedInvoice(inv)}
                      style={{ fontSize: 11, padding: '4px 10px' }}>
                      👁 Preview
                    </button>
                    <button className="btn btn-sm" onClick={() => shareViaWhatsApp(inv)}
                      style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(37,211,102,0.12)', borderColor: 'rgba(37,211,102,0.3)', color: '#25D366' }}>
                      💬 WhatsApp
                    </button>
                    <button className="btn btn-sm" onClick={() => shareViaEmail(inv)}
                      style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.25)', color: '#60A5FA' }}>
                      ✉️ Email
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — PREVIEW + GENERATE */}
        <div className="ig-right">
          <div className="preview-panel">

            {/* Template picker */}
            <div className="sec-label" style={{ marginBottom: 10 }}><span className="sec-dot" />Template</div>
            <div className="tmpl-row">
              {TEMPLATES.map(t => (
                <button key={t.key} className={`tmpl-opt ${template === t.key ? 'on' : ''}`} onClick={() => setTemplate(t.key)}>
                  <div className="tmpl-thumb" style={{ background: t.key === 'minimal' ? '#f5f5f5' : '#fff' }}>
                    <div className="t-bar" style={{ background: t.accent, width: '100%' }} />
                    <div className="t-bar" style={{ background: '#e5e7eb', width: '75%' }} />
                    <div className="t-bar" style={{ background: '#e5e7eb', width: '60%' }} />
                    <div className="t-bar" style={{ background: t.accent + '44', width: '40%' }} />
                  </div>
                  <div className="tmpl-name">{t.label}</div>
                </button>
              ))}
            </div>

            {/* Generate button */}
            <div className="gen-area">
              <div className="gen-label">Total Amount</div>
              <div className="gen-total">{fmt(total, currency)}</div>

              {/* Free limit indicator */}
              {token && !isPro && (
                invoiceCount >= FREE_LIMIT ? (
                  <div style={{
                    margin: '14px 0 0',
                    padding: '14px 16px',
                    background: 'linear-gradient(135deg, rgba(96,165,250,0.1), rgba(167,139,250,0.12))',
                    border: '1px solid rgba(167,139,250,0.35)',
                    borderRadius: 14,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>🎉</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#C4BCFF', marginBottom: 4 }}>
                      {FREE_LIMIT} free invoices used!
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 10 }}>
                      Unlimited invoices on Pro — starting at <strong style={{ color: '#A78BFA' }}>₹19/month</strong> 
                    </div>
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      style={{
                        padding: '8px 18px', borderRadius: 20, border: 'none',
                        background: 'linear-gradient(135deg, #60A5FA, #A78BFA)',
                        color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(139,127,255,0.4)',
                      }}
                    >
                      ⚡ Upgrade to Pro
                    </button>
                  </div>
                ) : (
                  <div style={{
                    margin: '12px 0 0',
                    padding: '8px 14px',
                    background: 'rgba(96,165,250,0.08)',
                    border: '1px solid rgba(96,165,250,0.2)',
                    borderRadius: 10,
                    fontSize: 13,
                    color: 'var(--text2)',
                    textAlign: 'center'
                  }}>
                    ⚡ {FREE_LIMIT - invoiceCount} free invoice{FREE_LIMIT - invoiceCount === 1 ? '' : 's'} remaining
                  </div>
                )
              )}

              {/* Free limit reached — hide generate buttons */}
              {(!token || isPro || invoiceCount < FREE_LIMIT) && (
                <>
                  <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-accent" onClick={generateInvoice} disabled={generating}
                      style={{ fontSize: 14, padding: '10px 24px', opacity: generating ? 0.7 : 1 }}>
                      {generating ? '⏳ Generating…' : '⚡ Generate & Print'}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
                  Saves to Sent → opens print / PDF dialog
                  </div>
                </>
              )}
            </div>

            {/* Upgrade Modal — Razorpay integrated */}
            {showUpgradeModal && (
              <>
                <div onClick={() => setShowUpgradeModal(false)} style={{
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
                    maxWidth: 420, width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
                    animation: 'slideUp 0.25s ease',
                    position: "relative",
                  }}>
                    {/* Close button */}
                    <button onClick={() => setShowUpgradeModal(false)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, width: 30, height: 30, color: "#9A96C0", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    {/* Header */}
                    <div style={{ fontSize: 44, marginBottom: 10 }}>⚡</div>
                    <h2 style={{
                      fontSize: 22, fontWeight: 800, marginBottom: 6,
                      background: 'linear-gradient(135deg, #60A5FA, #A78BFA)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>Go Pro — Unlimited Invoices!</h2>
                    <p style={{ color: '#9A96C0', fontSize: 13, marginBottom: 22, lineHeight: 1.6 }}>
                      You've used <strong style={{ color: '#f1f5f9' }}>{FREE_LIMIT} free invoices</strong> . Upgrade to Pro for unlimited invoice generation.
                    </p>

                    {/* Plan selector */}
                    <UpgradePaymentFlow
                      token={token}
                      API={API}
                      onSuccess={() => {
                        setShowUpgradeModal(false)
                        // Re-fetch status so buttons show again
                        fetch(`${API}/api/invoices/status`, {
                          headers: { Authorization: `Bearer ${token}` }
                        })
                          .then(r => r.json())
                          .then(d => {
                            setInvoiceCount(d.invoiceCount || 0)
                            setIsPro(d.isPro || false)
                          })
                          .catch(() => {})
                      }}
                      onClose={() => setShowUpgradeModal(false)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Live preview */}
            <div className="sec-label" style={{ margin: '14px 0 10px' }}><span className="sec-dot" />Live Preview</div>
            <div className="prev-box" id="ig-print-zone">
              <InvoicePreview inv={invData} items={items} currency={currency} discPct={discPct} taxPct={taxPct} template={template} status={status} />
            </div>
          </div>
        </div>
      </div>

      {showBizModal && <BizModal businesses={businesses} onSave={handleBizSave} onClose={() => setShowBizModal(false)} />}

      {/* Bug 4: Saved Invoice Preview Modal */}
      {showPreviewModal && previewInvoice && (
        <>
          <div onClick={() => setShowPreviewModal(false)} style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)'
          }} />
          <div style={{
            position: 'fixed', inset: 0, zIndex: 2001,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '20px', overflowY: 'auto'
          }}>
            <div style={{ width: '100%', maxWidth: 780, background: '#1A1830', borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(139,127,255,0.2)', background: '#15132A' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#C4BCFF' }}>📄 {previewInvoice.no}</div>
                  <div style={{ fontSize: 12, color: '#7A75A0', marginTop: 2 }}>{previewInvoice.clientName} · {previewInvoice.date}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => openPrintWindow(previewInvoice)}
                    className="btn btn-green btn-sm"
                  >🖨️ Print / Download</button>
                  <button
                    onClick={() => shareViaWhatsApp(previewInvoice)}
                    className="btn btn-sm"
                    style={{ background: 'rgba(37,211,102,0.12)', borderColor: 'rgba(37,211,102,0.3)', color: '#25D366' }}
                  >💬 WhatsApp</button>
                  <button
                    onClick={() => shareViaEmail(previewInvoice)}
                    className="btn btn-sm"
                    style={{ background: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.25)', color: '#60A5FA' }}
                  >✉️ Email</button>
                  <button className="btn btn-icon btn-ghost" onClick={() => setShowPreviewModal(false)} style={{ fontSize: 18 }}>×</button>
                </div>
              </div>
              {/* Invoice Preview */}
              <div style={{ padding: 20 }}>
                <div id="saved-preview-zone" style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
                  <InvoicePreview
                    inv={{ ...previewInvoice, no: previewInvoice.no }}
                    items={previewInvoice.items || []}
                    currency={previewInvoice.currency || '₹'}
                    discPct={previewInvoice.discPct || 0}
                    taxPct={previewInvoice.taxPct || 18}
                    template={previewInvoice.template || 'modern'}
                    status={previewInvoice.status || 'sent'}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showLoginPrompt && (
        <>
          <div onClick={() => setShowLoginPrompt(false)} style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)'
          }} />
          <div style={{
            position: 'fixed', inset: 0, zIndex: 2001,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
          }}>
            <div style={{
              background: 'var(--bg2, #1a1b2e)',
              border: '1px solid rgba(96,165,250,0.4)',
              borderRadius: 20, padding: '36px 28px',
              maxWidth: 380, width: '100%',
              textAlign: 'center',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)'
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
                marginBottom: 8,
                background: 'linear-gradient(135deg, #60A5FA, #A78BFA)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>Sign in to Continue</h2>
              <p style={{ color: 'var(--text2, #94a3b8)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                Please sign in to generate and save your invoices.
              </p>
              <button
                onClick={() => {
                  setShowLoginPrompt(false)
                  pendingGenerate.current = true
                  setShowAuthModal(true)
                }}
                style={{
                  width: '100%', padding: '13px',
                  borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #60A5FA, #A78BFA)',
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', marginBottom: 10
                }}
              >
                Sign in to Continue
              </button>
            </div>
          </div>
        </>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false)
          pendingGenerate.current = false
        }}
        defaultTab="login"
      />
    </div>
  )
}
