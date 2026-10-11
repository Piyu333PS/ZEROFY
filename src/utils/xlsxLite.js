// A very small Excel (.xlsx) writer: several sheets of plain text and numbers, nothing else.
// An .xlsx file is a zip of a few XML files; they are stored without compression, so no library is needed.

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 }
  return t
})()
const crc32 = (bytes) => { let c = 0xFFFFFFFF; for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0 }

function zip(files) {
  const enc = new TextEncoder()
  const parts = [], central = []
  let offset = 0
  for (const f of files) {
    const name = enc.encode(f.name), data = enc.encode(f.text), crc = crc32(data)
    const head = new DataView(new ArrayBuffer(30))
    head.setUint32(0, 0x04034b50, true); head.setUint16(4, 20, true); head.setUint16(6, 0x0800, true); head.setUint16(8, 0, true)
    head.setUint16(10, 0, true); head.setUint16(12, 0x21, true)   // fixed date: 1 Jan 1980
    head.setUint32(14, crc, true); head.setUint32(18, data.length, true); head.setUint32(22, data.length, true)
    head.setUint16(26, name.length, true); head.setUint16(28, 0, true)
    parts.push(new Uint8Array(head.buffer), name, data)
    const cen = new DataView(new ArrayBuffer(46))
    cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true); cen.setUint16(10, 0, true)
    cen.setUint16(12, 0, true); cen.setUint16(14, 0x21, true)
    cen.setUint32(16, crc, true); cen.setUint32(20, data.length, true); cen.setUint32(24, data.length, true)
    cen.setUint16(28, name.length, true); cen.setUint32(42, offset, true)
    central.push(new Uint8Array(cen.buffer), name)
    offset += 30 + name.length + data.length
  }
  const centralSize = central.reduce((s, p) => s + p.length, 0)
  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true)
  end.setUint32(12, centralSize, true); end.setUint32(16, offset, true)
  const all = [...parts, ...central, new Uint8Array(end.buffer)]
  const out = new Uint8Array(all.reduce((s, p) => s + p.length, 0))
  let at = 0; for (const p of all) { out.set(p, at); at += p.length }
  return out
}

const esc = (s) => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
const colName = (i) => { let s = ''; for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s }
// Excel sheet names: at most 31 characters, and none of \ / ? * [ ] :
const sheetName = (s, i) => (String(s || `Sheet${i + 1}`).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31) || `Sheet${i + 1}`)

function sheetXml(rows) {
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0)
  const cols = Array.from({ length: width }, (_, c) => {
    const longest = rows.reduce((m, r) => Math.max(m, String(r[c] ?? '').length), 6)
    return `<col min="${c + 1}" max="${c + 1}" width="${Math.min(48, longest + 3)}" customWidth="1"/>`
  }).join('')
  const body = rows.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => {
    if (v === null || v === undefined || v === '') return ''
    const ref = `${colName(ci)}${ri + 1}`, bold = ri === 0 ? ' s="1"' : ''
    return typeof v === 'number' && isFinite(v) ? `<c r="${ref}"${bold}><v>${v}</v></c>` : `<c r="${ref}"${bold} t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`
  }).join('')}</row>`).join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${width ? `<cols>${cols}</cols>` : ''}<sheetData>${body}</sheetData></worksheet>`
}

// sheets: [{ name, rows: [[cell, ...], ...] }] — the first row of each sheet is shown in bold
export function buildXlsxBytes(sheets) {
  const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
  const files = [
    { name: '[Content_Types].xml', text: `${X}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>` },
    { name: '_rels/.rels', text: `${X}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: 'xl/workbook.xml', text: `${X}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${esc(sheetName(s.name, i)).replace(/"/g, '&quot;')}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', text: `${X}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: 'xl/styles.xml', text: `${X}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>` },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, text: sheetXml(s.rows || []) })),
  ]
  return zip(files)
}

export const buildXlsxBlob = (sheets) => new Blob([buildXlsxBytes(sheets)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
