import { useState, useEffect, useCallback } from 'react'

/* ─── Utilities ──────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 9)
const today = () => new Date().toISOString().slice(0, 10)
const LS_BIZ = 'zerofy_businesses_v2'
const LS_INV = 'zerofy_invoices_v2'
const lsGet = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb } catch { return fb } }
const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v))
const fmt = (n, sym = '₹') => `${sym}${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/* ─── GST Data ───────────────────────────────────────────────── */
const GST_RATES = [0, 0.1, 0.25, 1.5, 3, 5, 7.5, 12, 18, 28]

const GOODS_HSN = [
  { hsn: '0101', desc: 'Live horses, asses, mules', gst: 0 },
  { hsn: '0201', desc: 'Meat of bovine animals, fresh/chilled', gst: 0 },
  { hsn: '0301', desc: 'Live fish', gst: 0 },
  { hsn: '0401', desc: 'Milk and cream', gst: 0 },
  { hsn: '0701', desc: 'Potatoes, fresh or chilled', gst: 0 },
  { hsn: '0901', desc: 'Coffee', gst: 5 },
  { hsn: '0902', desc: 'Tea', gst: 5 },
  { hsn: '1001', desc: 'Wheat and meslin', gst: 0 },
  { hsn: '1006', desc: 'Rice', gst: 0 },
  { hsn: '1507', desc: 'Soya-bean oil', gst: 5 },
  { hsn: '1701', desc: 'Cane or beet sugar', gst: 5 },
  { hsn: '1905', desc: 'Bread, pastry, cakes, biscuits', gst: 18 },
  { hsn: '2201', desc: 'Waters, ice and snow', gst: 0 },
  { hsn: '2202', desc: 'Waters with sugar/sweetened', gst: 18 },
  { hsn: '2401', desc: 'Unmanufactured tobacco', gst: 28 },
  { hsn: '3004', desc: 'Medicaments / Medicines', gst: 12 },
  { hsn: '3301', desc: 'Essential oils', gst: 18 },
  { hsn: '3401', desc: 'Soap, skin cleansing preparations', gst: 18 },
  { hsn: '3701', desc: 'Photographic film', gst: 28 },
  { hsn: '3923', desc: 'Plastic articles for packing', gst: 18 },
  { hsn: '4001', desc: 'Natural rubber', gst: 5 },
  { hsn: '4101', desc: 'Raw hides and skins', gst: 0 },
  { hsn: '4201', desc: 'Saddlery and harness', gst: 18 },
  { hsn: '4403', desc: 'Wood in rough', gst: 18 },
  { hsn: '4802', desc: 'Uncoated paper', gst: 12 },
  { hsn: '4901', desc: 'Printed books', gst: 0 },
  { hsn: '5001', desc: 'Silk-worm cocoons', gst: 0 },
  { hsn: '5101', desc: 'Wool, not carded or combed', gst: 5 },
  { hsn: '5208', desc: 'Woven fabrics of cotton', gst: 5 },
  { hsn: '6101', desc: 'Overcoats, jackets (knitted)', gst: 5 },
  { hsn: '6201', desc: 'Overcoats, raincoats (woven)', gst: 5 },
  { hsn: '6401', desc: 'Waterproof footwear', gst: 18 },
  { hsn: '7101', desc: 'Pearls, natural or cultured', gst: 3 },
  { hsn: '7108', desc: 'Gold (unwrought/semi-mfg)', gst: 3 },
  { hsn: '7113', desc: 'Articles of jewellery', gst: 3 },
  { hsn: '7201', desc: 'Pig iron and cast iron', gst: 18 },
  { hsn: '7308', desc: 'Structures of iron or steel', gst: 18 },
  { hsn: '7601', desc: 'Unwrought aluminium', gst: 18 },
  { hsn: '8414', desc: 'Air pumps, compressors, fans', gst: 18 },
  { hsn: '8415', desc: 'Air conditioning machines', gst: 28 },
  { hsn: '8443', desc: 'Printing machinery', gst: 18 },
  { hsn: '8471', desc: 'Computers', gst: 18 },
  { hsn: '8517', desc: 'Telephones, smartphones', gst: 12 },
  { hsn: '8528', desc: 'Monitors/projectors/TVs', gst: 28 },
  { hsn: '8703', desc: 'Motor cars', gst: 28 },
  { hsn: '9001', desc: 'Optical fibres, lenses', gst: 12 },
  { hsn: '9021', desc: 'Orthopaedic appliances', gst: 12 },
  { hsn: '9403', desc: 'Furniture (other)', gst: 18 },
  { hsn: '9405', desc: 'Lamps, lighting fittings', gst: 12 },
  { hsn: '9503', desc: 'Toys, games', gst: 12 },
]

