import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { toArabicDigits } from '../utils/format'
import { 
  LayoutDashboard, 
  TrendingUp, 
  Package, 
  Users, 
  DollarSign, 
  ShoppingCart,
  LogOut,
  Settings,
  BarChart3
} from 'lucide-react'
import Dashboard from './Dashboard'
import Inventory from './Inventory'
import Sales from './Sales'
import Purchases from './Purchases'
import Customers from './Customers'
import Suppliers from './Suppliers'
import Reports from './Reports'
import DatabaseSettings from './DatabaseSettings'
import Expenses from './Expenses'

type AdminSection = 'dashboard' | 'inventory' | 'sales' | 'purchases' | 'customers' | 'suppliers' | 'reports' | 'settings' | 'expenses'

export default function AdminView() {
  const { user, logout } = useAuth()
  const { stats } = useData()
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')

  const handleConnectionChange = (status: 'connected' | 'error' | 'checking') => {
    console.log('Database connection status changed:', status)
  }

  const menuItems = [
    { id: 'dashboard' as AdminSection, label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'inventory' as AdminSection, label: 'المخزون', icon: Package },
    { id: 'sales' as AdminSection, label: 'المبيعات', icon: ShoppingCart },
    { id: 'purchases' as AdminSection, label: 'المشتريات', icon: TrendingUp },
    { id: 'customers' as AdminSection, label: 'العملاء', icon: Users },
    { id: 'suppliers' as AdminSection, label: 'الموردين', icon: Users },
    { id: 'reports' as AdminSection, label: 'التقارير', icon: BarChart3 },
    { id: 'expenses' as AdminSection, label: 'المصروفات', icon: DollarSign },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onConnectionChange={handleConnectionChange} />
      case 'inventory':
        return <Inventory />
      case 'sales':
        return <Sales />
      case 'purchases':
        return <Purchases />
      case 'customers':
        return <Customers />
      case 'suppliers':
        return <Suppliers />
      case 'reports':
        return <Reports />
      case 'expenses':
        return <Expenses />
      case 'settings':
        return <DatabaseSettings />
      default:
        return <Dashboard onConnectionChange={handleConnectionChange} />
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] flex">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-[#0e1220]/95 to-[#0B0F19]/95 border-l border-gray-800/40 backdrop-blur-xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-xl border border-indigo-500/30 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">لوحة المسؤول</h1>
              <p className="text-xs text-gray-500 text-right">التحكم الكامل بالنظام</p>
            </div>
          </div>
          
          {/* User Info */}
          <div className="glass-panel border border-indigo-500/20 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-500/20 rounded-lg flex items-center justify-center border border-indigo-500/30">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-white text-sm font-semibold truncate">{user?.FullName || user?.Username}</p>
                <p className="text-xs text-indigo-400 font-medium">مدير النظام</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-white border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/30 border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.id === 'inventory' && (stats?.lowStock?.length || 0) > 0 && (
                  <span className="mr-auto bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                    {toArabicDigits(stats?.lowStock?.length)}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Quick Stats */}
        <div className="p-4 border-t border-gray-800/40 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="glass-panel border border-gray-800/30 rounded-lg p-2.5 text-right">
              <Package className="w-4 h-4 text-indigo-400 mb-1" />
              <p className="text-xl font-bold text-white">{toArabicDigits(stats?.totalItems || 0)}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">الأصناف</p>
            </div>
            <div className="glass-panel border border-gray-800/30 rounded-lg p-2.5 text-right">
              <Users className="w-4 h-4 text-emerald-400 mb-1" />
              <p className="text-xl font-bold text-white">{toArabicDigits(stats?.totalCustomers || 0)}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">العملاء</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-800/40 space-y-2">
          <button
            onClick={() => setActiveSection('settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm ${
              activeSection === 'settings'
                ? 'bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-white border border-indigo-500/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/30 border border-transparent hover:border-gray-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>الإعدادات</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all text-sm border border-transparent hover:border-red-500/30"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  )
}
