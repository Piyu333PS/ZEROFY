import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export function useBackButton() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const setupBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app')
        const listener = await App.addListener('backButton', () => {
          if (location.pathname === '/' || location.pathname === '/all-tools') {
            App.minimizeApp()
          } else {
            navigate(-1)
          }
        })
        return () => listener.remove()
      } catch {
        // Web browser pe Capacitor nahi hota — kuch nahi karna
      }
    }

    const cleanup = setupBackButton()
    return () => { cleanup.then(fn => fn && fn()) }
  }, [location.pathname, navigate])
}
