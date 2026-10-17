// Shared form checks used by the invoice editor, clients, items and onboarding.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
// 2-digit state code, 10-char PAN, entity code, 'Z', checksum
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const GST_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
// State / UT codes the GST portal issues (01–38), plus 97 (Other Territory) and 99 (Centre Jurisdiction)
const validState = (code) => (code >= 1 && code <= 38) || code === 97 || code === 99

// The 15th character of a GSTIN is a check digit worked out from the first 14
export const gstinCheckChar = (first14) => {
  let sum = 0
  for (let i = 0; i < 14; i++) {
    const v = GST_CHARS.indexOf(first14[i])
    const p = v * (i % 2 === 0 ? 1 : 2)
    sum += Math.floor(p / 36) + (p % 36)
  }
  return GST_CHARS[(36 - (sum % 36)) % 36]
}

// '' when the GSTIN is fine (or empty), otherwise a short message a user understands
export function gstinError(raw) {
  const v = String(raw || '').trim().toUpperCase()
  if (!v) return ''
  if (v.length !== 15) return 'GSTIN must be 15 characters'
  // wrong pattern, unknown state code or wrong last (check) character — to the user it is all one thing
  if (!GSTIN_RE.test(v) || !validState(Number(v.slice(0, 2))) || gstinCheckChar(v) !== v[14]) {
    return 'GSTIN is not valid. Please check the number'
  }
  return ''
}
export const validateGstin = (v) => !gstinError(v)

// Indian mobile: 10 digits, starting 6–9, not one digit repeated
export function phoneError(raw) {
  const v = String(raw || '')
  if (!v) return ''
  if (!/^\d{10}$/.test(v)) return 'Phone must be 10 digits'
  if (!/^[6-9]/.test(v) || /^(\d)\1{9}$/.test(v)) return 'Enter a real 10-digit mobile number'
  return ''
}

export const emailError = (raw) => {
  const v = String(raw || '').trim()
  return v && !EMAIL_RE.test(v) ? 'Email is not valid' : ''
}

// HSN (goods) is 4, 6 or 8 digits; SAC (services) is 6 digits starting 99
export function hsnError(raw, type = 'goods') {
  const v = String(raw || '').trim()
  if (!v) return ''
  if (!/^\d+$/.test(v)) return `${type === 'service' ? 'SAC' : 'HSN'} code must contain digits only`
  if (type === 'service') return /^99\d{4}$/.test(v) ? '' : 'SAC code must be 6 digits and start with 99'
  return [4, 6, 8].includes(v.length) ? '' : 'HSN code must be 4, 6 or 8 digits'
}
