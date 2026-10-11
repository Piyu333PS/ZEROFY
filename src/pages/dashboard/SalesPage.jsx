import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../utils/api'
import { toast } from '../../components/ui/Toast'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import styles from './AdminPage.module.css'

export const money = (paise) => `₹${(Math.round(Number(paise) || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const day = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')
export const refLink = (code) => `${window.location.origin}/?ref=${code}`
export const copyText = async (text, label = 'Copied') => {
  try { await navigator.clipboard.writeText(text); toast(label) } catch { toast.error('Could not copy. Select the text and copy it by hand.') }
}

/* A salesperson's own page: their code and link, what they have sold and what they are owed. */
export default function SalesPage() {
  const { token } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/sales/me', token).then(res => {
      if (res.ok) setData(res.data)
      else setError(res.status === 404 ? 'This account is not set up as a Zerofy sales partner.' : (res.data.error || 'Could not load your sales.'))
    })
  }, [token])

  if (error) return <div className={styles.wrap}><h1 className={styles.title}>My sales</h1><p className={styles.err} style={{ marginTop: 16 }}>{error}</p></div>
  if (!data) return <div className={styles.wrap}><h1 className={styles.title}>My sales</h1><div style={{ marginTop: 18 }}><SkeletonBlock height={220} /></div></div>

  const { salesperson: sp, totals, sales } = data
  const link = refLink(sp.code)
  const waText = `Make GST invoices in a minute with Zerofy. Start free here: ${link}`

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>My sales</h1>
          <p className={styles.subtitle}>{sp.name} · you earn {sp.commissionPct}% on a customer's first payment and {sp.renewalPct}% on renewals</p>
        </div>
      </div>

      <div className={styles.panel}>
        <p className={styles.panelTitle}>Your code and link</p>
        <p className={styles.panelSub}>Share the link, or ask the customer to enter the code at checkout. Anyone who opens the link has your code filled in for 30 days.</p>
        <div className={styles.linkBox}>
          <span className={styles.code} style={{ fontSize: 15, padding: '7px 12px' }}>{sp.code}</span>
          <span className={styles.link}>{link}</span>
          <button className={`${styles.btn} ${styles.primary}`} onClick={() => copyText(link, 'Link copied')}>Copy link</button>
          <a className={styles.btn} style={{ textDecoration: 'none' }} href={`https://wa.me/?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer">Share on WhatsApp</a>
        </div>
      </div>

      <div className={styles.tiles}>
        <div className={styles.tile}><div className={styles.tileLabel}>Sales</div><div className={styles.tileValue}>{totals.sales}</div><div className={styles.tileNote}>{totals.newCustomers} new customers</div></div>
        <div className={styles.tile}><div className={styles.tileLabel}>Sales value</div><div className={styles.tileValue}>{money(totals.value)}</div><div className={styles.tileNote}>before GST</div></div>
        <div className={`${styles.tile} ${styles.good}`}><div className={styles.tileLabel}>Commission due</div><div className={styles.tileValue}>{money(totals.commissionDue)}</div><div className={styles.tileNote}>not yet paid to you</div></div>
        <div className={styles.tile}><div className={styles.tileLabel}>Commission paid</div><div className={styles.tileValue}>{money(totals.commissionPaid)}</div><div className={styles.tileNote}>so far</div></div>
      </div>

      <div className={styles.panel}>
        <p className={styles.panelTitle}>Your sales</p>
        {sales.length === 0 ? <p className={styles.empty}>No sales yet. Share your link to get started.</p> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Date</th><th>Customer</th><th>Plan</th><th className={styles.num}>Value</th><th className={styles.num}>Commission</th><th>Status</th></tr></thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s._id}>
                    <td>{day(s.paidAt)}</td>
                    <td className={styles.strong}>{s.customer}</td>
                    <td>{s.planName}{s.renewal ? ' (renewal)' : ''}</td>
                    <td className={styles.num}>{money(s.taxable)}</td>
                    <td className={styles.num}>{money(s.commission)}</td>
                    <td>{s.commissionPaidAt ? <span className={`${styles.pill} ${styles.pillGreen}`}>Paid {day(s.commissionPaidAt)}</span> : <span className={`${styles.pill} ${styles.pillPro}`}>Due</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
