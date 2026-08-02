# Zerofy Invoice Generator — Bug Fix Package

## How to apply
1. Copy the `src/` files in this package into your `ZEROFY` repo at the same
   paths, overwriting the existing ones (2 files are brand new):
   - `src/pages/tools/InvoiceMaker.jsx` (modified)
   - `src/pages/dashboard/DashboardHome.jsx` (modified)
   - `src/pages/dashboard/DashboardHome.module.css` (modified)
   - `src/components/invoice/InvoicePreview.jsx` (**new**)
   - `src/utils/invoiceShare.js` (**new**)
2. Merge `package.json`'s two new dependencies into your repo's `package.json`:
   - `jspdf`
   - `html2canvas`
3. Run `npm install` then `npm run build` (or `npm run dev`) as usual.

`CHANGES.diff` has the full unified diff for the modified files if you'd
rather review/apply it with `git apply`.

## What was fixed (maps to your numbered list)

**1) Business details gayab ho jaate the after navigating back**
Business details typed directly into the "From (Your Business)" form were
never actually saved anywhere — they only got remembered if you explicitly
used the "🏢 Businesses → + Add" flow. Now, every time you hit **Generate &
Print**, the business you typed is auto saved/updated in your businesses
list (matched by name), and set as the "last used" business — so it's
there the next time you open Invoice Generator.

**2) Removed the "Preview PDF" button**
Only **Generate & Print** remains next to Live Preview.

**3) Preview / WhatsApp / Email were all doing the same thing**
Root cause: WhatsApp/Email used to grab whatever invoice preview happened
to already be open in the page (often the current draft, not the invoice
you actually clicked). They now render the *exact* invoice you clicked,
independent of what's on screen — via a new shared
`renderInvoiceMarkup(inv)` helper.
- **Preview** → just opens the preview modal, nothing else.
- **WhatsApp / Email** → generate a real PDF and use the Web Share API to
  auto-attach it when the browser/device supports it (this is the only way
  a browser can auto-attach a file into WhatsApp/Mail — there's no API to
  push a file into `wa.me` or `mailto:` links directly). Where Web Share
  isn't available (mostly desktop), it falls back to downloading the PDF
  and opening WhatsApp/Mail with the message pre-filled, same as before.

**4) Next tab (print window) made the app feel stuck**
`Generate & Print` no longer waits for the print tab/dialog — it fires the
print tab in the background and immediately continues in the main tab.

**5) Removed the "Generate New Invoice / Edit This Invoice" modal**
`Generate & Print` now redirects straight to the Dashboard (`/app`) right
after saving + opening the print tab. No modal in the way.

**6) Dashboard's Recent Invoices now have Preview/WhatsApp/Email actions**
Each row in the Dashboard's Recent Invoices table now has 👁 Preview, 💬
WhatsApp and ✉️ Email buttons, using the same shared logic as the Invoice
Generator page, so you can reprint or reshare an already-generated invoice
straight from the dashboard.

## Note on the "auto-attachment" for WhatsApp/Email
Browsers don't let a webpage push a file into WhatsApp Web or a mail app
through `wa.me`/`mailto:` links — that's a platform limitation, not
something Zerofy can code around. The Web Share API (`navigator.share`)
is the only browser-native way to hand a real file to another app, and
it only works when the browser/OS combination supports sharing files
(most mobile browsers; some desktop browsers on Windows 11/macOS). I
added real client-side PDF generation (via `jspdf` + `html2canvas`) so
that whenever Web Share is available, the PDF is genuinely attached —
otherwise it falls back to "download + open app with message" like
before.
