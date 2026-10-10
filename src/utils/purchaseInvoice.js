import { downloadInvoicePdf } from './invoiceShare'

// A Zerofy Pro payment, turned into the same document shape the invoice maker uses —
// so the customer's bill for their plan is made by the very same PDF code as their own invoices.
const isoDate = (d) => {
  const x = d ? new Date(d) : new Date()
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

export function purchaseToInvoice(p) {
  const b = p.billing || {}, s = p.seller || {}
  const rupees = (paise) => Math.round(Number(paise) || 0) / 100
  const notes = [
    p.couponCode ? `Coupon ${p.couponCode} applied: ₹${rupees(p.discount).toFixed(2)} off the plan price of ₹${rupees(p.base).toFixed(2)}.` : '',
    p.paymentId ? `Payment reference: ${p.paymentId}` : '',
    p.mode === 'auto' ? 'Paid by Auto Pay.' : '',
  ].filter(Boolean).join('\n')
  return {
    docType: 'invoice',
    no: p.receiptNo || 'Receipt',
    date: isoDate(p.paidAt),
    status: 'paid',
    template: 'modern',
    currency: '₹',
    bizName: s.name || 'Zerofy',
    bizAddr: s.address || '',
    bizEmail: s.email || '',
    bizGst: s.gstin || '',
    clientName: b.firm || b.name || '',
    clientAddr: [b.firm && b.name ? `Attn: ${b.name}` : '', b.address, b.pincode ? `PIN ${b.pincode}` : ''].filter(Boolean).join('\n'),
    clientPhone: b.phone || '',
    clientEmail: b.email || '',
    clientGst: b.gstin || '',
    placeOfSupply: s.gstin ? (b.state || '') : '',
    items: [{
      id: 'plan', type: 'service', desc: `${p.planName || 'Zerofy Pro'} (${p.days} days)`,
      hsnSac: s.gstin ? (s.sac || '') : '', uqc: 'NOS', qty: 1,
      rate: rupees(p.taxable), gstRate: Number(p.gstRate) || 0,
    }],
    discPct: 0, shipping: 0, roundOff: false,
    paidAmount: rupees(p.total),
    notes,
  }
}

export const downloadPurchaseInvoice = (p) => downloadInvoicePdf(purchaseToInvoice(p))
