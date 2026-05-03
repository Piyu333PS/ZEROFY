/**
 * Reliable download helper — browser + Capacitor Android/iOS dono pe kaam karta hai
 */

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function downloadText(text, filename, mimeType = 'text/plain') {
  const blob = new Blob([text], { type: mimeType })
  downloadBlob(blob, filename)
}
