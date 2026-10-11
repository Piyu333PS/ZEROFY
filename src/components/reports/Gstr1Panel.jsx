import { useMemo, useState } from 'react'
import { buildGstr1, gstr1Workbook, gstr1Sheets, gstBusinesses, gstMonths, monthLabel, toCsv } from '../../utils/gstr1'
import { buildXlsxBlob } from '../../utils/xlsxLite'
import { downloadBlob, downloadText } from '../../utils/download'
import styles from './Gstr1Panel.module.css'

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const ROWS = [
  ['b2b', 'B2B', 'Sales to GST-registered buyers'],
  ['b2cl', 'B2C Large', 'Unregistered buyer in another state, bill above ₹1,00,000'],
  ['b2cs', 'B2C Small', 'All other sales to unregistered buyers'],
  ['cdnr', 'Credit notes (registered)', 'Credit notes to GST-registered buyers'],
  ['cdnur', 'Credit notes (unregistered)', 'Credit notes against B2C Large bills'],
]

// GSTR-1 for one month and one GSTIN, ready to hand to a CA or load into the GST offline tool
export default function Gstr1Panel({ invoices, creditNotes }) {
  const docs = useMemo(() => [...invoices, ...creditNotes], [invoices, creditNotes])
  const businesses = useMemo(() => gstBusinesses(docs), [docs])
  const [gstin, setGstin] = useState('')
  const active = businesses.find(b => b.gstin === gstin) || businesses[0]
  const months = useMemo(() => active ? gstMonths(docs, active.gstin) : [], [docs, active])
  const [month, setMonth] = useState('')
  // Open on the latest month that has bills (the current month is often still empty)
  const picked = months.includes(month) ? month : (months.find(m => !buildGstr1({ invoices, creditNotes, month: m, gstin: active.gstin }).empty) || months[0])
  const g = useMemo(() => active && picked ? buildGstr1({ invoices, creditNotes, month: picked, gstin: active.gstin }) : null, [invoices, creditNotes, picked, active])
  const [showFiles, setShowFiles] = useState(false)

  if (!active) {
    return (
      <div className={styles.panel}>
        <p className={styles.title}>GSTR-1 report</p>
        <p className={styles.sub}>GSTR-1 is for businesses with a GST number. Add your GSTIN in your business profile and it will appear here for every month.</p>
      </div>
    )
  }

  const file = `GSTR1-${g.gstin}-${g.month}`
  const downloadExcel = () => downloadBlob(buildXlsxBlob(gstr1Workbook(g, active.name)), `${file}.xlsx`)
  const downloadCsv = (sheet) => downloadText(toCsv(sheet.rows), `${file}-${sheet.name}.csv`, 'text/csv;charset=utf-8')
  const w = g.warnings
  const notes = [
    w.badGstin.length > 0 && `Buyer GSTIN looks wrong on ${w.badGstin.join(', ')} — counted as an unregistered buyer. Fix the GSTIN on the bill if they are registered.`,
    w.noHsn.length > 0 && `HSN / SAC code is missing on ${w.noHsn.slice(0, 8).join(', ')}${w.noHsn.length > 8 ? ` and ${w.noHsn.length - 8} more` : ''}. The HSN summary needs it.`,
    w.noPos.length > 0 && `Place of supply is not set on ${w.noPos.join(', ')} — your own state was used.`,
  ].filter(Boolean)

  return (
    <div className={styles.panel} data-testid="gstr1">
      <div className={styles.head}>
        <div>
          <p className={styles.title}>GSTR-1 report</p>
          <p className={styles.sub}>Your sales for the month, in the layout your CA and the GST offline tool use.</p>
        </div>
        <div className={styles.controls}>
          {businesses.length > 1 && (
            <select aria-label="Business" value={active.gstin} onChange={e => { setGstin(e.target.value); setMonth('') }}>
              {businesses.map(b => <option key={b.gstin} value={b.gstin}>{b.name} — {b.gstin}</option>)}
            </select>
          )}
          <select aria-label="Month" value={picked} onChange={e => setMonth(e.target.value)}>
            {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>
      </div>

      {g.empty ? (
        <p className={styles.empty}>No bills in {monthLabel(g.month)} for GSTIN {g.gstin}.</p>
      ) : (
        <>
          <div className={styles.scroll}>
            <table className={styles.table}>
              <thead><tr><th>Section</th><th>Bills</th><th>Taxable value</th><th>IGST</th><th>CGST</th><th>SGST</th></tr></thead>
              <tbody>
                {ROWS.map(([key, label, hint]) => {
                  const s = g.summary[key]
                  return (
                    <tr key={key} className={s.count === 0 && s.taxable === 0 ? styles.dim : ''}>
                      <td><b>{label}</b><span>{hint}</span></td>
                      <td>{s.count}</td><td>{money(s.taxable)}</td><td>{money(s.igst)}</td><td>{money(s.cgst)}</td><td>{money(s.sgst)}</td>
                    </tr>
                  )
                })}
                <tr className={styles.net}>
                  <td><b>Net for {monthLabel(g.month)}</b><span>Sales less credit notes</span></td>
                  <td></td><td>{money(g.net.taxable)}</td><td>{money(g.net.igst)}</td><td>{money(g.net.cgst)}</td><td>{money(g.net.sgst)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className={styles.meta}>
            HSN summary: {g.hsn.length} line{g.hsn.length === 1 ? '' : 's'} · Documents issued: {g.docs.map(d => `${d.from} to ${d.to} (${d.total}${d.cancelled ? `, ${d.cancelled} cancelled` : ''})`).join(' · ')}
          </p>

          {notes.length > 0 && <ul className={styles.warn}>{notes.map(n => <li key={n}>{n}</li>)}</ul>}

          <div className={styles.actions}>
            <button className={styles.primary} onClick={downloadExcel}>Download Excel for your CA</button>
            <button className={styles.link} onClick={() => setShowFiles(v => !v)}>{showFiles ? 'Hide CSV files' : 'CSV files for the GST offline tool'}</button>
          </div>
          {showFiles && (
            <div className={styles.files}>
              {gstr1Sheets(g).filter(s => s.rows.length > 1).map(s => (
                <button key={s.name} className={styles.fileBtn} onClick={() => downloadCsv(s)}>{s.name}.csv <span>{s.rows.length - 1} row{s.rows.length === 2 ? '' : 's'}</span></button>
              ))}
            </div>
          )}
          <p className={styles.foot}>Draft and cancelled bills are not counted. Please check the figures with your CA before filing — Zerofy prepares the report, it does not file it.</p>
        </>
      )}
    </div>
  )
}
