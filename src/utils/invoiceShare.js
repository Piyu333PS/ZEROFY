import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { InvoicePreview } from '../components/invoice/InvoicePreview'
import { invoiceTotal, fmtMoney, formatDate } from './invoiceCalc'

/* ─── Build the exact invoice markup for ANY invoice object ────
   Seedha `inv` object se render hota hai — screen par jo preview khula hai us par depend nahi karta. */
export function renderInvoiceMarkup(inv, opts = {}) {
  return renderToStaticMarkup(
    createElement(InvoicePreview, { inv, hideBranding: Boolean(opts.hideBranding) })
  )
}

const esc = (s) => String(s || '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]))
const safeFileName = (inv) => (String(inv.no || 'invoice').replace(/[^\w.-]+/g, '-') || 'invoice') + '.pdf'
const totalText = (inv) => fmtMoney(invoiceTotal(inv), inv.currency || '₹')

const PRINT_DOC_HEAD = `<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 210mm;
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #fff; color: #1a1a2e;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact;
  }
  .invoice-wrap { width: 210mm; background: #fff; }
  @media print {
    @page { size: A4 portrait; margin: 0; }
    html, body { margin: 0; padding: 0; }
    tr { page-break-inside: avoid; }
  }
  table { border-collapse: collapse; }
</style>`

function buildPrintDocument(inv, opts) {
  return `<!DOCTYPE html><html><head><title>${esc(inv.no || 'Invoice')}</title>${PRINT_DOC_HEAD}</head><body><div class="invoice-wrap">${renderInvoiceMarkup(inv, opts)}</div></body></html>`
}

/* ─── Print / Save as PDF ──────────────────────────────────────
   Pehle ye naya tab (popup) kholta tha — popup blocker use rok deta tha aur button
   "kuch nahi karta" lagta tha. Ab ek hidden iframe mein print hota hai: koi popup nahi. */
export function printInvoice(inv, opts = {}) {
  return new Promise((resolve) => {
    const old = document.getElementById('zerofy-print-frame')
    if (old) old.remove()

    const frame = document.createElement('iframe')
    frame.id = 'zerofy-print-frame'
    frame.setAttribute('aria-hidden', 'true')
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
    document.body.appendChild(frame)

    const doc = frame.contentWindow.document
    doc.open()
    doc.write(buildPrintDocument(inv, opts))
    doc.close()

    let done = false
    const go = () => {
      if (done) return
      done = true
      try {
        frame.contentWindow.focus()
        frame.contentWindow.print()
      } catch (e) {
        console.error('Print error:', e)
      }
      resolve()
    }
    // Font load hone do, par 1.2s se zyada wait mat karo
    const fonts = doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve()
    Promise.race([fonts, new Promise(r => setTimeout(r, 1200))]).then(() => setTimeout(go, 150))
  })
}

// Purana naam — jo code abhi bhi ise import karta hai uske liye
export const openPrintWindow = (inv, opts) => printInvoice(inv, opts)

/* ─── Real PDF blob generation ─────────────────────────────────
   Lamba invoice ho to A4 ke kai pages mein toot jata hai (pehle sab ek page mein dab jata tha). */
export async function generateInvoicePdfBlob(inv, opts = {}) {
  const container = document.createElement('div')
  container.style.cssText = 'position:fixed;left:-99999px;top:0;width:794px;background:#fff;'
  container.innerHTML = renderInvoiceMarkup(inv, opts)
  document.body.appendChild(container)

  try {
    if (document.fonts && document.fonts.ready) {
      await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 800))])
    }
    await new Promise(r => setTimeout(r, 60))
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const pxPerPage = Math.floor(canvas.width * pageH / pageW)

    let y = 0, page = 0
    while (y < canvas.height) {
      const sliceH = Math.min(pxPerPage, canvas.height - y)
      // Aakhri page par sirf kuch pixel bache hon to naya page mat banao
      if (page > 0 && sliceH < 8) break
      const slice = document.createElement('canvas')
      slice.width = canvas.width
      slice.height = sliceH
      const ctx = slice.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, slice.width, slice.height)
      ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH)
      if (page > 0) pdf.addPage()
      pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageW, sliceH * pageW / canvas.width)
      y += sliceH
      page++
    }
    return pdf.output('blob')
  } finally {
    document.body.removeChild(container)
  }
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/* ─── Seedha PDF file download ─────────────────────────────── */
export async function downloadInvoicePdf(inv, opts = {}) {
  const blob = await generateInvoicePdfBlob(inv, opts)
  saveBlob(blob, safeFileName(inv))
}