const SERVICES_SAC = [
  { sac: '9954', desc: 'Construction services', gst: 18 },
  { sac: '9961', desc: 'Services in retail trade', gst: 5 },
  { sac: '9962', desc: 'Services in wholesale trade', gst: 5 },
  { sac: '9963', desc: 'Accommodation services', gst: 18 },
  { sac: '9964', desc: 'Passenger transport services', gst: 5 },
  { sac: '9965', desc: 'Goods transport services', gst: 5 },
  { sac: '9966', desc: 'Rental services of transport', gst: 18 },
  { sac: '9967', desc: 'Supporting services for transport', gst: 18 },
  { sac: '9968', desc: 'Postal and courier services', gst: 18 },
  { sac: '9971', desc: 'Financial and related services', gst: 18 },
  { sac: '9972', desc: 'Real estate services', gst: 18 },
  { sac: '9973', desc: 'Leasing/rental without operator', gst: 18 },
  { sac: '9981', desc: 'Research and development services', gst: 18 },
  { sac: '9982', desc: 'Legal and accounting services', gst: 18 },
  { sac: '9983', desc: 'Other professional services', gst: 18 },
  { sac: '9984', desc: 'Telecom services', gst: 18 },
  { sac: '9985', desc: 'Support services (BPO/KPO)', gst: 18 },
  { sac: '9986', desc: 'Agriculture support services', gst: 0 },
  { sac: '9987', desc: 'Maintenance and repair services', gst: 18 },
  { sac: '9988', desc: 'Manufacturing on fee/contract', gst: 12 },
  { sac: '9989', desc: 'Printing/publishing services', gst: 12 },
  { sac: '9991', desc: 'Public administration services', gst: 0 },
  { sac: '9992', desc: 'Education services', gst: 0 },
  { sac: '9993', desc: 'Human health services', gst: 0 },
  { sac: '9994', desc: 'Sewage/waste services', gst: 12 },
  { sac: '9995', desc: 'Services of membership orgs', gst: 18 },
  { sac: '9996', desc: 'Recreational and sporting services', gst: 18 },
  { sac: '9997', desc: 'Other services', gst: 18 },
  { sac: '9998', desc: 'Domestic services', gst: 0 },
  { sac: '9999', desc: 'Services by extra-territorial orgs', gst: 0 },
  { sac: '998211', desc: 'Legal advisory/consulting', gst: 18 },
  { sac: '998311', desc: 'Management consulting', gst: 18 },
  { sac: '998313', desc: 'IT consulting', gst: 18 },
  { sac: '998314', desc: 'IT design & development', gst: 18 },
  { sac: '998315', desc: 'IT infrastructure', gst: 18 },
  { sac: '998316', desc: 'IT support services', gst: 18 },
  { sac: '998361', desc: 'Advertising services', gst: 18 },
  { sac: '998371', desc: 'Market research services', gst: 18 },
  { sac: '998393', desc: 'Design services', gst: 18 },
]

const CURRENCIES = [
  { sym: '₹', code: 'INR' }, { sym: '$', code: 'USD' },
  { sym: '€', code: 'EUR' }, { sym: '£', code: 'GBP' },
]

const TEMPLATES = [
  { key: 'modern', label: 'Modern', accent: '#7C6FFF' },
  { key: 'clean', label: 'Clean', accent: '#0EA5E9' },
  { key: 'bold', label: 'Bold', accent: '#F59E0B' },
  { key: 'minimal', label: 'Minimal', accent: '#1a1a2e' },
]

const defaultItem = () => ({ id: uid(), type: 'goods', hsnSac: '', desc: '', qty: 1, rate: '', gstRate: 18 })

/* ─── CSS ────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

.ig-root {
  --bg: #0A0914;
  --card: rgba(255,255,255,0.04);
  --card2: rgba(255,255,255,0.07);
  --border: rgba(255,255,255,0.08);
  --border2: rgba(255,255,255,0.16);
  --text: #EAE8FF;
  --text2: #9B97C8;
  --text3: #5C587A;
  --accent: #7C6FFF;
  --accent-dim: rgba(124,111,255,0.15);
  --accent-glow: rgba(124,111,255,0.4);
  --green: #34D399;
  --red: #F87171;
  --yellow: #FBBF24;
  --blue: #38BDF8;
  --r: 12px;
  --r-sm: 8px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: var(--text);
  min-height: 100vh;
  background: var(--bg);
  padding-bottom: 60px;
}
.ig-root * { box-sizing: border-box; }

/* Header */
.ig-top {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
  gap: 12px; flex-wrap: wrap;
}
.ig-brand { display: flex; align-items: center; gap: 12px; }
.ig-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: linear-gradient(135deg, #7C6FFF, #A78BFA);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; box-shadow: 0 0 20px var(--accent-glow);
}
.ig-name { font-size: 17px; font-weight: 700; color: var(--text); letter-spacing: -0.02em; }
.ig-sub { font-size: 11px; color: var(--text3); margin-top: 1px; }
.ig-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

/* Buttons */
.btn {
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 600;
  padding: 8px 16px; border-radius: var(--r-sm); border: 1px solid var(--border2);
  background: var(--card2); color: var(--text2); cursor: pointer; transition: all 0.15s;
  display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
}
.btn:hover { background: rgba(255,255,255,0.12); color: var(--text); }
.btn-accent {
  background: linear-gradient(135deg, #7C6FFF, #A78BFA);
  border-color: transparent; color: #fff;
  box-shadow: 0 4px 18px var(--accent-glow);
}
.btn-accent:hover { opacity: 0.88; color: #fff; }
.btn-green { background: rgba(52,211,153,0.15); border-color: rgba(52,211,153,0.3); color: var(--green); }
.btn-green:hover { background: rgba(52,211,153,0.25); }
.btn-sm { padding: 6px 12px; font-size: 12px; }
.btn-icon { padding: 7px 8px; }
.btn-ghost { background: transparent; border-color: transparent; color: var(--text3); }
.btn-ghost:hover { background: var(--card2); color: var(--text); border-color: var(--border); }

/* Main layout */
.ig-layout { display: grid; grid-template-columns: 1fr 340px; gap: 0; min-height: calc(100vh - 80px); }
@media (max-width: 900px) { .ig-layout { grid-template-columns: 1fr; } }

.ig-left { padding: 20px 24px; border-right: 1px solid var(--border); }
.ig-right { padding: 20px; background: rgba(0,0,0,0.15); }

/* Section heading */
.sec-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--text3); margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
}
.sec-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }

/* Two-col */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
@media (max-width: 640px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }

/* Card */
.ig-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--r); padding: 16px; margin-bottom: 12px;
  transition: border-color 0.2s;
}
.ig-card:focus-within { border-color: rgba(124,111,255,0.3); }

