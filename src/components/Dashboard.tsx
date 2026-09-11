import { useEffect, useState } from 'react'
import { useData } from '../contexts/DataContext'
import { toArabicDigits, formatArabicCurrency } from '../utils/format'
import {
  Package,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  AlertCircle,
  AlertTriangle,
  Calendar,
} from 'lucide-react'

interface DashboardProps {
  onConnectionChange: (status: 'connected' | 'error' | 'checking') => void
}

export default function Dashboard({ onConnectionChange }: DashboardProps) {
  const { stats, loading: dataLoading, error: dataError, refreshStats } = useData()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [greeting, setGreeting] = useState('مرحباً بك')

  useEffect(() => {
    checkConnectionAndLoad()
    determineGreeting()
  }, [])

  const determineGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('صباح الخير')
    else if (hour < 18) setGreeting('طاب يومك')
    else setGreeting('مساء الخير')
  }

  const checkConnectionAndLoad = async () => {
    try {
      setLoading(true)
      setError(null)
      onConnectionChange('checking')

      const connResult = await window.api.checkConnection()
      if (!connResult.success) {
        throw new Error(connResult.error || 'فشل الاتصال بقاعدة البيانات')
      }

      await refreshStats()
      onConnectionChange('connected')
    } catch (err: any) {
      console.error('Dashboard error:', err)
      setError(err.message)
      onConnectionChange('error')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    await checkConnectionAndLoad()
  }

  const statCards = [
    {
      title: 'إجمالي الأصناف',
      value: toArabicDigits(stats?.totalItems || 0),
      icon: Package,
      gradient: 'from-blue-500/10 via-blue-600/5 to-transparent',
      glowClass: 'glow-blue',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 border border-blue-500/20',
      tag: 'المنتجات المسجلة بالنظام',
    },
    {
      title: 'العملاء النشطون',
      value: toArabicDigits(stats?.totalCustomers || 0),
      icon: Users,
      gradient: 'from-emerald-500/10 via-emerald-600/5 to-transparent',
      glowClass: 'glow-emerald',
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 border border-emerald-500/20',
      tag: 'المسجلون في قاعدة البيانات',
    },
    {
      title: 'إجمالي المبيعات',
      value: toArabicDigits(stats?.totalSales || 0),
      icon: TrendingUp,
      gradient: 'from-purple-500/10 via-purple-600/5 to-transparent',
      glowClass: 'glow-purple',
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/20 hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 border border-purple-500/20',
      tag: 'الفواتير الصادرة المكتملة',
    },
    {
      title: 'إيرادات اليوم',
      value: formatArabicCurrency(stats?.todayRevenue || 0),
      icon: DollarSign,
      gradient: 'from-orange-500/10 via-orange-600/5 to-transparent',
      glowClass: 'glow-orange',
      iconColor: 'text-orange-400',
      borderColor: 'border-orange-500/20 hover:border-orange-500/40',
      iconBg: 'bg-orange-500/10 border border-orange-500/20',
      tag: 'إجمالي قيمة مبيعات اليوم',
    },
  ]

  return (
    <div className="min-h-screen pb-12 text-right">
      {/* Premium Header */}
      <header className="bg-gradient-to-b from-[#0e1220]/65 to-transparent border-b border-gray-800/40 backdrop-blur-md sticky top-0 z-10">
        <div className="px-8 py-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
              لوحة الملخص العام
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-2 flex items-center gap-2 justify-start">
              {greeting}، مدير النظام!
            </h2>
            <p className="text-xs text-gray-400">إليك الحالة الحالية لمخزون المستودع والمبيعات اليوم.</p>
          </div>
          
          <div className="flex items-center gap-3 justify-start flex-row-reverse">
            <div className="text-xs text-gray-400 bg-gray-900/60 border border-gray-800/80 px-3.5 py-2 rounded-xl flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={loading || dataLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.25)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Activity className={`w-3.5 h-3.5 ${loading || dataLoading ? 'animate-spin' : ''}`} />
              <span>تحديث البيانات</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content Grid */}
      <div className="p-8">
        {(error || dataError) && (
          <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-3.5 shadow-2xl shadow-red-500/5 animate-fade-in justify-start">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-right">
              <h3 className="text-red-400 font-semibold text-sm mb-1">خطأ في الاتصال بقاعدة البيانات</h3>
              <p className="text-red-300/80 text-xs whitespace-pre-line leading-relaxed">{error || dataError}</p>
            </div>
          </div>
        )}

        {(loading || dataLoading) && !stats ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Activity className="w-10 h-10 text-blue-400 animate-spin mb-4" />
            <p className="text-sm text-gray-400 tracking-wide">جاري جلب إحصائيات المستودع والمبيعات...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((card) => (
                <div
                  key={card.title}
                  className={`glass-panel bg-gradient-to-br ${card.gradient} ${card.glowClass} rounded-2xl p-5 border ${card.borderColor} transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl text-right`}
                >
                  <div className="flex items-start justify-between flex-row-reverse">
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">{card.title}</p>
                      <h3 className="text-3xl font-extrabold tracking-tight text-white">{card.value}</h3>
                      <p className="text-[10px] text-gray-500 mt-2 font-medium">{card.tag}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${card.iconBg} ${card.iconColor} shadow-inner`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Sections Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Recent Sales */}
              <div className="lg:col-span-7 space-y-6">
                <div className="glass-panel rounded-2xl p-6 border border-gray-800/40">
                  <div className="flex items-center justify-between mb-5 flex-row-reverse">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 justify-start flex-row-reverse">
                      <span>آخر عمليات المبيعات</span>
                      <TrendingUp className="w-4.5 h-4.5 text-blue-400" />
                    </h3>
                    <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-bold">
                      أحدث 5 فواتير
                    </span>
                  </div>
                  
                  <div className="overflow-hidden rounded-xl border border-gray-800/60 bg-[#0a0d18]/40">
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                      <table className="w-full text-right">
                        <thead>
                          <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-900/60 border-b border-gray-800/80">
                            <th className="p-3.5 text-right">رقم الفاتورة</th>
                            <th className="p-3.5 text-right">التاريخ</th>
                            <th className="p-3.5 text-right">العميل</th>
                            <th className="p-3.5 text-left">الإجمالي</th>
                            <th className="p-3.5 text-left">الحالة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/40">
                          {stats?.recentSales && stats.recentSales.length > 0 ? (
                            stats.recentSales.map((sale) => {
                              const isPaidInFull = sale.RemainingAmount <= 0
                              return (
                                <tr key={sale.SaleID} className="hover:bg-gray-800/15 transition-colors group">
                                  <td className="p-3.5 text-xs font-mono text-blue-400 font-bold group-hover:text-blue-300 text-right" dir="ltr">
                                    #{toArabicDigits(sale.SaleID)}
                                  </td>
                                  <td className="p-3.5 text-xs text-gray-400 text-right">
                                    {toArabicDigits(new Date(sale.SaleDate).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }))}
                                  </td>
                                  <td className="p-3.5 text-xs font-semibold text-gray-200 text-right">
                                    {sale.CustomerName}
                                  </td>
                                  <td className="p-3.5 text-xs font-bold text-emerald-400 text-left">
                                    {formatArabicCurrency(sale.TotalAmount)}
                                  </td>
                                  <td className="p-3.5 text-left">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block border ${
                                        isPaidInFull
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                          : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                      }`}
                                    >
                                      {isPaidInFull ? 'خالصة' : 'آجلة'}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-xs text-gray-500">
                                لم يتم العثور على أي عمليات بيع حالياً
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Low Stock Panel */}
              <div className="lg:col-span-5 space-y-6">
                <div className="glass-panel bg-gradient-to-b from-[#1c121e]/20 via-[#0d0d17]/40 to-transparent rounded-2xl p-6 border border-red-500/10 hover:border-red-500/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-5 flex-row-reverse">
                    <h3 className="text-base font-bold text-red-400 flex items-center gap-2 justify-start flex-row-reverse">
                      <span>تنبيه انخفاض كميات المخزون</span>
                      <AlertTriangle className="w-4.5 h-4.5 animate-pulse" />
                    </h3>
                    <span className="text-[9px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 font-bold">
                      تحذير إعادة طلب
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-red-500/10 bg-[#0f0914]/40">
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                      <table className="w-full text-right">
                        <thead>
                          <tr className="text-[11px] uppercase tracking-wider text-red-400/80 bg-red-950/20 border-b border-red-500/10">
                            <th className="p-3.5 text-right">رمز الصنف</th>
                            <th className="p-3.5 text-right">الاسم</th>
                            <th className="p-3.5 text-center">الرصيد الحالي</th>
                            <th className="p-3.5 text-center">الحد الأدنى</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-950/10">
                          {stats?.lowStock && stats.lowStock.length > 0 ? (
                            stats.lowStock.map((item, index) => (
                              <tr key={index} className="hover:bg-red-500/5 transition-colors">
                                <td className="p-3.5 text-xs font-mono font-bold text-red-300 text-right" dir="ltr">{toArabicDigits(item.ItemCode)}</td>
                                <td className="p-3.5 text-xs text-gray-300 truncate max-w-[120px] text-right">{item.ItemName}</td>
                                <td className="p-3.5 text-xs font-extrabold text-red-400 text-center bg-red-500/5">
                                  {toArabicDigits(item.CurrentStock)}
                                </td>
                                <td className="p-3.5 text-xs text-gray-500 text-center">{toArabicDigits(item.MinStock)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-xs text-green-400 font-bold">
                                ✅ جميع كميات المخزون متوفرة وضمن الحدود الآمنة.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
