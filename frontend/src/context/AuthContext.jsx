import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiSend, clearAccessToken, persistAuthFromResponse, setAccessToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const me = await apiGet('/auth/me')
      setUser(me)
    } catch (e) {
      if (e.status === 414) {
        setUser(null)
      } else {
        setError(e.message)
        setUser(null)
      }
    }
  }, [])

  const login = useCallback(
    async (email, password) => {
      clearAccessToken()
      const data = await apiSend('/auth/login', 'POST', { email, password })
      setUser(persistAuthFromResponse(data))
      navigate('/dashboard', { replace: true })
    },
    [navigate],
  )

  const register = useCallback(
    async (email, name, password) => {
      clearAccessToken()
      const data = await apiSend('/auth/register', 'POST', { email, name, password })
      setUser(persistAuthFromResponse(data))
      navigate('/dashboard', { replace: true })
    },
    [navigate],
  )

  useEffect(() => {
    const url = new URL(window.location.href)
    const oauthToken = url.searchParams.get('accessToken')
    if (oauthToken) {
      setAccessToken(oauthToken)
      url.searchParams.delete('accessToken')
      url.searchParams.delete('expiresIn')
      const qs = url.searchParams.toString()
      window.history.replaceState({}, '', url.pathname + (qs ? `?${qs}` : '') + url.hash)
    }
    refresh()
  }, [refresh])

  const value = useMemo(
    () => ({
      user,
      loading: user === undefined,
      error,
      refresh,
      login,
      register,
      logout: () => {
        clearAccessToken()
        window.location.href = '/logout'
      },
    }),
    [user, error, refresh, login, register],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}

// reviewed: 2026-04-23T09:16:20

// refactored: 2026-04-23T19:33:09

// validated: 2026-04-23T19:49:50