function buildWhatsAppMessage(inv, attached) {
  const attachLine = attached
    ? '📎 PDF is attached with this message.'
    : '📎 The PDF has been downloaded — please attach it here.'
  const due = inv.dueDate ? `\nDue date: ${formatDate(inv.dueDate)}` : ''
  return `Hi ${inv.clientName || 'Client'},\n\nYour invoice *${inv.no}* is ready!\n\n📋 *Invoice Details:*\nAmount: *${totalText(inv)}*\nDate: ${formatDate(inv.date)}${due}\nBusiness: ${inv.bizName || ''}\n\n${attachLine}\n\n_Generated by Zerofy Invoice Generator_\nhttps://www.zerofy.co.in`
}

function buildEmailBody(inv, attached) {
  const attachLine = attached
    ? '📎 The PDF is attached to this email.'
    : '📎 The PDF has been downloaded to your device — please attach it before sending.'
  const due = inv.dueDate ? `\nDue date: ${formatDate(inv.dueDate)}` : ''
  return `Hi ${inv.clientName || 'Client'},\n\nPlease find your invoice details below:\n\nInvoice No: ${inv.no}\nDate: ${formatDate(inv.date)}${due}\nAmount: ${totalText(inv)}\n\nBusiness: ${inv.bizName || ''}\n\n${attachLine}\n\nThank you for your business!\n\nRegards,\n${inv.bizName || ''}`
}

// Native share sheet (mobile) — PDF attach ho jata hai. true = share ho gaya ya user ne cancel kiya.
async function tryNativeShare(inv, blob, text, title) {
  try {
    const file = new File([blob], safeFileName(inv), { type: 'application/pdf' })
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title, text })
      return true
    }
  } catch (err) {
    if (err?.name === 'AbortError') return true // user ne share sheet band kar di
    console.error('Share error:', err)
  }
  return false
}

/* ─── WhatsApp share ───────────────────────────────────────────
   Mobile: PDF native share sheet se attach hota hai.
   Desktop: PDF download hota hai + WhatsApp message pre-filled khulta hai.
   (Pehle share cancel karne par bhi WhatsApp khul jata tha — wo bug fix hai.) */
export async function shareViaWhatsApp(inv, opts = {}) {
  const digits = String(inv.clientPhone || '').replace(/\D/g, '')
  const phone = digits.length === 10 ? `91${digits}` : digits
  let blob = null
  try { blob = await generateInvoicePdfBlob(inv, opts) } catch (e) { console.error('PDF error:', e) }

  if (blob && await tryNativeShare(inv, blob, buildWhatsAppMessage(inv, true), `Invoice ${inv.no}`)) return
  if (blob) saveBlob(blob, safeFileName(inv))
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(buildWhatsAppMessage(inv, false))}`
  const w = window.open(waUrl, '_blank', 'noopener')
  if (!w) window.location.href = waUrl
}

/* ─── Email share — same approach ──────────────────────────── */
export async function shareViaEmail(inv, opts = {}) {
  let blob = null
  try { blob = await generateInvoicePdfBlob(inv, opts) } catch (e) { console.error('PDF error:', e) }

  const subject = `Invoice ${inv.no} from ${inv.bizName || 'Zerofy'}`
  if (blob && await tryNativeShare(inv, blob, buildEmailBody(inv, true), subject)) return
  if (blob) saveBlob(blob, safeFileName(inv))
  window.location.href = `mailto:${String(inv.clientEmail || '').trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildEmailBody(inv, false))}`
}
