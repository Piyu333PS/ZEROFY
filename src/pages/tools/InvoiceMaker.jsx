import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AuthModal from '../../components/AuthModal'
import { GOODS_HSN, UQC_CODES, SERVICES_SAC, CURRENCIES, TEMPLATES } from '../../data/invoiceCodes'
import { CSS } from '../../data/invoiceMakerStyles'
import { InvoicePreview } from '../../components/invoice/InvoicePreview'
import { printInvoice } from '../../utils/invoiceShare'
import { api } from '../../utils/api'
import { loadBilling, patchBilling } from '../../utils/billingStore'
import { isValidUpiId } from '../../utils/qr'
import {
  calcInvoice, fmtMoney, localToday, addDays, formatDate, GST_STATES, stateCodeOf, stateName, itemGstRate,
} from '../../utils/invoiceCalc'

/* ─── Utilities ──────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 9)
const today = localToday
const fmt = fmtMoney

/* ─── Logo: chhota karke data-URL banao (business profile ke saath save hota hai) ── */
const MAX_LOGO_CHARS = 140000
function fileToLogoDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) return reject(new Error('Choose an image file (PNG or JPG).'))
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('This image could not be opened. Try another file.'))
      img.onload = () => {
        let size = 240
        // Jab tak size limit mein na aa jaye, chhota karte jao
        for (let i = 0; i < 4; i++) {
          const scale = Math.min(1, size / Math.max(img.width, img.height))
          const canvas = document.createElement('canvas')
          canvas.width = Math.max(1, Math.round(img.width * scale))
          canvas.height = Math.max(1, Math.round(img.height * scale))
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
          const png = canvas.toDataURL('image/png')
          if (png.length <= MAX_LOGO_CHARS) return resolve(png)
          size = Math.round(size * 0.7)
        }
        reject(new Error('The logo is too large. Use a smaller image.'))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

/* ─── Validation ─────────────────────────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
// Standard 15-char GSTIN: 2-digit state code, 10-char PAN, 1 entity code, 'Z', 1 checksum
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i

const validateEmail = (v) => !v || EMAIL_RE.test(v.trim())
const validateGstin = (v) => !v || GSTIN_RE.test(v.trim())

// Small helper: red border on the input + a short message underneath,
// but only once the user has actually left the field (so it doesn't
// nag while they're still typing).
function FieldError({ show, message }) {
  if (!show) return null
  return <div className="field-err">{message}</div>
}

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
            <div style={{ padding: '6px 12px', fontSize: 10, color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>
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
            <div style={{ padding: '6px 12px', fontSize: 10, color: 'var(--text3)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
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
  const empty = { name: '', email: '', phone: '', altPhone: '', altEmail: '', gst: '', addr: '', prefix: 'INV', logo: '', bankDetails: '', upiId: '', terms: '', signatory: '' }
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [touched, setTouched] = useState({})
  const [formMsg, setFormMsg] = useState('')
  const [confirmDel, setConfirmDel] = useState(null)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const markTouched = k => () => setTouched(p => ({ ...p, [k]: true }))
  const pickLogo = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const logo = await fileToLogoDataUrl(file)
      setForm(f => ({ ...f, logo }))
      setFormMsg('')
    } catch (err) { setFormMsg(err.message) }
  }
  const setDigits = (k, max = 10) => (e) => setForm(f => ({ ...f, [k]: e.target.value.replace(/\D/g, '').slice(0, max) }))
  const setGst = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15) }))
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-h">
          <div className="modal-title">Business profiles</div>
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
                  {confirmDel === b.id ? (
                    <>
                      <button className="btn btn-sm" style={{ color: '#fff', borderColor: 'var(--red)', background: 'var(--red)' }}
                        onClick={() => { setConfirmDel(null); onSave(null, b.id) }}>Yes, delete</button>
                      <button className="btn btn-sm" onClick={() => setConfirmDel(null)}>No</button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-sm" onClick={() => { setEditing(b.id); setForm({ ...empty, ...b }); setTouched({}); setFormMsg('') }}>Edit</button>
                      <button className="btn btn-sm" style={{ color: 'var(--red)', borderColor: 'rgba(179,38,30,0.3)', background: 'rgba(179,38,30,0.08)' }}
                        onClick={() => setConfirmDel(b.id)}>Del</button>
                    </>
                  )}
                </div>
              </div>
            ))}
            <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              onClick={() => { setEditing('new'); setForm(empty); setTouched({}); setFormMsg('') }}>+ Add New Business</button>
          </>
        )}
        {editing && (
          <div style={{ animation: 'slideUp 0.2s ease' }}>
            <div className="sec-label"><span className="sec-dot" />{editing === 'new' ? 'New Business' : 'Edit Business'}</div>
            <div className="grid-2">
              <div className="field"><label className="lbl">Business Name *</label><input className="inp" value={form.name} onChange={set('name')} placeholder="My Company Pvt Ltd" /></div>
              <div className="field">
                <label className="lbl">Email</label>
                <input className={`inp ${touched.email && !validateEmail(form.email) ? 'inp-err' : ''}`}
                  type="email" value={form.email} onChange={set('email')} onBlur={markTouched('email')} placeholder="hello@company.com" />
                <FieldError show={touched.email && !validateEmail(form.email)} message="Enter a valid email, for example hello@company.com" />
              </div>
              <div className="field"><label className="lbl">Phone</label><input className="inp" value={form.phone} onChange={setDigits('phone')} placeholder="10-digit number" maxLength={10} inputMode="numeric" pattern="[0-9]*" /></div>
              <div className="field">
                <label className="lbl">GSTIN / PAN</label>
                <input className={`inp ${touched.gst && !validateGstin(form.gst) ? 'inp-err' : ''}`}
                  value={form.gst} onChange={setGst('gst')} onBlur={markTouched('gst')} placeholder="22AAAAA0000A1Z5" maxLength={15} />
                <FieldError show={touched.gst && !validateGstin(form.gst)} message="GSTIN must be 15 characters, for example 22AAAAA0000A1Z5" />
              </div>
              <div className="field"><label className="lbl">Invoice Prefix</label><input className="inp" value={form.prefix} onChange={set('prefix')} placeholder="INV" /></div>
              <div className="field"><label className="lbl">Alt. Phone <span style={{ fontSize: 9, color: 'var(--text3)' }}>(optional)</span></label><input className="inp" value={form.altPhone || ''} onChange={setDigits('altPhone')} placeholder="10-digit number" maxLength={10} inputMode="numeric" pattern="[0-9]*" /></div>
              <div className="field">
                <label className="lbl">Alt. Email <span style={{ fontSize: 9, color: 'var(--text3)' }}>(optional)</span></label>
                <input className={`inp ${touched.altEmail && !validateEmail(form.altEmail) ? 'inp-err' : ''}`}
                  type="email" value={form.altEmail || ''} onChange={set('altEmail')} onBlur={markTouched('altEmail')} placeholder="alt@company.com" />
                <FieldError show={touched.altEmail && !validateEmail(form.altEmail)} message="Enter a valid email, for example alt@company.com" />
              </div>
            </div>
            <div className="field"><label className="lbl">Address</label><textarea className="inp" value={form.addr} onChange={set('addr')} placeholder="Street, City, State, PIN" /></div>

            <div className="sec-label" style={{ marginTop: 14 }}><span className="sec-dot" />Shown on your invoices (optional)</div>
            <div className="field">
              <label className="lbl">Logo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {form.logo && <img src={form.logo} alt="Logo preview" style={{ width: 48, height: 48, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }} />}
                <label className="btn btn-sm" style={{ cursor: 'pointer' }}>
                  {form.logo ? 'Change logo' : 'Upload logo'}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickLogo} style={{ display: 'none' }} />
                </label>
                {form.logo && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setForm(f => ({ ...f, logo: '' }))}>Remove</button>}
              </div>
            </div>
            <div className="grid-2">
              <div className="field"><label className="lbl">UPI ID</label><input className="inp" value={form.upiId || ''} onChange={set('upiId')} placeholder="yourname@upi" /></div>
              <div className="field"><label className="lbl">Signatory name</label><input className="inp" value={form.signatory || ''} onChange={set('signatory')} placeholder="Authorised Signatory" /></div>
            </div>
            <div className="field"><label className="lbl">Bank details</label><textarea className="inp" rows={3} value={form.bankDetails || ''} onChange={set('bankDetails')} placeholder={'Account name\nAccount no.\nIFSC · Bank & branch'} /></div>
            <div className="field"><label className="lbl">Default terms &amp; conditions</label><textarea className="inp" rows={2} value={form.terms || ''} onChange={set('terms')} placeholder="Payment due within 15 days. Goods once sold will not be taken back." /></div>

            {formMsg && <div className="field-err" style={{ fontSize: 12, marginBottom: 6 }}>{formMsg}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-accent" onClick={() => {
                if (!form.name.trim()) return setFormMsg('Business name is required.')
                if (!validateEmail(form.email)) return setFormMsg('Email is not valid.')
                if (!validateEmail(form.altEmail)) return setFormMsg('Alt. email is not valid.')
                if (!validateGstin(form.gst)) return setFormMsg('GSTIN is not valid (15 characters, for example 22AAAAA0000A1Z5).')
                if (form.phone && form.phone.length !== 10) return setFormMsg('Phone must be 10 digits.')
                onSave({ ...form, name: form.name.trim(), id: editing === 'new' ? uid() : editing })
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
  { id: 'quarterly', label: '₹129/quarter', desc: `Quarterly`, amount: 129, badge: 'Most popular',  days: 90 },
  { id: 'yearly',    label: '₹399/year',   desc: `Yearly`,    amount: 399, badge: 'Best value', days: 365 },
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
        theme: { color: '#EFA02F' },
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
              border: selected === plan.id ? '2px solid rgba(168,94,8,0.6)' : '1px solid #DDE1D9',
              background: selected === plan.id
                ? 'linear-gradient(135deg, rgba(239,160,47,0.12), rgba(11,110,79,0.08))'
                : '#FFFFFF',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                border: `2px solid ${selected === plan.id ? '#A85E08' : '#C9CFC4'}`,
                background: selected === plan.id ? '#A85E08' : 'transparent',
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selected === plan.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#12263F' }}>{plan.desc}</div>
                {plan.badge && <div style={{ fontSize: 10, color: '#A85E08', fontWeight: 700 }}>{plan.badge}</div>}
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#A85E08', flexShrink: 0 }}>{plan.label}</div>
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
            padding: '9px 14px', borderRadius: 8, border: '1px solid rgba(11,110,79,0.35)',
            background: 'rgba(11,110,79,0.1)', color: '#0B6E4F',
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
          background: couponStatus.valid ? 'rgba(11,110,79,0.1)' : 'rgba(179,38,30,0.1)',
          border: `1px solid ${couponStatus.valid ? 'rgba(11,110,79,0.3)' : 'rgba(179,38,30,0.3)'}`,
          color: couponStatus.valid ? '#0B6E4F' : '#B3261E',
        }}>
          {couponStatus.valid
            ? `${couponStatus.desc} — you save ₹${(couponStatus.discountAmount / 100).toFixed(0)}!`
            : couponStatus.desc}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: 12, padding: '10px 12px', borderRadius: 8, fontSize: 12,
          background: 'rgba(179,38,30,0.1)', border: '1px solid rgba(179,38,30,0.3)', color: '#B3261E',
        }}>
          {error}
        </div>
      )}

      {/* Pay button */}
      <button
        onClick={handlePayment}
        disabled={loading}
        style={{
          width: '100%', padding: '14px',
          borderRadius: 12, border: 'none',
          background: loading ? 'rgba(239,160,47,0.45)' : '#EFA02F',
          color: '#12263F', fontSize: 15, fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: 10, transition: 'all 0.2s',
        }}
      >
        {loading ? 'Processing…' : `Pay ₹${displayAmount} and activate Pro`}
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#8494A6', fontSize: 12, cursor: 'pointer', padding: '4px 0' }}
        >
          Maybe later
        </button>
        <a
          href="/pricing"
          style={{ color: '#8494A6', fontSize: 12, textDecoration: 'none' }}
          onClick={onClose}
        >
          View all plans →
        </a>
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */
const blankForm = () => ({
  bizName: '', bizEmail: '', bizPhone: '', bizAltPhone: '', bizAltEmail: '', bizGst: '', bizAddr: '', bizLogo: '',
  clientName: '', clientEmail: '', clientPhone: '', clientGst: '', clientAddr: '', placeOfSupply: '',
  notes: '', terms: '', bankDetails: '', upiId: '', signatory: '',
  date: today(), dueDate: '', poNumber: '',
})

