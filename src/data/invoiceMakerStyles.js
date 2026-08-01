export const CSS = `
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
  color: #A78BFA; letter-spacing: 0.04em; margin-bottom: 0;
}
.inv-no input {
  background: transparent; border: none; outline: none; color: #A78BFA;
  font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 500;
  width: 140px; letter-spacing: 0.04em;
}

/* Items table */
.items-head {
  display: grid; grid-template-columns: 88px minmax(140px,1fr) 110px 88px 80px 64px 88px 90px 32px;
  gap: 6px; padding: 0 4px 8px; border-bottom: 2px solid rgba(139,127,255,0.3);
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9A96C0;
}
.item-row {
  display: grid; grid-template-columns: 88px minmax(140px,1fr) 110px 88px 80px 64px 88px 90px 32px;
  gap: 6px; align-items: start; margin-top: 8px; animation: fadeIn 0.2s ease;
  padding: 6px 4px; border-bottom: 1px solid rgba(255,255,255,0.06); border-radius: 6px;
  transition: background 0.12s;
}
.gst-rate-wrap { position: relative; }
.gst-rate-wrap select { width: 100%; }
.gst-manual-inp {
  width: 100%; margin-top: 3px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(139,127,255,0.35);
  border-radius: 6px; padding: 5px 7px;
  color: var(--accent); font-size: 12px; font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
}
.gst-manual-inp:focus { outline: none; border-color: var(--accent); }
.item-row:hover { background: rgba(139,127,255,0.06); }
@media (max-width: 700px) {
  .items-head { display: none; }
  .item-row { grid-template-columns: 1fr 1fr; }
  .gst-rate-wrap { grid-column: span 2; }
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
  max-height: 260px; overflow-y: auto; margin-top: 2px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.6); min-width: 320px;
}
.code-opt {
  padding: 8px 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.07);
  transition: background 0.1s; display: flex; justify-content: space-between; align-items: center;
}
.code-opt:last-child { border-bottom: none; }
.code-opt:hover { background: rgba(139,127,255,0.12); }
.code-opt-code { font-size: 13px; color: var(--accent); font-weight: 700; font-family: 'JetBrains Mono', monospace; margin-bottom: 1px; }
.code-opt-main { font-size: 11px; color: var(--text2); font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
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
