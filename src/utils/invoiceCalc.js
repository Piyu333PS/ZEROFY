// Invoice ka poora hisaab ek hi jagah — maker, preview, dashboard, reports sab yahi use karte hain,
// taaki har jagah same total dikhe. Backend mein iski mirror copy hai (src/utils/invoiceCalc.js) —
// dono ko saath mein badalna.

export const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100

// GST state codes (GSTIN ke pehle 2 digit)
export const GST_STATES = [
  ['01', 'Jammu & Kashmir'], ['02', 'Himachal Pradesh'], ['03', 'Punjab'], ['04', 'Chandigarh'],
  ['05', 'Uttarakhand'], ['06', 'Haryana'], ['07', 'Delhi'], ['08', 'Rajasthan'], ['09', 'Uttar Pradesh'],
  ['10', 'Bihar'], ['11', 'Sikkim'], ['12', 'Arunachal Pradesh'], ['13', 'Nagaland'], ['14', 'Manipur'],
  ['15', 'Mizoram'], ['16', 'Tripura'], ['17', 'Meghalaya'], ['18', 'Assam'], ['19', 'West Bengal'],
  ['20', 'Jharkhand'], ['21', 'Odisha'], ['22', 'Chhattisgarh'], ['23', 'Madhya Pradesh'], ['24', 'Gujarat'],
  ['26', 'Dadra & Nagar Haveli and Daman & Diu'], ['27', 'Maharashtra'], ['29', 'Karnataka'], ['30', 'Goa'],
  ['31', 'Lakshadweep'], ['32', 'Kerala'], ['33', 'Tamil Nadu'], ['34', 'Puducherry'],
  ['35', 'Andaman & Nicobar Islands'], ['36', 'Telangana'], ['37', 'Andhra Pradesh'], ['38', 'Ladakh'],
  ['97', 'Other Territory'],
].map(([code, name]) => ({ code, name }))

export const stateName = (code) => (GST_STATES.find(s => s.code === code) || {}).name || ''

export const stateCodeOf = (gstin) => {
  const m = String(gstin || '').trim().match(/^(\d{2})[A-Z0-9]{13}$/i)
  return m ? m[1] : ''
}

// Purane invoices mein per-item rate `gst` field mein tha, naye mein `gstRate` mein
export const itemGstRate = (it, inv) => {
  const candidates = [it && it.gstRate, it && it.gst, inv && inv.taxPct]
  for (const c of candidates) {
    if (c !== undefined && c !== null && c !== '' && !isNaN(Number(c))) return Number(c)
  }
  return 18
}

// Place of supply: jo user ne chuna, warna client ke GSTIN se
export const placeOfSupplyOf = (inv) => String(inv.placeOfSupply || '').trim() || stateCodeOf(inv.clientGst)

export const isInterState = (inv) => {
  const seller = stateCodeOf(inv.bizGst)
  const pos = placeOfSupplyOf(inv)
  return Boolean(seller && pos && seller !== pos)
}

// Discount har line par barabar lagta hai aur GST discount ke BAAD ki value par lagta hai
export function calcInvoice(inv = {}) {
  const discPct = Math.min(100, Math.max(0, Number(inv.discPct) || 0))
  let sub = 0, disc = 0, gst = 0
  const lines = (inv.items || [])
    .filter(it => it && (it.desc || Number(it.rate)))
    .map(it => {
      const qty = Number(it.qty) || 0
      const rate = Number(it.rate) || 0
      const gross = qty * rate
      const lineDisc = gross * discPct / 100
      const taxable = gross - lineDisc
      const gstRate = itemGstRate(it, inv)
      const gstAmt = taxable * gstRate / 100
      sub += gross; disc += lineDisc; gst += gstAmt
      return { ...it, qty, rate, gross: r2(gross), taxable: r2(taxable), gstRate, gstAmt: r2(gstAmt), total: r2(taxable + gstAmt) }
    })
  const inter = isInterState(inv)
  const shipping = Math.max(0, Number(inv.shipping) || 0)
  const raw = sub - disc + gst + shipping
  const total = inv.roundOff ? Math.round(raw) : r2(raw)
  return {
    lines,
    sub: r2(sub), disc: r2(disc), taxable: r2(sub - disc), gst: r2(gst),
    inter,
    // Seller ka GSTIN ho tabhi CGST/SGST/IGST alag dikhana sahi hai
    split: Boolean(stateCodeOf(inv.bizGst)),
    cgst: inter ? 0 : r2(gst / 2), sgst: inter ? 0 : r2(gst / 2), igst: inter ? r2(gst) : 0,
    shipping: r2(shipping),
    roundAdj: r2(total - raw),
    total,
  }
}

