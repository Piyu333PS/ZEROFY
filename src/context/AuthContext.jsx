import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('zerofy-token'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (token) {
      const saved = localStorage.getItem('zerofy-user')
      if (saved) setUser(JSON.parse(saved))
    }
  }, [])

  const saveSession = (data) => {
    setToken(data.token)
    setUser({ email: data.email, isPro: data.isPro, resumeCount: data.resumeCount, freeLimit: data.freeLimit })
    localStorage.setItem('zerofy-token', data.token)
    localStorage.setItem('zerofy-user', JSON.stringify({
      email: data.email,
      isPro: data.isPro,
      resumeCount: data.resumeCount,
      freeLimit: data.freeLimit
    }))
  }

  const register = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      saveSession(data)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      saveSession(data)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const googleLogin = async (idToken) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Google login failed')
      saveSession(data)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setError(null)
    localStorage.removeItem('zerofy-token')
    localStorage.removeItem('zerofy-user')
    // Home page pe redirect karo
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, googleLogin, setError }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
