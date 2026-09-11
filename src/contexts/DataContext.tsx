import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { DashboardStats } from '../types/electron'

interface DataContextType {
  stats: DashboardStats | null
  loading: boolean
  error: string | null
  refreshStats: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await window.api.getStats()
      if (result.success && result.data) {
        setStats(result.data)
      } else {
        setError(result.error || 'Failed to load statistics')
      }
    } catch (err: any) {
      console.error('DataContext error:', err)
      setError(err.message || 'An error occurred while fetching data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()

    // Optional: Refresh on window focus to ensure data is fresh
    const handleFocus = () => {
      loadStats()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadStats])

  return (
    <DataContext.Provider
      value={{
        stats,
        loading,
        error,
        refreshStats: loadStats
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
