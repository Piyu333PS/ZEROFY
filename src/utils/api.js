// Chhota fetch helper — har dashboard page mein alag-alag fetch boilerplate ki jagah.
// Hamesha { ok, status, data } lautata hai; network fail ho to ok:false aur data.error set hota hai.
export const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function api(path, token, { method = 'GET', body } = {}) {
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    let data = null
    try { data = await res.json() } catch { data = null }
    return { ok: res.ok, status: res.status, data: data || {} }
  } catch (e) {
    return { ok: false, status: 0, data: { error: 'Network error. Check your internet connection and try again.' } }
  }
}

// Pro status (branding hatane ke liye) — ek baar fetch hota hai, phir memory mein rehta hai
let proCache = { token: null, value: null }
export async function fetchIsPro(token) {
  if (!token) return false
  if (proCache.token === token && proCache.value !== null) return proCache.value
  const r = await api('/api/invoices/status', token)
  const value = Boolean(r.ok && r.data.isPro)
  if (r.ok) proCache = { token, value }
  return value
}
export const clearProCache = () => { proCache = { token: null, value: null } }
