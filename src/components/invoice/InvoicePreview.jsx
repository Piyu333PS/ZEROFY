import { TEMPLATES, UQC_CODES } from '../../data/invoiceCodes'

export const today = () => new Date().toISOString().slice(0, 10)
export const fmt = (n, sym = '₹') => `${sym}${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/* ─── Professional Invoice Preview ───────────────────────────── */
export function InvoicePreview({ inv, items, currency, discPct, taxPct, template, status }) {
  const sub = items.reduce((s, i) => s + (i.qty || 0) * (parseFloat(i.rate) || 0), 0)
  const disc = sub * (discPct / 100)
  const gstTotal = items.reduce((s, i) => s + (i.qty || 0) * (parseFloat(i.rate) || 0) * ((i.gstRate || 0) / 100), 0)
  const total = sub - disc + gstTotal
  const t = TEMPLATES.find(t => t.key === template) || TEMPLATES[0]
  const acc = t.accent
  const accLight = acc + '14'
  const accMid = acc + '28'

  const statusColors = { draft: '#818CF8', sent: '#38BDF8', paid: '#34D399', overdue: '#F87171', cancelled: '#9CA3AF' }
  const sc = statusColors[status] || statusColors.draft

  const filteredItems = items.filter(i => i.desc || i.rate)

  // number to words (Indian system)
  const numToWords = (n) => {
    const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
    const b = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
    if (n === 0) return 'Zero'
    const h = (x) => {
      if (x < 20) return a[x]
      if (x < 100) return b[Math.floor(x/10)] + (x%10 ? ' ' + a[x%10] : '')
      return a[Math.floor(x/100)] + ' Hundred' + (x%100 ? ' ' + h(x%100) : '')
    }
    let r = '', num = Math.floor(n)
    if (num >= 10000000) { r += h(Math.floor(num/10000000)) + ' Crore '; num %= 10000000 }
    if (num >= 100000)   { r += h(Math.floor(num/100000))   + ' Lakh ';  num %= 100000 }
    if (num >= 1000)     { r += h(Math.floor(num/1000))     + ' Thousand '; num %= 1000 }
    if (num > 0)          r += h(num)
    return r.trim() + ' Only'
  }

  return (
    <div style={{
      background: '#fff',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      color: '#1a1a2e',
      position: 'relative',
      minHeight: 700,
    }}>
      {/* TOP COLOR BAR */}
      <div style={{ height: 6, background: `linear-gradient(90deg, ${acc}, ${acc}99)` }} />

      {/* HEADER */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '28px 32px 20px',
        borderBottom: `1px solid ${accMid}`,
        background: accLight,
      }}>
        {/* Left — Seller */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 22, fontWeight: 800, color: acc,
            letterSpacing: '-0.02em', marginBottom: 6, lineHeight: 1.1
          }}>
            {inv.bizName || 'Your Business'}
          </div>
          {inv.bizAddr && (
            <div style={{ fontSize: 10.5, color: '#5A578A', lineHeight: 1.7, whiteSpace: 'pre-line', maxWidth: 220 }}>
              {inv.bizAddr}
            </div>
          )}
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {inv.bizPhone && <div style={{ fontSize: 10.5, color: '#5A578A' }}>📞 {inv.bizPhone}</div>}
            {inv.bizAltPhone && <div style={{ fontSize: 10.5, color: '#5A578A' }}>📞 {inv.bizAltPhone} <span style={{ fontSize: 9, color: '#9492C0' }}>(alt)</span></div>}
            {inv.bizEmail && <div style={{ fontSize: 10.5, color: '#5A578A' }}>✉ {inv.bizEmail}</div>}
            {inv.bizAltEmail && <div style={{ fontSize: 10.5, color: '#5A578A' }}>✉ {inv.bizAltEmail} <span style={{ fontSize: 9, color: '#9492C0' }}>(alt)</span></div>}
            {inv.bizGst   && <div style={{ fontSize: 10.5, color: '#5A578A', fontWeight: 600 }}>GSTIN: {inv.bizGst}</div>}
          </div>
        </div>

        {/* Right — Invoice meta */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: 32, fontWeight: 900, color: acc,
            letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8,
            textTransform: 'uppercase'
          }}>INVOICE</div>
          <div style={{
            fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
            color: '#1a1a2e', marginBottom: 8, letterSpacing: '0.04em'
          }}>{inv.no || 'INV-2026-001'}</div>
          <div style={{ fontSize: 10, color: '#5A578A', marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>Date: </span>{inv.date || today()}
          </div>
          <div style={{ marginTop: 8 }}>
            <span style={{
              background: sc + '22', color: sc, fontSize: 9, fontWeight: 800,
              padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase',
              letterSpacing: '0.1em', border: `1px solid ${sc}44`
            }}>{status}</span>
          </div>
        </div>
      </div>

      {/* BILL TO / FROM CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, margin: '0', borderBottom: `1px solid ${accMid}` }}>
        {/* Bill To */}
        <div style={{ padding: '18px 32px', borderRight: `1px solid ${accMid}` }}>
          <div style={{
            fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em',
            color: acc, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6
          }}>
            <div style={{ width: 18, height: 2, background: acc, borderRadius: 2 }} />
            Bill To
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>
            {inv.clientName || '—'}
          </div>
          {inv.clientAddr && (
            <div style={{ fontSize: 10.5, color: '#5A578A', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 4 }}>
              {inv.clientAddr}
            </div>
          )}
          {inv.clientPhone && <div style={{ fontSize: 10.5, color: '#5A578A' }}>📞 {inv.clientPhone}</div>}
          {inv.clientEmail && <div style={{ fontSize: 10.5, color: '#5A578A' }}>✉ {inv.clientEmail}</div>}
          {inv.clientGst   && <div style={{ fontSize: 10.5, color: '#5A578A', fontWeight: 600, marginTop: 2 }}>GSTIN: {inv.clientGst}</div>}
        </div>

        {/* Invoice Summary Box */}
        <div style={{ padding: '18px 32px', background: accLight }}>
          <div style={{
            fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em',
            color: acc, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6
          }}>
            <div style={{ width: 18, height: 2, background: acc, borderRadius: 2 }} />
            Invoice Summary
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <tbody>
              <tr>
                <td style={{ padding: '3px 0', color: '#5A578A' }}>Invoice No.</td>
                <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: '#1a1a2e' }}>{inv.no || '—'}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', color: '#5A578A' }}>Issue Date</td>
                <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 600, color: '#1a1a2e' }}>{inv.date || today()}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px 0', color: '#5A578A' }}>Currency</td>
                <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 600, color: '#1a1a2e' }}>{currency === '₹' ? 'INR' : currency}</td>
              </tr>
              {discPct > 0 && (
                <tr>
                  <td style={{ padding: '3px 0', color: '#5A578A' }}>Discount</td>
                  <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 600, color: '#34D399' }}>{discPct}%</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div style={{ padding: '20px 32px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: acc }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', width: 30 }}>#</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Description</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', width: 60 }}>HSN/SAC</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', width: 55 }}>UQC</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', width: 45 }}>Qty</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', color: '#fff', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', width: 90 }}>Rate</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', width: 50 }}>GST%</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', width: 60 }}>GST Amt</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', color: '#fff', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', width: 95 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#9492C0', fontSize: 11 }}>No items added yet</td>
              </tr>
            )}
            {filteredItems.map((it, idx) => {
              const taxable = (it.qty || 0) * (parseFloat(it.rate) || 0)
              const gstAmt = taxable * (it.gstRate / 100)
              const rowTotal = taxable + gstAmt
              return (
                <tr key={it.id} style={{
                  background: idx % 2 === 0 ? '#fff' : accLight,
                  borderBottom: `1px solid ${accMid}`
                }}>
                  <td style={{ padding: '10px 12px', color: '#9492C0', fontWeight: 600, fontSize: 10 }}>{idx + 1}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600, fontSize: 11, color: '#1a1a2e' }}>{it.desc || '—'}</div>
                    <div style={{ fontSize: 9, color: '#9492C0', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {it.type === 'goods' ? '🟡 Goods' : '🔵 Service'}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'monospace', fontSize: 10, color: '#6B6A9A' }}>{it.hsnSac || '—'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'monospace', fontSize: 10, color: '#6B6A9A' }}>{(UQC_CODES.find(u => u.code === it.uqc) || { label: 'PIECES' }).label}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{it.qty}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: 10.5 }}>{fmt(parseFloat(it.rate) || 0, currency)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 10 }}>
                    <span style={{
                      background: acc + '18', color: acc, fontWeight: 700,
                      padding: '2px 6px', borderRadius: 4, fontSize: 9
                    }}>{it.gstRate}%</span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'monospace', fontSize: 10, color: '#6B6A9A' }}>{fmt(gstAmt, currency)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, fontSize: 11, color: '#1a1a2e' }}>{fmt(rowTotal, currency)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* TOTALS + NOTES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 24, padding: '16px 32px 24px', alignItems: 'start' }}>
        {/* Left — Amount words + Notes */}
        <div>
          <div style={{
            background: accLight, border: `1px solid ${accMid}`,
            borderRadius: 8, padding: '12px 14px', marginBottom: 12
          }}>
            <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: acc, marginBottom: 4 }}>Amount in Words</div>
            <div style={{ fontSize: 11, color: '#1a1a2e', fontWeight: 500, fontStyle: 'italic', lineHeight: 1.5 }}>
              {currency}{numToWords(total)}
            </div>
          </div>
          {inv.notes && (
            <div style={{ background: '#fffbf0', border: '1px solid #f5e6b0', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#B8860B', marginBottom: 4 }}>Notes & Payment Details</div>
              <div style={{ fontSize: 10.5, color: '#5A578A', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{inv.notes}</div>
            </div>
          )}
        </div>

        {/* Right — Totals breakdown */}
        <div style={{ border: `1px solid ${accMid}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ background: acc + '10', padding: '8px 14px', borderBottom: `1px solid ${accMid}` }}>
            <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: acc }}>Summary</div>
          </div>
          <div style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, color: '#5A578A' }}>
              <span>Subtotal</span>
              <span style={{ fontFamily: 'monospace' }}>{fmt(sub, currency)}</span>
            </div>
            {disc > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, color: '#34D399' }}>
                <span>Discount ({discPct}%)</span>
                <span style={{ fontFamily: 'monospace' }}>−{fmt(disc, currency)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, color: '#5A578A' }}>
              <span>GST (per HSN/SAC)</span>
              <span style={{ fontFamily: 'monospace' }}>{fmt(gstTotal, currency)}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', padding: '10px 14px',
              background: acc, borderRadius: 6, marginTop: 8,
              fontSize: 13, fontWeight: 900, color: '#fff'
            }}>
              <span>Total</span>
              <span style={{ fontFamily: 'monospace' }}>{fmt(total, currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{
        borderTop: `2px solid ${accMid}`,
        background: accLight,
        padding: '14px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ fontSize: 9, color: '#9492C0' }}>
          This is a computer-generated invoice
        </div>
        <div style={{ fontSize: 9, color: '#9492C0', textAlign: 'right' }}>
          {inv.bizName && <span style={{ fontWeight: 700, color: acc }}>{inv.bizName}</span>}
          {inv.bizGst && <span> · GSTIN: {inv.bizGst}</span>}
        </div>
      </div>

      {/* Bottom accent line */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${acc}99, ${acc})` }} />

      {/* ZEROFY WATERMARK */}
      <div style={{
        padding: '8px 32px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        borderTop: '1px dashed #e8e5f5',
        background: 'linear-gradient(180deg, #fafafe, #f5f3ff)',
      }}>
        <span style={{ fontSize: 8, color: '#aaa', letterSpacing: '0.04em', fontStyle: 'italic' }}>Created with</span>
        <span style={{
          fontSize: 11, fontWeight: 900, letterSpacing: '0.06em',
          background: 'linear-gradient(90deg, #7C6FFF, #A78BFA)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>ZEROFY</span>
        <span style={{ fontSize: 8, color: '#bbb', letterSpacing: '0.01em' }}>Invoice Generator</span>
        <span style={{ fontSize: 8, color: '#ccc' }}>·</span>
        <a href="https://www.zerofy.co.in" style={{
          fontSize: 8, color: '#8B7FFF', textDecoration: 'none', fontWeight: 600, letterSpacing: '0.02em'
        }}>www.zerofy.co.in</a>
      </div>
    </div>
  )
}
