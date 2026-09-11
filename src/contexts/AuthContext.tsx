import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  UserID: number
  Username: string
  Role: 'Admin' | 'Sales' | 'Warehouse'
  FullName?: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in (from sessionStorage)
    const storedUser = sessionStorage.getItem('currentUser')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        sessionStorage.removeItem('currentUser')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    try {
      // Authenticate via REST API (server IP/port from config.json → preload BASE URL)
      const result = (await window.api.authenticateUser(username, password)) as any

      const userObj = result.data?.user || result.user;
      if (result.success && userObj) {
        const userData: User = {
          UserID: userObj.UserID,
          Username: userObj.Username,
          Role: userObj.Role,
          FullName: userObj.FullName,
        }
        setUser(userData)
        sessionStorage.setItem('currentUser', JSON.stringify(userData))
        return { success: true }
      }

      return { success: false, error: result.error || 'Invalid credentials' }
    } catch (error: unknown) {
      console.error('Login error:', error)
      const message = error instanceof Error ? error.message : 'Authentication failed'
      return { success: false, error: message }
    }
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem('currentUser')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
