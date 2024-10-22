'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { UserData, verifyToken } from '@/lib/kamiwazaApi'

interface AuthContextType {
  user: UserData | null
  loading: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {}
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await verifyToken()
        setUser(userData)
      } catch (error) {
        console.error('Error verifying token:', error)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)