/* Form fields */
.field { margin-bottom: 10px; }
.field:last-child { margin-bottom: 0; }
.lbl { font-size: 11px; font-weight: 600; color: var(--text3); letter-spacing: 0.04em; text-transform: uppercase; display: block; margin-bottom: 4px; }
.inp {
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px;
  background: var(--card2); color: var(--text); border: 1px solid var(--border);
  border-radius: var(--r-sm); padding: 9px 12px; width: 100%; outline: none; transition: all 0.15s;
}
.inp:hover { border-color: var(--border2); }
.inp:focus { border-color: var(--accent); background: rgba(124,111,255,0.08); }
.inp::placeholder { color: var(--text3); opacity: 0.7; }
.inp[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
textarea.inp { resize: vertical; min-height: 60px; line-height: 1.5; }
select.inp { cursor: pointer; }

/* Biz pills */
.biz-pills { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
.biz-pill {
  font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 20px;
  border: 1px solid var(--border2); background: var(--card2); color: var(--text3);
  cursor: pointer; transition: all 0.15s;
}
.biz-pill:hover { color: var(--text); background: rgba(255,255,255,0.1); }
.biz-pill.on { background: var(--accent-dim); border-color: rgba(124,111,255,0.4); color: var(--accent); }

/* Invoice number chip */
.inv-no {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--accent-dim); border: 1px solid rgba(124,111,255,0.3);
  border-radius: var(--r-sm); padding: 8px 14px;
  font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 500;
  color: #A78BFA; letter-spacing: 0.04em; margin-bottom: 14px;
}
.inv-no input {
  background: transparent; border: none; outline: none; color: #A78BFA;
  font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 500;
  width: 140px; letter-spacing: 0.04em;
}

/* Items table */
.items-head {
  display: grid; grid-template-columns: 80px 1fr 80px 60px 100px 80px 32px;
  gap: 8px; padding: 0 4px 8px; border-bottom: 1px solid var(--border);
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text3);
}
.item-row {
  display: grid; grid-template-columns: 80px 1fr 80px 60px 100px 80px 32px;
  gap: 8px; align-items: start; margin-top: 8px; animation: fadeIn 0.2s ease;
}
@media (max-width: 700px) {
  .items-head { display: none; }
  .item-row { grid-template-columns: 1fr 1fr; }
}
.item-amt {
  font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600;
  color: var(--text); text-align: right; padding-top: 9px;
}
.type-badge {
  font-size: 10px; font-weight: 700; padding: 3px 7px; border-radius: 5px;
  display: inline-block; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 11px;
}
.type-goods { background: rgba(251,191,36,0.15); color: var(--yellow); }
.type-service { background: rgba(96,165,250,0.15); color: var(--blue); }

/* Totals */
.totals { border-top: 1px solid var(--border); margin-top: 16px; padding-top: 14px; }
.t-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 13px; color: var(--text2); }
.t-row.grand { border-top: 1px solid var(--border2); margin-top: 10px; padding-top: 12px; font-size: 20px; font-weight: 700; color: var(--text); }
.t-row.grand span:last-child { color: var(--accent); font-family: 'JetBrains Mono', monospace; }
.pct-inp {
  font-family: 'JetBrains Mono', monospace; font-size: 12px; background: var(--card2);
  border: 1px solid var(--border); border-radius: 5px; padding: 2px 6px; width: 48px;
  color: var(--text2); outline: none; text-align: center;
}
.pct-inp:focus { border-color: var(--accent); }

/* Right panel */
.preview-panel { position: sticky; top: 20px; }
.prev-box {
  background: #fff; border-radius: var(--r); overflow: hidden;
  box-shadow: 0 8px 40px rgba(0,0,0,0.4);
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #1a1a2e;
  min-height: 400px;
}

/* Template thumbs */
.tmpl-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.tmpl-opt {
  flex: 1; min-width: 64px; cursor: pointer; border: 2px solid var(--border);
  border-radius: var(--r-sm); overflow: hidden; background: none; transition: all 0.15s;
  padding: 0;
}
.tmpl-opt.on { border-color: var(--accent); box-shadow: 0 0 12px var(--accent-glow); }
.tmpl-thumb { height: 44px; display: flex; flex-direction: column; padding: 5px 6px; gap: 3px; }
.t-bar { border-radius: 2px; height: 6px; }
.tmpl-name { font-size: 10px; font-weight: 600; text-align: center; padding: 4px 0 3px; color: var(--text3); }

/* Generate area */
.gen-area {
  background: linear-gradient(135deg, rgba(124,111,255,0.12), rgba(167,139,250,0.08));
  border: 1px solid rgba(124,111,255,0.25); border-radius: var(--r);
  padding: 20px; text-align: center; margin-bottom: 14px;
}
.gen-total { font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 700; color: var(--accent); letter-spacing: -0.02em; }
.gen-label { font-size: 11px; color: var(--text3); margin-bottom: 12px; }

