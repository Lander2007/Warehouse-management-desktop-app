import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { toArabicDigits, formatArabicCurrency } from '../utils/format'
import { 
  ShoppingCart, 
  Receipt, 
  Users, 
  LogOut,
  DollarSign,
  Clock
} from 'lucide-react'
import PointOfSale from './pos/PointOfSale'
import Sales from './Sales'
import Customers from './Customers'

type SalesSection = 'pos' | 'history' | 'customers'

export default function SalesView() {
  const { user, logout } = useAuth()
  const { stats, refreshStats } = useData()
  const [activeSection, setActiveSection] = useState<SalesSection>('pos')

  useEffect(() => {
    refreshStats()
  }, [refreshStats])

  const menuItems = [
    { id: 'pos' as SalesSection, label: 'نقطة البيع', icon: ShoppingCart, badge: 'نشط' },
    { id: 'history' as SalesSection, label: 'سجل المبيعات', icon: Receipt },
    { id: 'customers' as SalesSection, label: 'قائمة العملاء', icon: Users },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'pos':
        return <PointOfSale />
      case 'history':
        return <Sales />
      case 'customers':
        return <Customers />
      default:
        return <PointOfSale />
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] flex">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-[#0e1220]/95 to-[#0B0F19]/95 border-l border-gray-800/40 backdrop-blur-xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl border border-emerald-500/30 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">محطة المبيعات</h1>
              <p className="text-xs text-gray-500 text-right">نظام نقاط البيع</p>
            </div>
          </div>
          
          {/* User Info */}
          <div className="glass-panel border border-emerald-500/20 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-white text-sm font-semibold truncate">{user?.FullName || user?.Username}</p>
                <p className="text-xs text-emerald-400 font-medium">موظف مبيعات</p>
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
                    ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-white border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/30 border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1 text-right">{item.label}</span>
                {item.badge && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Today's Stats */}
        <div className="p-4 border-t border-gray-800/40 space-y-3">
          <div className="flex items-center gap-2 mb-2 justify-start flex-row-reverse">
            <span>أداء اليوم</span>
            <Clock className="w-4 h-4 text-gray-500" />
          </div>
          
          <div className="glass-panel border border-gray-800/30 rounded-xl p-4 text-right">
            <div className="flex items-center gap-3 mb-3 justify-start flex-row-reverse">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white" dir="rtl">{formatArabicCurrency(stats?.todayRevenue || 0)}</p>
                <p className="text-xs text-gray-500">إجمالي المبيعات</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-800/50 flex-row-reverse">
              <p className="text-xs text-gray-500">عدد العمليات</p>
              <p className="text-sm font-bold text-emerald-400">{toArabicDigits(stats?.recentSales?.length || 0)}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800/40">
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
