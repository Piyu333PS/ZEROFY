import { useState } from 'react'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

async function hashBuffer(buffer, algorithm) {
  const hashBuffer = await crypto.subtle.digest(algorithm, buffer)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function ChecksumVerifier() {
  const [file, setFile] = useState(null)
  const [hashes, setHashes] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [expected, setExpected] = useState('')
  const [matchResult, setMatchResult] = useState(null)
  const [copied, setCopied] = useState(null)

  const handleFile = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f); setHashes(null); setMatchResult(null); setProgress(0)
    setProcessing(true)
    try {
      const buffer = await f.arrayBuffer()
      setProgress(50)
      const [md5like, sha1, sha256, sha512] = await Promise.all([
        hashBuffer(buffer, 'SHA-1').then(h => h.slice(0, 32)), // pseudo MD5 length
        hashBuffer(buffer, 'SHA-1'),
        hashBuffer(buffer, 'SHA-256'),
        hashBuffer(buffer, 'SHA-512'),
      ])
      setProgress(100)
      setHashes({ 'SHA-1': sha1, 'SHA-256': sha256, 'SHA-512': sha512 })
    } catch (e) { alert('Error: ' + e.message) }
    setProcessing(false)
  }

  const verify = () => {
    if (!hashes || !expected.trim()) return
    const exp = expected.trim().toLowerCase()
    const match = Object.values(hashes).some(h => h.toLowerCase() === exp)
    setMatchResult(match)
  }

  const copy = (label, val) => {
    navigator.clipboard.writeText(val)
    setCopied(label)
    setTimeout(() => setCopied(null), 1500)
  }

  const fmtSize = (b) => b > 1024*1024 ? (b/1024/1024).toFixed(2)+' MB' : b > 1024 ? (b/1024).toFixed(1)+' KB' : b+' B'

  return (
    <ToolLayout icon="🔍" name="Checksum Verifier" desc="Verify SHA-1, SHA-256, SHA-512 checksum of any file">

      <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px 24px', textAlign: 'center', cursor: 'pointer', marginBottom: 20 }}
        onClick={() => document.getElementById('cs-upload').click()}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📁</div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{file ? file.name : 'Upload a file to verify checksum'}</div>
        {file && <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{fmtSize(file.size)}</div>}
        <input id="cs-upload" type="file" style={{ display: 'none' }} onChange={handleFile} />
      </div>

      {processing && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 8 }}>⚙️ Computing hashes...</div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: progress + '%' }} />
          </div>
        </div>
      )}

      {hashes && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {Object.entries(hashes).map(([label, val]) => (
              <div key={label} style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '12px 16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent2)' }}>{label}</span>
                  <button className={styles.copyBtn} style={{ marginTop: 0 }} onClick={() => copy(label, val)}>
                    {copied === label ? '✅' : '📋 Copy'}
                  </button>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text)', wordBreak: 'break-all' }}>
                  {val}
                </div>
              </div>
            ))}
          </div>

          {/* Verify */}
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
            <div className={styles.controlLabel} style={{ marginBottom: 10 }}>Verify against expected checksum</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className={styles.controlInput} style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
                value={expected} onChange={e => { setExpected(e.target.value); setMatchResult(null) }}
                placeholder="Paste expected hash here..." />
              <button className={styles.actionBtn} style={{ width: 'auto', padding: '0 20px', marginTop: 0 }}
                onClick={verify} disabled={!expected.trim()}>
                Verify
              </button>
            </div>

            {matchResult !== null && (
              <div style={{
                marginTop: 12, padding: '12px 16px', borderRadius: 'var(--radius)',
                background: matchResult ? 'rgba(0,212,170,0.1)' : 'rgba(255,77,77,0.1)',
                border: `1px solid ${matchResult ? 'rgba(0,212,170,0.3)' : 'rgba(255,77,77,0.3)'}`,
                color: matchResult ? 'var(--green)' : '#ff4d4d',
                fontWeight: 600, fontSize: 15, textAlign: 'center'
              }}>
                {matchResult ? '✅ Checksum matched! File is original.' : '❌ Checksum did not match! File may be corrupt or modified.'}
              </div>
            )}
          </div>
        </>
      )}
    </ToolLayout>
  )
}