// Saved invoice ke items ko form ke shape mein lao (purane invoices mein gstRate/hsnSac nahi the)
const itemsFromInvoice = (inv) => {
  const list = (inv.items || []).map(it => ({
    id: uid(),
    type: it.type === 'service' ? 'service' : 'goods',
    hsnSac: it.hsnSac || it.hsn || '',
    desc: it.desc || '',
    qty: it.qty ?? '',
    uqc: it.uqc || 'PCS',
    rate: it.rate ?? '',
    gstRate: itemGstRate(it, inv),
  }))
  return list.length ? list : [defaultItem()]
}

export default function InvoiceMaker() {
  useCSS()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editParam = searchParams.get('edit')
  const copyParam = searchParams.get('copy')
  const clientParam = searchParams.get('client')

  const [businesses, setBusinesses] = useState([])
  const [savedInvoices, setSavedInvoices] = useState([])
  const [customers, setCustomers] = useState([])
  const [catalog, setCatalog] = useState([]) // saved items
  const [cloudLoaded, setCloudLoaded] = useState(false)
  const [activeBizId, setActiveBizId] = useState(null)
  const [editing, setEditing] = useState(null) // jo saved invoice edit ho raha hai
  const [showBizModal, setShowBizModal] = useState(false)
  const [template, setTemplate] = useState('modern')
  const [currency, setCurrency] = useState('₹')
  const [discPct, setDiscPct] = useState(0)
  const [shipping, setShipping] = useState('')
  const [roundOff, setRoundOff] = useState(false)
  const [items, setItems] = useState([defaultItem()])
  const [invNo, setInvNo] = useState('')
  const [saving, setSaving] = useState('') // '' | 'draft' | 'final'
  const [formError, setFormError] = useState('')
  const [showProblems, setShowProblems] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const pendingSave = useRef(null)
  const [invoiceCount, setInvoiceCount] = useState(0)
  const [isPro, setIsPro] = useState(false)
  const FREE_LIMIT = 3
  const { token } = useAuth()
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const refreshStatus = useCallback(() => {
    if (!token) return
    loadBilling(token, { force: true }).then(d => {
      if (!d) return
      setInvoiceCount(d.status.invoiceCount || 0)
      setIsPro(Boolean(d.status.isPro))
    })
  }, [token])

  const [f, setF] = useState(blankForm)
  const sf = k => e => setF(p => ({ ...p, [k]: e.target.value }))

  // Track which fields the user has left at least once, so validation
  // errors only appear after they're done typing — not while mid-entry.
  const [touched, setTouched] = useState({})
  const markTouched = k => () => setTouched(p => ({ ...p, [k]: true }))

  // GSTIN: force uppercase, strip anything that isn't alphanumeric, cap at 15 chars
  const setGst = k => e => {
    const v = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15)
    setF(p => ({ ...p, [k]: v }))
  }
  const setPhone = k => e => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 10)
    setF(p => ({ ...p, [k]: v }))
  }

  // Business profiles server par save karo. Sirf tab call hota hai jab user ne sach mein kuch badla ho —
  // pehle ye har state-change par chalta tha aur load fail hone par khaali list save karke sab mita sakta tha.
  // Jab tak server se list load na ho jaye tab tak kabhi save mat karo (warna adhoori list purani ko mita degi)
  const cloudLoadedRef = useRef(false)
  const persistBusinesses = useCallback((list) => {
    if (!token || !cloudLoadedRef.current) return
    patchBilling({ businesses: list })
    api('/api/invoices/businesses', token, { method: 'PUT', body: { businesses: list } }).then(r => {
      if (!r.ok) setFormError('Could not save the business profile. Check your internet connection and try again.')
    })
  }, [token])

  // Invoice numbering: for the very FIRST invoice of a business, we leave the
  // field blank so the user types their own starting number. From the second
  // invoice onward, we pick up the numeric tail of their last invoice for that
  // business and increment it — the field always stays editable.
  const genInvNo = useCallback((bizId, invoices = savedInvoices) => {
    const existing = invoices.filter(i => (i.bizId || null) === (bizId || null))
    if (existing.length === 0) return ''
    const last = [...existing].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))[0]
    const taken = new Set(existing.map(i => i.no))
    let candidate = last.no || ''
    // Agla number jo abhi tak use nahi hua
    for (let i = 0; i < 500; i++) {
      const m = candidate.match(/^(.*?)(\d+)(\D*)$/)
      if (!m) {
        candidate = `INV-${new Date().getFullYear()}-001`
        if (!taken.has(candidate)) return candidate
        continue
      }
      const [, before, digits, after] = m
      candidate = `${before}${String(parseInt(digits, 10) + 1).padStart(digits.length, '0')}${after}`
      if (!taken.has(candidate)) return candidate
    }
    return ''
  }, [savedInvoices])

  const applyBusiness = useCallback((biz, { keepInvoiceFields = false, invoices } = {}) => {
    setActiveBizId(biz.id)
    try { localStorage.setItem('zerofy-last-biz-id', biz.id) } catch { /* ignore */ }
    setF(p => ({
      ...p,
      bizName: biz.name || '', bizEmail: biz.email || '', bizPhone: biz.phone || '', bizAltPhone: biz.altPhone || '',
      bizAltEmail: biz.altEmail || '', bizGst: biz.gst || '', bizAddr: biz.addr || '', bizLogo: biz.logo || '',
      // Business ke default bank details / terms — par user ne is invoice mein kuch likha ho to use mat chhedo
      ...(keepInvoiceFields ? {} : {
        bankDetails: biz.bankDetails || '', upiId: biz.upiId || '', terms: biz.terms || '', signatory: biz.signatory || '',
      }),
    }))
    if (!keepInvoiceFields) setInvNo(genInvNo(biz.id, invoices))
  }, [genInvNo])

  const loadBusiness = id => {
    const biz = businesses.find(b => b.id === id)
    if (biz) applyBusiness(biz, { keepInvoiceFields: Boolean(editing) })
  }

  // Saved invoice ko form mein bharo (edit ya duplicate ke liye)
  const fillFromInvoice = useCallback((inv, { asCopy, invoices }) => {
    setF({
      ...blankForm(),
      bizName: inv.bizName || '', bizEmail: inv.bizEmail || '', bizPhone: inv.bizPhone || '', bizAltPhone: inv.bizAltPhone || '',
      bizAltEmail: inv.bizAltEmail || '', bizGst: inv.bizGst || '', bizAddr: inv.bizAddr || '', bizLogo: inv.bizLogo || '',
      clientName: inv.clientName || '', clientEmail: inv.clientEmail || '', clientPhone: inv.clientPhone || '',
      clientGst: inv.clientGst || '', clientAddr: inv.clientAddr || '', placeOfSupply: inv.placeOfSupply || '',
      notes: inv.notes || '', terms: inv.terms || '', bankDetails: inv.bankDetails || '', upiId: inv.upiId || '', signatory: inv.signatory || '',
      date: asCopy ? today() : (inv.date || today()),
      dueDate: asCopy ? '' : (inv.dueDate || ''),
      poNumber: asCopy ? '' : (inv.poNumber || ''),
    })
    setItems(itemsFromInvoice(inv))
    setTemplate(inv.template || 'modern')
    setCurrency(inv.currency || '₹')
    setDiscPct(Number(inv.discPct) || 0)
    setShipping(Number(inv.shipping) ? String(inv.shipping) : '')
    setRoundOff(Boolean(inv.roundOff))
    setActiveBizId(inv.bizId || null)
    if (asCopy) { setEditing(null); setInvNo(genInvNo(inv.bizId || null, invoices)) }
    else { setEditing(inv); setInvNo(inv.no || '') }
  }, [genInvNo])

  // ── Cloud load (login ke baad) ─────────────────────────────
  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      // Poora data ek hi request mein (aur dashboard se aaye ho to turant, cache se)
      const data = await loadBilling(token)
      if (cancelled) return
      if (!data) {
        setCloudLoaded(true)
        setFormError('Could not load your saved data. Refresh the page and try again.')
        return
      }
      const bizRes = { ok: true }, invRes = { ok: true }
      const invoices = data.invoices
      let bizList = [...data.businesses]
      const custList = data.customers
      setCatalog(data.items)
      setInvoiceCount(data.status.invoiceCount || 0)
      setIsPro(Boolean(data.status.isPro))

      // Recovery: ek purane bug ki wajah se business profiles save nahi ho rahe the.
      // Agar list khaali hai par invoices hain, to invoices se profiles dobara bana lo.
      if (bizRes.ok) cloudLoadedRef.current = true
      if (bizRes.ok && bizList.length === 0 && invoices.length > 0) {
        const seen = new Set()
        for (const inv of invoices) { // newest first
          const key = inv.bizId || inv.bizName
          if (!inv.bizName || !key || seen.has(key)) continue
          seen.add(key)
          bizList.push({
            id: inv.bizId || uid(), name: inv.bizName, email: inv.bizEmail || '', phone: String(inv.bizPhone || '').replace(/\D/g, '').slice(-10),
            altPhone: inv.bizAltPhone || '', altEmail: inv.bizAltEmail || '', gst: inv.bizGst || '', addr: inv.bizAddr || '',
            prefix: 'INV', logo: inv.bizLogo || '', bankDetails: inv.bankDetails || '', upiId: inv.upiId || '', terms: inv.terms || '', signatory: inv.signatory || '',
          })
        }
        if (bizList.length) persistBusinesses(bizList)
      }

      setBusinesses(bizList)
      setSavedInvoices(invoices)
      setCustomers(custList)
      if (bizRes.ok) cloudLoadedRef.current = true
      setCloudLoaded(true)
      // Login se pehle bhara hua form (pending save) — use mat chhedo
      if (pendingSave.current) return
      if (!bizRes.ok || !invRes.ok) {
        setFormError('Could not load your saved data. Refresh the page and try again.')
        return
      }

      const wantedId = editParam || copyParam
      if (wantedId) {
        const inv = invoices.find(i => i._id === wantedId)
        if (inv) { fillFromInvoice(inv, { asCopy: !editParam, invoices }); return }
        setFormError('This invoice was not found. It may have been deleted. You can create a new one.')
      }

      // Naya invoice: pichhli baar wali business apne aap select ho jaye
      let lastId = null
      try { lastId = localStorage.getItem('zerofy-last-biz-id') } catch { /* ignore */ }
      const biz = bizList.find(b => b.id === lastId) || bizList[0]
      if (biz) applyBusiness(biz, { invoices })

      if (clientParam) {
        const c = custList.find(x => x._id === clientParam)
        if (c) setF(p => ({ ...p, clientName: c.name || '', clientEmail: c.email || '', clientPhone: String(c.phone || '').replace(/\D/g, '').slice(-10), clientGst: c.gst || '', clientAddr: c.addr || '' }))
      }
    })()
    return () => { cancelled = true }
  }, [token]) // eslint-disable-line

  const handleBizSave = (biz, deleteId) => {
    let next
    if (deleteId) {
      next = businesses.filter(b => b.id !== deleteId)
      if (activeBizId === deleteId) setActiveBizId(null)
    } else {
      next = businesses.find(b => b.id === biz.id) ? businesses.map(b => b.id === biz.id ? biz : b) : [...businesses, biz]
    }
    setBusinesses(next)
    persistBusinesses(next)
    // Jo business abhi form mein khula hai (ya pehla business) use turant form mein dikhao
    if (biz && (biz.id === activeBizId || !activeBizId) && !editing) {
      applyBusiness(biz, { keepInvoiceFields: biz.id === activeBizId && Boolean(invNo) })
    }
  }

  // Form mein seedha type ki gayi business details bhi profile mein save ho jati hain,
  // taaki agli baar dobara type na karni padein.
  const upsertBusinessFromForm = () => {
    const existing = businesses.find(b => b.id === activeBizId)
      || businesses.find(b => (b.name || '').trim().toLowerCase() === f.bizName.trim().toLowerCase())
    const bizData = {
      ...(existing || {}),
      id: existing ? existing.id : uid(),
      name: f.bizName.trim(),
      email: f.bizEmail || '', phone: f.bizPhone || '', altPhone: f.bizAltPhone || '', altEmail: f.bizAltEmail || '',
      gst: f.bizGst || '', addr: f.bizAddr || '',
      prefix: existing?.prefix || 'INV',
      logo: f.bizLogo || existing?.logo || '',
      bankDetails: f.bankDetails || existing?.bankDetails || '',
      upiId: f.upiId || existing?.upiId || '',
      terms: f.terms || existing?.terms || '',
      signatory: f.signatory || existing?.signatory || '',
    }
    const next = existing ? businesses.map(b => b.id === bizData.id ? bizData : b) : [...businesses, bizData]
    if (JSON.stringify(next) !== JSON.stringify(businesses)) {
      setBusinesses(next)
      persistBusinesses(next)
    }
    setActiveBizId(bizData.id)
    try { localStorage.setItem('zerofy-last-biz-id', bizData.id) } catch { /* ignore */ }
    return bizData.id
  }

  const updateItem = (id, k, v) => setItems(p => p.map(i => i.id === id ? { ...i, [k]: v } : i))
  const removeItem = id => setItems(p => p.length > 1 ? p.filter(i => i.id !== id) : p)

  // Client picker: naam type karte hi saved clients ke suggestions; poora naam match ho to details bhar do
  const onClientName = (e) => {
    const name = e.target.value
    const match = customers.find(c => (c.name || '').trim().toLowerCase() === name.trim().toLowerCase())
    setF(p => {
      if (!match || p.clientName.trim().toLowerCase() === name.trim().toLowerCase()) return { ...p, clientName: name }
      return {
        ...p, clientName: match.name,
        clientEmail: match.email || p.clientEmail,
        clientPhone: String(match.phone || '').replace(/\D/g, '').slice(-10) || p.clientPhone,
        clientGst: match.gst || p.clientGst,
        clientAddr: match.addr || p.clientAddr,
      }
    })
  }

  // Saved items: description mein saved item ka naam aate hi rate / GST / HSN / unit bhar do
  const onItemDesc = (id, value) => {
    const match = catalog.find(c => (c.name || '').trim().toLowerCase() === value.trim().toLowerCase())
    setItems(p => p.map(it => {
      if (it.id !== id) return it
      if (!match || (it.desc || '').trim().toLowerCase() === value.trim().toLowerCase()) return { ...it, desc: value }
      return {
        ...it, desc: match.name,
        type: match.type === 'service' ? 'service' : 'goods',
        hsnSac: match.hsnSac || it.hsnSac,
        uqc: match.uqc || it.uqc,
        gstRate: match.gstRate ?? it.gstRate,
        rate: it.rate === '' || it.rate === undefined ? String(match.rate ?? '') : it.rate,
        qty: it.qty === '' || it.qty === undefined ? 1 : it.qty,
      }
    }))
  }

  // Poora invoice object — preview, totals aur save teeno isi se bante hain
  const draftInv = useMemo(() => ({
    ...f, no: invNo.trim(), template, currency, discPct, taxPct: 18,
    shipping: Number(shipping) || 0, roundOff,
    items,
    status: editing ? editing.status : 'draft',
    paidAmount: editing ? editing.paidAmount : 0,
  }), [f, invNo, template, currency, discPct, shipping, roundOff, items, editing])
  const totals = useMemo(() => calcInvoice(draftInv), [draftInv])
  const total = totals.total

  // Jo cheezein save hone se rokti hain — saaf-saaf list (pehle sirf "format sahi nahi" dikhta tha)
  const problems = useMemo(() => {
    const p = []
    if (!invNo.trim()) p.push('Enter an invoice number')
    if (!f.bizName.trim()) p.push('Enter your business name')
    if (!f.clientName.trim()) p.push('Enter the client name')
    if (totals.lines.length === 0) p.push('Add at least one item (with a description or rate)')
    else if (totals.lines.some(l => !(l.qty > 0))) p.push('Every item needs a quantity above 0')
    if (!validateEmail(f.bizEmail)) p.push('Business email is not valid')
    if (!validateEmail(f.bizAltEmail)) p.push('Business alt. email is not valid')
    if (!validateEmail(f.clientEmail)) p.push('Client email is not valid')
    if (!validateGstin(f.bizGst)) p.push('Business GSTIN must be 15 characters')
    if (!validateGstin(f.clientGst)) p.push('Client GSTIN must be 15 characters')
    if (f.bizPhone && f.bizPhone.length !== 10) p.push('Business phone must be 10 digits')
    if (f.clientPhone && f.clientPhone.length !== 10) p.push('Client phone must be 10 digits')
    if (f.dueDate && f.date && f.dueDate < f.date) p.push('Due date cannot be before the invoice date')
    if (f.upiId.trim() && !isValidUpiId(f.upiId)) p.push('UPI ID is not valid (for example yourname@upi)')
    return p
  }, [invNo, f, totals])

  // mode: 'draft' (sirf save) | 'final' (save + print)
  const saveInvoice = async (mode) => {
    setFormError('')
    if (problems.length) { setShowProblems(true); return }

    // Login required
    if (!token) {
      pendingSave.current = mode
      setShowAuthModal(true)
      return
    }

    setSaving(mode)
    const bizId = upsertBusinessFromForm()
    const wasDraft = !editing || editing.status === 'draft'
    const status = mode === 'draft'
      ? (editing && editing.status !== 'draft' ? editing.status : 'draft')
      : (wasDraft ? 'sent' : editing.status)

    const body = {
      ...f, bizLogo: '', no: invNo.trim(), bizId, status, template, currency,
      discPct: Number(discPct) || 0, taxPct: 18,
      shipping: Number(shipping) || 0, roundOff,
      items: items
        .filter(i => i.desc || Number(i.rate))
        .map(i => ({ id: i.id, type: i.type, desc: i.desc, hsnSac: i.hsnSac, uqc: i.uqc || 'PCS', qty: Number(i.qty) || 0, rate: Number(i.rate) || 0, gstRate: Number(i.gstRate) || 0 })),
    }

    const res = editing
      ? await api(`/api/invoices/${editing._id}`, token, { method: 'PUT', body })
      : await api('/api/invoices', token, { method: 'POST', body: { ...body, countUsage: true } })

    if (!res.ok || !res.data.success) setSaving('')
    if (res.status === 403 && res.data.error === 'free_limit_reached') {
      setInvoiceCount(res.data.invoiceCount || FREE_LIMIT)
      setShowUpgradeModal(true)
      return
    }
    if (!res.ok || !res.data.success) {
      setFormError(res.data.message || res.data.error || 'Could not save the invoice. Please try again.')
      return
    }

    const saved = { ...res.data.invoice, bizLogo: f.bizLogo || '' }
    if (res.data.invoiceCount !== undefined) setInvoiceCount(res.data.invoiceCount)
    // List ko naye invoice ke saath taaza karo, phir wahan le jao
    await loadBilling(token, { force: true })
    navigate('/app/invoices')
    if (mode === 'final') printInvoice(saved, { hideBranding: isPro })
  }

  // Login ke baad jo save pending tha use poora karo
  useEffect(() => {
    if (token && cloudLoaded && pendingSave.current) {
      const mode = pendingSave.current
      pendingSave.current = null
      saveInvoice(mode)
    }
  }, [token, cloudLoaded]) // eslint-disable-line

  const limitReached = Boolean(token) && !isPro && !editing && invoiceCount >= FREE_LIMIT
  const sellerState = stateCodeOf(f.bizGst)
  const busy = Boolean(saving)
  const mono = { fontFamily: "'IBM Plex Mono', monospace" }

  return (
    <div className="ig-root">
      {/* TOP BAR */}
      <div className="ig-top">
        <div className="ig-top-inner">
          <div className="ig-top-left">
            <button className="ig-back" onClick={() => navigate(token ? '/app/invoices' : '/')}>‹ Invoices</button>
            <div className="ig-vsep" />
            <div className="ig-brand">
              <div className="ig-name">{editing ? `Edit invoice ${editing.no}` : 'New invoice'}</div>
            </div>
          </div>
          <div className="ig-actions">
            <button className="btn" onClick={() => setShowBizModal(true)}>
              Business profiles {businesses.length > 0 && <span style={{ background: 'var(--card2)', color: 'var(--text2)', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>{businesses.length}</span>}
            </button>
            <select className="inp" aria-label="Currency" value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: 'auto', padding: '8px 12px' }}>
              {CURRENCIES.map(c => <option key={c.sym} value={c.sym}>{c.sym} {c.code}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="ig-layout">

        {/* LEFT — FORM */}
        <div className="ig-left">

          {token && !cloudLoaded && (
            <div className="ig-banner" role="status">Loading your saved business, clients and items…</div>
          )}

          {editing && (
            <div className="ig-banner">
              You are editing saved invoice <strong>{editing.no}</strong>. Saving updates the same invoice and does not use up a free invoice.
            </div>
          )}

          {/* Invoice No + dates */}
          <div className="ig-card" style={{ paddingBottom: 14 }}>
            <div className="meta-grid">
              <div className="field">
                <label className="lbl">Invoice No. *</label>
                <input className={`inp ${showProblems && !invNo.trim() ? 'inp-err' : ''}`} style={mono}
                  value={invNo} onChange={e => setInvNo(e.target.value)} maxLength={30}
                  placeholder="e.g. INV-2026-001" />
              </div>
              <div className="field">
                <label className="lbl">Invoice Date</label>
                <input type="date" className="inp" value={f.date} onChange={sf('date')} />
              </div>
              <div className="field">
                <label className="lbl">Due Date</label>
                <input type="date" className="inp" value={f.dueDate} min={f.date || undefined} onChange={sf('dueDate')} />
              </div>
              <div className="field">
                <label className="lbl">PO / Ref No.</label>
                <input className="inp" value={f.poNumber} onChange={sf('poNumber')} maxLength={40} placeholder="Optional" />
              </div>
            </div>
            <div className="due-chips">
              <span>Due in:</span>
              {[0, 7, 15, 30, 45].map(d => (
                <button key={d} type="button"
                  className={`biz-pill ${f.dueDate && f.dueDate === addDays(f.date, d) ? 'on' : ''}`}
                  onClick={() => setF(p => ({ ...p, dueDate: addDays(p.date, d) }))}>
                  {d === 0 ? 'On receipt' : `${d} days`}
                </button>
              ))}
              {f.dueDate && <button type="button" className="biz-pill" onClick={() => setF(p => ({ ...p, dueDate: '' }))}>Clear</button>}
            </div>
            {!invNo.trim() && !editing && (
              <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 8 }}>
                This is the first invoice for this business, so enter your starting invoice number. After this, each new invoice is numbered automatically (you can still change it).
              </div>
            )}
          </div>

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
                <button className="biz-pill" style={{ color: 'var(--accent-deep)', borderColor: 'rgba(239,160,47,0.35)', background: 'var(--accent-dim)' }}
                  onClick={() => setShowBizModal(true)}>+ Add / Edit</button>
              </div>
            </div>
          )}

          {/* From + Bill To */}
          <div className="grid-2">
            <div className="ig-card">
              <div className="sec-label"><span className="sec-dot" />From (Your Business)</div>
              <div className="field"><label className="lbl">Business Name *</label><input className={`inp ${showProblems && !f.bizName.trim() ? 'inp-err' : ''}`} value={f.bizName} onChange={sf('bizName')} placeholder="Your Company Pvt Ltd" /></div>
              <div className="field">
                <label className="lbl">Email</label>
                <input
                  className={`inp ${touched.bizEmail && !validateEmail(f.bizEmail) ? 'inp-err' : ''}`}
                  type="email" value={f.bizEmail} onChange={sf('bizEmail')} onBlur={markTouched('bizEmail')}
                  placeholder="hello@company.com"
                />
                <FieldError show={touched.bizEmail && !validateEmail(f.bizEmail)} message="Enter a valid email, for example hello@company.com" />
              </div>
              <div className="field"><label className="lbl">Phone</label><input className="inp" value={f.bizPhone} onChange={setPhone('bizPhone')} placeholder="10-digit number" maxLength={10} inputMode="numeric" pattern="[0-9]*" /></div>
              <div className="field">
                <label className="lbl">GSTIN</label>
                <input
                  className={`inp ${touched.bizGst && !validateGstin(f.bizGst) ? 'inp-err' : ''}`}
                  value={f.bizGst} onChange={setGst('bizGst')} onBlur={markTouched('bizGst')}
                  placeholder="22AAAAA0000A1Z5" maxLength={15}
                />
                <FieldError show={touched.bizGst && !validateGstin(f.bizGst)} message="GSTIN must be 15 characters, for example 22AAAAA0000A1Z5" />
              </div>
              <div className="field"><label className="lbl">Alt. Phone <span style={{ fontSize: 9, color: 'var(--text3)' }}>(optional)</span></label><input className="inp" value={f.bizAltPhone} onChange={setPhone('bizAltPhone')} placeholder="10-digit number" maxLength={10} inputMode="numeric" pattern="[0-9]*" /></div>
              <div className="field">
                <label className="lbl">Alt. Email <span style={{ fontSize: 9, color: 'var(--text3)' }}>(optional)</span></label>
                <input
                  className={`inp ${touched.bizAltEmail && !validateEmail(f.bizAltEmail) ? 'inp-err' : ''}`}
                  type="email" value={f.bizAltEmail} onChange={sf('bizAltEmail')} onBlur={markTouched('bizAltEmail')}
                  placeholder="alt@company.com"
                />
                <FieldError show={touched.bizAltEmail && !validateEmail(f.bizAltEmail)} message="Enter a valid email, for example alt@company.com" />
              </div>
              <div className="field"><label className="lbl">Address</label><textarea className="inp" rows={2} value={f.bizAddr} onChange={sf('bizAddr')} placeholder="Street, City, State, PIN" /></div>
            </div>
            <div className="ig-card">
              <div className="sec-label"><span className="sec-dot" style={{ background: 'var(--blue)' }} />Bill To (Client)</div>
              <div className="field">
                <label className="lbl">Client Name *</label>
                <input className={`inp ${showProblems && !f.clientName.trim() ? 'inp-err' : ''}`} list="zerofy-client-list"
                  value={f.clientName} onChange={onClientName} placeholder={customers.length ? 'Type a name or pick a saved client' : 'Client Company'} autoComplete="off" />
                <datalist id="zerofy-client-list">
                  {customers.map(c => <option key={c._id} value={c.name}>{[c.phone, c.gst].filter(Boolean).join(' · ')}</option>)}
                </datalist>
              </div>
              <div className="field">
                <label className="lbl">Email</label>
                <input
                  className={`inp ${touched.clientEmail && !validateEmail(f.clientEmail) ? 'inp-err' : ''}`}
                  type="email" value={f.clientEmail} onChange={sf('clientEmail')} onBlur={markTouched('clientEmail')}
                  placeholder="client@email.com"
                />
                <FieldError show={touched.clientEmail && !validateEmail(f.clientEmail)} message="Enter a valid email, for example client@email.com" />
              </div>
              <div className="field"><label className="lbl">Phone</label><input className="inp" value={f.clientPhone} onChange={setPhone('clientPhone')} placeholder="10-digit number" maxLength={10} inputMode="numeric" pattern="[0-9]*" /></div>
              <div className="field">
                <label className="lbl">GSTIN</label>
                <input
                  className={`inp ${touched.clientGst && !validateGstin(f.clientGst) ? 'inp-err' : ''}`}
                  value={f.clientGst} onChange={setGst('clientGst')} onBlur={markTouched('clientGst')}
                  placeholder="Client GSTIN" maxLength={15}
                />
                <FieldError show={touched.clientGst && !validateGstin(f.clientGst)} message="GSTIN must be 15 characters, for example 22AAAAA0000A1Z5" />
              </div>
              <div className="field">
                <label className="lbl">Place of Supply</label>
                <select className="inp" value={f.placeOfSupply} onChange={sf('placeOfSupply')}>
                  <option value="">{stateCodeOf(f.clientGst) ? `Auto — ${stateName(stateCodeOf(f.clientGst))} (from client GSTIN)` : 'Auto (from client GSTIN)'}</option>
                  {GST_STATES.map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
                </select>
                {sellerState && (
                  <div style={{ fontSize: 10.5, color: 'var(--text3)', marginTop: 4 }}>
                    {totals.inter ? 'Supply to another state: IGST applies' : 'Same state (or state not known): CGST + SGST apply'}
                  </div>
                )}
              </div>
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
                  <select className="inp" aria-label="Item type" value={it.type}
                    onChange={e => { updateItem(it.id, 'type', e.target.value); updateItem(it.id, 'hsnSac', '') }}>
                    <option value="goods">Goods</option>
                    <option value="service">Service</option>
                  </select>
                </div>
                {/* Description */}
                <div>
                  <input className="inp" aria-label="Item description" list="zerofy-item-list" autoComplete="off"
                    value={it.desc} onChange={e => onItemDesc(it.id, e.target.value)}
                    placeholder={catalog.length ? 'Type a name or pick a saved item' : 'Item description…'} />
                  {it.hsnSac && (
                    <div style={{ marginTop: 3, fontSize: 10, color: 'var(--text3)' }}>
                      {it.type === 'goods' ? 'HSN' : 'SAC'}: <span style={{ color: 'var(--accent-deep)', fontWeight: 700 }}>{it.hsnSac}</span>
                    </div>
                  )}
                </div>
                {/* HSN/SAC */}
                <div>
                  <CodePicker key={`${it.type}:${it.hsnSac}`} type={it.type} value={it.hsnSac}
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
                  <select className="inp" aria-label="GST rate" value={it.gstRate}
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
                    aria-label="Custom GST rate"
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
                  <select className="inp" aria-label="Unit" value={it.uqc || 'PCS'}
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
                  <input className="inp" type="number" min="0" step="any" aria-label="Quantity" value={it.qty}
                    onChange={e => updateItem(it.id, 'qty', e.target.value === '' ? '' : Math.max(0, +e.target.value))}
                    placeholder="Qty"
                    style={{ textAlign: 'center' }} />
                </div>
                {/* Rate */}
                <div>
                  <input className="inp" type="number" min="0" step="any" aria-label="Rate" value={it.rate}
                    onChange={e => updateItem(it.id, 'rate', e.target.value === '' ? '' : String(Math.max(0, +e.target.value)))}
                    placeholder="0.00" style={{ textAlign: 'right' }} />
                </div>
                {/* Amount (auto) */}
                <div style={{ paddingTop: 8, textAlign: 'right' }}>
                  <span style={{
                    ...mono, fontSize: 12, fontWeight: 700,
                    color: (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0) > 0 ? 'var(--accent)' : 'var(--text3)'
                  }}>
                    {fmt((parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0), currency)}
                  </span>
                </div>
                {/* Remove */}
                <div style={{ paddingTop: 8 }}>
                  <button className="btn btn-icon btn-ghost btn-sm" onClick={() => removeItem(it.id)} aria-label="Remove item"
                    disabled={items.length === 1}
                    style={{ color: 'var(--red)', fontSize: 16, lineHeight: 1, opacity: items.length === 1 ? 0.3 : 1 }}>×</button>
                </div>
              </div>
            ))}

            <datalist id="zerofy-item-list">
              {catalog.map(c => <option key={c._id} value={c.name}>{`${fmt(c.rate, currency)} · GST ${c.gstRate}%`}</option>)}
            </datalist>
            <div style={{ fontSize: 10.5, color: 'var(--text3)', marginTop: 8 }}>
              Items you add here are saved automatically. Next time, just pick the name.
            </div>

            {/* Totals */}
            <div className="totals">
              <div className="t-row"><span>Subtotal (excl. GST)</span><span style={mono}>{fmt(totals.sub, currency)}</span></div>
              <div className="t-row">
                <span>Discount <input type="number" min="0" max="100" step="any" aria-label="Discount percent" value={discPct}
                  onChange={e => setDiscPct(Math.min(100, Math.max(0, +e.target.value || 0)))} className="pct-inp" />%</span>
                <span style={{ ...mono, color: totals.disc > 0 ? 'var(--green)' : 'var(--text3)' }}>−{fmt(totals.disc, currency)}</span>
              </div>
              {totals.split ? (
                totals.inter
                  ? <div className="t-row"><span>IGST</span><span style={mono}>{fmt(totals.igst, currency)}</span></div>
                  : <>
                    <div className="t-row"><span>CGST</span><span style={mono}>{fmt(totals.cgst, currency)}</span></div>
                    <div className="t-row"><span>SGST</span><span style={mono}>{fmt(totals.sgst, currency)}</span></div>
                  </>
              ) : (
                <div className="t-row"><span>GST (on the value after discount)</span><span style={mono}>{fmt(totals.gst, currency)}</span></div>
              )}
              <div className="t-row">
                <span>Shipping / other charges</span>
                <input type="number" min="0" step="any" aria-label="Shipping or other charges" value={shipping}
                  onChange={e => setShipping(e.target.value === '' ? '' : String(Math.max(0, +e.target.value)))}
                  className="pct-inp" style={{ width: 110, textAlign: 'right' }} placeholder="0.00" />
              </div>
              <div className="t-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={roundOff} onChange={e => setRoundOff(e.target.checked)} />
                  Round off the total
                </label>
                <span style={{ ...mono, color: 'var(--text3)' }}>{totals.roundAdj !== 0 ? `${totals.roundAdj > 0 ? '+' : '−'}${fmt(Math.abs(totals.roundAdj), currency)}` : ''}</span>
              </div>
              <div className="t-row grand"><span>Total</span><span>{fmt(total, currency)}</span></div>
            </div>
          </div>

          {/* Payment details, notes, terms */}
          <div className="ig-card">
            <div className="sec-label"><span className="sec-dot" style={{ background: 'var(--green)' }} />Payment details &amp; notes (optional)</div>
            <div className="grid-2">
              <div className="field"><label className="lbl">Bank details</label><textarea className="inp" rows={3} value={f.bankDetails} onChange={sf('bankDetails')} placeholder={'Account name\nAccount no.\nIFSC · Bank & branch'} /></div>
              <div>
                <div className="field">
                  <label className="lbl">UPI ID</label>
                  <input className={`inp ${f.upiId.trim() && !isValidUpiId(f.upiId) ? 'inp-err' : ''}`} value={f.upiId} onChange={e => setF(p => ({ ...p, upiId: e.target.value.trim() }))} placeholder="yourname@upi" />
                  <div style={{ fontSize: 10.5, color: 'var(--text3)', marginTop: 4 }}>Add a UPI ID and a "Scan to pay" QR code appears on the invoice.</div>
                </div>
                <div className="field"><label className="lbl">Signatory name</label><input className="inp" value={f.signatory} onChange={sf('signatory')} placeholder="Authorised Signatory" /></div>
              </div>
            </div>
            <div className="field"><label className="lbl">Notes</label><textarea className="inp" rows={2} value={f.notes} onChange={sf('notes')} placeholder="Thank you note, delivery details…" /></div>
            <div className="field"><label className="lbl">Terms &amp; conditions</label><textarea className="inp" rows={2} value={f.terms} onChange={sf('terms')} placeholder="Payment due within 15 days…" /></div>
            <div style={{ fontSize: 10.5, color: 'var(--text3)' }}>Bank details, UPI, signatory and terms are saved to your business profile and filled in on your next invoice.</div>
          </div>

        </div>

        {/* RIGHT — PREVIEW + SAVE */}
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

            {/* Save area */}
            <div className="gen-area">
              <div className="gen-label">Invoice total</div>
              <div className="gen-total">{fmt(total, currency)}</div>
              {f.dueDate && <div className="gen-note" style={{ marginTop: 4 }}>Due {formatDate(f.dueDate)}</div>}

              {/* Free limit indicator */}
              {token && !isPro && !editing && (
                limitReached ? (
                  <div style={{
                    margin: '14px 0 0', padding: '14px 16px',
                    background: '#FCEFD9',
                    border: '1px solid rgba(239,160,47,0.45)', borderRadius: 12, textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#A85E08', marginBottom: 4 }}>
                      You have used all {FREE_LIMIT} free invoices
                    </div>
                    <div style={{ fontSize: 12, color: '#44566B', lineHeight: 1.5, marginBottom: 10 }}>
                      Unlimited invoices on Pro, from <strong style={{ color: '#A85E08' }}>₹49/month</strong>
                    </div>
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      style={{
                        padding: '8px 18px', borderRadius: 20, border: 'none',
                        background: '#EFA02F',
                        color: '#12263F', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      Upgrade to Pro
                    </button>
                  </div>
                ) : (
                  <div className="gen-note" style={{ marginTop: 6 }}>
                    {FREE_LIMIT - invoiceCount} of {FREE_LIMIT} free invoices left
                  </div>
                )
              )}

              {!limitReached && (
                <>
                  <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-accent" onClick={() => saveInvoice('final')} disabled={busy}
                      style={{ fontSize: 14, padding: '10px 22px', opacity: busy ? 0.6 : 1, cursor: busy ? 'wait' : 'pointer' }}>
                      {saving === 'final' ? 'Saving…' : 'Save & print'}
                    </button>
                    <button className="btn" onClick={() => saveInvoice('draft')} disabled={busy}
                      style={{ fontSize: 13, padding: '10px 16px', opacity: busy ? 0.6 : 1, cursor: busy ? 'wait' : 'pointer' }}>
                      {saving === 'draft' ? 'Saving…' : (editing && editing.status !== 'draft' ? 'Save changes' : 'Save as draft')}
                    </button>
                  </div>
                  <div className="gen-note">
                    Save &amp; print saves the invoice and opens the print / PDF dialog
                  </div>
                </>
              )}

              {showProblems && problems.length > 0 && (
                <div className="ig-problems" role="alert">
                  <strong>Fix these before saving:</strong>
                  <ul>{problems.map(p => <li key={p}>{p}</li>)}</ul>
                </div>
              )}
              {formError && <div className="ig-problems" role="alert">{formError}</div>}
            </div>

            {/* Upgrade Modal — Razorpay integrated */}
            {showUpgradeModal && (
              <>
                <div onClick={() => setShowUpgradeModal(false)} style={{
                  position: 'fixed', inset: 0, zIndex: 2000,
                  background: 'rgba(18,38,63,0.45)', backdropFilter: 'blur(6px)'
                }} />
                <div style={{
                  position: 'fixed', inset: 0, zIndex: 2001,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
                }}>
                  <div style={{
                    background: '#FFFFFF', border: '1px solid #DDE1D9',
                    borderRadius: 20, padding: '36px 28px',
                    maxWidth: 420, width: '100%', textAlign: 'center',
                    boxShadow: '0 24px 60px rgba(18,38,63,0.22)',
                    animation: 'slideUp 0.25s ease', position: 'relative',
                  }}>
                    <button onClick={() => setShowUpgradeModal(false)} aria-label="Close" style={{ position: 'absolute', top: 14, right: 14, background: '#EEF0EA', border: '1px solid #DDE1D9', borderRadius: 8, width: 30, height: 30, color: '#44566B', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    <h2 style={{
                      fontFamily: "'Fraunces', Georgia, serif",
                      fontSize: 24, fontWeight: 600, margin: '0 0 8px', color: '#12263F',
                    }}>Unlimited invoices with Pro</h2>
                    <p style={{ color: '#44566B', fontSize: 13, marginBottom: 22, lineHeight: 1.6 }}>
                      You've used <strong style={{ color: '#12263F' }}>{FREE_LIMIT} free invoices</strong>. Upgrade to Pro for unlimited invoice generation. Your form is safe and will still be here.
                    </p>
                    <UpgradePaymentFlow
                      token={token}
                      API={API}
                      onSuccess={() => {
                        setShowUpgradeModal(false)
                        refreshStatus()
                      }}
                      onClose={() => setShowUpgradeModal(false)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Live preview */}
            <div className="sec-label" style={{ margin: '18px 0 10px' }}><span className="sec-dot" />Live Preview</div>
            <div className="prev-frame">
              <div className="prev-box" id="ig-print-zone">
                <InvoicePreview inv={draftInv} hideBranding={isPro} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBizModal && <BizModal businesses={businesses} onSave={handleBizSave} onClose={() => setShowBizModal(false)} />}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false)
          // Login safal hua ho to token turant localStorage mein aa jata hai — tabhi pending save rakho
          let loggedIn = false
          try { loggedIn = Boolean(localStorage.getItem('zerofy-token')) } catch { /* ignore */ }
          if (!loggedIn) pendingSave.current = null
        }}
        defaultTab="login"
      />
    </div>
  )
}
