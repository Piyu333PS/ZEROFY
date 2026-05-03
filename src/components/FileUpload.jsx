import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import styles from './FileUpload.module.css'

export default function FileUpload({ onFiles, accept, multiple = false, maxSize = 100 * 1024 * 1024, label }) {
  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) onFiles(accepted)
  }, [onFiles])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop, accept, multiple, maxSize
  })

  const acceptStr = Object.values(accept || {}).flat().join(', ')

  return (
    <div>
      <div {...getRootProps()} className={`${styles.zone} ${isDragActive ? styles.active : ''}`}>
        <input {...getInputProps()} />
        <div className={styles.icon}>{isDragActive ? '📂' : '📁'}</div>
        <div className={styles.title}>
          {isDragActive ? 'Drop file here...' : (label || 'Drag & drop or click to choose a file')}
        </div>
        <div className={styles.sub}>
          {acceptStr && <span>{acceptStr}</span>}
          <span>Max {Math.round(maxSize / (1024 * 1024))}MB</span>
        </div>
        <button className={styles.btn} type="button">Choose File</button>
      </div>
      {fileRejections.length > 0 && (
        <div className={styles.error}>
          ⚠️ {fileRejections[0]?.errors[0]?.message || 'File not accepted'}
        </div>
      )}
    </div>
  )
}
