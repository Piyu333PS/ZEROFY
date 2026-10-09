import { useEffect, useRef, useState } from 'react'

/* Animates a number from its previous value to the new one (used for the big amounts on the
   overview). Skips the animation when the user has asked for reduced motion. */
export function useCountUp(target, duration = 700) {
  const value = Number(target) || 0
  const [shown, setShown] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || duration <= 0) { fromRef.current = value; setShown(value); return }
    const from = fromRef.current
    if (from === value) { setShown(value); return }
    let raf
    const start = performance.now()
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(from + (value - from) * eased)
      if (t < 1) raf = requestAnimationFrame(step)
      else fromRef.current = value
    }
    raf = requestAnimationFrame(step)
    return () => { cancelAnimationFrame(raf); fromRef.current = value }
  }, [value, duration])

  return shown
}
