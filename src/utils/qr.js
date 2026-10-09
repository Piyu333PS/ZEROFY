// Chhota QR code generator (byte mode, error-correction level M, version 1–12 ≈ 280 characters tak).
// Invoice par UPI payment QR ke liye — koi external library ya network call nahi lagta,
// isliye preview, print aur PDF teeno mein same chalta hai.

// [EC codewords per block, [blocks, data codewords per block], ...] — level M
const EC_TABLE = [
  null,
  [10, [1, 16]], [16, [1, 28]], [26, [1, 44]], [18, [2, 32]], [24, [2, 43]], [16, [4, 27]],
  [18, [4, 31]], [22, [2, 38], [2, 39]], [22, [3, 36], [2, 37]], [26, [4, 43], [1, 44]],
  [30, [1, 50], [4, 51]], [22, [6, 36], [2, 37]],
]
const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58]]
const MAX_VERSION = 12

// GF(256) tables
const EXP = new Uint8Array(512), LOG = new Uint8Array(256)
{
  let x = 1
  for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
}
const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0)

function rsRemainder(data, ecLen) {
  // generator polynomial
  let gen = [1]
  for (let i = 0; i < ecLen; i++) {
    const next = new Array(gen.length + 1).fill(0)
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j]
      next[j + 1] ^= mul(gen[j], EXP[i])
    }
    gen = next
  }
  const rem = new Array(ecLen).fill(0)
  for (const b of data) {
    const factor = b ^ rem.shift()
    rem.push(0)
    for (let i = 0; i < ecLen; i++) rem[i] ^= mul(gen[i + 1], factor)
  }
  return rem
}

const dataCapacity = (v) => EC_TABLE[v].slice(1).reduce((s, [n, k]) => s + n * k, 0)

function encodeData(bytes, version) {
  const cap = dataCapacity(version)
  const bits = []
  const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1) }
  push(4, 4)                                  // byte mode
  push(bytes.length, version < 10 ? 8 : 16)   // character count
  for (const b of bytes) push(b, 8)
  push(0, Math.min(4, cap * 8 - bits.length)) // terminator
  while (bits.length % 8) bits.push(0)
  const out = []
  for (let i = 0; i < bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8).join(''), 2))
  for (let pad = 0xec; out.length < cap; pad ^= 0xec ^ 0x11) out.push(pad)
  return out
}

function interleave(data, version) {
  const [ecLen, ...groups] = EC_TABLE[version]
  const blocks = []
  let pos = 0
  for (const [count, size] of groups) {
    for (let i = 0; i < count; i++) {
      const d = data.slice(pos, pos + size)
      pos += size
      blocks.push({ d, e: rsRemainder(d, ecLen) })
    }
  }
  const out = []
  const maxData = Math.max(...blocks.map(b => b.d.length))
  for (let i = 0; i < maxData; i++) for (const b of blocks) if (i < b.d.length) out.push(b.d[i])
  for (let i = 0; i < ecLen; i++) for (const b of blocks) out.push(b.e[i])
  return out
}

const MASKS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
]

function buildMatrix(codewords, version, mask) {
  const n = version * 4 + 17
  const m = Array.from({ length: n }, () => new Array(n).fill(false))
  const fn = Array.from({ length: n }, () => new Array(n).fill(false)) // function modules
  const set = (r, c, v) => { m[r][c] = v; fn[r][c] = true }

  const finder = (r0, c0) => {
    for (let dr = -4; dr <= 4; dr++) for (let dc = -4; dc <= 4; dc++) {
      const r = r0 + dr, c = c0 + dc
      if (r < 0 || r >= n || c < 0 || c >= n) continue
      const d = Math.max(Math.abs(dr), Math.abs(dc))
      set(r, c, d !== 2 && d !== 4)
    }
  }
  finder(3, 3); finder(3, n - 4); finder(n - 4, 3)

  for (let i = 0; i < n; i++) { // timing
    if (!fn[6][i]) set(6, i, i % 2 === 0)
    if (!fn[i][6]) set(i, 6, i % 2 === 0)
  }

  const centers = ALIGN[version]
  for (const r of centers) for (const c of centers) {
    if ((r === 6 && c === 6) || (r === 6 && c === n - 7) || (r === n - 7 && c === 6)) continue
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1)
    }
  }

  // format info (level M = 00)
  const drawFormat = (maskId) => {
    const data = maskId // (0b00 << 3) | mask
    let rem = data
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
    const bits = ((data << 10) | rem) ^ 0x5412
    const bit = (i) => ((bits >>> i) & 1) === 1
    for (let i = 0; i <= 5; i++) set(i, 8, bit(i))
    set(7, 8, bit(6)); set(8, 8, bit(7)); set(8, 7, bit(8))
    for (let i = 9; i < 15; i++) set(8, 14 - i, bit(i))
    for (let i = 0; i < 8; i++) set(8, n - 1 - i, bit(i))
    for (let i = 8; i < 15; i++) set(n - 15 + i, 8, bit(i))
    set(n - 8, 8, true) // dark module
  }
  drawFormat(mask)

  if (version >= 7) {
    let rem = version
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
    const bits = (version << 12) | rem
    for (let i = 0; i < 18; i++) {
      const b = ((bits >>> i) & 1) === 1
      const a = n - 11 + (i % 3), k = Math.floor(i / 3)
      set(a, k, b); set(k, a, b)
    }
  }

  // data placement (zig-zag from bottom-right)
  let i = 0
  const total = codewords.length * 8
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < n; vert++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j
        const upward = ((right + 1) & 2) === 0
        const r = upward ? n - 1 - vert : vert
        if (fn[r][c]) continue
        let dark = false
        if (i < total) dark = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) === 1
        i++
        if (MASKS[mask](r, c)) dark = !dark
        m[r][c] = dark
      }
    }
  }
  return m
}

