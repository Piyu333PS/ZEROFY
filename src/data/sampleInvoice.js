import { localToday, addDays } from '../utils/invoiceCalc'

// A made-up invoice shown to new users ("See a sample invoice"). It is never saved.
export const sampleInvoice = () => ({
  _id: 'sample',
  no: 'INV-2026-001',
  date: localToday(),
  dueDate: addDays(localToday(), 15),
  status: 'sent',
  template: 'modern',
  currency: '₹',
  bizName: 'Sharma Traders',
  bizAddr: '14 Johari Bazaar\nJaipur 302003, Rajasthan',
  bizPhone: '9828012345',
  bizEmail: 'accounts@sharmatraders.in',
  bizGst: '08ABCDE1234F1Z5',
  clientName: 'Balaji Hardware Stores',
  clientAddr: 'Plot 22, Industrial Area\nJodhpur 342003, Rajasthan',
  clientPhone: '9811122233',
  clientGst: '08AAACB5678K1Z2',
  discPct: 0,
  bankDetails: 'Sharma Traders\nA/c 50200012345678\nIFSC HDFC0000123, HDFC Bank',
  upiId: 'sharmatraders@okhdfcbank',
  terms: 'Payment due within 15 days.',
  items: [
    { id: 's1', type: 'goods', desc: 'TMT Steel Rod 12mm', hsnSac: '7214', uqc: 'KGS', qty: 120, rate: 62.5, gstRate: 18 },
    { id: 's2', type: 'goods', desc: 'Binding wire', hsnSac: '7217', uqc: 'KGS', qty: 15, rate: 78, gstRate: 18 },
    { id: 's3', type: 'service', desc: 'Delivery and unloading', hsnSac: '9965', uqc: 'NOS', qty: 1, rate: 850, gstRate: 18 },
  ],
})
