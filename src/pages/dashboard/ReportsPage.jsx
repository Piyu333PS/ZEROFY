import { useState, useEffect, useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../utils/api'
import { calcInvoice, displayStatus, STATUS_LABELS } from '../../utils/invoiceCalc'
import { downloadText } from '../../utils/download'
import styles from './ReportsPage.module.css'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const fmt2 = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const invoiceTotal = (inv) => inv.grandTotal !== undefined ? Number(inv.grandTotal) : calcInvoice(inv).total
// Draft (abhi bheja nahi) aur cancelled invoices billing mein nahi gine jate
const isBillable = (inv) => inv.status !== 'cancelled' && inv.status !== 'draft'

const STATUS_COLORS = { paid: '#1F6F54', sent: '#E8933C', partial: '#2B5D8C', overdue: '#C1443C', draft: '#69708A', cancelled: '#B9A9A7' }
const CHART_COLORS = ['#E8933C', '#1F6F54', '#2B5D8C', '#C1443C', '#7A5AA8', '#C97423', '#69708A']

const PERIODS = [
  { value: 'monthly', label: 'Monthly', count: 12 },
  { value: 'quarterly', label: 'Quarterly', count: 8 },
  { value: 'yearly', label: 'Yearly', count: 5 },
]

// Parses a date string (YYYY-MM-DD or anything Date() can read) safely
function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

function periodKey(date, period) {
  const y = date.getFullYear()
  const m = date.getMonth() // 0-11
  if (period === 'monthly') return `${y}-${String(m + 1).padStart(2, '0')}`
  if (period === 'quarterly') return `${y}-Q${Math.floor(m / 3) + 1}`
  return `${y}`
}

function periodLabel(key, period) {
  if (period === 'monthly') {
    const [y, m] = key.split('-')
    const d = new Date(Number(y), Number(m) - 1, 1)
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
  }
  if (period === 'quarterly') return key.replace('-', ' ')
  return key
}

// Builds the last N period buckets ending at the current period, in order
function buildBuckets(period, count) {
  const now = new Date()
  const buckets = []
  for (let i = count - 1; i >= 0; i--) {
    let d
    if (period === 'monthly') d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    else if (period === 'quarterly') d = new Date(now.getFullYear(), now.getMonth() - i * 3, 1)
    else d = new Date(now.getFullYear() - i, 0, 1)
    const key = periodKey(d, period)
    buckets.push({ key, name: periodLabel(key, period), invoiced: 0, received: 0 })
  }
  return buckets
}

export default function ReportsPage() {
  const { token } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState('monthly')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      const [invRes, payRes, custRes] = await Promise.all([
        api('/api/invoices', token),
        api('/api/payments', token),
        api('/api/customers', token),
      ])
      if (cancelled) return
      if (invRes.ok && invRes.data.success) setInvoices(invRes.data.invoices || [])
      if (payRes.ok && payRes.data.success) setPayments(payRes.data.payments || [])
      if (custRes.ok && custRes.data.success) setCustomers(custRes.data.customers || [])
      if (!invRes.ok || !payRes.ok) setError('Report data load nahi ho paya. Page refresh karke dobara try karein.')
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [token])

  const invoiceMap = useMemo(() => Object.fromEntries(invoices.map(inv => [inv._id, inv])), [invoices])

  // ---- Summary totals ----
  const totals = useMemo(() => {
    const billable = invoices.filter(isBillable)
    const billableIds = new Set(billable.map(i => i._id))
    const totalInvoiced = billable.reduce((s, i) => s + invoiceTotal(i), 0)
    const totalReceived = payments.filter(p => billableIds.has(p.invoiceId)).reduce((s, p) => s + (p.amount || 0), 0)
    const pending = Math.max(0, totalInvoiced - totalReceived)
    const collectionRate = totalInvoiced > 0 ? (totalReceived / totalInvoiced) * 100 : 0
    const avgInvoice = billable.length > 0 ? totalInvoiced / billable.length : 0
    return { totalInvoiced, totalReceived, pending, collectionRate, avgInvoice }
  }, [invoices, payments])

  // ---- Billing history (period-wise, invoiced vs received) ----
  const cfg = PERIODS.find(p => p.value === period)
  const billingHistory = useMemo(() => {
    const buckets = buildBuckets(period, cfg.count)
    const map = Object.fromEntries(buckets.map(b => [b.key, b]))

    invoices.forEach(inv => {
      if (!isBillable(inv)) return
      const d = parseDate(inv.date) || parseDate(inv.createdAt)
      if (!d) return
      const key = periodKey(d, period)
      if (map[key]) map[key].invoiced += invoiceTotal(inv)
    })

    payments.forEach(p => {
      const d = parseDate(p.date) || parseDate(p.createdAt)
      if (!d) return
      const key = periodKey(d, period)
      if (map[key]) map[key].received += (p.amount || 0)
    })

    return buckets.map(b => ({ ...b, invoiced: Math.round(b.invoiced), received: Math.round(b.received) }))
  }, [invoices, payments, period])

  // ---- Top clients by payment received ----
  const topClients = useMemo(() => {
    const byClient = {}
    payments.forEach(p => {
      const inv = invoiceMap[p.invoiceId]
      const name = inv?.clientName || 'Unknown client'
      byClient[name] = (byClient[name] || 0) + (p.amount || 0)
    })
    return Object.entries(byClient)
      .map(([name, amount]) => ({ name, amount: Math.round(amount) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8)
  }, [payments, invoiceMap])

  // ---- Invoice status breakdown ----
  const statusBreakdown = useMemo(() => {
    const byStatus = {}
    invoices.forEach(inv => {
      const s = displayStatus(inv)
      if (!byStatus[s]) byStatus[s] = { status: s, count: 0, amount: 0 }
      byStatus[s].count += 1
      byStatus[s].amount += invoiceTotal(inv)
    })
    return Object.values(byStatus).map(s => ({ ...s, amount: Math.round(s.amount) }))
  }, [invoices])

  // ---- GST summary (month-wise) — GST return bharte waqt kaam aata hai ----
  const gstSummary = useMemo(() => {
    const byMonth = {}
    invoices.forEach(inv => {
      if (!isBillable(inv)) return
      const d = parseDate(inv.date) || parseDate(inv.createdAt)
      if (!d) return
      const key = periodKey(d, 'monthly')
      const c = calcInvoice(inv)
      if (!byMonth[key]) byMonth[key] = { key, count: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
      const m = byMonth[key]
      m.count += 1; m.taxable += c.taxable; m.cgst += c.cgst; m.sgst += c.sgst; m.igst += c.igst; m.total += c.total
    })
    return Object.values(byMonth).sort((a, b) => b.key.localeCompare(a.key)).slice(0, 12)
  }, [invoices])

  const exportGstCsv = () => {
    const rows = [['Invoice No', 'Date', 'Client', 'Client GSTIN', 'Taxable value', 'CGST', 'SGST', 'IGST', 'Invoice total', 'Status']]
    invoices.filter(isBillable).forEach(inv => {
      const c = calcInvoice(inv)
      rows.push([inv.no, inv.date || '', inv.clientName || '', inv.clientGst || '', c.taxable, c.cgst, c.sgst, c.igst, c.total, displayStatus(inv)])
    })
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    downloadText('\uFEFF' + csv, 'zerofy-gst-report.csv', 'text/csv;charset=utf-8')
  }

  // ---- Kis client par kitna baaki hai ----
  const receivables = useMemo(() => {
    const byClient = {}
    invoices.forEach(inv => {
      if (!isBillable(inv)) return
      const bal = inv.balance !== undefined ? Number(inv.balance) : invoiceTotal(inv)
      if (!(bal > 0)) return
      const name = inv.clientName || 'Unknown client'
      if (!byClient[name]) byClient[name] = { name, amount: 0, count: 0, overdue: 0 }
      byClient[name].amount += bal
      byClient[name].count += 1
      if (displayStatus(inv) === 'overdue') byClient[name].overdue += bal
    })
    return Object.values(byClient).sort((a, b) => b.amount - a.amount).slice(0, 10)
  }, [invoices])

  const clientCount = Math.max(customers.length, new Set(invoices.map(i => (i.clientName || '').trim().toLowerCase()).filter(Boolean)).size)

  const statCards = [
    { label: 'Total invoiced', value: fmt(totals.totalInvoiced) },
    { label: 'Total received', value: fmt(totals.totalReceived), tone: 'green' },
    { label: 'Outstanding', value: fmt(totals.pending), tone: 'orange' },
    { label: 'Collection rate', value: `${totals.collectionRate.toFixed(1)}%` },
    { label: 'Avg. invoice value', value: fmt(totals.avgInvoice) },
    { label: 'Clients', value: clientCount },
  ]

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reports</h1>
          <p className={styles.subtitle}>Billing performance across period, clients and status</p>
        </div>
        <div className={styles.periodToggle}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              className={`${styles.periodBtn} ${period === p.value ? styles.periodBtnActive : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.empty}>Loading report data…</p>
      ) : invoices.length === 0 ? (
        <p className={styles.empty}>Abhi tak koi invoice nahi bana — report yaha data aane ke baad dikhega.</p>
      ) : (
        <>
          <div className={styles.statsGrid}>
            {statCards.map(c => (
              <div key={c.label} className={styles.statCard}>
                <p className={styles.statLabel}>{c.label}</p>
                <p className={`${styles.statValue} ${c.tone ? styles[c.tone] : ''}`}>{c.value}</p>
              </div>
            ))}
          </div>

          <div className={styles.panel}>
            <p className={styles.panelTitle}>Billing history</p>
            <p className={styles.panelSub}>Invoiced vs received, {period}</p>
            <div className={styles.chartBox}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={billingHistory} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E1D9C4" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#69708A' }} axisLine={{ stroke: '#E1D9C4' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#69708A' }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                  <Tooltip formatter={(v) => fmt2(v)} contentStyle={{ borderRadius: 10, border: '1px solid #E1D9C4', fontSize: 12.5 }} />
                  <Legend wrapperStyle={{ fontSize: 12.5 }} />
                  <Bar dataKey="invoiced" name="Invoiced" fill="#E8933C" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="received" name="Received" fill="#1F6F54" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.row}>
            <div className={`${styles.panel} ${styles.rowPanel}`}>
              <p className={styles.panelTitle}>Top clients by payment</p>
              <p className={styles.panelSub}>Highest paying clients, all-time</p>
              <div className={styles.chartBox}>
                {topClients.length === 0 ? (
                  <p className={styles.empty}>Abhi tak koi payment record nahi hua.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topClients} layout="vertical" margin={{ top: 8, right: 24, left: 12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E1D9C4" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#69708A' }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11.5, fill: '#1B2340' }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => fmt2(v)} contentStyle={{ borderRadius: 10, border: '1px solid #E1D9C4', fontSize: 12.5 }} />
                      <Bar dataKey="amount" name="Received" radius={[0, 4, 4, 0]}>
                        {topClients.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className={`${styles.panel} ${styles.rowPanel}`}>
              <p className={styles.panelTitle}>Invoice status breakdown</p>
              <p className={styles.panelSub}>By count and value</p>
              <div className={styles.chartBox}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      dataKey="amount"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {statusBreakdown.map((s, i) => (
                        <Cell key={i} fill={STATUS_COLORS[s.status] || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n, props) => [fmt2(v), `${STATUS_LABELS[props.payload.status] || props.payload.status} (${props.payload.count})`]} contentStyle={{ borderRadius: 10, border: '1px solid #E1D9C4', fontSize: 12.5 }} />
                    <Legend wrapperStyle={{ fontSize: 12.5 }} formatter={(v) => STATUS_LABELS[v] || v} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeadRow}>
              <div>
                <p className={styles.panelTitle}>GST summary</p>
                <p className={styles.panelSub}>Month-wise taxable value aur tax (draft / cancelled invoices shamil nahi)</p>
              </div>
              <button className={styles.exportBtn} onClick={exportGstCsv}>Export CSV</button>
            </div>
            <div className={styles.tableScroll}>
              <table className={styles.dataTable}>
                <thead>
                  <tr><th>Month</th><th>Invoices</th><th>Taxable value</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {gstSummary.map(m => (
                    <tr key={m.key}>
                      <td>{periodLabel(m.key, 'monthly')}</td>
                      <td>{m.count}</td>
                      <td>{fmt2(m.taxable)}</td>
                      <td>{fmt2(m.cgst)}</td>
                      <td>{fmt2(m.sgst)}</td>
                      <td>{fmt2(m.igst)}</td>
                      <td><strong>{fmt2(m.total)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.panel}>
            <p className={styles.panelTitle}>Outstanding by client</p>
            <p className={styles.panelSub}>Kis client par kitna paisa baaki hai</p>
            {receivables.length === 0 ? (
              <p className={styles.empty}>Koi balance baaki nahi hai. 🎉</p>
            ) : (
              <div className={styles.tableScroll}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr><th>Client</th><th>Unpaid invoices</th><th>Overdue</th><th>Outstanding</th></tr>
                  </thead>
                  <tbody>
                    {receivables.map(r => (
                      <tr key={r.name}>
                        <td>{r.name}</td>
                        <td>{r.count}</td>
                        <td className={r.overdue > 0 ? styles.overdueCell : ''}>{fmt2(r.overdue)}</td>
                        <td><strong>{fmt2(r.amount)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
