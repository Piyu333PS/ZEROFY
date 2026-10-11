// A client's account statement: every invoice, payment and credit note in date order with a running balance.
import { calcInvoice, docTypeOf, r2, localToday, formatDate, fmtMoney } from './invoiceCalc'

const METHOD = { upi: 'UPI', cash: 'Cash', bank_transfer: 'Bank transfer', card: 'Card', cheque: 'Cheque', other: 'Other' }
const counts = (d) => d.status !== 'draft' && d.status !== 'cancelled'
const totalOf = (d) => d.grandTotal !== undefined ? Number(d.grandTotal) : calcInvoice(d).total
const sameName = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase()

// Indian financial year that a date falls in: 1 April – 31 March
export function financialYearOf(iso = localToday()) {
  const [y, m] = String(iso).split('-').map(Number)
  const start = m >= 4 ? y : y - 1
  return { from: `${start}-04-01`, to: `${start + 1}-03-31`, label: `FY ${start}-${String(start + 1).slice(2)}` }
}

// from / to are YYYY-MM-DD; leave either empty for "no limit"
export function buildStatement({ customer, invoices = [], creditNotes = [], payments = [], from = '', to = '' }) {
  const id = String(customer._id || '')
  const isTheirs = (d) => (d.customerId ? String(d.customerId) === id : sameName(d.clientName, customer.name))
  const inv = invoices.filter(d => docTypeOf(d) === 'invoice' && counts(d) && isTheirs(d))
  const invIds = new Set(inv.map(d => String(d._id)))
  const notes = creditNotes.filter(d => counts(d) && (invIds.has(String(d.refInvoiceId || '')) || (!d.refInvoiceId && isTheirs(d))))
  const pays = payments.filter(p => invIds.has(String(p.invoiceId)))
  const invNo = Object.fromEntries(inv.map(d => [String(d._id), d.no]))

  const all = [
    ...inv.map(d => ({ date: String(d.date || d.createdAt || '').slice(0, 10), order: 0, type: 'Invoice', ref: d.no || '', detail: d.dueDate ? `Due ${formatDate(d.dueDate)}` : '', debit: r2(totalOf(d)), credit: 0 })),
    ...notes.map(d => ({ date: String(d.date || d.createdAt || '').slice(0, 10), order: 1, type: 'Credit note', ref: d.no || '', detail: d.refInvoiceNo ? `Against ${d.refInvoiceNo}` : '', debit: 0, credit: r2(totalOf(d)) })),
    ...pays.map(p => ({ date: String(p.date || p.createdAt || '').slice(0, 10), order: 2, type: 'Payment', ref: METHOD[p.method] || 'Payment', detail: invNo[String(p.invoiceId)] ? `For ${invNo[String(p.invoiceId)]}` : '', debit: 0, credit: r2(p.amount) })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order)

  let opening = 0
  const entries = []
  let balance = 0
  for (const e of all) {
    if (from && e.date < from) { opening = r2(opening + e.debit - e.credit); continue }
    if (to && e.date > to) continue
    if (!entries.length) balance = opening
    balance = r2(balance + e.debit - e.credit)
    entries.push({ ...e, balance })
  }
  if (!entries.length) balance = opening
  const sum = (f) => r2(entries.reduce((s, e) => s + e[f], 0))
  const seller = [...inv].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || {}
  return {
    customer, from, to, opening, entries, closing: balance,
    billed: r2(inv.filter(d => (!from || d.date >= from) && (!to || d.date <= to)).reduce((s, d) => s + totalOf(d), 0)),
    debit: sum('debit'), credit: sum('credit'),
    currency: seller.currency || '₹',
    business: { name: seller.bizName || '', addr: seller.bizAddr || '', phone: seller.bizPhone || '', email: seller.bizEmail || '', gst: seller.bizGst || '', upi: seller.upiId || '' },
    hasAny: all.length > 0,
  }
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]))
export const periodText = (st) => st.from && st.to ? `${formatDate(st.from)} to ${formatDate(st.to)}` : st.from ? `From ${formatDate(st.from)}` : st.to ? `Up to ${formatDate(st.to)}` : 'All time'

