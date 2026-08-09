export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.ig-root {
  /* Same paper/ink/saffron/green palette used across the Zerofy dashboard,
     so this tool reads as part of the app instead of a bolted-on dark page. */
  --bg: #F7F3EA;
  --card: #FFFFFF;
  --card2: #F3EEE0;
  --border: #E1D9C4;
  --border2: #D6CBA8;
  --text: #1B2340;
  --text2: #4B5566;
  --text3: #8890A6;
  --accent: #E8933C;
  --accent-deep: #C97423;
  --accent2: #1F6F54;
  --accent-dim: rgba(232,147,60,0.12);
  --accent-glow: rgba(232,147,60,0.35);
  --grad: linear-gradient(135deg, #E8933C 0%, #C97423 100%);
  --green: #1F6F54;
  --red: #C1443C;
  --yellow: #C97423;
  --blue: #1F6F54;
  --r: 14px;
  --r-sm: 9px;
  font-family: 'Inter', sans-serif;
  color: var(--text);
  background:
    radial-gradient(circle at 15% 0%, rgba(232,147,60,0.07) 0%, transparent 45%),
    radial-gradient(circle at 90% 10%, rgba(31,111,84,0.06) 0%, transparent 45%),
    var(--bg);
  /* Fills exactly the space below the site navbar (60px) so the tool itself
     never causes the whole page to scroll — the form and preview panels
     below scroll independently instead. On small screens this collapses
     back to normal document flow (see media query at the bottom). */
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.ig-root * { box-sizing: border-box; }

/* Header — one compact row: back + breadcrumb + brand + actions.
   Translucent + blurred so the paper background behind shows through,
   matching the rest of the page instead of sitting on top as a flat strip. */
.ig-top {
  background: rgba(247,243,234,0.9);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
/* Same max-width + centering as .ig-layout below, so the back button lines
   up with the left panel's edge and the actions line up with the right
   panel's edge — the header and body read as one aligned column, not two
   independently-centered strips. */
.ig-top-inner {
  display: flex; align-items: center; justify-content: space-between;
  max-width: 1600px; width: 100%; margin: 0 auto;
  padding: 10px 24px;
  gap: 12px; flex-wrap: wrap;
}
.ig-top-left { display: flex; align-items: center; gap: 12px; min-width: 0; flex-wrap: wrap; }
.ig-back {
  display: inline-flex; align-items: center; gap: 4px;
  font-family: inherit; font-size: 12.5px; font-weight: 600;
  padding: 6px 12px 6px 9px; border-radius: 100px;
  border: 1px solid var(--border2); background: #fff;
  color: var(--text2); cursor: pointer; white-space: nowrap; transition: all 0.15s;
}
.ig-back:hover { background: var(--accent-dim); border-color: var(--accent); color: var(--accent-deep); }
.ig-crumb { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--text3); white-space: nowrap; }
.ig-crumb-sep { color: rgba(27,35,64,0.22); }
.ig-crumb-cur { color: var(--text2); }
.ig-vsep { width: 1px; height: 22px; background: var(--border); flex-shrink: 0; }
.ig-brand { display: flex; align-items: center; gap: 10px; }
.ig-icon {
  width: 34px; height: 34px; border-radius: 9px;
  background: var(--grad);
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; box-shadow: 0 4px 14px rgba(232,147,60,0.35); flex-shrink: 0;
}
.ig-name { font-family: 'Space Grotesk', sans-serif; font-size: 14.5px; font-weight: 700; color: var(--text); letter-spacing: -0.02em; line-height: 1.2; }
.ig-sub { font-size: 10px; color: var(--text3); margin-top: 1px; }
.ig-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
@media (max-width: 1050px) {
  .ig-root { height: auto; min-height: calc(100vh - 60px); overflow: visible; }
}
@media (max-width: 640px) {
  .ig-vsep, .ig-sub { display: none; }
}

/* Centered container — matches the ~1280px max-width used across the rest of Zerofy */
.ig-container { max-width: 1360px; margin: 0 auto; padding: 0 24px; }

/* Buttons */
.btn {
  font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
  padding: 8px 16px; border-radius: var(--r-sm); border: 1px solid var(--border);
  background: #fff; color: var(--text2); cursor: pointer; transition: all 0.15s;
  display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
}
.btn:hover { background: var(--card2); border-color: var(--border2); color: var(--text); }
.btn-accent {
  background: var(--grad);
  border-color: transparent; color: #fff;
  box-shadow: 0 4px 16px rgba(232,147,60,0.4);
}
.btn-accent:hover { opacity: 0.92; color: #fff; box-shadow: 0 6px 22px rgba(232,147,60,0.5); }
.btn-green { background: rgba(31,111,84,0.1); border-color: rgba(31,111,84,0.3); color: var(--green); }
.btn-green:hover { background: rgba(31,111,84,0.18); }
.btn-sm { padding: 6px 12px; font-size: 12px; }
.btn-icon { padding: 7px 8px; }
.btn-ghost { background: transparent; border-color: transparent; color: var(--text3); }
.btn-ghost:hover { background: var(--card2); color: var(--text); border-color: var(--border); }

/* Main layout — fills the remaining viewport height below the header.
   Left (form) and right (preview) panels each get their own scrollbar via
   min-height:0, so the page itself is fixed and only the panel you're
   working in scrolls — the live preview stays on screen the whole time. */
.ig-layout {
  flex: 1; min-height: 0;
  display: grid; grid-template-columns: minmax(0,1fr) minmax(360px, 480px);
  grid-template-rows: minmax(0, 1fr);
  gap: 24px; max-width: 1600px; width: 100%; margin: 0 auto;
  padding: 18px 24px; align-items: stretch;
  overflow: hidden;
}
@media (max-width: 1050px) {
  .ig-layout { grid-template-columns: 1fr; grid-template-rows: none; gap: 20px; overflow: visible; height: auto; padding: 18px 16px 32px; }
}

.ig-left {
  padding: 0 8px 4px 0; margin-right: -8px;
  overflow-y: auto; min-height: 0;
}
.ig-right {
  padding: 0 4px 4px 0; margin-right: -4px;
  overflow-y: auto; min-height: 0;
}
@media (max-width: 1050px) {
  .ig-left, .ig-right { overflow: visible; height: auto; padding: 0; margin: 0; }
}

/* Section heading */
.sec-label {
  font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--text3); margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
}
.sec-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); flex-shrink: 0; box-shadow: 0 0 6px var(--accent-glow); }