// Mask ka penalty score (standard ke 4 rules) — sabse kam score wala mask sabse aasani se scan hota hai
function penalty(m) {
  const n = m.length
  let score = 0
  const runs = (get) => {
    for (let a = 0; a < n; a++) {
      let run = 1
      for (let b = 1; b < n; b++) {
        if (get(a, b) === get(a, b - 1)) { run++; if (run === 5) score += 3; else if (run > 5) score++ } else run = 1
      }
      // finder-like pattern 1:1:3:1:1 with 4 light modules on a side
      for (let b = 0; b + 10 < n; b++) {
        const p = []
        for (let k = 0; k < 11; k++) p.push(get(a, b + k) ? 1 : 0)
        const s = p.join('')
        if (s === '10111010000' || s === '00001011101') score += 40
      }
    }
  }
  runs((a, b) => m[a][b]); runs((a, b) => m[b][a])
  for (let r = 0; r < n - 1; r++) for (let c = 0; c < n - 1; c++) {
    const v = m[r][c]
    if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3
  }
  let dark = 0
  for (const row of m) for (const v of row) if (v) dark++
  score += Math.floor(Math.abs(dark * 20 - n * n * 10) / (n * n)) * 10
  return score
}

const toUtf8 = (text) => {
  const s = unescape(encodeURIComponent(String(text)))
  const out = []
  for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i))
  return out
}

// text → boolean matrix (true = dark). Text bahut lamba ho to null.
export function qrMatrix(text) {
  const bytes = toUtf8(text)
  let version = 0
  for (let v = 1; v <= MAX_VERSION; v++) {
    const need = 4 + (v < 10 ? 8 : 16) + bytes.length * 8
    if (need <= dataCapacity(v) * 8) { version = v; break }
  }
  if (!version) return null
  const codewords = interleave(encodeData(bytes, version), version)
  let best = null, bestScore = Infinity
  for (let mask = 0; mask < 8; mask++) {
    const m = buildMatrix(codewords, version, mask)
    const s = penalty(m)
    if (s < bestScore) { bestScore = s; best = m }
  }
  return best
}

// SVG path data (1 unit = 1 module, 4-module quiet zone included in `size`)
export function qrSvg(text) {
  const m = qrMatrix(text)
  if (!m) return null
  const q = 4
  let d = ''
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m.length; c++) {
      if (!m[r][c]) continue
      let w = 1
      while (c + w < m.length && m[r][c + w]) w++
      d += `M${c + q} ${r + q}h${w}v1h-${w}z`
      c += w - 1
    }
  }
  return { size: m.length + q * 2, path: d }
}

/* ─── UPI ────────────────────────────────────────────────────── */
export const isValidUpiId = (v) => /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/.test(String(v || '').trim())

// NPCI ka standard UPI deep-link — kisi bhi UPI app (GPay, PhonePe, Paytm, BHIM) se scan hota hai
export function upiPayUri({ upiId, name, amount, note }) {
  if (!isValidUpiId(upiId)) return ''
  const enc = (s) => encodeURIComponent(String(s || '').trim()).replace(/%20/g, '%20')
  const parts = [`pa=${String(upiId).trim()}`]
  if (name) parts.push(`pn=${enc(String(name).slice(0, 50))}`)
  const amt = Number(amount)
  if (amt > 0) parts.push(`am=${amt.toFixed(2)}`)
  parts.push('cu=INR')
  if (note) parts.push(`tn=${enc(String(note).slice(0, 50))}`)
  return `upi://pay?${parts.join('&')}`
}