// The printable statement (A4 width). Plain HTML with its own styles, so it prints and turns into a PDF the same way.
export function statementMarkup(st) {
  const m = (n) => fmtMoney(n, st.currency)
  const c = st.customer, b = st.business
  const td = 'padding:8px 10px;border-bottom:1px solid #E3E6DF;font-size:12px;'
  const num = td + "text-align:right;font-family:'IBM Plex Mono',Menlo,Consolas,monospace;white-space:nowrap;"
  const rows = st.entries.map(e => `<tr>
    <td style="${td}white-space:nowrap">${esc(formatDate(e.date))}</td>
    <td style="${td}"><b>${esc(e.type)}</b> ${esc(e.ref)}${e.detail ? `<div style="color:#5C7189;font-size:11px">${esc(e.detail)}</div>` : ''}</td>
    <td style="${num}">${e.debit ? m(e.debit) : ''}</td><td style="${num}color:#0B6E4F">${e.credit ? m(e.credit) : ''}</td><td style="${num}font-weight:600">${m(e.balance)}</td></tr>`).join('')
  const th = 'padding:9px 10px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#fff;background:#12263F;text-align:left;'
  const due = st.closing > 0.005
  return `<div style="width:794px;padding:40px 44px;background:#fff;color:#12263F;font-family:Inter,Arial,sans-serif;box-sizing:border-box">
  <div style="display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:3px solid #12263F;padding-bottom:18px">
    <div><div style="font-size:21px;font-weight:700">${esc(b.name || 'Statement')}</div>
      <div style="font-size:11.5px;color:#5C7189;line-height:1.6;margin-top:4px;max-width:330px">${[b.addr, b.phone && `Ph: ${b.phone}`, b.email, b.gst && `GSTIN: ${b.gst}`].filter(Boolean).map(esc).join('<br>')}</div></div>
    <div style="text-align:right"><div style="font-size:22px;font-weight:700;letter-spacing:.5px">STATEMENT OF ACCOUNT</div>
      <div style="font-size:12px;color:#5C7189;margin-top:6px">${esc(periodText(st))}</div><div style="font-size:11.5px;color:#5C7189">Made on ${esc(formatDate(localToday()))}</div></div>
  </div>
  <div style="display:flex;justify-content:space-between;gap:24px;margin:20px 0 18px">
    <div><div style="font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:#5C7189;font-weight:600">Statement for</div>
      <div style="font-size:16px;font-weight:700;margin-top:4px">${esc(c.name)}</div>
      <div style="font-size:11.5px;color:#5C7189;line-height:1.6">${[c.addr, c.phone && `Ph: ${c.phone}`, c.email, c.gst && `GSTIN: ${c.gst}`].filter(Boolean).map(esc).join('<br>')}</div></div>
    <div style="background:${due ? '#FFF4DF' : '#E4F3EC'};border-radius:10px;padding:12px 18px;text-align:right;align-self:flex-start">
      <div style="font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:#5C7189;font-weight:600">${due ? 'Amount due' : st.closing < -0.005 ? 'Advance with us' : 'Amount due'}</div>
      <div style="font-size:22px;font-weight:700;font-family:'IBM Plex Mono',Menlo,Consolas,monospace;color:${due ? '#A85E08' : '#0B6E4F'}">${m(Math.abs(st.closing))}</div></div>
  </div>
  <table style="width:100%;border-collapse:collapse">
    <thead><tr><th style="${th}">Date</th><th style="${th}">Details</th><th style="${th}text-align:right">Billed</th><th style="${th}text-align:right">Received</th><th style="${th}text-align:right">Balance</th></tr></thead>
    <tbody>
      ${st.from ? `<tr><td style="${td}"></td><td style="${td}color:#5C7189">Opening balance</td><td style="${num}"></td><td style="${num}"></td><td style="${num}font-weight:600">${m(st.opening)}</td></tr>` : ''}
      ${rows || `<tr><td colspan="5" style="${td}text-align:center;color:#5C7189;padding:22px">No invoices or payments in this period.</td></tr>`}
      <tr><td style="${td}border-bottom:0"></td><td style="${td}border-bottom:0;font-weight:700">Total</td><td style="${num}border-bottom:0;font-weight:700">${m(st.debit)}</td><td style="${num}border-bottom:0;font-weight:700;color:#0B6E4F">${m(st.credit)}</td><td style="${num}border-bottom:0;font-weight:700;background:#F4F5F1">${m(st.closing)}</td></tr>
    </tbody>
  </table>
  ${due && b.upi ? `<div style="margin-top:18px;font-size:12px;color:#12263F">Pay by UPI: <b style="font-family:'IBM Plex Mono',monospace">${esc(b.upi)}</b></div>` : ''}
  <div style="margin-top:26px;font-size:10.5px;color:#8494A6;border-top:1px solid #E3E6DF;padding-top:10px">This is a computer-generated statement. Please tell us within 7 days if anything does not match your records.</div>
</div>`
}

// Short message to send with the statement
export function statementMessage(st) {
  const m = (n) => fmtMoney(n, st.currency)
  const lines = [`Hello ${st.customer.name},`, '', `Here is your account statement${st.business.name ? ` from ${st.business.name}` : ''} (${periodText(st)}).`, '',
    `Billed: ${m(st.debit)}`, `Received: ${m(st.credit)}`, st.closing > 0.005 ? `*Amount due: ${m(st.closing)}*` : st.closing < -0.005 ? `Advance with us: ${m(-st.closing)}` : 'Nothing is due. Thank you!']
  if (st.closing > 0.005 && st.business.upi) lines.push('', `Pay by UPI: ${st.business.upi}`)
  return lines.join('\n')
}