/* Two-col */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
@media (max-width: 640px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }

/* Card — same paper card treatment used across the rest of Zerofy */
.ig-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--r); padding: 20px; margin-bottom: 16px;
  transition: border-color 0.2s, background 0.2s;
  box-shadow: 0 1px 0 rgba(27,35,64,0.03), 0 4px 16px rgba(27,35,64,0.05);
}
.ig-card:focus-within { border-color: rgba(232,147,60,0.45); background: #fff; }

/* Form fields */
.field { margin-bottom: 10px; }
.field:last-child { margin-bottom: 0; }
.lbl { font-size: 11px; font-weight: 600; color: var(--text3); letter-spacing: 0.04em; text-transform: uppercase; display: block; margin-bottom: 4px; }
.inp {
  font-family: 'Inter', sans-serif; font-size: 13px;
  background: #fff; color: var(--text); border: 1px solid var(--border);
  border-radius: var(--r-sm); padding: 9px 12px; width: 100%; outline: none; transition: all 0.15s;
}
.inp:hover { border-color: var(--border2); }
.inp:focus { border-color: var(--accent); background: rgba(232,147,60,0.04); box-shadow: 0 0 0 3px rgba(232,147,60,0.12); }
.inp::placeholder { color: #A9AFC0; opacity: 1; }
.inp[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
textarea.inp { resize: vertical; min-height: 60px; line-height: 1.5; }
select.inp { cursor: pointer; color-scheme: light; }
select.inp option { background: #fff; color: var(--text); }

/* Field-level validation */
.inp-err { border-color: rgba(193,68,60,0.55) !important; background: rgba(193,68,60,0.05); }
.inp-err:focus { box-shadow: 0 0 0 3px rgba(193,68,60,0.15) !important; }
.field-err { font-size: 10.5px; color: var(--red); margin-top: 4px; line-height: 1.4; }

/* Biz pills */
.biz-pills { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
.biz-pill {
  font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 20px;
  border: 1px solid var(--border); background: #fff; color: var(--text2);
  cursor: pointer; transition: all 0.15s;
}
.biz-pill:hover { color: var(--text); background: var(--card2); border-color: var(--border2); }
.biz-pill.on { background: var(--accent-dim); border-color: rgba(232,147,60,0.5); color: var(--accent-deep); }

/* Invoice number chip */
.inv-no {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--accent-dim); border: 1px solid rgba(232,147,60,0.3);
  border-radius: var(--r-sm); padding: 8px 14px;
  font-family: 'IBM Plex Mono', monospace; font-size: 14px; font-weight: 500;
  color: var(--accent-deep); letter-spacing: 0.04em; margin-bottom: 0;
}
.inv-no input {
  background: transparent; border: none; outline: none; color: var(--accent-deep);
  font-family: 'IBM Plex Mono', monospace; font-size: 14px; font-weight: 500;
  width: 140px; letter-spacing: 0.04em;
}

/* Items table — proportional (fr-based) columns instead of fixed pixel
   widths, so the row compresses smoothly as the left panel narrows (e.g.
   at higher browser zoom) instead of overflowing and getting clipped. The
   card below still has overflow-x:auto as a last-resort fallback. */
.items-head {
  display: grid;
  grid-template-columns: minmax(58px,0.65fr) minmax(120px,1.8fr) minmax(78px,1fr) minmax(60px,0.7fr) minmax(54px,0.65fr) minmax(42px,0.5fr) minmax(58px,0.75fr) minmax(62px,0.8fr) 24px;
  gap: 5px; padding: 0 4px 8px; border-bottom: 2px solid rgba(232,147,60,0.3);
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text3);
}
.item-row {
  display: grid;
  grid-template-columns: minmax(58px,0.65fr) minmax(120px,1.8fr) minmax(78px,1fr) minmax(60px,0.7fr) minmax(54px,0.65fr) minmax(42px,0.5fr) minmax(58px,0.75fr) minmax(62px,0.8fr) 24px;
  gap: 5px; align-items: start; margin-top: 8px; animation: fadeIn 0.2s ease;
  padding: 6px 4px; border-bottom: 1px solid var(--border); border-radius: 6px;
  transition: background 0.12s;
}
.gst-rate-wrap { position: relative; }
.gst-rate-wrap select { width: 100%; }
.gst-manual-inp {
  width: 100%; margin-top: 3px;
  background: rgba(232,147,60,0.06);
  border: 1px solid rgba(232,147,60,0.35);
  border-radius: 6px; padding: 5px 7px;
  color: var(--accent-deep); font-size: 12px; font-weight: 700;
  font-family: 'IBM Plex Mono', monospace;
}
.gst-manual-inp:focus { outline: none; border-color: var(--accent); }
.item-row:hover { background: rgba(232,147,60,0.05); }
@media (max-width: 700px) {
  .items-head { display: none; }
  .item-row { grid-template-columns: 1fr 1fr; }
  .gst-rate-wrap { grid-column: span 2; }
}
.item-amt {
  font-family: 'IBM Plex Mono', monospace; font-size: 13px; font-weight: 600;
  color: var(--text); text-align: right; padding-top: 9px;
}
.type-badge {
  font-size: 10px; font-weight: 700; padding: 3px 7px; border-radius: 5px;
  display: inline-block; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 11px;
}
.type-goods { background: rgba(201,116,35,0.14); color: var(--accent-deep); }
.type-service { background: rgba(31,111,84,0.14); color: var(--green); }

/* Totals */
.totals { border-top: 1px solid var(--border); margin-top: 16px; padding-top: 14px; }
.t-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; font-size: 13px; color: var(--text2); }
.t-row.grand { background: var(--accent-dim); border: 1px solid rgba(232,147,60,0.25); border-radius: 10px; margin-top: 12px; padding: 12px 14px; font-size: 20px; font-weight: 700; color: var(--text); }
.t-row.grand span:last-child { color: var(--accent-deep); font-family: 'IBM Plex Mono', monospace; }
.pct-inp {
  font-family: 'IBM Plex Mono', monospace; font-size: 12px; background: #fff;
  border: 1px solid var(--border); border-radius: 5px; padding: 2px 6px; width: 48px;
  color: var(--text2); outline: none; text-align: center;
}
.pct-inp:focus { border-color: var(--accent); }

/* Right panel — lives inside .ig-right which already scrolls on its own,
   so this no longer needs to be sticky against the page. */
.preview-panel { position: static; }

/* Framed card that holds the white invoice preview — gives it real presence
   instead of a cramped strip pinned to the sidebar edge. */
.prev-frame {
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 1px 0 rgba(27,35,64,0.03), 0 8px 24px rgba(27,35,64,0.06);
}
.prev-box {
  background: #fff; border-radius: 10px; overflow: hidden;
  box-shadow: 0 12px 40px rgba(27,35,64,0.16), 0 0 0 1px var(--border);
  font-family: 'Inter', sans-serif; font-size: 12px; color: #1a1a2e;
  min-height: 560px;
  width: 100%;
  transform-origin: top left;
}
/* Template thumbs */
.tmpl-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.tmpl-opt {
  flex: 1; min-width: 64px; cursor: pointer; border: 2px solid var(--border);
  border-radius: var(--r-sm); overflow: hidden; background: var(--card2); transition: all 0.15s;
  padding: 0;
}
.tmpl-opt:hover { border-color: rgba(232,147,60,0.4); background: #fff; }
.tmpl-opt.on { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(232,147,60,0.18); }
.tmpl-thumb { height: 44px; display: flex; flex-direction: column; padding: 5px 6px; gap: 3px; }
.t-bar { border-radius: 2px; height: 6px; }
.tmpl-name { font-size: 10px; font-weight: 600; text-align: center; padding: 4px 0 3px; color: var(--text3); background: #fff; border-top: 1px solid var(--border); }
.tmpl-opt.on .tmpl-name { color: var(--accent-deep); }

/* Generate area */
.gen-area {
  background: linear-gradient(135deg, rgba(232,147,60,0.14), rgba(31,111,84,0.08));
  border: 1px solid rgba(232,147,60,0.3); border-radius: var(--r);
  padding: 20px; text-align: center; margin-bottom: 14px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.5);
}
.gen-total { font-family: 'IBM Plex Mono', monospace; font-size: 28px; font-weight: 700; color: var(--accent-deep); letter-spacing: -0.02em; }
.gen-label { font-size: 11px; color: var(--text3); margin-bottom: 12px; letter-spacing: 0.06em; text-transform: uppercase; }

/* Saved list */
.saved-list { margin-top: 20px; }
.saved-item {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; border: 1px solid var(--border); border-radius: var(--r-sm);
  padding: 10px 12px; margin-bottom: 6px; gap: 8px; transition: all 0.15s;
}
.saved-item:hover { border-color: rgba(232,147,60,0.35); background: var(--card2); }
.s-no { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--accent-deep); font-weight: 500; }
.s-client { font-size: 11px; color: var(--text3); margin-top: 2px; }
.s-amt { font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 600; color: var(--text); white-space: nowrap; }

/* Modal */
.modal-bg {
  position: fixed; inset: 0; background: rgba(27,35,64,0.45); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
  animation: fadeIn 0.15s ease;
}
.modal {
  background: #fff; border: 1px solid var(--border); border-radius: 16px;
  padding: 24px; width: 520px; max-width: 100%; max-height: 88vh; overflow-y: auto;
  animation: slideUp 0.2s ease;
  box-shadow: 0 24px 60px rgba(27,35,64,0.22), 0 0 0 1px rgba(27,35,64,0.04);
}
.modal-h { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-title { font-family: 'Space Grotesk', sans-serif; font-size: 17px; font-weight: 700; }

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
  background: #fff; border: 1px solid rgba(232,147,60,0.3); border-radius: var(--r-sm);
  max-height: 260px; overflow-y: auto; margin-top: 2px;
  box-shadow: 0 10px 30px rgba(27,35,64,0.18); min-width: 320px;
}
.code-opt {
  padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--border);
  transition: background 0.1s; display: flex; justify-content: space-between; align-items: center;
}
.code-opt:last-child { border-bottom: none; }
.code-opt:hover { background: rgba(232,147,60,0.08); }
.code-opt-code { font-size: 13px; color: var(--accent-deep); font-weight: 700; font-family: 'IBM Plex Mono', monospace; margin-bottom: 1px; }
.code-opt-main { font-size: 11px; color: var(--text2); font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
.code-opt-sub { font-size: 10px; color: var(--text3); margin-top: 1px; }
.code-badge { font-size: 10px; font-weight: 700; color: var(--accent-deep); background: rgba(232,147,60,0.16); padding: 2px 6px; border-radius: 4px; font-family: 'IBM Plex Mono', monospace; }

/* Print preview */
.print-prev { padding: 28px; background: #fff; color: #1a1a2e; min-height: 500px; }
.prev-h { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; }
.prev-biz { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
.prev-no { font-family: 'IBM Plex Mono', monospace; font-size: 13px; font-weight: 600; }
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
.ig-root ::-webkit-scrollbar-track { background: var(--card2); }
.ig-root ::-webkit-scrollbar-thumb { background: rgba(232,147,60,0.4); border-radius: 10px; }
.code-drop ::-webkit-scrollbar { width: 4px; }
.code-drop ::-webkit-scrollbar-thumb { background: rgba(232,147,60,0.35); border-radius: 10px; }
`
