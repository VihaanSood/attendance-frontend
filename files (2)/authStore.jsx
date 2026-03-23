// src/store/authStore.js — Auth state with React context
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { auth, setToken, setRefreshToken, clearTokens, getToken } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  // Verify token on mount
  useEffect(() => {
    if (getToken()) {
      auth.me()
        .then(res => { setUser(res.data); localStorage.setItem('user', JSON.stringify(res.data)) })
        .catch(() => { clearTokens(); setUser(null) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await auth.login({ email, password })
    setToken(res.data.accessToken)
    setRefreshToken(res.data.refreshToken)
    setUser(res.data.user)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    return res
  }, [])

  const register = useCallback(async (data) => {
    const res = await auth.register(data)
    setToken(res.data.accessToken)
    setRefreshToken(res.data.refreshToken)
    setUser(res.data.user)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    return res
  }, [])

  const logout = useCallback(async () => {
    try { await auth.logout() } catch {}
    clearTokens()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
