import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import Login from './components/Login'
import AdminView from './components/AdminView'
import SalesView from './components/SalesView'
import WarehouseView from './components/WarehouseView'
import ProtectedRoute from './components/ProtectedRoute'

function AppRoutes() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm">جاري تحميل التطبيق...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {user?.Role === 'Admin' && <AdminView />}
            {user?.Role === 'Sales' && <SalesView />}
            {user?.Role === 'Warehouse' && <WarehouseView />}
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/*"
        element={
          <ProtectedRoute allowedRoles={['Sales']}>
            <SalesView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/warehouse/*"
        element={
          <ProtectedRoute allowedRoles={['Warehouse']}>
            <WarehouseView />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  useEffect(() => {
    // Pure React RTL Setup
    document.documentElement.dir = 'rtl'
    document.documentElement.lang = 'ar'
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <AppRoutes />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
