// Single source of truth for Zerofy Pro — feature list + plan pricing.
// Imported by PricingPage and BillingPage so copy/colors never drift apart.

export const PRO_FEATURES = [
  { icon: '', label: 'Unlimited invoices' },
  { icon: '', label: 'Quotations and credit notes' },
  { icon: '', label: 'Clients, saved items and payment tracking' },
  { icon: '', label: 'GST summary and reports with CSV export' },
  { icon: '', label: 'UPI "Scan to pay" QR code on invoices' },
  { icon: '', label: 'Priority support' },
]

// Accent theme per billing cycle — reused across Pricing + Billing pages.
export const PLAN_THEME = {
  monthly: {
    name: 'Monthly',
    emoji: '',
    accent: '#EFA02F',
    soft: 'rgba(239,160,47,0.08)',
    border: 'rgba(239,160,47,0.25)',
    gradient: '#EFA02F',
  },
  quarterly: {
    name: 'Quarterly',
    emoji: '',
    accent: '#F6B24E',
    soft: 'linear-gradient(135deg, rgba(239,160,47,0.12) 0%, rgba(239,160,47,0.14) 100%)',
    border: 'rgba(239,160,47,0.5)',
    gradient: '#EFA02F',
  },
  yearly: {
    name: 'Yearly',
    emoji: '',
    accent: '#fbbf24',
    soft: 'rgba(251,191,36,0.07)',
    border: 'rgba(251,191,36,0.3)',
    gradient: '#EFA02F',
  },
}

// Prices are before GST. GST (when Zerofy charges it) is added at checkout.
export const PLANS = [
  {
    id: 'monthly',
    price: 149,
    listPrice: 149,
    period: '/month',
    months: 1,
    desc: 'Pay month by month. Good for trying Pro.',
    badge: null,
    cta: 'Choose Monthly',
    ctaStyle: 'blue',
  },
  {
    id: 'yearly',
    price: 999,
    listPrice: 1499,
    period: '/year',
    months: 12,
    desc: 'Launch offer. One payment for the whole year.',
    badge: 'Best Value',
    cta: 'Choose Yearly',
    ctaStyle: 'gradient',
  },
]

// % saved vs paying the monthly price every month for the same stretch.
export const savingsVsMonthly = (planId) => {
  const plan = PLANS.find(p => p.id === planId)
  if (!plan || plan.months === 1) return 0
  const monthly = PLANS.find(p => p.id === 'monthly').price
  const fullPrice = monthly * plan.months
  return Math.round(((fullPrice - plan.price) / fullPrice) * 100)
}
