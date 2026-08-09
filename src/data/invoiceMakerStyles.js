export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

.ig-root {
  /* Colors mirror the site-wide dark theme (see index.css --bg/--accent/--purple)
     so this tool looks like part of Zerofy, not a bolted-on page. */
  --bg: var(--bg, #0A0A12);
  --card: rgba(255,255,255,0.045);
  --card2: rgba(255,255,255,0.075);
  --border: rgba(255,255,255,0.10);
  --border2: rgba(255,255,255,0.22);
  --text: var(--text, #FFFFFF);
  --text2: var(--text2, #A0A8B8);
  --text3: var(--text3, #7c8494);
  --accent: var(--accent, #63b3ed);
  --accent2: var(--purple, #9f7aea);
  --accent-dim: rgba(99,179,237,0.16);
  --accent-glow: rgba(99,179,237,0.35);
  --grad: var(--grad, linear-gradient(135deg, #63b3ed 0%, #9f7aea 100%));
  --green: #34D399;
  --red: #F87171;
  --yellow: #FBBF24;
  --blue: #38BDF8;
  --r: 14px;
  --r-sm: 9px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: var(--text);
  min-height: 100vh;
  background:
    radial-gradient(circle at 15% 0%, rgba(99,179,237,0.10) 0%, transparent 45%),
    radial-gradient(circle at 90% 10%, rgba(159,122,234,0.08) 0%, transparent 45%),
    var(--bg);
  padding-bottom: 60px;
}
.ig-root * { box-sizing: border-box; }

/* Header — sticky glass bar, same treatment as the main site nav */
.ig-top {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 28px;
  background: rgba(10,10,18,0.82);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(99,179,237,0.14);
  gap: 12px; flex-wrap: wrap;
  position: sticky; top: 0; z-index: 40;
}
.ig-brand { display: flex; align-items: center; gap: 12px; }
.ig-icon {
  width: 40px; height: 40px; border-radius: 11px;
  background: var(--grad);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; box-shadow: 0 0 20px var(--accent-glow);
}
.ig-name { font-size: 17px; font-weight: 700; color: var(--text); letter-spacing: -0.02em; }
.ig-sub { font-size: 11px; color: var(--text3); margin-top: 1px; }
.ig-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

/* Centered container — matches the ~1280px max-width used across the rest of Zerofy */
.ig-container { max-width: 1360px; margin: 0 auto; padding: 0 24px; }

/* Buttons */
.btn {
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 600;
  padding: 8px 16px; border-radius: var(--r-sm); border: 1px solid rgba(255,255,255,0.18);
  background: #181A26; color: var(--text2); cursor: pointer; transition: all 0.15s;
  display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
}
.btn:hover { background: #1E212F; border-color: rgba(255,255,255,0.28); color: var(--text); }
.btn-accent {
  background: linear-gradient(135deg, #63b3ed, #9f7aea);
  border-color: transparent; color: #fff;
  box-shadow: 0 4px 18px rgba(99,179,237,0.45);
}
.btn-accent:hover { opacity: 0.88; color: #fff; box-shadow: 0 6px 24px rgba(99,179,237,0.55); }
.btn-green { background: rgba(52,211,153,0.15); border-color: rgba(52,211,153,0.35); color: var(--green); }
.btn-green:hover { background: rgba(52,211,153,0.25); }
.btn-sm { padding: 6px 12px; font-size: 12px; }
.btn-icon { padding: 7px 8px; }
.btn-ghost { background: transparent; border-color: transparent; color: var(--text3); }
.btn-ghost:hover { background: #181A26; color: var(--text); border-color: rgba(255,255,255,0.14); }

/* Main layout — centered, generous columns so the preview isn't squeezed */
.ig-layout {
  display: grid; grid-template-columns: minmax(0,1fr) minmax(400px, 560px);
  gap: 28px; max-width: 1360px; margin: 0 auto; padding: 24px 24px 0;
  align-items: start;
}
@media (max-width: 1050px) { .ig-layout { grid-template-columns: 1fr; gap: 20px; } }

.ig-left { padding: 0; }
.ig-right { padding: 0; }

/* Section heading */
.sec-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  color: #A0A8B8; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
}
.sec-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); flex-shrink: 0; box-shadow: 0 0 6px var(--accent-glow); }

/* Two-col */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
@media (max-width: 640px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }

/* Card — same glass-on-dark treatment used across the rest of Zerofy */
.ig-card {
  background: rgba(255,255,255,0.035);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: var(--r); padding: 20px; margin-bottom: 16px;
  transition: border-color 0.2s, background 0.2s;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.2);
}
.ig-card:focus-within { border-color: rgba(99,179,237,0.4); background: rgba(255,255,255,0.05); }

/* Form fields */
.field { margin-bottom: 10px; }
.field:last-child { margin-bottom: 0; }
.lbl { font-size: 11px; font-weight: 600; color: var(--text3); letter-spacing: 0.04em; text-transform: uppercase; display: block; margin-bottom: 4px; }
.inp {
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px;
  background: #181A26; color: var(--text); border: 1px solid rgba(255,255,255,0.14);
  border-radius: var(--r-sm); padding: 9px 12px; width: 100%; outline: none; transition: all 0.15s;
}
.inp:hover { border-color: rgba(255,255,255,0.26); }
.inp:focus { border-color: var(--accent); background: rgba(99,179,237,0.1); box-shadow: 0 0 0 3px rgba(99,179,237,0.12); }
.inp::placeholder { color: #5b6272; opacity: 1; }
.inp[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
textarea.inp { resize: vertical; min-height: 60px; line-height: 1.5; }
select.inp { cursor: pointer; color-scheme: dark; }
select.inp option { background: #181A26; color: #F0EEFF; }

/* Field-level validation */
.inp-err { border-color: rgba(248,113,113,0.6) !important; background: rgba(248,113,113,0.06); }
.inp-err:focus { box-shadow: 0 0 0 3px rgba(248,113,113,0.15) !important; }
.field-err { font-size: 10.5px; color: #F87171; margin-top: 4px; line-height: 1.4; }

/* Biz pills */
.biz-pills { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
.biz-pill {
  font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.18); background: #181A26; color: #9aa0b4;
  cursor: pointer; transition: all 0.15s;
}
.biz-pill:hover { color: var(--text); background: #1E212F; border-color: rgba(255,255,255,0.28); }
.biz-pill.on { background: rgba(99,179,237,0.2); border-color: rgba(99,179,237,0.5); color: #b794f4; }

/* Invoice number chip */
.inv-no {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--accent-dim); border: 1px solid rgba(99,179,237,0.3);
  border-radius: var(--r-sm); padding: 8px 14px;
  font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 500;
  color: #9f7aea; letter-spacing: 0.04em; margin-bottom: 0;
}
.inv-no input {
  background: transparent; border: none; outline: none; color: #9f7aea;
  font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 500;
  width: 140px; letter-spacing: 0.04em;
}

/* Items table */
.items-head {
  display: grid; grid-template-columns: 88px minmax(140px,1fr) 110px 88px 80px 64px 88px 90px 32px;
  gap: 6px; padding: 0 4px 8px; border-bottom: 2px solid rgba(99,179,237,0.3);
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #A0A8B8;
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
  border: 1px solid rgba(99,179,237,0.35);
  border-radius: 6px; padding: 5px 7px;
  color: var(--accent); font-size: 12px; font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
}
.gst-manual-inp:focus { outline: none; border-color: var(--accent); }
.item-row:hover { background: rgba(99,179,237,0.06); }
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
.t-row.grand { background: rgba(99,179,237,0.12); border: 1px solid rgba(99,179,237,0.25); border-radius: 10px; margin-top: 12px; padding: 12px 14px; font-size: 20px; font-weight: 700; color: var(--text); }
.t-row.grand span:last-child { color: #b794f4; font-family: 'JetBrains Mono', monospace; }
.pct-inp {
  font-family: 'JetBrains Mono', monospace; font-size: 12px; background: #181A26;
  border: 1px solid rgba(255,255,255,0.14); border-radius: 5px; padding: 2px 6px; width: 48px;
  color: var(--text2); outline: none; text-align: center;
}
.pct-inp:focus { border-color: var(--accent); }

/* Right panel */
.preview-panel { position: sticky; top: 88px; }

/* Framed card that holds the white invoice preview — gives it real presence
   instead of a cramped strip pinned to the sidebar edge. */
.prev-frame {
  background: rgba(255,255,255,0.035);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 18px;
  padding: 16px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 28px rgba(0,0,0,0.25);
}
.prev-box {
  background: #fff; border-radius: 10px; overflow: hidden;
  box-shadow: 0 12px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(99,179,237,0.18);
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #1a1a2e;
  min-height: 560px;
  width: 100%;
  transform-origin: top left;
}
@media (max-width: 1050px) { .preview-panel { position: static; } }

/* Template thumbs */
.tmpl-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.tmpl-opt {
  flex: 1; min-width: 64px; cursor: pointer; border: 2px solid rgba(255,255,255,0.12);
  border-radius: var(--r-sm); overflow: hidden; background: #13131F; transition: all 0.15s;
  padding: 0;
}
.tmpl-opt:hover { border-color: rgba(99,179,237,0.35); background: #181A26; }
.tmpl-opt.on { border-color: var(--accent); box-shadow: 0 0 14px rgba(99,179,237,0.4); }
.tmpl-thumb { height: 44px; display: flex; flex-direction: column; padding: 5px 6px; gap: 3px; }
.t-bar { border-radius: 2px; height: 6px; }
.tmpl-name { font-size: 10px; font-weight: 600; text-align: center; padding: 4px 0 3px; color: #A0A8B8; background: #0F0F1A; border-top: 1px solid rgba(255,255,255,0.07); }
.tmpl-opt.on .tmpl-name { color: #b794f4; }

/* Generate area */
.gen-area {
  background: linear-gradient(135deg, rgba(99,179,237,0.16), rgba(159,122,234,0.10));
  border: 1px solid rgba(99,179,237,0.3); border-radius: var(--r);
  padding: 20px; text-align: center; margin-bottom: 14px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
}
.gen-total { font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 700; color: #b794f4; letter-spacing: -0.02em; text-shadow: 0 0 20px rgba(99,179,237,0.4); }
.gen-label { font-size: 11px; color: #A0A8B8; margin-bottom: 12px; letter-spacing: 0.06em; text-transform: uppercase; }

/* Saved list */
.saved-list { margin-top: 20px; }
.saved-item {
  display: flex; align-items: center; justify-content: space-between;
  background: #13131F; border: 1px solid rgba(255,255,255,0.1); border-radius: var(--r-sm);
  padding: 10px 12px; margin-bottom: 6px; gap: 8px; transition: all 0.15s;
}
.saved-item:hover { border-color: rgba(99,179,237,0.3); background: #181A26; }
.s-no { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #b794f4; font-weight: 500; }
.s-client { font-size: 11px; color: #7c8494; margin-top: 2px; }
.s-amt { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: var(--text); white-space: nowrap; }

/* Modal */
.modal-bg {
  position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
  animation: fadeIn 0.15s ease;
}
.modal {
  background: #0F0F1A; border: 1px solid rgba(99,179,237,0.25); border-radius: 16px;
  padding: 24px; width: 520px; max-width: 100%; max-height: 88vh; overflow-y: auto;
  animation: slideUp 0.2s ease;
  box-shadow: 0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,179,237,0.1);
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
  background: #0F0F1A; border: 1px solid rgba(99,179,237,0.3); border-radius: var(--r-sm);
  max-height: 260px; overflow-y: auto; margin-top: 2px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.6); min-width: 320px;
}
.code-opt {
  padding: 8px 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.07);
  transition: background 0.1s; display: flex; justify-content: space-between; align-items: center;
}
.code-opt:last-child { border-bottom: none; }
.code-opt:hover { background: rgba(99,179,237,0.12); }
.code-opt-code { font-size: 13px; color: var(--accent); font-weight: 700; font-family: 'JetBrains Mono', monospace; margin-bottom: 1px; }
.code-opt-main { font-size: 11px; color: var(--text2); font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
.code-opt-sub { font-size: 10px; color: #7c8494; margin-top: 1px; }
.code-badge { font-size: 10px; font-weight: 700; color: #b794f4; background: rgba(99,179,237,0.18); padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; }

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
.divider { border: none; border-top: 1px solid rgba(99,179,237,0.15); margin: 4px 0 14px; }

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
.ig-root ::-webkit-scrollbar-thumb { background: rgba(99,179,237,0.35); border-radius: 10px; }
.code-drop ::-webkit-scrollbar { width: 4px; }
.code-drop ::-webkit-scrollbar-thumb { background: rgba(99,179,237,0.3); border-radius: 10px; }
`
