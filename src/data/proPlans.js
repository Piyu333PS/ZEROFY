// Single source of truth for Zerofy Pro — feature list + plan pricing.
// Imported by PricingPage and BillingPage so copy/colors never drift apart.

export const PRO_FEATURES = [
  { icon: '🧾', label: 'Unlimited invoice generation' },
  { icon: '🛠️', label: 'Every tool unlocked' },
  { icon: '📁', label: 'Unlimited file processing' },
  { icon: '📦', label: 'Max 100MB file size' },
  { icon: '🚫', label: 'No watermarks' },
  { icon: '🎧', label: 'Priority support' },
]

// Accent theme per billing cycle — reused across Pricing + Billing pages.
export const PLAN_THEME = {
  monthly: {
    name: 'Monthly',
    emoji: '⚡',
    accent: '#60A5FA',
    soft: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.25)',
    gradient: 'linear-gradient(135deg, #60A5FA, #3B82F6)',
  },
  quarterly: {
    name: 'Quarterly',
    emoji: '🔥',
    accent: '#A78BFA',
    soft: 'linear-gradient(135deg, rgba(96,165,250,0.12) 0%, rgba(167,139,250,0.14) 100%)',
    border: 'rgba(167,139,250,0.5)',
    gradient: 'linear-gradient(135deg, #60A5FA, #A78BFA)',
  },
  yearly: {
    name: 'Yearly',
    emoji: '💰',
    accent: '#fbbf24',
    soft: 'rgba(251,191,36,0.07)',
    border: 'rgba(251,191,36,0.3)',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
  },
}

export const PLANS = [
  {
    id: 'monthly',
    price: 49,
    period: '/month',
    months: 1,
    desc: 'Billed every month. Cancel anytime.',
    badge: null,
    cta: 'Get Started',
    ctaStyle: 'blue',
  },
  {
    id: 'quarterly',
    price: 129,
    period: '/3 months',
    months: 3,
    desc: 'Save vs monthly. Billed every 3 months.',
    badge: '🔥 Most Popular',
    cta: 'Get Started',
    ctaStyle: 'gradient',
  },
  {
    id: 'yearly',
    price: 399,
    period: '/year',
    months: 12,
    desc: 'Best value. Billed once a year.',
    badge: '💰 Best Value',
    cta: 'Get Started',
    ctaStyle: 'gold',
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
