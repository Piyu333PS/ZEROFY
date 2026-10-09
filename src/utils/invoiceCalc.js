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

/* ─── Document types ─────────────────────────────────────────── */
// Invoices, quotations and credit notes are stored the same way; `docType` tells them apart.
// Documents saved before this existed have no docType — they are invoices.
export const docTypeOf = (d) => (d && (d.docType === 'quotation' || d.docType === 'credit_note') ? d.docType : 'invoice')

export const DOC = {
  invoice: { label: 'Invoice', lower: 'invoice', plural: 'Invoices', prefix: 'INV', path: '/app/invoices', listKey: 'invoices' },
  quotation: { label: 'Quotation', lower: 'quotation', plural: 'Quotations', prefix: 'QT', path: '/app/quotations', listKey: 'quotations' },
  credit_note: { label: 'Credit note', lower: 'credit note', plural: 'Credit notes', prefix: 'CN', path: '/app/credit-notes', listKey: 'creditNotes' },
}
export const docInfo = (d) => DOC[typeof d === 'string' ? (DOC[d] ? d : 'invoice') : docTypeOf(d)]

/* ─── Status ─────────────────────────────────────────────────── */
// The status to show. It comes from the saved status plus payments, credit notes and dates.
//   invoice     → draft | sent | partial | overdue | paid | credited | cancelled
//   quotation   → draft | sent | expired | accepted | declined | converted
//   credit note → issued | cancelled
export const displayStatus = (inv) => {
  const type = docTypeOf(inv)
  const s = inv.status || 'draft'
  if (type === 'credit_note') return s === 'cancelled' ? 'cancelled' : 'issued'
  if (type === 'quotation') {
    if (['draft', 'accepted', 'declined', 'converted'].includes(s)) return s
    if (inv.validTill && inv.validTill < localToday()) return 'expired'
    return 'sent'
  }
  if (s === 'draft' || s === 'cancelled') return s
  const total = inv.grandTotal !== undefined ? Number(inv.grandTotal) : invoiceTotal(inv)
  const paid = Number(inv.paidAmount) || 0
  const credited = Number(inv.creditedAmount) || 0
  if (credited > 0 && paid <= 0 && credited >= total - 0.01) return 'credited'
  if (s === 'paid') return 'paid'
  if (paid + credited > 0 && paid + credited >= total - 0.01) return 'paid'
  if (inv.dueDate && inv.dueDate < localToday()) return 'overdue'
  if (paid > 0) return 'partial'
  return 'sent'
}

export const STATUS_LABELS = {
  draft: 'Draft', sent: 'Sent', partial: 'Part paid', overdue: 'Overdue', paid: 'Paid', cancelled: 'Cancelled',
  credited: 'Credited', expired: 'Expired', accepted: 'Accepted', declined: 'Declined', converted: 'Invoiced', issued: 'Issued',
}

// Everything the preview and the PDF need to know that depends on the document type —
// kept here so the screen, the print and the PDF always say the same thing.
export const docView = (inv, calc) => {
  const type = docTypeOf(inv)
  const c = calc || calcInvoice(inv)
  const cur = inv.currency || '₹'
  const pos = placeOfSupplyOf(inv)
  const common = [
    pos ? ['Place of Supply', `${stateName(pos) || pos} (${pos})`] : null,
    cur !== '₹' ? ['Currency', cur] : null,
  ]
  const date = formatDate(inv.date || localToday())
  if (type === 'quotation') {
    return {
      type, title: 'Quotation', detailsLabel: 'Quotation Details', totalLabel: 'Total', noteLabel: `Quotation ${inv.no || ''}`.trim(),
      meta: [['Quotation No.', inv.no || '—'], ['Date', date],
        inv.validTill ? ['Valid Till', formatDate(inv.validTill)] : null,
        inv.poNumber ? ['Ref No.', inv.poNumber] : null, ...common].filter(Boolean),
      footer: 'This is a quotation, not a tax invoice',
      showPayment: false, allowQr: false, paid: 0, credited: 0, balance: c.total, badge: '',
    }
  }
  if (type === 'credit_note') {
    return {
      type, title: 'Credit Note', detailsLabel: 'Credit Note Details', totalLabel: 'Total credit', noteLabel: `Credit note ${inv.no || ''}`.trim(),
      meta: [['Credit Note No.', inv.no || '—'], ['Date', date],
        inv.refInvoiceNo ? ['Against Invoice', inv.refInvoiceNo] : null,
        inv.refInvoiceDate ? ['Invoice Date', formatDate(inv.refInvoiceDate)] : null,
        inv.reason ? ['Reason', inv.reason] : null, ...common].filter(Boolean),
      footer: 'This is a computer-generated credit note',
      showPayment: false, allowQr: false, paid: 0, credited: 0, balance: 0, badge: '',
    }
  }
  const paid = r2(inv.paidAmount)
  const credited = r2(inv.creditedAmount)
  const balance = r2(Math.max(0, c.total - paid - credited))
  const st = inv.status || 'draft'
  return {
    type, title: inv.bizGst ? 'Tax Invoice' : 'Invoice', detailsLabel: 'Invoice Details', totalLabel: 'Total', noteLabel: `Invoice ${inv.no || ''}`.trim(),
    meta: [['Invoice No.', inv.no || '—'], ['Invoice Date', date],
      inv.dueDate ? ['Due Date', formatDate(inv.dueDate)] : null,
      inv.poNumber ? ['PO / Ref No.', inv.poNumber] : null, ...common].filter(Boolean),
    footer: 'This is a computer-generated invoice',
    showPayment: true, allowQr: st !== 'cancelled' && st !== 'paid' && balance > 0,
    paid, credited, balance,
    badge: st === 'paid' ? (paid <= 0 && credited > 0 ? 'Credited' : 'Paid') : '',
  }
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
