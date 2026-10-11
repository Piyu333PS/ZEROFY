// Indian mobile number as typed or pasted → the 10 digits.
// "+91 98111 22233", "919811122233" and "09811122233" all become "9811122233".
// While typing, a leading 91 or 0 is allowed to stay until the full number is in.
export function cleanMobile(value) {
  let d = String(value || '').replace(/\D/g, '')
  const max = d.startsWith('91') ? 12 : d.startsWith('0') ? 11 : 10
  d = d.slice(0, max)
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return d
}
