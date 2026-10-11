import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../utils/api'
import { toast } from '../../components/ui/Toast'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import { money, day, refLink, copyText } from './SalesPage'
import styles from './AdminPage.module.css'

/* The owner's panel: how the business is doing, every user, and the sales team with its commission.
   Only accounts listed in the server setting ADMIN_EMAILS can open it. */

function Overview({ token }) {
  const [d, setD] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { api('/api/admin/overview', token).then(r => (r.ok ? setD(r.data) : setError(r.data.error || 'Could not load'))) }, [token])
  if (error) return <p className={styles.err}>{error}</p>
  if (!d) return <SkeletonBlock height={260} />
  return (
    <>
      <div className={styles.tiles}>
        <div className={styles.tile}><div className={styles.tileLabel}>Users</div><div className={styles.tileValue}>{d.users.total}</div><div className={styles.tileNote}>{d.users.setupDone} set up a business</div></div>
        <div className={styles.tile}><div className={styles.tileLabel}>New this week</div><div className={styles.tileValue}>{d.users.new7}</div><div className={styles.tileNote}>{d.users.new30} in 30 days</div></div>
        <div className={`${styles.tile} ${styles.good}`}><div className={styles.tileLabel}>Pro users</div><div className={styles.tileValue}>{d.pro.active}</div><div className={styles.tileNote}>{d.pro.autoRenew} on Auto Pay</div></div>
        <div className={`${styles.tile} ${d.pro.expiring7 ? styles.warn : ''}`}><div className={styles.tileLabel}>Ending in 7 days</div><div className={styles.tileValue}>{d.pro.expiring7}</div><div className={styles.tileNote}>not on Auto Pay</div></div>
        <div className={styles.tile}><div className={styles.tileLabel}>Revenue this month</div><div className={styles.tileValue}>{money(d.revenue.thisMonth)}</div><div className={styles.tileNote}>incl. GST if charged</div></div>
        <div className={styles.tile}><div className={styles.tileLabel}>Revenue all time</div><div className={styles.tileValue}>{money(d.revenue.allTime)}</div><div className={styles.tileNote}>{d.revenue.payments} payments · {d.revenue.withSalesCode} with a sales code</div></div>
      </div>
      <div className={styles.panel}>
        <p className={styles.panelTitle}>Latest payments</p>
        {d.recent.length === 0 ? <p className={styles.empty}>No payments yet.</p> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Date</th><th>Customer</th><th>Plan</th><th>Invoice no.</th><th>Sales code</th><th className={styles.num}>Amount</th></tr></thead>
              <tbody>
                {d.recent.map(p => (
                  <tr key={p._id}>
                    <td>{day(p.paidAt)}</td>
                    <td><div className={styles.strong}>{p.firm || '—'}</div><div className={styles.dim}>{p.email}</div></td>
                    <td>{p.planName}{p.renewal ? ' (renewal)' : ''}</td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{p.receiptNo}</td>
                    <td>{p.salesCode ? <span className={styles.code}>{p.salesCode}</span> : '—'}</td>
                    <td className={styles.num}>{money(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

const USER_FILTERS = [['all', 'All'], ['pro', 'Pro'], ['free', 'Free'], ['expiring', 'Ending in 7 days']]

function Users({ token }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [d, setD] = useState(null)
  const [error, setError] = useState('')
  const [giving, setGiving] = useState(null) // { id, days }
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    api(`/api/admin/users?filter=${filter}&q=${encodeURIComponent(q.trim())}`, token).then(r => (r.ok ? (setD(r.data), setError('')) : setError(r.data.error || 'Could not load')))
  }, [token, filter, q])
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t) }, [load])

  const give = async () => {
    setBusy(true)
    const r = await api(`/api/admin/users/${giving.id}/extend`, token, { method: 'POST', body: { days: Number(giving.days) } })
    setBusy(false)
    if (!r.ok) { toast.error(r.data.error || 'Could not update'); return }
    toast(`Pro is now valid till ${day(r.data.proExpiry)}`)
    setGiving(null); load()
  }

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <input type="search" className={`${styles.inp} ${styles.search}`} placeholder="Search email, business, mobile or GSTIN" value={q} onChange={e => setQ(e.target.value)} />
        <div className={styles.tabs}>{USER_FILTERS.map(([k, label]) => <button key={k} className={`${styles.tab} ${filter === k ? styles.tabOn : ''}`} onClick={() => setFilter(k)}>{label}</button>)}</div>
      </div>
      {error && <p className={styles.err}>{error}</p>}
      {!d ? <SkeletonBlock height={200} /> : d.users.length === 0 ? <p className={styles.empty}>No users match.</p> : (
        <>
          <p className={styles.panelSub}>{d.total} user{d.total === 1 ? '' : 's'}{d.total > d.users.length ? ` — showing the newest ${d.users.length}` : ''}</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>User</th><th>Mobile</th><th>Plan</th><th className={styles.num}>Invoices</th><th>Joined</th><th></th></tr></thead>
              <tbody>
                {d.users.map(u => (
                  <tr key={u._id}>
                    <td><div className={styles.strong}>{u.business || '—'}</div><div className={styles.dim}>{u.email}{u.google ? ' · Google' : ''}</div></td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{u.phone || '—'}</td>
                    <td>
                      {u.isPro
                        ? <><span className={`${styles.pill} ${styles.pillPro}`}>Pro</span><div className={styles.dim}>till {day(u.proExpiry)}{u.autoRenew ? ' · Auto Pay' : ''}</div></>
                        : <><span className={styles.pill}>Free</span><div className={styles.dim}>{Math.min(3, u.freeUsed)} of 3 used</div></>}
                    </td>
                    <td className={styles.num}>{u.invoices}</td>
                    <td>{day(u.createdAt)}</td>
                    <td>
                      {giving?.id === u._id ? (
                        <span className={styles.inline}>
                          <select className={styles.inp} style={{ padding: '6px 8px' }} value={giving.days} onChange={e => setGiving(g => ({ ...g, days: e.target.value }))} aria-label="Days of Pro">
                            <option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="365">365 days</option>
                          </select>
                          <button className={`${styles.btn} ${styles.primary}`} disabled={busy} onClick={give}>{busy ? '…' : 'Give'}</button>
                          <button className={styles.btn} onClick={() => setGiving(null)}>Cancel</button>
                        </span>
                      ) : <button className={styles.btn} onClick={() => setGiving({ id: u._id, days: '30' })}>{u.isPro ? 'Extend Pro' : 'Give Pro'}</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

const blankPerson = { name: '', code: '', phone: '', email: '', commissionPct: '30', renewalPct: '10' }

function SalesTeam({ token }) {
  const [d, setD] = useState(null)
  const [error, setError] = useState('')
  const [f, setF] = useState(blankPerson)
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [openId, setOpenId] = useState('')

  const load = useCallback(() => api('/api/admin/salespeople', token).then(r => (r.ok ? setD(r.data) : setError(r.data.error || 'Could not load'))), [token])
  useEffect(() => { load() }, [load])
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }))

  const add = async (e) => {
    e.preventDefault(); setFormError(''); setBusy(true)
    const r = await api('/api/admin/salespeople', token, { method: 'POST', body: { ...f, commissionPct: Number(f.commissionPct), renewalPct: Number(f.renewalPct) } })
    setBusy(false)
    if (!r.ok) { setFormError(r.data.error || 'Could not add'); return }
    toast(`${r.data.salesperson.name} added with code ${r.data.salesperson.code}`)
    setF(blankPerson); load()
  }
  const markPaid = async (ids, paid = true) => {
    const r = await api('/api/admin/commission/paid', token, { method: 'POST', body: { purchaseIds: ids, paid } })
    if (!r.ok) { toast.error(r.data.error || 'Could not update'); return }
    toast(paid ? 'Marked as paid' : 'Marked as due again'); load()
  }
  const toggleActive = async (p) => {
    const r = await api(`/api/admin/salespeople/${p._id}`, token, { method: 'PUT', body: { active: !p.active } })
    if (!r.ok) { toast.error(r.data.error || 'Could not update'); return }
    toast(p.active ? `${p.name}'s code is switched off` : `${p.name}'s code is active again`); load()
  }

  return (
    <>
      <form className={styles.panel} onSubmit={add}>
        <p className={styles.panelTitle}>Add a salesperson</p>
        <p className={styles.panelSub}>Give each person a short code. Customers enter it at checkout, or open the person's link. If you add the email they use for their own Zerofy account, they get a "My sales" page.</p>
        <div className={styles.form}>
          <div className={styles.c2}><label htmlFor="sp-name">Name *</label><input id="sp-name" className={styles.inp} value={f.name} onChange={set('name')} maxLength={80} placeholder="Amit Kumar" required /></div>
          <div className={styles.c1}><label htmlFor="sp-code">Code *</label><input id="sp-code" className={styles.inp} style={{ fontFamily: 'var(--mono)', textTransform: 'uppercase' }} value={f.code} onChange={e => setF(p => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30) }))} placeholder="AMIT07" required /></div>
          <div className={styles.c1}><label htmlFor="sp-phone">Mobile</label><input id="sp-phone" className={styles.inp} value={f.phone} onChange={e => setF(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} inputMode="numeric" placeholder="10 digits" /></div>
          <div className={styles.c2}><label htmlFor="sp-email">Their Zerofy login email</label><input id="sp-email" type="email" className={styles.inp} value={f.email} onChange={set('email')} placeholder="optional" /></div>
          <div className={styles.c1}><label htmlFor="sp-pct">First sale %</label><input id="sp-pct" type="number" min="0" max="90" className={styles.inp} value={f.commissionPct} onChange={set('commissionPct')} /></div>
          <div className={styles.c1}><label htmlFor="sp-rpct">Renewal %</label><input id="sp-rpct" type="number" min="0" max="90" className={styles.inp} value={f.renewalPct} onChange={set('renewalPct')} /></div>
          <div className={styles.c2}><button type="submit" className={`${styles.btn} ${styles.primary}`} style={{ padding: '10px 18px', fontSize: 13.5 }} disabled={busy}>{busy ? 'Adding…' : 'Add salesperson'}</button></div>
        </div>
        {formError && <p className={styles.err} style={{ margin: '12px 0 0' }}>{formError}</p>}
      </form>

      {error && <p className={styles.err}>{error}</p>}
      {!d ? <SkeletonBlock height={160} /> : (
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Sales team</p>
          <p className={styles.panelSub}>Commission is worked out on the plan value before GST. Refunds are not taken off automatically — do not mark a refunded sale as paid.</p>
          {d.unknownCodes.length > 0 && (
            <p className={styles.err} style={{ background: '#FCEFD9', color: '#6B3D05', borderColor: 'rgba(239,160,47,0.45)' }}>
              Codes used at checkout that belong to nobody: {d.unknownCodes.map(u => `${u.code} (${u.sales})`).join(', ')}. Add a salesperson with that code to count those sales.
            </p>
          )}
          {d.salespeople.length === 0 ? <p className={styles.empty}>No one yet. Add your first salesperson above.</p> : d.salespeople.map(p => {
            const due = p.sales.filter(s => !s.commissionPaidAt).map(s => s._id)
            return (
              <div key={p._id} className={styles.person}>
                <div className={styles.personHead}>
                  <div>
                    <div className={styles.personName}>{p.name} {!p.active && <span className={`${styles.pill} ${styles.pillRed}`}>Off</span>}</div>
                    <div className={styles.dim}>{[p.phone, p.email, `${p.commissionPct}% / ${p.renewalPct}%`].filter(Boolean).join(' · ')}{p.email && !p.hasAccount ? ' · no Zerofy account with this email yet' : ''}</div>
                  </div>
                  <span className={styles.code}>{p.code}</span>
                  <div className={styles.personStats}>
                    <span><strong>{p.totals.sales}</strong>sales</span>
                    <span><strong>{money(p.totals.value)}</strong>value</span>
                    <span><strong style={{ color: p.totals.commissionDue ? 'var(--rust)' : undefined }}>{money(p.totals.commissionDue)}</strong>to pay</span>
                    <span><strong>{money(p.totals.commissionPaid)}</strong>paid</span>
                  </div>
                </div>
                <div className={styles.personBody}>
                  <div className={styles.inline}>
                    <button className={styles.btn} onClick={() => copyText(refLink(p.code), 'Link copied')}>Copy link</button>
                    <button className={styles.btn} onClick={() => setOpenId(id => (id === p._id ? '' : p._id))} aria-expanded={openId === p._id}>{openId === p._id ? 'Hide sales' : `Show sales (${p.sales.length})`}</button>
                    {due.length > 0 && <button className={`${styles.btn} ${styles.primary}`} onClick={() => markPaid(due)}>Mark {money(p.totals.commissionDue)} as paid</button>}
                    <button className={styles.btn} onClick={() => toggleActive(p)}>{p.active ? 'Switch code off' : 'Switch code on'}</button>
                  </div>
                  {openId === p._id && (p.sales.length === 0 ? <p className={styles.empty}>No sales with this code yet.</p> : (
                    <div className={styles.tableWrap} style={{ marginTop: 12 }}>
                      <table className={styles.table}>
                        <thead><tr><th>Date</th><th>Customer</th><th>Plan</th><th className={styles.num}>Value</th><th className={styles.num}>Commission</th><th>Status</th></tr></thead>
                        <tbody>
                          {p.sales.map(s => (
                            <tr key={s._id}>
                              <td>{day(s.paidAt)}</td>
                              <td><div className={styles.strong}>{s.customer}</div><div className={styles.dim}>{s.email}</div></td>
                              <td>{s.planName}{s.renewal ? ' (renewal)' : ''}</td>
                              <td className={styles.num}>{money(s.taxable)}</td>
                              <td className={styles.num}>{money(s.commission)}</td>
                              <td>{s.commissionPaidAt
                                ? <span className={styles.inline}><span className={`${styles.pill} ${styles.pillGreen}`}>Paid {day(s.commissionPaidAt)}</span><button className={styles.btn} onClick={() => markPaid([s._id], false)}>Undo</button></span>
                                : <button className={styles.btn} onClick={() => markPaid([s._id])}>Mark paid</button>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

const TABS = [['overview', 'Overview'], ['users', 'Users'], ['sales', 'Sales team']]

export default function AdminPage() {
  const { token } = useAuth()
  const [tab, setTab] = useState('overview')
  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Admin</h1>
          <p className={styles.subtitle}>Only you can see this page.</p>
        </div>
        <div className={styles.tabs} role="tablist">
          {TABS.map(([k, label]) => <button key={k} role="tab" aria-selected={tab === k} className={`${styles.tab} ${tab === k ? styles.tabOn : ''}`} onClick={() => setTab(k)}>{label}</button>)}
        </div>
      </div>
      {tab === 'overview' && <Overview token={token} />}
      {tab === 'users' && <Users token={token} />}
      {tab === 'sales' && <SalesTeam token={token} />}
    </div>
  )
}
