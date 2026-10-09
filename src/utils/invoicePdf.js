import { PDFDocument, StandardFonts, rgb, degrees, LineCapStyle } from 'pdf-lib'
import { TEMPLATES } from '../data/invoiceCodes'
import {
  calcInvoice, formatDate, localToday, amountInWords, placeOfSupplyOf, stateName, r2,
} from './invoiceCalc'
import { qrMatrix, upiPayUri } from './qr'

/* Asli TEXT wala invoice PDF (pehle PDF invoice ki tasveer hota tha — text select / search /
   copy nahi hota tha aur file bhaari hoti thi).

   pdf-lib ke standard fonts sirf Latin (WinAnsi) characters jaante hain:
   - "₹" un fonts mein nahi hai, isliye use chhoti vector drawing ke roop mein banate hain
   - agar invoice mein Hindi ya koi aur non-Latin text ho, to canBuildTextPdf() false deta hai
     aur caller purane image-wale tareeke par laut jata hai (taaki text kabhi "?" na bane) */

const A4 = [595.28, 841.89]
const M = 36                 // side margin
const BOTTOM = 56            // footer ke liye jagah

const hex = (h) => {
  const n = parseInt(String(h).replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => v / 255)
}
const col = (h) => rgb(...hex(h))
// accent ka halka tint (safed par alpha)
const tint = (h, a) => rgb(...hex(h).map(v => 1 - (1 - v) * a))

const INK = col('#14202E'), MUTED = col('#4B5B6E'), SOFT = col('#8A97A6'), WHITE = rgb(1, 1, 1)
const GREEN = col('#1F9C5A')

// Jo characters standard fonts mein nahi hain unhe milte-julte Latin se badlo
const REPLACE = { '–': '-', '—': '-', '−': '-', '‘': "'", '’': "'", '“': '"', '”': '"', '…': '...', ' ': ' ', '•': '-', '\t': ' ' }
const clean = (s) => String(s ?? '').replace(/[–—−‘’“”… •\t]/g, ch => REPLACE[ch]).replace(/\r/g, '')

// WinAnsi (cp1252) mein jo aa sakta hai
const WINANSI_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'
const encodable = (s) => {
  for (const ch of clean(s).replace(/₹/g, '')) {
    const c = ch.codePointAt(0)
    if (c === 10) continue
    if (c >= 32 && c <= 126) continue
    if (c >= 160 && c <= 255) continue
    if (WINANSI_EXTRA.includes(ch)) continue
    return false
  }
  return true
}

const TEXT_FIELDS = ['no', 'poNumber', 'bizName', 'bizAddr', 'bizPhone', 'bizAltPhone', 'bizEmail', 'bizAltEmail', 'bizGst',
  'clientName', 'clientAddr', 'clientPhone', 'clientEmail', 'clientGst', 'notes', 'terms', 'bankDetails', 'upiId', 'signatory']

export function canBuildTextPdf(inv) {
  if (!TEXT_FIELDS.every(k => encodable(inv[k]))) return false
  return (inv.items || []).every(it => encodable(it.desc) && encodable(it.hsnSac || it.hsn) && encodable(it.uqc))
}

const num = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const RUPEE_PATH = 'M10 6 H78 M10 30 H78 M10 6 H34 C70 6 70 54 34 54 H10 L58 100'

