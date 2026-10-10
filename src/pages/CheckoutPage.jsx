import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../utils/api'
import { loadBilling } from '../utils/billingStore'
import { GST_STATES, stateCodeOf, formatDate } from '../utils/invoiceCalc'
import { downloadPurchaseInvoice } from '../utils/purchaseInvoice'
import styles from './CheckoutPage.module.css'

/* Checkout for Zerofy Pro.
   Left: who the bill is for.  Right: what they pay — plan, coupon, GST, total — and the Pay button.
   Every amount on this page comes from the server (/api/payment/quote); the page never works out a price itself. */

const rupees = (paise) => `₹${(Math.round(Number(paise) || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const whole = (paise) => `₹${Math.round((Number(paise) || 0) / 100).toLocaleString('en-IN')}`
const blank = { name: '', firm: '', phone: '', email: '', address: '', state: '', pincode: '', gstin: '' }

const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve()
  const s = document.createElement('script')
  s.src = 'https://checkout.razorpay.com/v1/checkout.js'
  s.onload = resolve
  s.onerror = () => reject(new Error('Could not load the payment screen. Check your internet connection and try again.'))
  document.head.appendChild(s)
})

const lock = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>

export default function CheckoutPage() {
  const { token, user, initializing } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const [plans, setPlans] = useState(null)
  const [gstEnabled, setGstEnabled] = useState(false)
  const [planId, setPlanId] = useState(params.get('plan') === 'monthly' ? 'monthly' : 'yearly')
  const [mode, setMode] = useState('once') // 'once' | 'auto'
  const [b, setB] = useState(blank)
  const [account, setAccount] = useState(null) // { isPro, proExpiry }
  const [loaded, setLoaded] = useState(false)

  const [couponOpen, setCouponOpen] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState('') // applied code
  const [couponError, setCouponError] = useState('')
  const [couponBusy, setCouponBusy] = useState(false)
  const [salesOpen, setSalesOpen] = useState(false)
  const [salesCode, setSalesCode] = useState(params.get('ref') || '')

  const [quote, setQuote] = useState(null)
  const [showProblems, setShowProblems] = useState(false)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)
  const [done, setDone] = useState(null) // { purchase, proExpiry }
  const [busyPdf, setBusyPdf] = useState(false)

  // Not logged in → log in first, then come straight back here
  useEffect(() => {
    if (initializing || token) return
    try { sessionStorage.setItem('zerofy-after-login', `/checkout?plan=${planId}`) } catch { /* ignore */ }
    navigate('/', { replace: true })
  }, [initializing, token]) // eslint-disable-line

  useEffect(() => {
    if (!token) return
    let off = false
    Promise.all([api('/api/payment/plans', token), api('/api/payment/checkout-info', token)]).then(([p, info]) => {
      if (off) return
      if (p.ok) { setPlans(p.data.plans); setGstEnabled(Boolean(p.data.gstEnabled)) }
      else setError('Could not load the plans. Refresh the page and try again.')
      if (info.ok) {
        setB({ ...blank, ...info.data.billing })
        setAccount({ isPro: info.data.isPro, proExpiry: info.data.proExpiry })
      }
      setLoaded(true)
    })
    return () => { off = true }
  }, [token])

  const plan = plans?.find(p => p.id === planId) || null
  const canAuto = Boolean(plan?.autoPay)
  useEffect(() => { if (!canAuto && mode === 'auto') setMode('once') }, [canAuto, mode])
  // A coupon cannot be used with Auto Pay
  const effectiveCoupon = mode === 'auto' ? '' : coupon

  // Ask the server for the price break-up whenever something that changes it changes
  const quoteSeq = useRef(0)
  useEffect(() => {
    if (!token || !plans) return
    const seq = ++quoteSeq.current
    api('/api/payment/quote', token, { method: 'POST', body: { planId, mode, couponCode: effectiveCoupon, state: b.state } }).then(res => {
      if (seq !== quoteSeq.current) return
      if (res.ok) setQuote(res.data.quote)
      else if (effectiveCoupon) { setCoupon(''); setCouponError(res.data.error || 'This coupon code is not valid'); setCouponOpen(true) }
    })
  }, [token, plans, planId, mode, effectiveCoupon, b.state])

  const set = (k) => (e) => setB(p => ({ ...p, [k]: e.target.value }))
  const setPhone = (e) => setB(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))
  const setPin = (e) => setB(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))
  const setGstin = (e) => {
    const v = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15)
    // A full GSTIN tells us the state — fill it in
    setB(p => ({ ...p, gstin: v, state: v.length === 15 && stateCodeOf(v) ? stateCodeOf(v) : p.state }))
  }

  const problems = useMemo(() => {
    const p = {}
    if (b.name.trim().length < 2) p.name = 'Enter your name'
    if (b.phone.length !== 10) p.phone = 'Enter a 10-digit mobile number'
    if (b.address.trim().length < 5) p.address = 'Enter your address'
    if (!b.state) p.state = 'Choose your state'
    if (b.pincode.length !== 6) p.pincode = 'Enter a 6-digit PIN code'
    if (b.gstin && b.gstin.length !== 15) p.gstin = 'GSTIN must be 15 characters'
    else if (b.gstin && b.state && stateCodeOf(b.gstin) !== b.state) p.gstin = 'This GSTIN does not match the state you chose'
    return p
  }, [b])
  const problemList = Object.values(problems)
  const bad = (k) => showProblems && problems[k]

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setCouponBusy(true); setCouponError('')
    const res = await api('/api/payment/quote', token, { method: 'POST', body: { planId, mode: 'once', couponCode: code, state: b.state } })
    setCouponBusy(false)
    if (!res.ok) { setCouponError(res.data.error || 'This coupon code is not valid'); return }
    if (mode === 'auto') setMode('once')
    setCoupon(code); setCouponInput(''); setCouponOpen(false)
  }
  const removeCoupon = () => { setCoupon(''); setCouponError('') }

  const choosePlan = (id) => { setPlanId(id); setParams(p => { p.set('plan', id); return p }, { replace: true }) }

  const pay = async () => {
    setError('')
    if (problemList.length) { setShowProblems(true); return }
    setPaying(true)
    try {
      await loadRazorpay()
      const res = await api('/api/payment/checkout', token, {
        method: 'POST', body: { planId, mode, couponCode: effectiveCoupon, salesCode: salesCode.trim(), billing: b },
      })
      if (!res.ok) throw new Error(res.data.message || res.data.error || 'Could not start the payment. Please try again.')
      const o = res.data
      setQuote(o.quote)

      const finish = async (path, body) => {
        const v = await api(path, token, { method: 'POST', body })
        if (!v.ok) { setError('Your payment went through but we could not confirm it. Please contact support@zerofy.co.in — do not pay again.'); setPaying(false); return }
        const list = await api('/api/payment/purchases', token)
        const purchase = list.ok ? list.data.purchases.find(x => x._id === o.purchaseId) : null
        // Bring the account's Pro status up to date everywhere, including the login session
        try {
          const saved = JSON.parse(localStorage.getItem('zerofy-user') || '{}')
          localStorage.setItem('zerofy-user', JSON.stringify({ ...saved, isPro: true, proExpiry: v.data.proExpiry }))
        } catch { /* ignore */ }
        loadBilling(token, { force: true })
        setDone({ purchase, proExpiry: v.data.proExpiry })
        setPaying(false)
        window.scrollTo(0, 0)
      }

      const common = {
        key: o.keyId, name: 'Zerofy', description: o.planName,
        prefill: { name: b.name, email: b.email || user?.email || '', contact: b.phone },
        notes: { purchaseId: o.purchaseId },
        theme: { color: '#12263F' },
        modal: { ondismiss: () => setPaying(false) },
      }
      const rzp = new window.Razorpay(o.mode === 'auto'
        ? { ...common, subscription_id: o.subscriptionId, handler: (r) => finish('/api/payment/verify-subscription', r) }
        : { ...common, order_id: o.orderId, amount: o.amount, currency: o.currency, handler: (r) => finish('/api/payment/verify', r) })
      if (rzp.on) rzp.on('payment.failed', (r) => { setError(r?.error?.description || 'The payment did not go through. Please try again.'); setPaying(false) })
      rzp.open()
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
      setPaying(false)
    }
  }

  if (initializing || !token) return null

  const header = (
    <header className={styles.top}>
      <div className={styles.topInner}>
        <Link to="/app" className={styles.brand}><span className={styles.mark}>Z</span><span className={styles.word}>ZEROFY</span></Link>
        <span className={styles.secure}>{lock} Secure checkout · payments by Razorpay</span>
        {!done && <button className={styles.back} onClick={() => navigate('/pricing')}>‹ Back to plans</button>}
      </div>
    </header>
  )

  /* ── After payment ── */
  if (done) {
    const p = done.purchase
    return (
      <div className={styles.page}>
        {header}
        <div className={styles.wrap}>
          <div className={`${styles.card} ${styles.success}`} role="status">
            <div className={styles.tick}><svg viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></div>
            <h1 className={styles.title}>Payment successful</h1>
            <p className={styles.sub}>Zerofy Pro is now active on your account. You can create unlimited invoices.</p>
            <div className={styles.successRows}>
              {p && <div className={styles.row}><span>Invoice no.</span><span>{p.receiptNo}</span></div>}
              {p && <div className={styles.row}><span>Plan</span><span style={{ fontFamily: 'inherit' }}>{p.planName}</span></div>}
              {p && <div className={styles.row}><span>Amount paid</span><span>{rupees(p.total)}</span></div>}
              <div className={styles.row}><span>Pro valid till</span><span style={{ fontFamily: 'inherit' }}>{formatDate(String(done.proExpiry).slice(0, 10))}</span></div>
            </div>
            <div className={styles.btnRow}>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => navigate('/app')}>Go to my billing app</button>
              {p && (
                <button className={styles.btn} disabled={busyPdf} onClick={async () => { setBusyPdf(true); try { await downloadPurchaseInvoice(p) } finally { setBusyPdf(false) } }}>
                  {busyPdf ? 'Preparing…' : 'Download invoice'}
                </button>
              )}
            </div>
            <p className={styles.fine}>You can download this invoice again any time from Settings → Billing &amp; plan.</p>
          </div>
        </div>
      </div>
    )
  }

  const validTill = (() => {
    if (!quote) return ''
    const from = account?.isPro && account.proExpiry && new Date(account.proExpiry) > new Date() ? new Date(account.proExpiry) : new Date()
    from.setDate(from.getDate() + quote.days)
    return formatDate(`${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`)
  })()

  return (
    <div className={styles.page}>
      {header}
      <div className={styles.wrap}>
        <div className={styles.steps} aria-hidden="true">
          <span className={styles.done}><i>✓</i> Plan</span><b />
          <span className={styles.on}><i>2</i> Your details</span><b />
          <span><i>3</i> Payment</span>
        </div>
        <h1 className={styles.title}>Checkout</h1>
        <p className={styles.sub}>Tell us who the invoice is for, check the amount, and pay.</p>

        {account?.isPro && (
          <div className={styles.notice}>
            You already have Pro till {formatDate(String(account.proExpiry).slice(0, 10))}. Paying again adds the new period after that date — you do not lose any days.
          </div>
        )}

        <div className={styles.grid}>
          {/* LEFT */}
          <div>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Plan</h2>
              <p className={styles.cardSub}>Both plans give you unlimited invoices.</p>
              <div className={styles.choices} role="radiogroup" aria-label="Plan">
                {(plans || [{ id: 'monthly' }, { id: 'yearly' }]).map(p => (
                  <button key={p.id} type="button" role="radio" aria-checked={planId === p.id}
                    className={`${styles.choice} ${planId === p.id ? styles.choiceOn : ''}`} onClick={() => choosePlan(p.id)}>
                    <div className={styles.choiceName}>{p.id === 'yearly' ? 'Yearly' : 'Monthly'}{p.id === 'yearly' && <span className={styles.tag}>Best value</span>}</div>
                    {p.price
                      ? <div className={styles.choicePrice}>{whole(p.price)}{p.listPrice > p.price && <s>{whole(p.listPrice)}</s>}</div>
                      : <div className={styles.skel} style={{ width: 90, margin: '10px 0 6px' }} />}
                    <div className={styles.choiceNote}>{p.id === 'yearly' ? 'For 12 months. Launch offer.' : 'For 1 month.'}</div>
                  </button>
                ))}
              </div>

              {canAuto && (
                <>
                  <h2 className={styles.cardTitle} style={{ marginTop: 20 }}>How do you want to pay?</h2>
                  <div className={styles.choices} role="radiogroup" aria-label="Payment type" style={{ marginTop: 10 }}>
                    <button type="button" role="radio" aria-checked={mode === 'once'} className={`${styles.choice} ${mode === 'once' ? styles.choiceOn : ''}`} onClick={() => setMode('once')}>
                      <div className={styles.choiceName}>One-time payment</div>
                      <div className={styles.choiceNote}>Pay once. Nothing is charged again unless you choose to renew.</div>
                    </button>
                    <button type="button" role="radio" aria-checked={mode === 'auto'} className={`${styles.choice} ${mode === 'auto' ? styles.choiceOn : ''}`} onClick={() => setMode('auto')}>
                      <div className={styles.choiceName}>Auto Pay</div>
                      <div className={styles.choiceNote}>Renews by itself every {plan.period}. Cancel any time from Billing &amp; plan.</div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Billing details</h2>
              <p className={styles.cardSub}>These details are printed on your invoice from Zerofy.</p>
              <div className={styles.fields}>
                <div className={styles.field}>
                  <label htmlFor="co-name">Your name *</label>
                  <input id="co-name" className={`${styles.inp} ${bad('name') ? styles.inpErr : ''}`} value={b.name} onChange={set('name')} maxLength={80} autoComplete="name" placeholder="Full name" />
                  {bad('name') && <div className={styles.err}>{problems.name}</div>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="co-firm">Firm / organisation name <em>(optional)</em></label>
                  <input id="co-firm" className={styles.inp} value={b.firm} onChange={set('firm')} maxLength={120} autoComplete="organization" placeholder="Business name" />
                </div>
                <div className={styles.field}>
                  <label htmlFor="co-phone">Mobile number *</label>
                  <input id="co-phone" className={`${styles.inp} ${bad('phone') ? styles.inpErr : ''}`} value={b.phone} onChange={setPhone} inputMode="numeric" autoComplete="tel-national" placeholder="10-digit number" />
                  {bad('phone') && <div className={styles.err}>{problems.phone}</div>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="co-email">Email</label>
                  <input id="co-email" className={styles.inp} value={b.email || user?.email || ''} disabled />
                  <div className={styles.hint}>Your Zerofy account email.</div>
                </div>
                <div className={`${styles.field} ${styles.full}`}>
                  <label htmlFor="co-address">Address *</label>
                  <textarea id="co-address" className={`${styles.inp} ${bad('address') ? styles.inpErr : ''}`} value={b.address} onChange={set('address')} maxLength={300} rows={2} autoComplete="street-address" placeholder="Building, street, city" />
                  {bad('address') && <div className={styles.err}>{problems.address}</div>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="co-state">State *</label>
                  <select id="co-state" className={`${styles.inp} ${bad('state') ? styles.inpErr : ''}`} value={b.state} onChange={set('state')}>
                    <option value="">Choose state…</option>
                    {GST_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                  </select>
                  {bad('state') && <div className={styles.err}>{problems.state}</div>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="co-pin">PIN code *</label>
                  <input id="co-pin" className={`${styles.inp} ${bad('pincode') ? styles.inpErr : ''}`} value={b.pincode} onChange={setPin} inputMode="numeric" autoComplete="postal-code" placeholder="6 digits" />
                  {bad('pincode') && <div className={styles.err}>{problems.pincode}</div>}
                </div>
                <div className={`${styles.field} ${styles.full}`}>
                  <label htmlFor="co-gstin">GSTIN <em>(optional)</em></label>
                  <input id="co-gstin" className={`${styles.inp} ${bad('gstin') ? styles.inpErr : ''}`} style={{ fontFamily: 'var(--mono)' }} value={b.gstin} onChange={setGstin} placeholder="22AAAAA0000A1Z5" />
                  {bad('gstin') ? <div className={styles.err}>{problems.gstin}</div>
                    : <div className={styles.hint}>{gstEnabled ? 'Add your GSTIN to claim input tax credit on this purchase.' : 'If you have a GSTIN, it will be printed on your invoice.'}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <aside className={`${styles.card} ${styles.summary}`} aria-label="Order summary">
            <h2 className={styles.cardTitle} style={{ marginBottom: 14 }}>Order summary</h2>
            {!quote ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div className={styles.skel} style={{ width: '70%' }} /><div className={styles.skel} /><div className={styles.skel} style={{ width: '50%' }} />
              </div>
            ) : (
              <>
                <div className={styles.planLine}>
                  <div>
                    <div className={styles.planName}>{quote.planName}</div>
                    <div className={styles.planMeta}>
                      {mode === 'auto' ? `Renews every ${quote.period}` : `One-time payment · ${quote.days} days`}{validTill && ` · valid till ${validTill}`}
                    </div>
                  </div>
                </div>

                <div className={styles.rows}>
                  <div className={styles.row}><span>Plan price</span><span>{rupees(quote.base)}</span></div>
                  {quote.listAmount > quote.base && (
                    <div className={`${styles.row} ${styles.rowGreen}`}><span>Launch offer (regular price {whole(quote.listAmount)})</span><span>included</span></div>
                  )}
                  {quote.discount > 0 && <div className={`${styles.row} ${styles.rowGreen}`}><span>Coupon {quote.couponCode}</span><span>−{rupees(quote.discount)}</span></div>}
                  {quote.gstEnabled && quote.discount > 0 && <div className={styles.row}><span>Taxable value</span><span>{rupees(quote.taxable)}</span></div>}
                  {quote.gstEnabled && (quote.igst > 0
                    ? <div className={styles.row}><span>IGST ({quote.gstRate}%)</span><span>{rupees(quote.igst)}</span></div>
                    : <>
                      <div className={styles.row}><span>CGST ({quote.gstRate / 2}%)</span><span>{rupees(quote.cgst)}</span></div>
                      <div className={styles.row}><span>SGST ({quote.gstRate / 2}%)</span><span>{rupees(quote.sgst)}</span></div>
                    </>)}
                </div>

                <div className={styles.total}><span>Total to pay</span><span data-testid="total">{rupees(quote.total)}</span></div>
                <div className={styles.taxNote}>{quote.gstEnabled ? `Includes ${rupees(quote.tax)} GST` : 'No extra charges'}</div>

                <div className={styles.extras}>
                  {mode === 'auto' ? (
                    <div className={styles.hint}>Coupons work with one-time payment only.</div>
                  ) : quote.couponCode ? (
                    <div className={styles.applied}>
                      <span><code>{quote.couponCode}</code> applied — {quote.couponDesc}</span>
                      <button type="button" onClick={removeCoupon}>Remove</button>
                    </div>
                  ) : couponOpen ? (
                    <div>
                      <div className={styles.codeBox}>
                        <input className={`${styles.inp} ${couponError ? styles.inpErr : ''}`} aria-label="Coupon code" autoFocus value={couponInput} maxLength={20}
                          onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                          onKeyDown={e => { if (e.key === 'Enter') applyCoupon() }} placeholder="Enter coupon code" />
                        <button type="button" className={styles.applyBtn} disabled={couponBusy || !couponInput.trim()} onClick={applyCoupon}>{couponBusy ? '…' : 'Apply'}</button>
                      </div>
                      {couponError && <div className={styles.err} role="alert">{couponError}</div>}
                    </div>
                  ) : (
                    <div><button type="button" className={styles.linkBtn} onClick={() => setCouponOpen(true)}>Have a coupon code?</button></div>
                  )}

                  {salesOpen || salesCode ? (
                    <div className={styles.field}>
                      <label htmlFor="co-sales">Sales / referral code <em>(optional)</em></label>
                      <input id="co-sales" className={styles.inp} style={{ fontFamily: 'var(--mono)', textTransform: 'uppercase' }} value={salesCode} maxLength={30}
                        onChange={e => setSalesCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))} placeholder="Code of the person who helped you" />
                    </div>
                  ) : (
                    <div><button type="button" className={styles.linkBtn} onClick={() => setSalesOpen(true)}>Did someone refer you? Add their code</button></div>
                  )}
                </div>

                {showProblems && problemList.length > 0 && (
                  <div className={styles.problems} role="alert"><strong>Please fix these first:</strong><ul>{problemList.map(p => <li key={p}>{p}</li>)}</ul></div>
                )}
                {error && <div className={styles.problems} role="alert">{error}</div>}

                <button className={styles.payBtn} onClick={pay} disabled={paying || !loaded}>
                  {paying ? 'Opening payment…' : mode === 'auto' ? `Start Auto Pay · ${rupees(quote.total)}` : `Make payment · ${rupees(quote.total)}`}
                </button>
                <p className={styles.fine}>
                  UPI, cards and net banking. 7-day money-back guarantee on your first payment.<br />
                  By paying you agree to our <a href="/terms-conditions" target="_blank" rel="noreferrer">Terms</a> and <a href="/refund" target="_blank" rel="noreferrer">Refund policy</a>.
                </p>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
