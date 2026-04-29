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
  --bg: #12111F;
  --card: #1E1C2E;
  --card2: #252338;
  --border: rgba(255,255,255,0.10);
  --border2: rgba(255,255,255,0.22);
  --text: #F0EEFF;
  --text2: #B8B4E0;
  --text3: #7A75A0;
  --accent: #8B7FFF;
  --accent-dim: rgba(139,127,255,0.18);
  --accent-glow: rgba(139,127,255,0.35);
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
  background: #1A1830;
  border-bottom: 1px solid rgba(139,127,255,0.2);
  gap: 12px; flex-wrap: wrap;
  box-shadow: 0 2px 16px rgba(0,0,0,0.3);
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
  padding: 8px 16px; border-radius: var(--r-sm); border: 1px solid rgba(255,255,255,0.18);
  background: #252338; color: var(--text2); cursor: pointer; transition: all 0.15s;
  display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
}
.btn:hover { background: #2E2B48; border-color: rgba(255,255,255,0.28); color: var(--text); }
.btn-accent {
  background: linear-gradient(135deg, #7C6FFF, #A78BFA);
  border-color: transparent; color: #fff;
  box-shadow: 0 4px 18px rgba(124,111,255,0.45);
}
.btn-accent:hover { opacity: 0.88; color: #fff; box-shadow: 0 6px 24px rgba(124,111,255,0.55); }
.btn-green { background: rgba(52,211,153,0.15); border-color: rgba(52,211,153,0.35); color: var(--green); }
.btn-green:hover { background: rgba(52,211,153,0.25); }
.btn-sm { padding: 6px 12px; font-size: 12px; }
.btn-icon { padding: 7px 8px; }
.btn-ghost { background: transparent; border-color: transparent; color: var(--text3); }
.btn-ghost:hover { background: #252338; color: var(--text); border-color: rgba(255,255,255,0.14); }

/* Main layout */
.ig-layout { display: grid; grid-template-columns: 1fr 420px; gap: 0; min-height: calc(100vh - 80px); }
@media (max-width: 1000px) { .ig-layout { grid-template-columns: 1fr; } }

.ig-left { padding: 20px 24px; border-right: 1px solid rgba(139,127,255,0.15); }
.ig-right { padding: 20px; background: #15132A; border-left: 1px solid rgba(139,127,255,0.1); }

/* Section heading */
.sec-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  color: #9A96C0; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
}
.sec-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); flex-shrink: 0; box-shadow: 0 0 6px var(--accent-glow); }

/* Two-col */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
@media (max-width: 640px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }

/* Card */
.ig-card {
  background: #1E1C2E;
  border: 1px solid rgba(139,127,255,0.15);
  border-radius: var(--r); padding: 16px; margin-bottom: 12px;
  transition: border-color 0.2s;
  box-shadow: 0 2px 12px rgba(0,0,0,0.25);
}
.ig-card:focus-within { border-color: rgba(139,127,255,0.45); }

/* Form fields */
.field { margin-bottom: 10px; }
.field:last-child { margin-bottom: 0; }
.lbl { font-size: 11px; font-weight: 600; color: var(--text3); letter-spacing: 0.04em; text-transform: uppercase; display: block; margin-bottom: 4px; }
.inp {
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px;
  background: #252338; color: var(--text); border: 1px solid rgba(255,255,255,0.14);
  border-radius: var(--r-sm); padding: 9px 12px; width: 100%; outline: none; transition: all 0.15s;
}
.inp:hover { border-color: rgba(255,255,255,0.26); }
.inp:focus { border-color: var(--accent); background: rgba(139,127,255,0.1); box-shadow: 0 0 0 3px rgba(139,127,255,0.12); }
.inp::placeholder { color: #5A5578; opacity: 1; }
.inp[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
textarea.inp { resize: vertical; min-height: 60px; line-height: 1.5; }
select.inp { cursor: pointer; color-scheme: dark; }
select.inp option { background: #252338; color: #F0EEFF; }

/* Biz pills */
.biz-pills { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
.biz-pill {
  font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.18); background: #252338; color: #B0ACC8;
  cursor: pointer; transition: all 0.15s;
}
.biz-pill:hover { color: var(--text); background: #2E2B48; border-color: rgba(255,255,255,0.28); }
.biz-pill.on { background: rgba(139,127,255,0.2); border-color: rgba(139,127,255,0.5); color: #C4BCFF; }

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
  display: grid; grid-template-columns: 100px 1fr 90px 60px 100px 32px;
  gap: 8px; padding: 0 4px 8px; border-bottom: 2px solid rgba(139,127,255,0.3);
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9A96C0;
}
.item-row {
  display: grid; grid-template-columns: 100px 1fr 90px 60px 100px 32px;
  gap: 8px; align-items: start; margin-top: 8px; animation: fadeIn 0.2s ease;
  padding: 6px 4px; border-bottom: 1px solid rgba(255,255,255,0.06); border-radius: 6px;
  transition: background 0.12s;
}
.item-row:hover { background: rgba(139,127,255,0.06); }
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
.totals { border-top: 1px solid rgba(255,255,255,0.1); margin-top: 16px; padding-top: 14px; }
.t-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; font-size: 13px; color: var(--text2); }
.t-row.grand { background: rgba(139,127,255,0.12); border: 1px solid rgba(139,127,255,0.25); border-radius: 10px; margin-top: 12px; padding: 12px 14px; font-size: 20px; font-weight: 700; color: var(--text); }
.t-row.grand span:last-child { color: #C4BCFF; font-family: 'JetBrains Mono', monospace; }
.pct-inp {
  font-family: 'JetBrains Mono', monospace; font-size: 12px; background: #252338;
  border: 1px solid rgba(255,255,255,0.14); border-radius: 5px; padding: 2px 6px; width: 48px;
  color: var(--text2); outline: none; text-align: center;
}
.pct-inp:focus { border-color: var(--accent); }

/* Right panel */
.preview-panel { position: sticky; top: 20px; }
.prev-box {
  background: #fff; border-radius: var(--r); overflow: hidden;
  box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,127,255,0.15);
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #1a1a2e;
  min-height: 400px;
  width: 100%;
  transform-origin: top left;
}

/* Template thumbs */
.tmpl-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.tmpl-opt {
  flex: 1; min-width: 64px; cursor: pointer; border: 2px solid rgba(255,255,255,0.12);
  border-radius: var(--r-sm); overflow: hidden; background: #1E1C2E; transition: all 0.15s;
  padding: 0;
}
.tmpl-opt:hover { border-color: rgba(139,127,255,0.35); background: #252338; }
.tmpl-opt.on { border-color: var(--accent); box-shadow: 0 0 14px rgba(139,127,255,0.4); }
.tmpl-thumb { height: 44px; display: flex; flex-direction: column; padding: 5px 6px; gap: 3px; }
.t-bar { border-radius: 2px; height: 6px; }
.tmpl-name { font-size: 10px; font-weight: 600; text-align: center; padding: 4px 0 3px; color: #9A96C0; background: #15132A; border-top: 1px solid rgba(255,255,255,0.07); }
.tmpl-opt.on .tmpl-name { color: #C4BCFF; }

/* Generate area */
.gen-area {
  background: linear-gradient(135deg, rgba(139,127,255,0.16), rgba(167,139,250,0.10));
  border: 1px solid rgba(139,127,255,0.3); border-radius: var(--r);
  padding: 20px; text-align: center; margin-bottom: 14px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
}
.gen-total { font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 700; color: #C4BCFF; letter-spacing: -0.02em; text-shadow: 0 0 20px rgba(139,127,255,0.4); }
.gen-label { font-size: 11px; color: #9A96C0; margin-bottom: 12px; letter-spacing: 0.06em; text-transform: uppercase; }

/* Saved list */
.saved-list { margin-top: 20px; }
.saved-item {
  display: flex; align-items: center; justify-content: space-between;
  background: #1E1C2E; border: 1px solid rgba(255,255,255,0.1); border-radius: var(--r-sm);
  padding: 10px 12px; margin-bottom: 6px; gap: 8px; transition: all 0.15s;
}
.saved-item:hover { border-color: rgba(139,127,255,0.3); background: #252338; }
.s-no { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #C4BCFF; font-weight: 500; }
.s-client { font-size: 11px; color: #7A75A0; margin-top: 2px; }
.s-amt { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: var(--text); white-space: nowrap; }

/* Modal */
.modal-bg {
  position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
  animation: fadeIn 0.15s ease;
}
.modal {
  background: #1A1830; border: 1px solid rgba(139,127,255,0.25); border-radius: 16px;
  padding: 24px; width: 520px; max-width: 100%; max-height: 88vh; overflow-y: auto;
  animation: slideUp 0.2s ease;
  box-shadow: 0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,127,255,0.1);
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
  background: #1A1830; border: 1px solid rgba(139,127,255,0.3); border-radius: var(--r-sm);
  max-height: 180px; overflow-y: auto; margin-top: 2px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.6);
}
.code-opt {
  padding: 8px 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.07);
  transition: background 0.1s; display: flex; justify-content: space-between; align-items: center;
}
.code-opt:last-child { border-bottom: none; }
.code-opt:hover { background: rgba(139,127,255,0.12); }
.code-opt-main { font-size: 12px; color: var(--text); font-weight: 500; }
.code-opt-sub { font-size: 10px; color: #7A75A0; margin-top: 1px; }
.code-badge { font-size: 10px; font-weight: 700; color: #C4BCFF; background: rgba(139,127,255,0.18); padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; }

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
.divider { border: none; border-top: 1px solid rgba(139,127,255,0.15); margin: 4px 0 14px; }

/* Animations */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }

/* Print */
@media print {
  .ig-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}

/* Scrollbar */
.ig-root ::-webkit-scrollbar { width: 4px; height: 4px; }
.ig-root ::-webkit-scrollbar-track { background: #12111F; }
.ig-root ::-webkit-scrollbar-thumb { background: rgba(139,127,255,0.35); border-radius: 10px; }
.code-drop ::-webkit-scrollbar { width: 4px; }
.code-drop ::-webkit-scrollbar-thumb { background: rgba(139,127,255,0.3); border-radius: 10px; }
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

/* ─── Professional Invoice Preview ───────────────────────────── */
function Preview({ inv, items, currency, discPct, taxPct, template, status }) {
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
            {inv.bizEmail && <div style={{ fontSize: 10.5, color: '#5A578A' }}>✉ {inv.bizEmail}</div>}
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
              <tr style={{ borderTop: `1px solid ${accMid}` }}>
                <td style={{ padding: '6px 0 2px', fontWeight: 800, fontSize: 12, color: '#1a1a2e' }}>Amount Due</td>
                <td style={{ padding: '6px 0 2px', textAlign: 'right', fontWeight: 900, fontSize: 14, color: acc, fontFamily: 'monospace' }}>{fmt(total, currency)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div style={{ padding: '24px 32px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: acc }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', width: 28 }}>#</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Description</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', width: 70 }}>HSN/SAC</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', width: 40 }}>Qty</th>
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
  const gstTotal = items.reduce((s, i) => s + (i.qty||0)*(parseFloat(i.rate)||0)*((i.gstRate||0)/100), 0)
  const tax = gstTotal
  const total = sub - disc + gstTotal

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
    printInvoice()
  }

  const printInvoice = () => {
    const el = document.getElementById('ig-print-zone')
    if (!el) return
    const t = TEMPLATES.find(t => t.key === template) || TEMPLATES[0]
    const acc = t.accent
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${invNo}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 210mm;
      min-height: 297mm;
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #fff;
      color: #1a1a2e;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
    }
    body { padding: 0; }
    .invoice-wrap {
      width: 210mm;
      min-height: 297mm;
      background: #fff;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    @media print {
      @page {
        size: A4 portrait;
        margin: 0;
      }
      html, body { margin: 0; padding: 0; }
      .invoice-wrap { page-break-after: avoid; }
    }
    table { border-collapse: collapse; }
    .mono { font-family: 'Courier New', monospace; }
  </style>
</head>
<body>
  <div class="invoice-wrap">
    ${el.innerHTML}
  </div>
</body>
</html>`)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 900)
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
                  {it.hsnSac && (
                    <div style={{ marginTop: 3, fontSize: 10, color: '#9A96C0' }}>
                      GST: <span style={{ color: '#C4BCFF', fontWeight: 700 }}>{it.gstRate}%</span>
                      {' '}· {it.type === 'goods' ? 'HSN' : 'SAC'}: <span style={{ color: '#C4BCFF', fontWeight: 700 }}>{it.hsnSac}</span>
                    </div>
                  )}
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
                {/* Remove */}
                <div style={{ paddingTop: 8 }}>
                  <button className="btn btn-icon btn-ghost btn-sm" onClick={() => removeItem(it.id)}
                    style={{ color: 'var(--red)', fontSize: 16, lineHeight: 1 }}>×</button>
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="totals">
              <div className="t-row"><span>Subtotal (excl. GST)</span><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(sub, currency)}</span></div>
              <div className="t-row">
                <span>Discount <input type="number" min="0" max="100" value={discPct} onChange={e => setDiscPct(+e.target.value)} className="pct-inp" />%</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: discPct > 0 ? 'var(--green)' : 'var(--text3)' }}>−{fmt(disc, currency)}</span>
              </div>
              <div className="t-row">
                <span>GST (as per HSN/SAC)</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(gstTotal, currency)}</span>
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
