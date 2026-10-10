import { TEMPLATES, UQC_CODES } from '../../data/invoiceCodes'
import {
  calcInvoice, fmtMoney, localToday, amountInWords, docView,
} from '../../utils/invoiceCalc'
import { qrSvg, upiPayUri } from '../../utils/qr'

export const today = localToday
export const fmt = fmtMoney

const th = (align, width) => ({
  padding: '9px 8px', textAlign: align, color: '#fff', fontWeight: 700, fontSize: 8.5,
  textTransform: 'uppercase', letterSpacing: '0.08em', width,
})
const td = (align) => ({ padding: '9px 8px', textAlign: align, verticalAlign: 'top' })

/* ─── Professional Invoice Preview ─────────────────────────────
   `inv` mein poora invoice hota hai. Purane callers jo items / currency / discPct /
   template / status alag se bhejte the, wo bhi chalte hain — wo props inv ke upar merge ho jate hain. */
export function InvoicePreview({ inv = {}, items, currency, discPct, taxPct, template, status, hideBranding = false }) {
  const full = {
    ...inv,
    ...(items !== undefined ? { items } : {}),
    ...(currency !== undefined ? { currency } : {}),
    ...(discPct !== undefined ? { discPct } : {}),
    ...(taxPct !== undefined ? { taxPct } : {}),
    ...(template !== undefined ? { template } : {}),
    ...(status !== undefined ? { status } : {}),
  }
  const cur = full.currency || '₹'
  const c = calcInvoice(full)
  const t = TEMPLATES.find(x => x.key === full.template) || TEMPLATES[0]
  const acc = t.accent
  const accLight = acc + '14'
  const accMid = acc + '28'
  const money = (n) => fmtMoney(n, cur)

  const st = full.status || 'draft'
  const isDraft = st === 'draft'
  const isCancelled = st === 'cancelled'
  const view = docView(full, c)
  const { paid, credited, balance } = view
  // UPI "Scan to pay" QR — only on ₹ invoices, while money is still due
  const payable = balance
  const upiUri = (cur === '₹' && view.allowQr)
    ? upiPayUri({ upiId: full.upiId, name: full.bizName, amount: payable, note: full.no ? `Invoice ${full.no}` : '' })
    : ''
  const qr = upiUri ? qrSvg(upiUri) : null

  const uqcLabel = (code) => (UQC_CODES.find(u => u.code === code) || {}).code || code || ''

  const metaRows = view.meta.map((row, i) => (i === 0 ? [...row, true] : row))

  const sumRow = (label, value, color) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11, color: color || '#4B5B6E' }}>
      <span>{label}</span>
      <span style={{ fontFamily: 'monospace' }}>{value}</span>
    </div>
  )

  return (
    <div style={{
      background: '#fff',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      color: '#14202E',
      position: 'relative',
      minHeight: 700,
      overflow: 'hidden',
    }}>
      {/* DRAFT / CANCELLED watermark */}
      {(isDraft || isCancelled) && (
        <div style={{
          position: 'absolute', top: '38%', left: 0, right: 0, textAlign: 'center',
          fontSize: 96, fontWeight: 900, letterSpacing: '0.12em',
          color: isCancelled ? 'rgba(193,68,60,0.09)' : 'rgba(26,26,46,0.06)',
          transform: 'rotate(-24deg)', pointerEvents: 'none', userSelect: 'none', zIndex: 0,
        }}>{isCancelled ? 'CANCELLED' : 'DRAFT'}</div>
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* TOP COLOR BAR */}
        <div style={{ height: 6, background: `linear-gradient(90deg, ${acc}, ${acc}99)` }} />

        {/* HEADER */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
          padding: '26px 32px 20px',
          borderBottom: `1px solid ${accMid}`,
          background: accLight,
        }}>
          {/* Left — Seller */}
          <div style={{ flex: 1, display: 'flex', gap: 14, alignItems: 'flex-start', minWidth: 0 }}>
            {full.bizLogo && (
              <img src={full.bizLogo} alt="" style={{ width: 58, height: 58, objectFit: 'contain', borderRadius: 8, background: '#fff', flexShrink: 0 }} />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: acc, letterSpacing: '-0.02em', marginBottom: 6, lineHeight: 1.15, wordBreak: 'break-word' }}>
                {full.bizName || 'Your Business'}
              </div>
              {full.bizAddr && (
                <div style={{ fontSize: 10.5, color: '#4B5B6E', lineHeight: 1.6, whiteSpace: 'pre-line', maxWidth: 260 }}>
                  {full.bizAddr}
                </div>
              )}
              <div style={{ marginTop: 5, display: 'flex', flexDirection: 'column', gap: 2, fontSize: 10.5, color: '#4B5B6E' }}>
                {(full.bizPhone || full.bizAltPhone) && <div>Ph: {[full.bizPhone, full.bizAltPhone].filter(Boolean).join(', ')}</div>}
                {(full.bizEmail || full.bizAltEmail) && <div>Email: {[full.bizEmail, full.bizAltEmail].filter(Boolean).join(', ')}</div>}
                {full.bizGst && <div style={{ fontWeight: 700, color: '#263A52' }}>GSTIN: {full.bizGst}</div>}
              </div>
            </div>
          </div>

          {/* Right — Invoice meta */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: acc, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8, textTransform: 'uppercase' }}>
              {view.title}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#14202E', letterSpacing: '0.04em' }}>
              {full.no || '—'}
            </div>
            {view.badge && (
              <div style={{ marginTop: 8 }}>
                <span style={{
                  background: '#34D39922', color: '#1F9C5A', fontSize: 9, fontWeight: 800,
                  padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase',
                  letterSpacing: '0.1em', border: '1px solid #34D39966',
                }}>{view.badge}</span>
              </div>
            )}
          </div>
        </div>

        {/* BILL TO / DETAILS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${accMid}` }}>
          <div style={{ padding: '16px 32px', borderRight: `1px solid ${accMid}` }}>
            <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: acc, marginBottom: 8 }}>
              Bill To
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#14202E', marginBottom: 4, wordBreak: 'break-word' }}>
              {full.clientName || '—'}
            </div>
            {full.clientAddr && (
              <div style={{ fontSize: 10.5, color: '#4B5B6E', lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: 4 }}>
                {full.clientAddr}
              </div>
            )}
            <div style={{ fontSize: 10.5, color: '#4B5B6E', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {full.clientPhone && <div>Ph: {full.clientPhone}</div>}
              {full.clientEmail && <div>Email: {full.clientEmail}</div>}
              {full.clientGst && <div style={{ fontWeight: 700, color: '#263A52' }}>GSTIN: {full.clientGst}</div>}
            </div>
          </div>

          <div style={{ padding: '16px 32px', background: accLight }}>
            <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: acc, marginBottom: 8 }}>
              {view.detailsLabel}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <tbody>
                {metaRows.map(([label, value, mono]) => (
                  <tr key={label}>
                    <td style={{ padding: '3px 0', color: '#4B5B6E', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{label}</td>
                    <td style={{ padding: '3px 0 3px 10px', textAlign: 'right', fontWeight: 700, wordBreak: 'break-word', fontFamily: mono ? 'monospace' : 'inherit', color: '#14202E' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div style={{ padding: '18px 32px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: acc }}>
                <th style={th('left', 24)}>#</th>
                <th style={th('left')}>Description</th>
                <th style={th('center', 58)}>HSN/SAC</th>
                <th style={th('center', 62)}>Qty</th>
                <th style={th('right', 78)}>Rate</th>
                <th style={th('right', 82)}>Taxable</th>
                <th style={th('right', 80)}>GST</th>
                <th style={th('right', 88)}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {c.lines.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 20, textAlign: 'center', color: '#8A97A6', fontSize: 11 }}>No items added yet</td>
                </tr>
              )}
              {c.lines.map((it, idx) => (
                <tr key={it.id || idx} style={{ background: idx % 2 === 0 ? '#fff' : accLight, borderBottom: `1px solid ${accMid}` }}>
                  <td style={{ ...td('left'), color: '#8A97A6', fontWeight: 600, fontSize: 10 }}>{idx + 1}</td>
                  <td style={td('left')}>
                    <div style={{ fontWeight: 600, fontSize: 11, color: '#14202E', wordBreak: 'break-word' }}>{it.desc || '—'}</div>
                  </td>
                  <td style={{ ...td('center'), fontFamily: 'monospace', fontSize: 10, color: '#5C6B7C' }}>{it.hsnSac || it.hsn || '—'}</td>
                  <td style={{ ...td('center'), fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {it.qty} <span style={{ fontSize: 8.5, color: '#8A97A6', fontWeight: 500 }}>{uqcLabel(it.uqc)}</span>
                  </td>
                  <td style={{ ...td('right'), fontFamily: 'monospace', fontSize: 10.5 }}>{money(it.rate)}</td>
                  <td style={{ ...td('right'), fontFamily: 'monospace', fontSize: 10.5 }}>{money(it.taxable)}</td>
                  <td style={{ ...td('right'), fontFamily: 'monospace', fontSize: 10, color: '#5C6B7C' }}>
                    {money(it.gstAmt)}
                    <div style={{ fontSize: 8.5, color: acc, fontWeight: 700 }}>@ {it.gstRate}%</div>
                  </td>
                  <td style={{ ...td('right'), fontFamily: 'monospace', fontWeight: 800, fontSize: 11, color: '#14202E' }}>{money(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALS + NOTES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 236px', gap: 22, padding: '16px 32px 20px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
            <div style={{ background: accLight, border: `1px solid ${accMid}`, borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: acc, marginBottom: 4 }}>Amount in Words</div>
              <div style={{ fontSize: 11, color: '#14202E', fontWeight: 500, fontStyle: 'italic', lineHeight: 1.5 }}>
                {amountInWords(c.total, cur)}
              </div>
            </div>

            {view.showPayment && (full.bankDetails || full.upiId) && (
              <div style={{ border: `1px solid ${accMid}`, borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: acc, marginBottom: 4 }}>Payment Details</div>
                  {full.bankDetails && <div style={{ fontSize: 10.5, color: '#4B5B6E', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{full.bankDetails}</div>}
                  {full.upiId && <div style={{ fontSize: 10.5, color: '#263A52', fontWeight: 700, marginTop: full.bankDetails ? 4 : 0, wordBreak: 'break-all' }}>UPI: {full.upiId}</div>}
                </div>
                {qr && (
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${qr.size} ${qr.size}`} width="104" height="104" shapeRendering="crispEdges" role="img" aria-label="UPI payment QR code" style={{ display: 'block', background: '#fff' }}>
                      <rect width={qr.size} height={qr.size} fill="#ffffff" />
                      <path d={qr.path} fill="#000000" />
                    </svg>
                    <div style={{ fontSize: 8.5, fontWeight: 700, color: '#263A52', marginTop: 3 }}>Scan to pay {money(payable)}</div>
                    <div style={{ fontSize: 7.5, color: '#8A97A6' }}>Any UPI app</div>
                  </div>
                )}
              </div>
            )}

            {full.notes && (
              <div style={{ background: '#fffbf0', border: '1px solid #f5e6b0', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#B8860B', marginBottom: 4 }}>Notes</div>
                <div style={{ fontSize: 10.5, color: '#4B5B6E', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{full.notes}</div>
              </div>
            )}

            {full.terms && (
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8A97A6', marginBottom: 3 }}>Terms &amp; Conditions</div>
                <div style={{ fontSize: 9.5, color: '#5C6B7C', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{full.terms}</div>
              </div>
            )}
          </div>

          <div>
            <div style={{ border: `1px solid ${accMid}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px' }}>
                {sumRow('Subtotal', money(c.sub))}
                {c.disc > 0 && sumRow(`Discount (${Number(full.discPct) || 0}%)`, `−${money(c.disc)}`, '#1F9C5A')}
                {c.disc > 0 && sumRow('Taxable value', money(c.taxable))}
                {c.split
                  ? (c.inter
                    ? sumRow('IGST', money(c.igst))
                    : <>{sumRow('CGST', money(c.cgst))}{sumRow('SGST', money(c.sgst))}</>)
                  : sumRow('GST', money(c.gst))}
                {c.shipping > 0 && sumRow('Shipping / other charges', money(c.shipping))}
                {c.roundAdj !== 0 && sumRow('Round off', `${c.roundAdj > 0 ? '+' : '−'}${money(Math.abs(c.roundAdj))}`)}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', padding: '10px 12px',
                  background: acc, borderRadius: 6, marginTop: 8,
                  fontSize: 13, fontWeight: 900, color: '#fff',
                }}>
                  <span>{view.totalLabel}</span>
                  <span style={{ fontFamily: 'monospace' }}>{money(c.total)}</span>
                </div>
                {(paid > 0 || credited > 0) && (
                  <div style={{ marginTop: 6 }}>
                    {credited > 0 && sumRow('Credit notes', `−${money(credited)}`, '#1F9C5A')}
                    {paid > 0 && sumRow('Amount paid', `−${money(paid)}`, '#1F9C5A')}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 11.5, fontWeight: 800, color: '#14202E' }}>
                      <span>Balance due</span>
                      <span style={{ fontFamily: 'monospace' }}>{money(balance)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 34, textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#4B5B6E' }}>For <span style={{ fontWeight: 700, color: '#14202E' }}>{full.bizName || 'Your Business'}</span></div>
              <div style={{ height: 34 }} />
              <div style={{ borderTop: '1px solid #C5CCD4', paddingTop: 4, fontSize: 9.5, color: '#5C6B7C', display: 'inline-block', minWidth: 150 }}>
                {full.signatory || 'Authorised Signatory'}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{
          borderTop: `2px solid ${accMid}`,
          background: accLight,
          padding: '12px 32px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 9, color: '#8A97A6' }}>{view.footer}</div>
          <div style={{ fontSize: 9, color: '#8A97A6', textAlign: 'right' }}>
            {full.bizName && <span style={{ fontWeight: 700, color: acc }}>{full.bizName}</span>}
            {full.bizGst && <span> · GSTIN: {full.bizGst}</span>}
          </div>
        </div>

        <div style={{ height: 4, background: `linear-gradient(90deg, ${acc}99, ${acc})` }} />

        {/* ZEROFY BRANDING — shown on every plan, free and Pro (the `hideBranding` prop is no longer used) */}
        {(
          <div style={{
            padding: '8px 32px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            borderTop: '1px dashed #DDE1D9',
            background: '#FAFBF8',
          }}>
            <span style={{ fontSize: 8, color: '#aaa', letterSpacing: '0.04em', fontStyle: 'italic' }}>Created with</span>
            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.06em', color: '#5C7189' }}>ZEROFY</span>
            <span style={{ fontSize: 8, color: '#bbb' }}>Invoice Generator</span>
            <span style={{ fontSize: 8, color: '#ccc' }}>·</span>
            <a href="https://www.zerofy.co.in" style={{ fontSize: 8, color: '#5C7189', textDecoration: 'none', fontWeight: 600 }}>www.zerofy.co.in</a>
          </div>
        )}
      </div>
    </div>
  )
}