export async function buildInvoicePdf(inv, { hideBranding = false } = {}) {
  const doc = await PDFDocument.create()
  const F = await doc.embedFont(StandardFonts.Helvetica)
  const B = await doc.embedFont(StandardFonts.HelveticaBold)
  const I = await doc.embedFont(StandardFonts.HelveticaOblique)

  const c = calcInvoice(inv)
  const cur = inv.currency || '₹'
  const t = TEMPLATES.find(x => x.key === inv.template) || TEMPLATES[0]
  const ACC = col(t.accent), ACC_L = tint(t.accent, 0.08), ACC_M = tint(t.accent, 0.18)
  const st = inv.status || 'draft'
  const paid = r2(inv.paidAmount)
  const balance = r2(Math.max(0, c.total - paid))
  const [W, H] = A4

  doc.setTitle(`Invoice ${clean(inv.no)}`)
  doc.setAuthor(clean(inv.bizName) || 'Zerofy')
  doc.setSubject(`Invoice for ${clean(inv.clientName)}`)
  doc.setCreator('Zerofy — www.zerofy.co.in')

  let page, y // y = top se neeche ki taraf (points)
  const pages = []
  const newPage = () => {
    page = doc.addPage(A4)
    pages.push(page)
    page.drawRectangle({ x: 0, y: H - 5, width: W, height: 5, color: ACC })
    y = 5
  }
  const Y = (top) => H - top // top-origin → pdf origin

  const width = (s, font, size) => font.widthOfTextAtSize(clean(s), size)
  const text = (s, x, top, { font = F, size = 9, color = INK, align = 'left' } = {}) => {
    const str = clean(s)
    if (!str) return 0
    const w = font.widthOfTextAtSize(str, size)
    const px = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x
    page.drawText(str, { x: px, y: Y(top), font, size, color })
    return w
  }
  // Shabdon par wrap; bahut lamba shabd ho to tod do
  const wrap = (s, font, size, maxW) => {
    const lines = []
    for (const para of clean(s).split('\n')) {
      let line = ''
      for (let word of para.split(/\s+/).filter(Boolean)) {
        while (font.widthOfTextAtSize(word, size) > maxW) {
          let cut = word.length - 1
          while (cut > 1 && font.widthOfTextAtSize(word.slice(0, cut), size) > maxW) cut--
          if (line) { lines.push(line); line = '' }
          lines.push(word.slice(0, cut)); word = word.slice(cut)
        }
        const trial = line ? `${line} ${word}` : word
        if (font.widthOfTextAtSize(trial, size) > maxW && line) { lines.push(line); line = word } else line = trial
      }
      lines.push(line)
    }
    while (lines.length > 1 && !lines[lines.length - 1]) lines.pop()
    return lines
  }
  const para = (s, x, top, maxW, { font = F, size = 9, color = MUTED, lead = 1.45 } = {}) => {
    const lines = wrap(s, font, size, maxW)
    lines.forEach((ln, i) => text(ln, x, top + i * size * lead, { font, size, color }))
    return lines.length * size * lead
  }
  const paraHeight = (s, font, size, maxW, lead = 1.45) => (s ? wrap(s, font, size, maxW).length * size * lead : 0)

  // Amount: ₹ ko vector se banate hain (font mein nahi hota), baaki symbols seedhe text
  const money = (n, xRight, top, { font = F, size = 9, color = INK, sign = '' } = {}) => {
    const body = num(Math.abs(n))
    const bw = font.widthOfTextAtSize(body, size)
    text(body, xRight - bw, top, { font, size, color })
    let left = xRight - bw
    if (cur === '₹') {
      const capH = size * 0.72, gw = capH * 0.78
      left -= gw + size * 0.08
      page.drawSvgPath(RUPEE_PATH, {
        x: left, y: Y(top) + capH, scale: capH / 100,
        borderColor: color, borderWidth: font === B ? 13 : 9, borderLineCap: LineCapStyle.Round,
      })
    } else {
      const sw = font.widthOfTextAtSize(cur, size)
      left -= sw + 1
      text(cur, left, top, { font, size, color })
    }
    if (sign) { const sw = font.widthOfTextAtSize(sign, size); left -= sw + 1; text(sign, left, top, { font, size, color }) }
    return xRight - left
  }
  const label = (s, x, top, color = ACC) => text(String(s).toUpperCase(), x, top, { font: B, size: 6.8, color })

  /* ───────── PAGE 1 HEADER ───────── */
  newPage()
  const headTop = y
  const rightW = 190
  let lx = M
  const leftMax = W - M * 2 - rightW - 16

  // Logo (PNG / JPG data-URL)
  let logo = null
  if (inv.bizLogo && /^data:image\/(png|jpe?g);base64,/.test(inv.bizLogo)) {
    try {
      const bytes = Uint8Array.from(atob(inv.bizLogo.split(',')[1]), ch => ch.charCodeAt(0))
      logo = /^data:image\/png/.test(inv.bizLogo) ? await doc.embedPng(bytes) : await doc.embedJpg(bytes)
    } catch { logo = null }
  }
  const nameLines = wrap(inv.bizName || 'Your Business', B, 16, leftMax - (logo ? 58 : 0))
  const addrLines = inv.bizAddr ? wrap(inv.bizAddr, F, 8.2, Math.min(240, leftMax - (logo ? 58 : 0))) : []
  const contact = [
    (inv.bizPhone || inv.bizAltPhone) && `Ph: ${[inv.bizPhone, inv.bizAltPhone].filter(Boolean).join(', ')}`,
    (inv.bizEmail || inv.bizAltEmail) && `Email: ${[inv.bizEmail, inv.bizAltEmail].filter(Boolean).join(', ')}`,
  ].filter(Boolean)
  const leftH = nameLines.length * 18 + addrLines.length * 11.5 + contact.length * 11.5 + (inv.bizGst ? 12 : 0)
  const headH = Math.max(leftH, logo ? 50 : 0, 58) + 40
  page.drawRectangle({ x: 0, y: Y(headTop + headH), width: W, height: headH, color: ACC_L })
  page.drawLine({ start: { x: 0, y: Y(headTop + headH) }, end: { x: W, y: Y(headTop + headH) }, thickness: 0.7, color: ACC_M })

  let ty = headTop + 34
  if (logo) {
    const s = Math.min(46 / logo.width, 46 / logo.height)
    page.drawImage(logo, { x: lx, y: Y(headTop + 20 + logo.height * s), width: logo.width * s, height: logo.height * s })
    lx += 58
  }
  nameLines.forEach((ln, i) => text(ln, lx, ty + i * 18, { font: B, size: 16, color: ACC }))
  ty += nameLines.length * 18 - 4
  addrLines.forEach((ln) => { text(ln, lx, ty, { size: 8.2, color: MUTED }); ty += 11.5 })
  contact.forEach((ln) => { text(ln, lx, ty, { size: 8.2, color: MUTED }); ty += 11.5 })
  if (inv.bizGst) text(`GSTIN: ${inv.bizGst}`, lx, ty, { font: B, size: 8.2, color: col('#263A52') })

  text(inv.bizGst ? 'TAX INVOICE' : 'INVOICE', W - M, headTop + 38, { font: B, size: 21, color: ACC, align: 'right' })
  text(inv.no || '-', W - M, headTop + 54, { font: B, size: 10, color: INK, align: 'right' })
  if (st === 'paid') {
    const pw = B.widthOfTextAtSize('PAID', 7.5) + 16
    page.drawRectangle({ x: W - M - pw, y: Y(headTop + 74), width: pw, height: 14, color: tint('#1F9C5A', 0.14), borderColor: GREEN, borderWidth: 0.6 })
    text('PAID', W - M - pw / 2, headTop + 70, { font: B, size: 7.5, color: GREEN, align: 'center' })
  }
  y = headTop + headH

  /* ───────── BILL TO / DETAILS ───────── */
  const half = W / 2
  const pos = placeOfSupplyOf(inv)
  const meta = [
    ['Invoice No.', inv.no || '-'],
    ['Invoice Date', formatDate(inv.date || localToday())],
    inv.dueDate && ['Due Date', formatDate(inv.dueDate)],
    inv.poNumber && ['PO / Ref No.', inv.poNumber],
    pos && ['Place of Supply', `${stateName(pos) || pos} (${pos})`],
    cur !== '₹' && ['Currency', cur],
  ].filter(Boolean)
  const cAddr = inv.clientAddr ? wrap(inv.clientAddr, F, 8.2, half - M - 20) : []
  const cName = wrap(inv.clientName || '-', B, 10.5, half - M - 20)
  const cExtra = [inv.clientPhone && `Ph: ${inv.clientPhone}`, inv.clientEmail && `Email: ${inv.clientEmail}`].filter(Boolean)
  const billH = 30 + cName.length * 13 + cAddr.length * 11.5 + cExtra.length * 11.5 + (inv.clientGst ? 12 : 0) + 10
  const blockH = Math.max(billH, 30 + meta.length * 13 + 10)
  page.drawRectangle({ x: half, y: Y(y + blockH), width: half, height: blockH, color: ACC_L })
  page.drawLine({ start: { x: half, y: Y(y) }, end: { x: half, y: Y(y + blockH) }, thickness: 0.7, color: ACC_M })
  page.drawLine({ start: { x: 0, y: Y(y + blockH) }, end: { x: W, y: Y(y + blockH) }, thickness: 0.7, color: ACC_M })

  label('Bill To', M, y + 18)
  let by = y + 34
  cName.forEach((ln) => { text(ln, M, by, { font: B, size: 10.5 }); by += 13 })
  cAddr.forEach((ln) => { text(ln, M, by, { size: 8.2, color: MUTED }); by += 11.5 })
  cExtra.forEach((ln) => { text(ln, M, by, { size: 8.2, color: MUTED }); by += 11.5 })
  if (inv.clientGst) text(`GSTIN: ${inv.clientGst}`, M, by, { font: B, size: 8.2, color: col('#263A52') })

  label('Invoice Details', half + 20, y + 18)
  meta.forEach(([k, v], i) => {
    text(k, half + 20, y + 34 + i * 13, { size: 8.6, color: MUTED })
    text(v, W - M, y + 34 + i * 13, { font: B, size: 8.6, align: 'right' })
  })
  y += blockH + 16

  /* ───────── ITEMS TABLE ───────── */
  const TW = W - M * 2
  // columns: #, description, hsn, qty, rate, taxable, gst, amount
  const cw = [20, 0, 46, 52, 60, 64, 58, 70]
  cw[1] = TW - cw.reduce((s, v) => s + v, 0)
  const cx = cw.reduce((acc, wv, i) => { acc.push(i === 0 ? M : acc[i - 1] + cw[i - 1]); return acc }, [])
  const heads = ['#', 'Description', 'HSN/SAC', 'Qty', 'Rate', 'Taxable', 'GST', 'Amount']
  const alignOf = ['left', 'left', 'center', 'center', 'right', 'right', 'right', 'right']
  const cell = (i) => (alignOf[i] === 'right' ? cx[i] + cw[i] - 6 : alignOf[i] === 'center' ? cx[i] + cw[i] / 2 : cx[i] + 6)

  const tableHead = () => {
    page.drawRectangle({ x: M, y: Y(y + 20), width: TW, height: 20, color: ACC })
    heads.forEach((h, i) => text(h.toUpperCase(), cell(i), y + 13, { font: B, size: 6.8, color: WHITE, align: alignOf[i] }))
    y += 20
  }
  const ensure = (need) => {
    if (y + need > H - BOTTOM) { newPage(); y += 24; return true }
    return false
  }
  tableHead()
  if (c.lines.length === 0) {
    text('No items', W / 2, y + 22, { size: 9, color: SOFT, align: 'center' })
    y += 36
  }
  c.lines.forEach((it, idx) => {
    const dLines = wrap(it.desc || '-', B, 8.6, cw[1] - 12)
    const rowH = Math.max(26, dLines.length * 11.5 + 13)
    if (ensure(rowH + 4)) tableHead()
    if (idx % 2 === 1) page.drawRectangle({ x: M, y: Y(y + rowH), width: TW, height: rowH, color: ACC_L })
    page.drawLine({ start: { x: M, y: Y(y + rowH) }, end: { x: M + TW, y: Y(y + rowH) }, thickness: 0.5, color: ACC_M })
    const base = y + 15
    text(String(idx + 1), cell(0), base, { size: 8, color: SOFT })
    dLines.forEach((ln, i) => text(ln, cell(1), base + i * 11.5, { font: B, size: 8.6 }))
    text(it.hsnSac || it.hsn || '-', cell(2), base, { size: 8, color: MUTED, align: 'center' })
    const q = String(it.qty), unit = it.uqc ? ` ${it.uqc}` : ''
    const qw = B.widthOfTextAtSize(q, 8.6) + F.widthOfTextAtSize(clean(unit), 6.8)
    text(q, cell(3) - qw / 2, base, { font: B, size: 8.6 })
    text(unit, cell(3) - qw / 2 + B.widthOfTextAtSize(q, 8.6), base, { size: 6.8, color: SOFT })
    money(it.rate, cell(4), base, { size: 8.4 })
    money(it.taxable, cell(5), base, { size: 8.4 })
    money(it.gstAmt, cell(6), base, { size: 8, color: MUTED })
    text(`@ ${it.gstRate}%`, cell(6), base + 9.5, { font: B, size: 6.6, color: ACC, align: 'right' })
    money(it.total, cell(7), base, { font: B, size: 8.8 })
    y += rowH
  })
  y += 14

  /* ───────── BOTTOM: left (words, payment, notes, terms) + right (totals, signature) ───────── */
  const RW = 200, GAP = 18
  const LW = TW - RW - GAP
  const RX = M + LW + GAP
  const padX = 10

  const payable = paid > 0 ? balance : c.total
  const upiUri = (cur === '₹' && st !== 'cancelled' && st !== 'paid' && payable > 0)
    ? upiPayUri({ upiId: inv.upiId, name: inv.bizName, amount: payable, note: inv.no ? `Invoice ${inv.no}` : '' }) : ''
  const qr = upiUri ? qrMatrix(upiUri) : null
  const QR = 78

  const words = amountInWords(c.total, cur)
  const wordsH = 22 + paraHeight(words, I, 8.8, LW - padX * 2) + 6
  const payTextW = LW - padX * 2 - (qr ? QR + 14 : 0)
  const payTextH = paraHeight(inv.bankDetails, F, 8.4, payTextW) + (inv.upiId ? 12 : 0)
  const hasPay = Boolean(inv.bankDetails || inv.upiId)
  const payH = hasPay ? Math.max(22 + payTextH + 6, qr ? QR + 34 : 0) : 0
  const notesH = inv.notes ? 22 + paraHeight(inv.notes, F, 8.4, LW - padX * 2) + 6 : 0
  const termsH = inv.terms ? 14 + paraHeight(inv.terms, F, 7.8, LW) + 4 : 0
  const leftTotalH = wordsH + (payH ? payH + 8 : 0) + (notesH ? notesH + 8 : 0) + (termsH ? termsH + 8 : 0)

  const sumRows = [
    ['Subtotal', c.sub],
    c.disc > 0 && [`Discount (${Number(inv.discPct) || 0}%)`, -c.disc, GREEN],
    c.disc > 0 && ['Taxable value', c.taxable],
    ...(c.split ? (c.inter ? [['IGST', c.igst]] : [['CGST', c.cgst], ['SGST', c.sgst]]) : [['GST', c.gst]]),
    c.shipping > 0 && ['Shipping / other charges', c.shipping],
    c.roundAdj !== 0 && ['Round off', c.roundAdj],
  ].filter(Boolean)
  const totalsH = 10 + sumRows.length * 14 + 30 + (paid > 0 ? 34 : 0) + 6
  const rightTotalH = totalsH + 74

  ensure(Math.max(leftTotalH, rightTotalH) + 10)
  const blockTop = y

  // LEFT
  let ly = blockTop
  page.drawRectangle({ x: M, y: Y(ly + wordsH), width: LW, height: wordsH, color: ACC_L, borderColor: ACC_M, borderWidth: 0.6 })
  label('Amount in Words', M + padX, ly + 14)
  para(words, M + padX, ly + 27, LW - padX * 2, { font: I, size: 8.8, color: INK })
  ly += wordsH + 8

  if (hasPay) {
    page.drawRectangle({ x: M, y: Y(ly + payH), width: LW, height: payH, borderColor: ACC_M, borderWidth: 0.6 })
    label('Payment Details', M + padX, ly + 14)
    let py = ly + 27
    if (inv.bankDetails) py += para(inv.bankDetails, M + padX, py, payTextW, { size: 8.4 })
    if (inv.upiId) text(`UPI: ${inv.upiId}`, M + padX, py, { font: B, size: 8.4, color: col('#263A52') })
    if (qr) {
      const n = qr.length, quiet = 2, mod = QR / (n + quiet * 2)
      const qx = M + LW - padX - QR, qy = ly + 8
      page.drawRectangle({ x: qx, y: Y(qy + QR), width: QR, height: QR, color: WHITE })
      for (let r = 0; r < n; r++) {
        for (let cc = 0; cc < n; cc++) {
          if (!qr[r][cc]) continue
          let run = 1
          while (cc + run < n && qr[r][cc + run]) run++
          page.drawRectangle({ x: qx + (cc + quiet) * mod, y: Y(qy + (r + quiet + 1) * mod), width: run * mod + 0.05, height: mod + 0.05, color: rgb(0, 0, 0) })
          cc += run - 1
        }
      }
      const cap = 'Scan to pay '
      const capW = B.widthOfTextAtSize(cap, 7) + B.widthOfTextAtSize(num(payable), 7) + 6
      const start = qx + QR / 2 - capW / 2
      text(cap, start, qy + QR + 9, { font: B, size: 7, color: col('#263A52') })
      money(payable, start + capW, qy + QR + 9, { font: B, size: 7, color: col('#263A52') })
      text('Any UPI app', qx + QR / 2, qy + QR + 18, { size: 6.2, color: SOFT, align: 'center' })
    }
    ly += payH + 8
  }
  if (inv.notes) {
    page.drawRectangle({ x: M, y: Y(ly + notesH), width: LW, height: notesH, color: col('#FFFBF0'), borderColor: col('#F0E2B4'), borderWidth: 0.6 })
    label('Notes', M + padX, ly + 14, col('#9A7410'))
    para(inv.notes, M + padX, ly + 27, LW - padX * 2, { size: 8.4 })
    ly += notesH + 8
  }
  if (inv.terms) {
    label('Terms & Conditions', M, ly + 10, SOFT)
    para(inv.terms, M, ly + 22, LW, { size: 7.8, color: col('#5C6B7C') })
    ly += termsH + 8
  }

  // RIGHT: totals
  let ry = blockTop
  page.drawRectangle({ x: RX, y: Y(ry + totalsH), width: RW, height: totalsH, borderColor: ACC_M, borderWidth: 0.6 })
  ry += 18
  sumRows.forEach(([k, v, color]) => {
    text(k, RX + padX, ry, { size: 8.6, color: color || MUTED })
    money(v, RX + RW - padX, ry, { size: 8.6, color: color || MUTED, sign: v < 0 ? '-' : '' })
    ry += 14
  })
  page.drawRectangle({ x: RX + 6, y: Y(ry + 20), width: RW - 12, height: 24, color: ACC })
  text('Total', RX + 16, ry + 12, { font: B, size: 10.5, color: WHITE })
  money(c.total, RX + RW - 16, ry + 12, { font: B, size: 10.5, color: WHITE })
  ry += 30
  if (paid > 0) {
    ry += 6
    text('Amount paid', RX + padX, ry, { size: 8.6, color: GREEN })
    money(paid, RX + RW - padX, ry, { size: 8.6, color: GREEN, sign: '-' })
    ry += 14
    text('Balance due', RX + padX, ry, { font: B, size: 9.2 })
    money(balance, RX + RW - padX, ry, { font: B, size: 9.2 })
  }

  // Signature
  const sy = blockTop + totalsH + 22
  const forW = F.widthOfTextAtSize('For ', 8) + B.widthOfTextAtSize(clean(inv.bizName || 'Your Business'), 8)
  text('For ', RX + RW - forW, sy, { size: 8, color: MUTED })
  text(inv.bizName || 'Your Business', RX + RW, sy, { font: B, size: 8, align: 'right' })
  page.drawLine({ start: { x: RX + RW - 130, y: Y(sy + 38) }, end: { x: RX + RW, y: Y(sy + 38) }, thickness: 0.6, color: col('#C5CCD4') })
  text(inv.signatory || 'Authorised Signatory', RX + RW, sy + 48, { size: 7.6, color: col('#5C6B7C'), align: 'right' })

  /* ───────── FOOTER + WATERMARK (har page par) ───────── */
  pages.forEach((p, i) => {
    page = p
    page.drawLine({ start: { x: M, y: 40 }, end: { x: W - M, y: 40 }, thickness: 0.8, color: ACC_M })
    text('This is a computer-generated invoice', M, H - 28, { size: 7, color: SOFT })
    const tail = [inv.bizName, inv.bizGst && `GSTIN: ${inv.bizGst}`].filter(Boolean).join('  |  ')
    text(pages.length > 1 ? `${tail}${tail ? '  |  ' : ''}Page ${i + 1} of ${pages.length}` : tail, W - M, H - 28, { size: 7, color: SOFT, align: 'right' })
    if (!hideBranding) text('Created with Zerofy Invoice Generator - www.zerofy.co.in', W / 2, H - 15, { size: 6.4, color: SOFT, align: 'center' })
    if (st === 'draft' || st === 'cancelled') {
      const wm = st === 'draft' ? 'DRAFT' : 'CANCELLED'
      const size = st === 'draft' ? 110 : 76
      const ww = B.widthOfTextAtSize(wm, size)
      const ang = 24 * Math.PI / 180
      page.drawText(wm, {
        x: W / 2 - (ww / 2) * Math.cos(ang), y: H / 2 - (ww / 2) * Math.sin(ang) - 20,
        font: B, size, rotate: degrees(24), opacity: 0.07,
        color: st === 'draft' ? INK : col('#B3261E'),
      })
    }
  })

  return doc.save()
}