/* Saved list */
.saved-list { margin-top: 20px; }
.saved-item {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--card); border: 1px solid var(--border); border-radius: var(--r-sm);
  padding: 10px 12px; margin-bottom: 6px; gap: 8px; transition: border-color 0.15s;
}
.saved-item:hover { border-color: var(--border2); }
.s-no { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #A78BFA; font-weight: 500; }
.s-client { font-size: 11px; color: var(--text3); margin-top: 2px; }
.s-amt { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: var(--text); white-space: nowrap; }

/* Modal */
.modal-bg {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
  animation: fadeIn 0.15s ease;
}
.modal {
  background: #0D0C1A; border: 1px solid var(--border2); border-radius: 16px;
  padding: 24px; width: 520px; max-width: 100%; max-height: 88vh; overflow-y: auto;
  animation: slideUp 0.2s ease;
  box-shadow: 0 24px 60px rgba(0,0,0,0.6);
}
.modal-h { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-title { font-size: 17px; font-weight: 700; }

/* Status pills */
.status-strip { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; align-items: center; }
.s-pill {
  font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 20px; border: 1px solid; cursor: pointer; transition: all 0.15s;
}

/* HSN/SAC search */
.code-search { position: relative; }
.code-drop {
  position: absolute; top: 100%; left: 0; right: 0; z-index: 50;
  background: #0D0C1A; border: 1px solid var(--border2); border-radius: var(--r-sm);
  max-height: 180px; overflow-y: auto; margin-top: 2px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
.code-opt {
  padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--border);
  transition: background 0.1s; display: flex; justify-content: space-between; align-items: center;
}
.code-opt:last-child { border-bottom: none; }
.code-opt:hover { background: var(--card2); }
.code-opt-main { font-size: 12px; color: var(--text); font-weight: 500; }
.code-opt-sub { font-size: 10px; color: var(--text3); margin-top: 1px; }
.code-badge { font-size: 10px; font-weight: 700; color: var(--accent); font-family: 'JetBrains Mono', monospace; }

/* Print preview */
.print-prev { padding: 28px; background: #fff; color: #1a1a2e; min-height: 500px; }
.prev-h { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; }
.prev-biz { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
.prev-no { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; }
.prev-tbl { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 11px; }
.prev-tbl th { text-transform: uppercase; letter-spacing: 0.06em; font-size: 9px; padding: 7px 10px; text-align: left; }
.prev-tbl td { padding: 8px 10px; border-bottom: 1px solid #f0eeff; font-size: 11px; }
.prev-tot { margin-left: auto; min-width: 200px; }
.p-t-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; color: #5A578A; }
.p-t-grand { display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; padding-top: 8px; border-top: 2px solid; margin-top: 6px; }

/* Section divider */
.divider { border: none; border-top: 1px solid var(--border); margin: 4px 0 14px; }

/* Animations */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }

/* Print */
@media print {
  .ig-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}

/* Scrollbar */
.ig-root ::-webkit-scrollbar { width: 4px; height: 4px; }
.ig-root ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 10px; }
.code-drop ::-webkit-scrollbar { width: 4px; }
.code-drop ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
`

function useCSS() {
  useEffect(() => {
    const id = 'ig-styles-v2'
    if (!document.getElementById(id)) {
      const s = document.createElement('style'); s.id = id; s.textContent = CSS
      document.head.appendChild(s)
    }
  }, [])
}

/* ─── HSN/SAC Picker ─────────────────────────────────────────── */
function CodePicker({ type, value, onSelect }) {
  const [q, setQ] = useState(value || '')
  const [open, setOpen] = useState(false)
  const list = type === 'goods' ? GOODS_HSN : SERVICES_SAC
  const key = type === 'goods' ? 'hsn' : 'sac'
  const filtered = q.length >= 2
    ? list.filter(i => i[key].includes(q) || i.desc.toLowerCase().includes(q.toLowerCase()))
    : list.slice(0, 20)

  return (
    <div className="code-search">
      <input className="inp" value={q} placeholder={type === 'goods' ? 'Search HSN…' : 'Search SAC…'}
        onChange={e => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
      />
      {open && (
        <div className="code-drop">
          {filtered.length === 0 && <div className="code-opt" style={{ color: 'var(--text3)', cursor: 'default' }}>No results</div>}
          {filtered.map(i => (
            <div key={i[key]} className="code-opt" onMouseDown={() => { onSelect(i); setQ(i[key]); setOpen(false) }}>
              <div>
                <div className="code-opt-main">{i.desc}</div>
                <div className="code-opt-sub">{type === 'goods' ? 'HSN' : 'SAC'}: {i[key]}</div>
              </div>
              <div className="code-badge">{i.gst}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Invoice Preview ────────────────────────────────────────── */
function Preview({ inv, items, currency, discPct, taxPct, template, status }) {
  const sub = items.reduce((s, i) => s + (i.qty || 0) * (parseFloat(i.rate) || 0), 0)
  const disc = sub * (discPct / 100)
  const tax = (sub - disc) * (taxPct / 100)
  const total = sub - disc + tax
  const t = TEMPLATES.find(t => t.key === template) || TEMPLATES[0]
  const acc = t.accent

  const statusColors = { draft: '#818CF8', sent: '#38BDF8', paid: '#34D399', overdue: '#F87171', cancelled: '#9CA3AF' }
  const sc = statusColors[status] || statusColors.draft

  return (
    <div className="print-prev" style={{ borderTop: `4px solid ${acc}` }}>
      {/* Header */}
      <div className="prev-h">
        <div>
          <div className="prev-biz" style={{ color: acc }}>{inv.bizName || 'Your Business'}</div>
          <div style={{ fontSize: 11, color: '#5A578A', marginTop: 4, lineHeight: 1.7 }}>
            {inv.bizEmail && <div>{inv.bizEmail}</div>}
            {inv.bizPhone && <div>{inv.bizPhone}</div>}
            {inv.bizGst && <div>GSTIN: {inv.bizGst}</div>}
            {inv.bizAddr && <div style={{ whiteSpace: 'pre-line' }}>{inv.bizAddr}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: acc, marginBottom: 4 }}>Invoice</div>
          <div className="prev-no">{inv.no || 'INV-2026-001'}</div>
          <div style={{ marginTop: 8 }}>
            <span style={{ background: sc + '22', color: sc, fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{status}</span>
          </div>
          <div style={{ fontSize: 10, color: '#5A578A', marginTop: 8 }}>{inv.date || today()}</div>
        </div>
      </div>

      {/* Bill to / From */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18, background: '#f9f8ff', borderRadius: 8, padding: '12px 14px' }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9492C0', marginBottom: 6 }}>Bill To</div>
          <div style={{ fontWeight: 700, fontSize: 12 }}>{inv.clientName || '—'}</div>
          <div style={{ fontSize: 10, color: '#5A578A', marginTop: 3, lineHeight: 1.6 }}>
            {inv.clientEmail && <div>{inv.clientEmail}</div>}
            {inv.clientPhone && <div>{inv.clientPhone}</div>}
            {inv.clientGst && <div>GSTIN: {inv.clientGst}</div>}
            {inv.clientAddr && <div style={{ whiteSpace: 'pre-line' }}>{inv.clientAddr}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9492C0', marginBottom: 6 }}>Currency</div>
          <div style={{ fontWeight: 700, fontSize: 12 }}>{currency === '₹' ? 'INR – Indian Rupee' : currency}</div>
        </div>
      </div>

      {/* Table */}
      <table className="prev-tbl">
        <thead>
          <tr style={{ background: acc + '18' }}>
            <th style={{ color: acc }}>#</th>
            <th style={{ color: acc }}>Description</th>
            <th style={{ color: acc }}>HSN/SAC</th>
            <th style={{ color: acc, textAlign: 'center' }}>Qty</th>
            <th style={{ color: acc, textAlign: 'right' }}>Rate</th>
            <th style={{ color: acc, textAlign: 'right' }}>GST%</th>
            <th style={{ color: acc, textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.filter(i => i.desc || i.rate).map((it, idx) => (
            <tr key={it.id} style={{ background: idx % 2 === 1 ? '#f9f8ff' : '#fff' }}>
              <td style={{ color: '#9492C0' }}>{idx + 1}</td>
              <td style={{ fontWeight: 500 }}>{it.desc || '—'}</td>
              <td style={{ fontFamily: 'monospace', fontSize: 10, color: '#777' }}>{it.hsnSac || '—'}</td>
              <td style={{ textAlign: 'center' }}>{it.qty}</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{fmt(parseFloat(it.rate) || 0, currency)}</td>
              <td style={{ textAlign: 'right' }}>{it.gstRate}%</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{fmt((it.qty || 0) * (parseFloat(it.rate) || 0), currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <div className="prev-tot">
          <div className="p-t-row"><span>Subtotal</span><span style={{ fontFamily: 'monospace' }}>{fmt(sub, currency)}</span></div>
          {disc > 0 && <div className="p-t-row"><span>Discount ({discPct}%)</span><span style={{ fontFamily: 'monospace' }}>−{fmt(disc, currency)}</span></div>}
          <div className="p-t-row"><span>Tax/GST ({taxPct}%)</span><span style={{ fontFamily: 'monospace' }}>{fmt(tax, currency)}</span></div>
          <div className="p-t-grand" style={{ color: acc, borderColor: acc }}>
            <span>Total</span><span style={{ fontFamily: 'monospace' }}>{fmt(total, currency)}</span>
          </div>
        </div>
      </div>

      {inv.notes && (
        <div style={{ marginTop: 20, borderTop: '1px solid #e8e7ff', paddingTop: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9492C0', marginBottom: 4 }}>Notes</div>
          <div style={{ fontSize: 10, color: '#5A578A', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{inv.notes}</div>
        </div>
      )}

      <div style={{ marginTop: 24, borderTop: '1px solid #e8e7ff', paddingTop: 10, fontSize: 9, color: '#aaa', textAlign: 'center' }}>
        Generated with Zerofy Invoice Generator · Thank you for your business!
      </div>
    </div>
  )
}

/* ─── Business Modal ─────────────────────────────────────────── */
function BizModal({ businesses, onSave, onClose }) {
  const empty = { name: '', email: '', phone: '', gst: '', addr: '', prefix: 'INV' }
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-h">
          <div className="modal-title">🏢 Business Profiles</div>
          <button className="btn btn-icon btn-ghost" onClick={onClose} style={{ fontSize: 18 }}>×</button>
        </div>
        {!editing && (
          <>
            {businesses.map(b => (
              <div key={b.id} className="saved-item" style={{ marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{b.email}{b.gst ? ` · GSTIN: ${b.gst}` : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm" onClick={() => { setEditing(b.id); setForm({ ...b }) }}>Edit</button>
                  <button className="btn btn-sm" style={{ color: 'var(--red)', borderColor: 'rgba(248,113,113,0.25)', background: 'rgba(248,113,113,0.08)' }}
                    onClick={() => { if (window.confirm('Delete?')) onSave(null, b.id) }}>Del</button>
                </div>
              </div>
            ))}
            <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              onClick={() => { setEditing('new'); setForm(empty) }}>+ Add New Business</button>
          </>
        )}
        {editing && (
          <div style={{ animation: 'slideUp 0.2s ease' }}>
            <div className="sec-label"><span className="sec-dot" />{editing === 'new' ? 'New Business' : 'Edit Business'}</div>
            <div className="grid-2">
              <div className="field"><label className="lbl">Business Name *</label><input className="inp" value={form.name} onChange={set('name')} placeholder="My Company Pvt Ltd" /></div>
              <div className="field"><label className="lbl">Email</label><input className="inp" value={form.email} onChange={set('email')} placeholder="hello@company.com" /></div>
              <div className="field"><label className="lbl">Phone</label><input className="inp" value={form.phone} onChange={set('phone')} placeholder="+91 98000 00000" /></div>
              <div className="field"><label className="lbl">GSTIN / PAN</label><input className="inp" value={form.gst} onChange={set('gst')} placeholder="22AAAAA0000A1Z5" /></div>
              <div className="field"><label className="lbl">Invoice Prefix</label><input className="inp" value={form.prefix} onChange={set('prefix')} placeholder="INV" /></div>
            </div>
            <div className="field"><label className="lbl">Address</label><textarea className="inp" value={form.addr} onChange={set('addr')} placeholder="Street, City, State, PIN" /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-accent" onClick={() => {
                if (!form.name.trim()) return alert('Business name required')
                onSave({ ...form, id: editing === 'new' ? uid() : editing })
                setEditing(null)
              }}>Save</button>
              <button className="btn" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function InvoiceMaker() {
  useCSS()

  const [businesses, setBusinesses] = useState(() => lsGet(LS_BIZ, []))
  const [savedInvoices, setSavedInvoices] = useState(() => lsGet(LS_INV, []))
  const [activeBizId, setActiveBizId] = useState(null)
  const [status, setStatus] = useState('draft')
  const [showBizModal, setShowBizModal] = useState(false)
  const [template, setTemplate] = useState('modern')
  const [currency, setCurrency] = useState('₹')
  const [discPct, setDiscPct] = useState(0)
  const [taxPct, setTaxPct] = useState(18)
  const [items, setItems] = useState([defaultItem()])
  const [invNo, setInvNo] = useState('')
  const [generating, setGenerating] = useState(false)

  const [f, setF] = useState({
    bizName: '', bizEmail: '', bizPhone: '', bizGst: '', bizAddr: '',
    clientName: '', clientEmail: '', clientPhone: '', clientGst: '', clientAddr: '',
    notes: '', date: today(),
  })
  const sf = k => e => setF(p => ({ ...p, [k]: e.target.value }))

  useEffect(() => lsSet(LS_BIZ, businesses), [businesses])
  useEffect(() => lsSet(LS_INV, savedInvoices), [savedInvoices])

  const genInvNo = useCallback((biz) => {
    const prefix = biz?.prefix || 'INV'
    const year = new Date().getFullYear()
    const existing = savedInvoices.filter(i => i.bizId === (biz?.id || null))
    const lastNum = existing.reduce((max, inv) => {
      const m = inv.no?.match(/(\d+)$/)
      return m ? Math.max(max, parseInt(m[1])) : max
    }, 0)
    return `${prefix}-${year}-${String(lastNum + 1).padStart(3, '0')}`
  }, [savedInvoices])

  useEffect(() => {
    if (!invNo) setInvNo(genInvNo(businesses.find(b => b.id === activeBizId)))
  }, [activeBizId, businesses]) // eslint-disable-line

  const loadBusiness = id => {
    setActiveBizId(id)
    const biz = businesses.find(b => b.id === id)
    if (!biz) return
    setF(p => ({ ...p, bizName: biz.name, bizEmail: biz.email || '', bizPhone: biz.phone || '', bizGst: biz.gst || '', bizAddr: biz.addr || '' }))
    setInvNo(genInvNo(biz))
  }

  const handleBizSave = (biz, deleteId) => {
    if (deleteId) { setBusinesses(p => p.filter(b => b.id !== deleteId)); if (activeBizId === deleteId) setActiveBizId(null); return }
    setBusinesses(p => p.find(b => b.id === biz.id) ? p.map(b => b.id === biz.id ? biz : b) : [...p, biz])
  }

  const updateItem = (id, k, v) => setItems(p => p.map(i => i.id === id ? { ...i, [k]: v } : i))
  const removeItem = id => setItems(p => p.length > 1 ? p.filter(i => i.id !== id) : p)

  const sub = items.reduce((s, i) => s + (i.qty || 0) * (parseFloat(i.rate) || 0), 0)
  const disc = sub * (discPct / 100)
  const tax = (sub - disc) * (taxPct / 100)
  const total = sub - disc + tax

  const generateInvoice = async () => {
    if (!f.bizName.trim()) { alert('Please enter your Business Name.'); return }
    if (!f.clientName.trim()) { alert('Please enter Client Name.'); return }
    if (items.every(i => !i.desc && !i.rate)) { alert('Please add at least one item.'); return }

    setGenerating(true)
    await new Promise(r => setTimeout(r, 600)) // brief animation

    const inv = {
      id: uid(), ts: Date.now(), no: invNo,
      bizId: activeBizId, bizName: f.bizName,
      clientName: f.clientName, clientEmail: f.clientEmail,
      clientAddr: f.clientAddr, clientPhone: f.clientPhone, clientGst: f.clientGst,
      bizEmail: f.bizEmail, bizPhone: f.bizPhone, bizAddr: f.bizAddr, bizGst: f.bizGst,
      date: f.date, notes: f.notes,
      total: fmt(total, currency),
      status: 'sent',
      template, currency, discPct, taxPct,
      items: [...items],
    }
    setSavedInvoices(p => [inv, ...p.filter(i => i.no !== invNo)].slice(0, 100))
    setStatus('sent')
    const biz = businesses.find(b => b.id === activeBizId)
    const next = genInvNo(biz)
    setTimeout(() => setInvNo(next), 80)
    setGenerating(false)

    // Auto print
    printInvoice(inv)
  }

  const printInvoice = (inv) => {
    const el = document.getElementById('ig-print-zone')
    if (!el) return
    const t = TEMPLATES.find(t => t.key === template) || TEMPLATES[0]
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head><title>${invNo}</title>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Plus Jakarta Sans',sans-serif;padding:32px;max-width:820px;margin:0 auto;-webkit-print-color-adjust:exact;print-color-adjust:exact}@media print{@page{margin:16px}}</style>
    </head><body>${el.innerHTML}</body></html>`)
    w.document.close(); w.focus(); setTimeout(() => w.print(), 700)
  }

  const statusMeta = { draft: '#818CF8', sent: '#38BDF8', paid: '#34D399', overdue: '#F87171', cancelled: '#9CA3AF' }
  const invData = { ...f, no: invNo }
  const t = TEMPLATES.find(t => t.key === template) || TEMPLATES[0]

  return (
    <div className="ig-root">
      {/* TOP BAR */}
      <div className="ig-top">
        <div className="ig-brand">
          <div className="ig-icon">🧾</div>
          <div>
            <div className="ig-name">Invoice Generator</div>
            <div className="ig-sub">GST-ready · Instant PDF · Multi-business</div>
          </div>
        </div>
        <div className="ig-actions">
          <button className="btn" onClick={() => setShowBizModal(true)}>
            🏢 Businesses {businesses.length > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 10 }}>{businesses.length}</span>}
          </button>
          <select className="inp" value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: 'auto', padding: '8px 12px' }}>
            {CURRENCIES.map(c => <option key={c.sym} value={c.sym}>{c.sym} {c.code}</option>)}
          </select>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="ig-layout">

        {/* LEFT — FORM */}
        <div className="ig-left">

          {/* Invoice No + Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div className="inv-no">
              🧾 <input value={invNo} onChange={e => setInvNo(e.target.value)} />
            </div>
            <input type="date" className="inp" value={f.date} onChange={sf('date')} style={{ width: 'auto', flex: '0 0 auto' }} />
          </div>
          <div className="status-strip">
            {Object.entries(statusMeta).map(([k, c]) => (
              <button key={k} className="s-pill" onClick={() => setStatus(k)}
                style={{ background: status === k ? c + '22' : 'transparent', borderColor: status === k ? c : 'var(--border)', color: status === k ? c : 'var(--text3)' }}>
                <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: status === k ? c : 'var(--text3)', marginRight: 5, verticalAlign: 'middle' }} />
                {k}
              </button>
            ))}
          </div>
          <hr className="divider" />

          {/* Business Selector */}
          {businesses.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div className="sec-label"><span className="sec-dot" />Your Business</div>
              <div className="biz-pills">
                {businesses.map(b => (
                  <button key={b.id} className={`biz-pill ${activeBizId === b.id ? 'on' : ''}`} onClick={() => loadBusiness(b.id)}>
                    {activeBizId === b.id && '✓ '}{b.name}
                  </button>
                ))}
                <button className="biz-pill" style={{ color: 'var(--accent)', borderColor: 'rgba(124,111,255,0.3)', background: 'var(--accent-dim)' }}
                  onClick={() => setShowBizModal(true)}>+ Add</button>
              </div>
            </div>
          )}

          {/* From + Bill To */}
          <div className="grid-2">
            <div className="ig-card">
              <div className="sec-label"><span className="sec-dot" />From (Your Business)</div>
              <div className="field"><label className="lbl">Business Name *</label><input className="inp" value={f.bizName} onChange={sf('bizName')} placeholder="Your Company Pvt Ltd" /></div>
              <div className="field"><label className="lbl">Email</label><input className="inp" value={f.bizEmail} onChange={sf('bizEmail')} placeholder="hello@company.com" /></div>
              <div className="field"><label className="lbl">Phone</label><input className="inp" value={f.bizPhone} onChange={sf('bizPhone')} placeholder="+91 98000 00000" /></div>
              <div className="field"><label className="lbl">GSTIN / PAN</label><input className="inp" value={f.bizGst} onChange={sf('bizGst')} placeholder="22AAAAA0000A1Z5" /></div>
              <div className="field"><label className="lbl">Address</label><textarea className="inp" rows={2} value={f.bizAddr} onChange={sf('bizAddr')} placeholder="Street, City, State, PIN" /></div>
            </div>
            <div className="ig-card">
              <div className="sec-label"><span className="sec-dot" style={{ background: 'var(--blue)' }} />Bill To (Client)</div>
              <div className="field"><label className="lbl">Client Name *</label><input className="inp" value={f.clientName} onChange={sf('clientName')} placeholder="Client Company" /></div>
              <div className="field"><label className="lbl">Email</label><input className="inp" value={f.clientEmail} onChange={sf('clientEmail')} placeholder="client@email.com" /></div>
              <div className="field"><label className="lbl">Phone</label><input className="inp" value={f.clientPhone} onChange={sf('clientPhone')} placeholder="+91 00000 00000" /></div>
              <div className="field"><label className="lbl">GSTIN / PAN</label><input className="inp" value={f.clientGst} onChange={sf('clientGst')} placeholder="Client GSTIN" /></div>
              <div className="field"><label className="lbl">Address</label><textarea className="inp" rows={2} value={f.clientAddr} onChange={sf('clientAddr')} placeholder="Client address" /></div>
            </div>
          </div>

          {/* Items */}
          <div className="ig-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="sec-label" style={{ margin: 0 }}><span className="sec-dot" style={{ background: 'var(--yellow)' }} />Line Items</div>
              <button className="btn btn-sm btn-accent" onClick={() => setItems(p => [...p, defaultItem()])}>+ Add Item</button>
            </div>
            <div className="items-head">
              <div>Type</div>
              <div>Description</div>
              <div>HSN / SAC</div>
              <div style={{ textAlign: 'center' }}>Qty</div>
              <div style={{ textAlign: 'right' }}>Rate</div>
              <div style={{ textAlign: 'right' }}>GST %</div>
              <div />
            </div>
            {items.map(it => (
              <div key={it.id} className="item-row">
                {/* Type */}
                <div>
                  <select className="inp" value={it.type}
                    onChange={e => { updateItem(it.id, 'type', e.target.value); updateItem(it.id, 'hsnSac', ''); updateItem(it.id, 'desc', '') }}>
                    <option value="goods">🟡 Goods</option>
                    <option value="service">🔵 Service</option>
                  </select>
                </div>
                {/* Description */}
                <div>
                  <input className="inp" value={it.desc} onChange={e => updateItem(it.id, 'desc', e.target.value)} placeholder="Item description…" />
                </div>
                {/* HSN/SAC */}
                <div>
                  <CodePicker type={it.type} value={it.hsnSac}
                    onSelect={sel => {
                      const key = it.type === 'goods' ? 'hsn' : 'sac'
                      updateItem(it.id, 'hsnSac', sel[key])
                      updateItem(it.id, 'gstRate', sel.gst)
                      if (!it.desc) updateItem(it.id, 'desc', sel.desc)
                    }}
                  />
                </div>
                {/* Qty */}
                <div>
                  <input className="inp" type="number" min="1" value={it.qty}
                    onChange={e => updateItem(it.id, 'qty', Math.max(1, +e.target.value))}
                    style={{ textAlign: 'center' }} />
                </div>
                {/* Rate */}
                <div>
                  <input className="inp" type="number" min="0" value={it.rate}
                    onChange={e => updateItem(it.id, 'rate', e.target.value)}
                    placeholder="0.00" style={{ textAlign: 'right' }} />
                </div>
                {/* GST Rate */}
                <div>
                  <select className="inp" value={it.gstRate} onChange={e => updateItem(it.id, 'gstRate', +e.target.value)} style={{ textAlign: 'right' }}>
                    {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                {/* Remove */}
                <div style={{ paddingTop: 8 }}>
                  <button className="btn btn-icon btn-ghost btn-sm" onClick={() => removeItem(it.id)}
                    style={{ color: 'var(--red)', fontSize: 16, lineHeight: 1 }}>×</button>
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="totals">
              <div className="t-row"><span>Subtotal</span><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(sub, currency)}</span></div>
              <div className="t-row">
                <span>Discount <input type="number" min="0" max="100" value={discPct} onChange={e => setDiscPct(+e.target.value)} className="pct-inp" />%</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: discPct > 0 ? 'var(--green)' : 'var(--text3)' }}>−{fmt(disc, currency)}</span>
              </div>
              <div className="t-row">
                <span>GST / Tax <input type="number" min="0" max="100" value={taxPct} onChange={e => setTaxPct(+e.target.value)} className="pct-inp" />%</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(tax, currency)}</span>
              </div>
              <div className="t-row grand"><span>Total</span><span>{fmt(total, currency)}</span></div>
            </div>
          </div>

          {/* Notes */}
          <div className="ig-card">
            <div className="sec-label"><span className="sec-dot" style={{ background: 'var(--green)' }} />Notes (optional)</div>
            <textarea className="inp" rows={3} value={f.notes} onChange={sf('notes')} placeholder="Bank details, payment instructions, thank you note…" />
          </div>

          {/* Saved invoices */}
          {savedInvoices.length > 0 && (
            <div className="saved-list">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div className="sec-label" style={{ margin: 0 }}><span className="sec-dot" />Recent Invoices ({savedInvoices.length})</div>
                <button className="btn btn-sm btn-ghost" onClick={() => { if (window.confirm('Clear all saved invoices?')) setSavedInvoices([]) }}>Clear</button>
              </div>
              {savedInvoices.slice(0, 5).map(inv => (
                <div key={inv.id} className="saved-item">
                  <div>
                    <div className="s-no">{inv.no}</div>
                    <div className="s-client">{inv.clientName || '—'} · {inv.date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ background: statusMeta[inv.status] + '22', color: statusMeta[inv.status], fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{inv.status}</span>
                    <span className="s-amt">{inv.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — PREVIEW + GENERATE */}
        <div className="ig-right">
          <div className="preview-panel">

            {/* Template picker */}
            <div className="sec-label" style={{ marginBottom: 10 }}><span className="sec-dot" />Template</div>
            <div className="tmpl-row">
              {TEMPLATES.map(t => (
                <button key={t.key} className={`tmpl-opt ${template === t.key ? 'on' : ''}`} onClick={() => setTemplate(t.key)}>
                  <div className="tmpl-thumb" style={{ background: t.key === 'minimal' ? '#f5f5f5' : '#fff' }}>
                    <div className="t-bar" style={{ background: t.accent, width: '100%' }} />
                    <div className="t-bar" style={{ background: '#e5e7eb', width: '75%' }} />
                    <div className="t-bar" style={{ background: '#e5e7eb', width: '60%' }} />
                    <div className="t-bar" style={{ background: t.accent + '44', width: '40%' }} />
                  </div>
                  <div className="tmpl-name">{t.label}</div>
                </button>
              ))}
            </div>

            {/* Generate button */}
            <div className="gen-area">
              <div className="gen-label">Total Amount</div>
              <div className="gen-total">{fmt(total, currency)}</div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-accent" onClick={generateInvoice} disabled={generating}
                  style={{ fontSize: 14, padding: '10px 24px', opacity: generating ? 0.7 : 1 }}>
                  {generating ? '⏳ Generating…' : '⚡ Generate & Print'}
                </button>
                <button className="btn btn-green btn-sm" onClick={() => document.getElementById('ig-print-zone') && printInvoice()}>
                  👁 Preview PDF
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
                Saves to Sent → opens print/PDF dialog
              </div>
            </div>

            {/* Live preview */}
            <div className="sec-label" style={{ margin: '14px 0 10px' }}><span className="sec-dot" />Live Preview</div>
            <div className="prev-box" id="ig-print-zone">
              <Preview inv={invData} items={items} currency={currency} discPct={discPct} taxPct={taxPct} template={template} status={status} />
            </div>
          </div>
        </div>
      </div>

      {showBizModal && <BizModal businesses={businesses} onSave={handleBizSave} onClose={() => setShowBizModal(false)} />}
    </div>
  )
}
