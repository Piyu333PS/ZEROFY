import { useEffect, useState, useCallback } from 'react'
import { api } from './api'

/* Billing app ka shared data store.
   Pehle har page (Overview, Invoices, Clients, Payments, Reports, Invoice maker) khulte hi
   2–4 alag API calls karta tha — har baar 2–5 second. Ab poora data ek hi request
   (/api/dashboard/bootstrap) mein aata hai aur memory mein rehta hai:
   - page badalne par data turant dikhta hai (purana data dikhakar peeche se refresh hota hai)
   - kuch bhi save/delete karne ke baad refresh() se sab pages ek saath update ho jate hain */

const FRESH_MS = 15000

let state = { token: null, data: null, error: null, at: 0 }
let inflight = null
const subscribers = new Set()
const emit = () => subscribers.forEach(fn => fn())

// Logo har invoice mein store nahi hota — business profile se jod do, taaki view/print/PDF mein dikhe
function normalize(raw) {
  const businesses = raw.businesses || []
  const logoByBiz = {}
  for (const b of businesses) if (b && b.id && b.logo) logoByBiz[b.id] = b.logo
  return {
    businesses,
    invoices: (raw.invoices || []).map(inv => ({ ...inv, bizLogo: inv.bizLogo || logoByBiz[inv.bizId] || '' })),
    customers: raw.customers || [],
    payments: raw.payments || [],
    items: raw.items || [],
    stats: raw.stats || null,
    status: raw.status || { invoiceCount: 0, freeLimit: 3, isPro: false },
  }
}

export function loadBilling(token, { force = false } = {}) {
  if (!token) return Promise.resolve(null)
  if (state.token !== token) { state = { token, data: null, error: null, at: 0 }; inflight = null }
  if (!force && state.data && Date.now() - state.at < FRESH_MS) return Promise.resolve(state.data)
  if (inflight) return inflight

  const mine = (inflight = api('/api/dashboard/bootstrap', token).then(res => {
    if (inflight === mine) inflight = null
    if (state.token !== token) return null // is beech logout / account change ho gaya
    if (res.ok && res.data.success) {
      state = { token, data: normalize(res.data), error: null, at: Date.now() }
    } else {
      state = { ...state, error: res.data.error || 'Could not load your data. Refresh the page and try again.' }
    }
    emit()
    return state.data
  }))
  emit()
  return mine
}

// Cached data mein chhota badlav turant dikhane ke liye (server refresh ka wait kiye bina)
export function patchBilling(partial) {
  if (!state.data) return
  state = { ...state, data: normalize({ ...state.data, ...partial }) }
  emit()
}

export const clearBilling = () => { state = { token: null, data: null, error: null, at: 0 }; inflight = null; emit() }

export function useBilling(token) {
  const [, tick] = useState(0)
  useEffect(() => {
    const fn = () => tick(n => n + 1)
    subscribers.add(fn)
    if (token) loadBilling(token)
    return () => { subscribers.delete(fn) }
  }, [token])

  const refresh = useCallback(() => loadBilling(token, { force: true }), [token])
  const mine = state.token === token
  const data = mine ? state.data : null
  return {
    data,
    loading: Boolean(token) && !data && !(mine && state.error), // pehli baar load ho raha hai
    refreshing: Boolean(inflight) && Boolean(data),
    error: mine ? state.error : null,
    refresh,
  }
}