export const invoiceTotal = (inv) => calcInvoice(inv).total

/* ─── Dates ──────────────────────────────────────────────────── */
// toISOString() UTC deta hai — India mein subah 5:30 se pehle wo kal ki date ban jati thi
export const localToday = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const addDays = (isoDate, days) => {
  const [y, m, d] = String(isoDate || localToday()).split('-').map(Number)
  const dt = new Date(y, (m || 1) - 1, (d || 1) + Number(days || 0))
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
// '2026-05-14' → '14 May 2026'
export const formatDate = (iso) => {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return iso || '—'
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] || ''} ${m[1]}`
}

/* ─── Status ─────────────────────────────────────────────────── */
// Dikhane wala status: stored status + payments + due date se nikalta hai
// → draft | sent | partial | overdue | paid | cancelled
export const displayStatus = (inv) => {
  const s = inv.status || 'draft'
  if (s === 'draft' || s === 'cancelled' || s === 'paid') return s
  const total = inv.grandTotal !== undefined ? Number(inv.grandTotal) : invoiceTotal(inv)
  const paid = Number(inv.paidAmount) || 0
  if (paid > 0 && paid >= total - 0.01) return 'paid'
  if (inv.dueDate && inv.dueDate < localToday()) return 'overdue'
  if (paid > 0) return 'partial'
  return 'sent'
}

export const STATUS_LABELS = {
  draft: 'Draft', sent: 'Sent', partial: 'Part paid', overdue: 'Overdue', paid: 'Paid', cancelled: 'Cancelled',
}

/* ─── Money ──────────────────────────────────────────────────── */
export const fmtMoney = (n, sym = '₹') =>
  `${sym}${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const CURRENCY_WORDS = {
  '₹': ['Rupees', 'Paise'], '$': ['Dollars', 'Cents'], '€': ['Euros', 'Cents'], '£': ['Pounds', 'Pence'],
}

// Number → words (Indian system), paise ke saath
export const amountInWords = (amount, sym = '₹') => {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const h = (x) => {
    if (x < 20) return a[x]
    if (x < 100) return b[Math.floor(x / 10)] + (x % 10 ? ' ' + a[x % 10] : '')
    return a[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' + h(x % 100) : '')
  }
  const words = (n) => {
    if (n === 0) return 'Zero'
    let r = '', num = n
    if (num >= 10000000) { r += words(Math.floor(num / 10000000)) + ' Crore '; num %= 10000000 }
    if (num >= 100000) { r += h(Math.floor(num / 100000)) + ' Lakh '; num %= 100000 }
    if (num >= 1000) { r += h(Math.floor(num / 1000)) + ' Thousand '; num %= 1000 }
    if (num > 0) r += h(num)
    return r.trim()
  }
  const totalPaise = Math.round(Math.abs(Number(amount) || 0) * 100)
  const whole = Math.floor(totalPaise / 100)
  const paise = totalPaise % 100
  const [major, minor] = CURRENCY_WORDS[sym] || ['', '']
  let out = `${major ? major + ' ' : ''}${words(whole)}`
  if (paise > 0) out += ` and ${words(paise)} ${minor || 'Hundredths'}`
  return out + ' Only'
}
