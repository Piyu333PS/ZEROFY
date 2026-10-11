import { useMemo, useState } from 'react'
import { api } from '../../utils/api'
import { patchBilling } from '../../utils/billingStore'
import { stateCodeOf, stateName } from '../../utils/invoiceCalc'
import { cleanMobile } from '../../utils/phone'
import styles from './BusinessSetup.module.css'

/* First step after signing up: set up the business once.
   The details go on every invoice, so the first invoice needs no "add business" step —
   and the mobile number (and GSTIN) are what "Forgot your email?" uses to find the account later. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const uid = () => Math.random().toString(36).slice(2, 9)

export default function BusinessSetup({ token, email, onLogout }) {
  const [f, setF] = useState({ name: '', phone: '', email: email || '', addr: '', gst: '' })
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }))
  const setPhone = (e) => setF(p => ({ ...p, phone: cleanMobile(e.target.value) }))
  const setGst = (e) => setF(p => ({ ...p, gst: e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15) }))

  const problems = useMemo(() => {
    const p = {}
    if (f.name.trim().length < 2) p.name = 'Enter your business name'
    if (f.phone.length !== 10) p.phone = 'Enter a 10-digit mobile number'
    if (f.email.trim() && !EMAIL_RE.test(f.email.trim())) p.email = 'Enter a valid email address'
    if (f.addr.trim().length < 5) p.addr = 'Enter your business address'
    if (f.gst && !stateCodeOf(f.gst)) p.gst = 'GSTIN must be 15 characters, starting with the 2-digit state code'
    return p
  }, [f])
  const bad = (k) => show && problems[k]
  const gstState = stateCodeOf(f.gst) ? stateName(stateCodeOf(f.gst)) : ''

  const save = async (e) => {
    e.preventDefault()
    setError('')
    if (Object.keys(problems).length) { setShow(true); return }
    setSaving(true)
    const business = {
      id: uid(), name: f.name.trim(), email: f.email.trim(), phone: f.phone, altPhone: '', altEmail: '',
      gst: f.gst, addr: f.addr.trim(), prefix: 'INV', logo: '', bankDetails: '', upiId: '', terms: '', signatory: '',
    }
    const res = await api('/api/invoices/businesses', token, { method: 'PUT', body: { businesses: [business] } })
    setSaving(false)
    if (!res.ok) { setError(res.data.error || 'Could not save. Check your internet connection and try again.'); return }
    try { localStorage.setItem('zerofy-last-biz-id', business.id) } catch { /* ignore */ }
    // The app shell is watching this list — as soon as it has a business, the dashboard opens
    patchBilling({ businesses: res.data.businesses || [business] })
  }

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <div className={styles.topInner}>
          <span className={styles.brand}><span className={styles.mark}>Z</span><span className={styles.word}>ZEROFY</span></span>
          <button className={styles.logout} onClick={onLogout}>Log out</button>
        </div>
      </header>

      <div className={styles.wrap}>
        <div className={styles.steps} aria-hidden="true">
          <span className={styles.done}><i>✓</i> Account</span><b />
          <span className={styles.on}><i>2</i> Your business</span><b />
          <span><i>3</i> First invoice</span>
        </div>
        <h1 className={styles.title}>Set up your business</h1>
        <p className={styles.sub}>One minute, one time. These details are printed on every invoice you make.</p>

        <div className={styles.grid}>
          <form className={styles.card} onSubmit={save} noValidate>
            <div className={styles.fields}>
              <div className={`${styles.field} ${styles.full}`}>
                <label htmlFor="bs-name">Business name *</label>
                <input id="bs-name" className={`${styles.inp} ${bad('name') ? styles.inpErr : ''}`} value={f.name} onChange={set('name')} maxLength={120} autoFocus autoComplete="organization" placeholder="e.g. Sharma Traders" />
                {bad('name') && <div className={styles.err}>{problems.name}</div>}
              </div>
              <div className={styles.field}>
                <label htmlFor="bs-phone">Mobile number *</label>
                <div className={styles.prefix}>
                  <span>+91</span>
                  <input id="bs-phone" className={`${styles.inp} ${bad('phone') ? styles.inpErr : ''}`} value={f.phone} onChange={setPhone} inputMode="numeric" autoComplete="tel-national" placeholder="10-digit number" />
                </div>
                {bad('phone') ? <div className={styles.err}>{problems.phone}</div> : <div className={styles.hint}>Also used to find your account if you forget your email.</div>}
              </div>
              <div className={styles.field}>
                <label htmlFor="bs-email">Business email <em>(optional)</em></label>
                <input id="bs-email" type="email" className={`${styles.inp} ${bad('email') ? styles.inpErr : ''}`} value={f.email} onChange={set('email')} maxLength={120} autoComplete="email" placeholder="hello@yourbusiness.com" />
                {bad('email') && <div className={styles.err}>{problems.email}</div>}
              </div>
              <div className={`${styles.field} ${styles.full}`}>
                <label htmlFor="bs-addr">Business address *</label>
                <textarea id="bs-addr" className={`${styles.inp} ${bad('addr') ? styles.inpErr : ''}`} value={f.addr} onChange={set('addr')} maxLength={300} rows={2} autoComplete="street-address" placeholder="Shop / building, street, city, state, PIN code" />
                {bad('addr') && <div className={styles.err}>{problems.addr}</div>}
              </div>
              <div className={`${styles.field} ${styles.full}`}>
                <label htmlFor="bs-gst">GSTIN <em>(if you have one)</em></label>
                <input id="bs-gst" className={`${styles.inp} ${bad('gst') ? styles.inpErr : ''}`} style={{ fontFamily: 'var(--mono)' }} value={f.gst} onChange={setGst} placeholder="22AAAAA0000A1Z5" />
                {bad('gst') ? <div className={styles.err}>{problems.gst}</div>
                  : <div className={styles.hint}>{gstState ? `Registered in ${gstState}. Your invoices will show CGST, SGST and IGST.` : 'No GSTIN? Leave this empty — you can still make invoices, and add it later.'}</div>}
              </div>
            </div>

            {error && <div className={styles.alert} role="alert">{error}</div>}
            <div className={styles.actions}>
              <button type="submit" className={styles.save} disabled={saving}>{saving ? 'Saving…' : 'Save and continue'}</button>
              <span className={styles.fine}>You can change these any time, and add a logo, bank details and UPI later.</span>
            </div>
          </form>

          <aside className={styles.side}>
            <div className={styles.card}>
              <div className={styles.sideLabel}>On your invoice</div>
              <div className={styles.sheet} aria-hidden="true">
                <div className={styles.sheetBar} />
                <div className={styles.sheetHead}>
                  <div style={{ minWidth: 0 }}>
                    <div className={styles.bizName}>{f.name.trim() || 'Your business name'}</div>
                    <div className={styles.bizLine}>{f.addr.trim() || 'Your address'}</div>
                    <div className={styles.bizLine} style={{ marginTop: 2 }}>
                      {[f.phone && `Ph: ${f.phone}`, f.email.trim() && `Email: ${f.email.trim()}`].filter(Boolean).join('\n') || 'Phone · Email'}
                    </div>
                    {f.gst && <div className={styles.bizGst}>GSTIN: {f.gst}</div>}
                  </div>
                  <div className={styles.sheetTitle}>{stateCodeOf(f.gst) ? 'Tax Invoice' : 'Invoice'}</div>
                </div>
                <div className={styles.sheetBody}>
                  <div className={styles.ghost} style={{ width: '55%' }} /><div className={styles.ghost} /><div className={styles.ghost} style={{ width: '80%' }} /><div className={styles.ghost} style={{ width: '35%', marginLeft: 'auto' }} />
                </div>
              </div>
            </div>
            <div className={`${styles.card} ${styles.why}`}>
              <div className={styles.sideLabel}>Why we ask</div>
              <ul>
                <li>Your first invoice is ready to fill — no business details to type again.</li>
                <li>GST is worked out correctly from your GSTIN.</li>
                <li>If you forget your login email, your mobile number finds your account.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
