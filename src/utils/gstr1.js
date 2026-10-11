// GSTR-1 (the monthly return of sales) worked out from the saved invoices and credit notes.
// The sheets and column names follow the GST offline tool, so a CA can use the file as it is.
// This is a helper for filing, not the filing itself — the figures should be checked before upload.
import { calcInvoice, placeOfSupplyOf, stateCodeOf, stateName, docTypeOf, r2 } from './invoiceCalc'

// An invoice to an unregistered buyer in another state is listed one by one ("B2C Large") above this value;
// smaller ones are added up state-wise ("B2C Small").
export const B2CL_LIMIT = 100000

const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const gstDate = (iso) => { const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}-${MON[Number(m[2]) - 1]}-${m[1]}` : '' }
const posText = (code) => code ? `${code}-${stateName(code) || ''}` : ''
const monthOf = (doc) => String(doc.date || doc.createdAt || '').slice(0, 7)
const gstinOf = (v) => String(v || '').trim().toUpperCase()
const issued = (d) => d.status !== 'draft' && d.status !== 'cancelled'

// Taxable value of one document, split by GST rate
function byRate(calc) {
  const map = {}
  for (const l of calc.lines) map[l.gstRate] = r2((map[l.gstRate] || 0) + l.taxable)
  return Object.entries(map).map(([rate, taxable]) => ({ rate: Number(rate), taxable })).sort((a, b) => a.rate - b.rate)
}

// Businesses that have a GSTIN and at least one document — GSTR-1 is filed per GSTIN
export function gstBusinesses(docs) {
  const map = {}
  for (const d of docs) { const g = gstinOf(d.bizGst); if (GSTIN_RE.test(g) && !map[g]) map[g] = { gstin: g, name: d.bizName || g } }
  return Object.values(map)
}

// Months that have documents for this GSTIN, newest first (always includes the current month)
export function gstMonths(docs, gstin, today = new Date()) {
  const set = new Set([`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`])
  for (const d of docs) if (gstinOf(d.bizGst) === gstin && issued(d) && /^\d{4}-\d{2}$/.test(monthOf(d))) set.add(monthOf(d))
  return [...set].sort().reverse()
}
export const monthLabel = (m) => { const [y, mm] = String(m).split('-'); return `${MON[Number(mm) - 1] || ''} ${y}` }

export function buildGstr1({ invoices = [], creditNotes = [], month, gstin }) {
  const seller = gstinOf(gstin), sellerState = stateCodeOf(seller)
  const mine = (d) => gstinOf(d.bizGst) === seller && monthOf(d) === month
  const allInv = invoices.filter(d => docTypeOf(d) === 'invoice' && mine(d))
  const allNotes = creditNotes.filter(mine)
  const inv = allInv.filter(issued), notes = allNotes.filter(issued)
  const invById = Object.fromEntries(invoices.map(i => [String(i._id), i]))

  const b2b = [], b2cl = [], cdnr = [], cdnur = []
  const b2csMap = {}, hsnMap = {}
  const warn = { badGstin: [], noHsn: [], noPos: [] }
  const sec = () => ({ count: 0, taxable: 0, igst: 0, cgst: 0, sgst: 0, value: 0 })
  const sum = { b2b: sec(), b2cl: sec(), b2cs: sec(), cdnr: sec(), cdnur: sec() }
  const add = (s, c, sign = 1) => { s.count += 1; s.taxable += sign * c.taxable; s.igst += sign * c.igst; s.cgst += sign * c.cgst; s.sgst += sign * c.sgst; s.value += sign * c.total }

  const hsnAdd = (doc, c, sign) => {
    for (const l of c.lines) {
      const code = String(l.hsnSac || l.hsn || '').trim()
      if (!code && !warn.noHsn.includes(doc.no)) warn.noHsn.push(doc.no)
      const uqc = l.type === 'service' ? 'NA' : String(l.uqc || 'OTH').toUpperCase()
      const key = `${code}|${uqc}|${l.gstRate}`
      const h = hsnMap[key] || (hsnMap[key] = { hsn: code, desc: '', uqc, rate: l.gstRate, qty: 0, value: 0, taxable: 0, igst: 0, cgst: 0, sgst: 0 })
      if (!h.desc && l.desc) h.desc = String(l.desc).slice(0, 30)
      const tax = l.gstAmt
      h.qty += sign * (l.type === 'service' ? 0 : l.qty); h.taxable += sign * l.taxable; h.value += sign * (l.taxable + tax)
      if (c.inter) h.igst += sign * tax; else { h.cgst += sign * tax / 2; h.sgst += sign * tax / 2 }
    }
  }
  const b2csAdd = (pos, rate, taxable, sign) => {
    const key = `${pos}|${rate}`
    const row = b2csMap[key] || (b2csMap[key] = { pos, rate, taxable: 0 })
    row.taxable += sign * taxable
  }
  const buyerOf = (doc) => {
    const raw = gstinOf(doc.clientGst)
    if (raw && !GSTIN_RE.test(raw) && !warn.badGstin.includes(doc.no)) warn.badGstin.push(doc.no)
    return GSTIN_RE.test(raw) ? raw : ''
  }

  for (const doc of inv) {
    const c = calcInvoice(doc), rates = byRate(c)
    const buyer = buyerOf(doc)
    const pos = placeOfSupplyOf(doc) || sellerState
    if (buyer && !placeOfSupplyOf(doc)) warn.noPos.push(doc.no)
    hsnAdd(doc, c, 1)
    if (buyer) {
      add(sum.b2b, c)
      for (const r of rates) b2b.push({ gstin: buyer, name: doc.clientName || '', no: doc.no, date: gstDate(doc.date), value: c.total, pos: posText(pos), reverse: 'N', type: 'Regular B2B', rate: r.rate, taxable: r.taxable })
    } else if (c.inter && c.total > B2CL_LIMIT) {
      add(sum.b2cl, c)
      for (const r of rates) b2cl.push({ no: doc.no, date: gstDate(doc.date), value: c.total, pos: posText(pos), rate: r.rate, taxable: r.taxable })
    } else {
      add(sum.b2cs, c)
      for (const r of rates) b2csAdd(pos, r.rate, r.taxable, 1)
    }
  }

  for (const doc of notes) {
    const c = calcInvoice(doc), rates = byRate(c)
    const buyer = buyerOf(doc)
    const pos = placeOfSupplyOf(doc) || sellerState
    const orig = invById[String(doc.refInvoiceId || '')]
    hsnAdd(doc, c, -1)
    if (buyer) {
      add(sum.cdnr, c)
      for (const r of rates) cdnr.push({ gstin: buyer, name: doc.clientName || '', no: doc.no, date: gstDate(doc.date), noteType: 'C', pos: posText(pos), reverse: 'N', supply: 'Regular B2B', value: c.total, rate: r.rate, taxable: r.taxable })
    } else if (c.inter && orig && calcInvoice(orig).total > B2CL_LIMIT) {
      add(sum.cdnur, c)
      for (const r of rates) cdnur.push({ urType: 'B2CL', no: doc.no, date: gstDate(doc.date), noteType: 'C', pos: posText(pos), value: c.total, rate: r.rate, taxable: r.taxable })
    } else {
      // A credit note to a small unregistered buyer simply lowers that state's B2C Small figure
      add(sum.b2cs, c, -1); sum.b2cs.count -= 1
      for (const r of rates) b2csAdd(pos, r.rate, r.taxable, -1)
    }
  }

  const b2cs = Object.values(b2csMap).map(r => ({ type: 'OE', pos: posText(r.pos), rate: r.rate, taxable: r2(r.taxable) })).filter(r => r.taxable !== 0)
    .sort((a, b) => a.pos.localeCompare(b.pos) || a.rate - b.rate)
  const hsn = Object.values(hsnMap).map(h => ({ ...h, qty: r2(h.qty), value: r2(h.value), taxable: r2(h.taxable), igst: r2(h.igst), cgst: r2(h.cgst), sgst: r2(h.sgst) }))
    .filter(h => h.taxable !== 0 || h.qty !== 0).sort((a, b) => a.hsn.localeCompare(b.hsn) || a.rate - b.rate)

  // Documents issued: the first and last number used in the month, how many, and how many were cancelled
  const range = (list, nature) => {
    const used = list.filter(d => d.status !== 'draft' && d.no)
    if (!used.length) return null
    const nos = used.map(d => String(d.no)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    return { nature, from: nos[0], to: nos[nos.length - 1], total: used.length, cancelled: used.filter(d => d.status === 'cancelled').length }
  }
  const docs = [range(allInv, 'Invoices for outward supply'), range(allNotes, 'Credit Note')].filter(Boolean)

  for (const k of Object.keys(sum)) for (const f of ['taxable', 'igst', 'cgst', 'sgst', 'value']) sum[k][f] = r2(sum[k][f])
  // Net figures for the month: sales less credit notes
  const net = { taxable: 0, igst: 0, cgst: 0, sgst: 0 }
  for (const f of Object.keys(net)) net[f] = r2(sum.b2b[f] + sum.b2cl[f] + sum.b2cs[f] - sum.cdnr[f] - sum.cdnur[f])

  return { month, gstin: seller, b2b, b2cl, b2cs, cdnr, cdnur, hsn, docs, summary: sum, net, warnings: warn, empty: inv.length + notes.length === 0 }
}

// The sheets, with the column names of the GST offline tool
export function gstr1Sheets(g) {
  return [
    { name: 'b2b', rows: [['GSTIN/UIN of Recipient', 'Receiver Name', 'Invoice Number', 'Invoice date', 'Invoice Value', 'Place Of Supply', 'Reverse Charge', 'Applicable % of Tax Rate', 'Invoice Type', 'E-Commerce GSTIN', 'Rate', 'Taxable Value', 'Cess Amount'],
      ...g.b2b.map(r => [r.gstin, r.name, r.no, r.date, r.value, r.pos, r.reverse, '', r.type, '', r.rate, r.taxable, 0])] },
    { name: 'b2cl', rows: [['Invoice Number', 'Invoice date', 'Invoice Value', 'Place Of Supply', 'Applicable % of Tax Rate', 'Rate', 'Taxable Value', 'Cess Amount', 'E-Commerce GSTIN'],
      ...g.b2cl.map(r => [r.no, r.date, r.value, r.pos, '', r.rate, r.taxable, 0, ''])] },
    { name: 'b2cs', rows: [['Type', 'Place Of Supply', 'Applicable % of Tax Rate', 'Rate', 'Taxable Value', 'Cess Amount', 'E-Commerce GSTIN'],
      ...g.b2cs.map(r => [r.type, r.pos, '', r.rate, r.taxable, 0, ''])] },
    { name: 'cdnr', rows: [['GSTIN/UIN of Recipient', 'Receiver Name', 'Note Number', 'Note Date', 'Note Type', 'Place Of Supply', 'Reverse Charge', 'Note Supply Type', 'Note Value', 'Applicable % of Tax Rate', 'Rate', 'Taxable Value', 'Cess Amount'],
      ...g.cdnr.map(r => [r.gstin, r.name, r.no, r.date, r.noteType, r.pos, r.reverse, r.supply, r.value, '', r.rate, r.taxable, 0])] },
    { name: 'cdnur', rows: [['UR Type', 'Note Number', 'Note Date', 'Note Type', 'Place Of Supply', 'Note Value', 'Applicable % of Tax Rate', 'Rate', 'Taxable Value', 'Cess Amount'],
      ...g.cdnur.map(r => [r.urType, r.no, r.date, r.noteType, r.pos, r.value, '', r.rate, r.taxable, 0])] },
    { name: 'hsn', rows: [['HSN', 'Description', 'UQC', 'Total Quantity', 'Total Value', 'Rate', 'Taxable Value', 'Integrated Tax Amount', 'Central Tax Amount', 'State/UT Tax Amount', 'Cess Amount'],
      ...g.hsn.map(h => [h.hsn, h.desc, h.uqc, h.qty, h.value, h.rate, h.taxable, h.igst, h.cgst, h.sgst, 0])] },
    { name: 'docs', rows: [['Nature of Document', 'Sr. No. From', 'Sr. No. To', 'Total Number', 'Cancelled'],
      ...g.docs.map(d => [d.nature, d.from, d.to, d.total, d.cancelled])] },
  ]
}

export function gstr1Workbook(g, bizName = '') {
  const s = g.summary
  const line = (label, x) => [label, x.count, x.taxable, x.igst, x.cgst, x.sgst]
  const summary = { name: 'Summary', rows: [
    ['GSTR-1 summary', 'Documents', 'Taxable Value', 'IGST', 'CGST', 'SGST'],
    ['Business', bizName], ['GSTIN', g.gstin], ['Month', monthLabel(g.month)], [],
    line('B2B — sales to GST-registered buyers', s.b2b),
    line('B2C Large — unregistered, other state, above Rs. 1,00,000', s.b2cl),
    line('B2C Small — all other unregistered sales (net of their credit notes)', s.b2cs),
    line('Credit notes — registered buyers', s.cdnr),
    line('Credit notes — unregistered (B2C Large)', s.cdnur),
    [], ['Net for the month (sales less credit notes)', '', g.net.taxable, g.net.igst, g.net.cgst, g.net.sgst],
    [], ['Made with Zerofy from your saved invoices. Please check the figures before filing.'],
  ] }
  return [summary, ...gstr1Sheets(g)]
}

export const toCsv = (rows) => '﻿' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
