import { useState } from 'react'
import { downloadBlob } from '../../utils/download'
import ToolLayout from '../../components/ToolLayout'
import styles from '../ToolPage.module.css'

// AES-like encryption using Web Crypto API
async function encryptText(text, password) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey'])
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']
  )
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text))
  const combined = new Uint8Array([...salt, ...iv, ...new Uint8Array(encrypted)])
  return btoa(String.fromCharCode(...combined))
}

async function decryptText(encrypted, password) {
  const enc = new TextEncoder()
  const bytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
  const salt = bytes.slice(0, 16)
  const iv = bytes.slice(16, 28)
  const data = bytes.slice(28)
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
  )
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return new TextDecoder().decode(decrypted)
}

export default function SecureNotes() {
  const [mode, setMode] = useState('encrypt')
  const [text, setText] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [output, setOutput] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const process = async () => {
    if (!text.trim() || !password) return
    if (mode === 'encrypt' && password !== confirmPwd) {
      setError('❌ Passwords do not match!'); return
    }
    setProcessing(true); setError(''); setOutput('')
    try {
      if (mode === 'encrypt') {
        const result = await encryptText(text, password)
        setOutput(result)
      } else {
        const result = await decryptText(text.trim(), password)
        setOutput(result)
      }
    } catch {
      setError('❌ ' + (mode === 'decrypt' ? 'Wrong password ya invalid encrypted text!' : 'Encryption failed!'))
    }
    setProcessing(false)
  }

  const copy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const download = () => {
    downloadBlob(new Blob([output], { type: 'text/plain' }), mode === 'encrypt' ? 'encrypted_note.txt' : 'decrypted_note.txt')
  }

  return (
    <ToolLayout icon="🔐" name="Secure Notes" desc="Lock notes with AES-256 encryption — unreadable without the password">

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['encrypt', 'decrypt'].map(m => (
          <button key={m} onClick={() => { setMode(m); setOutput(''); setError('') }} style={{
            flex: 1, padding: '12px', borderRadius: 'var(--radius)', border: '2px solid',
            cursor: 'pointer', fontWeight: 700, fontSize: 14,
            borderColor: mode === m ? 'var(--accent)' : 'var(--border)',
            background: mode === m ? 'var(--accent-glow)' : 'var(--bg3)',
            color: mode === m ? 'var(--accent2)' : 'var(--text2)',
          }}>
            {m === 'encrypt' ? '🔒 Encrypt' : '🔓 Decrypt'}
          </button>
        ))}
      </div>

      <div className={styles.controlGroup} style={{ marginBottom: 12 }}>
        <label className={styles.controlLabel}>{mode === 'encrypt' ? 'Text / Note' : 'Encrypted Text'}</label>
        <textarea className={styles.textArea} style={{ minHeight: 120 }} value={text}
          onChange={e => { setText(e.target.value); setError('') }}
          placeholder={mode === 'encrypt' ? 'Enter the note or text to encrypt...' : 'Paste encrypted text here...'} />
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Password</label>
          <div style={{ position: 'relative' }}>
            <input className={styles.controlInput} type={showPwd ? 'text' : 'password'}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Strong password dalao" style={{ paddingRight: 40 }} />
            <button onClick={() => setShowPwd(s => !s)} style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 16
            }}>{showPwd ? '🙈' : '👁'}</button>
          </div>
        </div>
        {mode === 'encrypt' && (
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Confirm Password</label>
            <input className={styles.controlInput} type={showPwd ? 'text' : 'password'}
              value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
              placeholder="Confirm password"
              style={{ borderColor: confirmPwd && confirmPwd !== password ? '#ff4d4d' : undefined }} />
          </div>
        )}
      </div>

      {password.length > 0 && password.length < 8 && (
        <div style={{ fontSize: 12, color: '#ffd700', marginBottom: 8 }}>⚠️ Password must be at least 8 characters</div>
      )}

      {error && <div style={{ color: '#ff4d4d', fontSize: 14, marginBottom: 8 }}>{error}</div>}

      <button className={styles.actionBtn} onClick={process} disabled={processing || !text || !password || (mode === 'encrypt' && password !== confirmPwd)}>
        {processing ? <><span className={styles.spinner} /> Processing...</> : mode === 'encrypt' ? '🔒 Encrypt' : '🔓 Decrypt'}
      </button>

      {output && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className={styles.controlLabel}>{mode === 'encrypt' ? '🔒 Encrypted Output' : '✅ Decrypted Text'}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className={styles.copyBtn} style={{ marginTop: 0 }} onClick={copy}>{copied ? '✅ Copied' : '📋 Copy'}</button>
              <button className={styles.copyBtn} style={{ marginTop: 0 }} onClick={download}>⬇️ Save</button>
            </div>
          </div>
          <textarea className={styles.outputArea} style={{ minHeight: 100 }} value={output} readOnly />
          <div className={styles.hint} style={{ marginTop: 8 }}>
            🔐 AES-256-GCM encryption • Cannot be decrypted without the password
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
