import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { toArabicDigits } from '../utils/format'
import { 
  Package, 
  TrendingUp, 
  AlertTriangle,
  LogOut,
  Boxes,
  ClipboardList,
  PackageCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import Inventory from './Inventory'
import Purchases from './Purchases'

type WarehouseSection = 'inventory' | 'receiving' | 'stockcheck'

interface AuditResult {
  mismatches: Array<{
    itemID: number
    code: string
    name: string
    dbStock: number
    excelStock: number
    difference: number
  }>
  missingInDb: Array<{
    code: string
    name: string
    excelStock: number
  }>
  totalExcelItems: number
  totalDbItems: number
}

export default function WarehouseView() {
  const { user, logout } = useAuth()
  const { stats, refreshStats } = useData()
  const [activeSection, setActiveSection] = useState<WarehouseSection>('inventory')

  // Audit State
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [reconciling, setReconciling] = useState(false)
  const [auditError, setAuditError] = useState<string | null>(null)

  useEffect(() => {
    refreshStats()
  }, [refreshStats])

  const totalItemsCount = stats?.totalItems || 0
  const lowStockCount = stats?.lowStock?.length || 0
  const outOfStockCount = (stats?.lowStock || []).filter((item: any) => item.CurrentStock === 0).length || 0

  const runAudit = async () => {
    setAuditLoading(true)
    setAuditError(null)
    try {
      const result = await window.api.runStockAudit()
      if (result.success) {
        setAuditResult(result.data)
      } else {
        setAuditError(result.error || 'فشل تشغيل عملية الجرد والمطابقة')
      }
    } catch (err: any) {
      setAuditError(err.message || 'حدث خطأ أثناء الاتصال بالخادم')
    } finally {
      setAuditLoading(false)
    }
  }

  const handleReconcile = async () => {
    if (!auditResult || auditResult.mismatches.length === 0) return
    
    if (!confirm(`هل أنت متأكد من رغبتك في تحديث كميات ${auditResult.mismatches.length} من الأصناف في قاعدة البيانات لتطابق رصيد ملف الإكسل الفعلي؟`)) {
      return
    }

    setReconciling(true)
    try {
      const itemsToUpdate = auditResult.mismatches.map(m => ({
        itemID: m.itemID,
        excelStock: m.excelStock
      }))

      const result = await window.api.reconcileStock(itemsToUpdate)
      if (result.success) {
        alert('تمت تسوية كميات المخزون وتحديث قاعدة البيانات بنجاح!')
        setAuditResult(null)
        refreshStats()
      } else {
        alert('فشلت عملية التسوية: ' + result.error)
      }
    } catch (err: any) {
      alert('خطأ: ' + err.message)
    } finally {
      setReconciling(false)
    }
  }

  const menuItems = [
    { 
      id: 'inventory' as WarehouseSection, 
      label: 'إدارة المخزون', 
      icon: Package,
      description: 'عرض وإدارة مستويات المخزون الحالية'
    },
    { 
      id: 'receiving' as WarehouseSection, 
      label: 'استلام الشحنات', 
      icon: TrendingUp,
      description: 'تسجيل الشحنات الواردة والمشتريات'
    },
    { 
      id: 'stockcheck' as WarehouseSection, 
      label: 'جرد ومطابقة المخزون', 
      icon: ClipboardList,
      description: 'التحقق من مطابقة الجرد الفعلي'
    },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'inventory':
        return <Inventory />
      case 'receiving':
        return <Purchases />
      case 'stockcheck':
        return (
          <div className="p-8 h-screen flex flex-col overflow-hidden text-right">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 justify-start">
                  <ClipboardList className="w-7 h-7 text-indigo-400" />
                  جرد وتسوية كميات المخزون
                </h2>
                <p className="text-gray-400 text-sm mt-1">مقارنة سجلات النظام مع ملف الجرد الفعلي (Excel).</p>
              </div>
              <button
                onClick={runAudit}
                disabled={auditLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${auditLoading ? 'animate-spin' : ''}`} />
                تشغيل الجرد والمطابقة
              </button>
            </div>

            {auditError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 justify-start">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-semibold">{auditError}</p>
              </div>
            )}

            {auditResult ? (
              <div className="flex-1 overflow-hidden flex flex-col gap-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="glass-panel p-4 border border-gray-800/40 rounded-xl text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">الفروقات المكتشفة</p>
                    <p className={`text-2xl font-bold ${auditResult.mismatches.length > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                      {toArabicDigits(auditResult.mismatches.length)}
                    </p>
                  </div>
                  <div className="glass-panel p-4 border border-gray-800/40 rounded-xl text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">غير موجود بالخادم</p>
                    <p className={`text-2xl font-bold ${auditResult.missingInDb.length > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {toArabicDigits(auditResult.missingInDb.length)}
                    </p>
                  </div>
                  <div className="glass-panel p-4 border border-gray-800/40 rounded-xl text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">الأصناف المفحوصة</p>
                    <p className="text-2xl font-bold text-white">{toArabicDigits(auditResult.totalExcelItems)}</p>
                  </div>
                </div>

                {/* Mismatches Table */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">تفاصيل فروقات الكميات</h3>
                    {auditResult.mismatches.length > 0 && (
                      <button
                        onClick={handleReconcile}
                        disabled={reconciling}
                        className="text-xs bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 px-4 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2"
                      >
                        {reconciling ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        تسوية وتحديث جميع الكميات الفروق
                      </button>
                    )}
                  </div>

                  <div className="glass-panel border border-gray-800/40 rounded-2xl overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-auto flex-1">
                      <table className="w-full text-right text-sm">
                        <thead className="sticky top-0 bg-[#0e1220] z-10 border-b border-gray-800/80">
                          <tr className="text-[10px] uppercase tracking-wider text-gray-500">
                            <th className="p-4 text-right">رمز الصنف</th>
                            <th className="p-4 text-right">اسم المنتج</th>
                            <th className="p-4 text-center">مخزون النظام</th>
                            <th className="p-4 text-center">مخزون الإكسل</th>
                            <th className="p-4 text-center">الفرق</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/30">
                          {auditResult.mismatches.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-12 text-center text-emerald-400 font-bold">
                                <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                                جميع الكميات مطابقة تماماً للمستودع الفعلي!
                              </td>
                            </tr>
                          ) : (
                            auditResult.mismatches.map((m, i) => (
                              <tr key={i} className="hover:bg-gray-800/10">
                                <td className="p-4 font-mono text-xs text-indigo-400 font-bold text-right" dir="ltr">{toArabicDigits(m.code)}</td>
                                <td className="p-4 text-gray-300 text-right">{m.name}</td>
                                <td className="p-4 text-center font-bold text-gray-400">{toArabicDigits(m.dbStock)}</td>
                                <td className="p-4 text-center font-bold text-white">{toArabicDigits(m.excelStock)}</td>
                                <td className={`p-4 text-center font-bold ${m.difference > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {m.difference > 0 ? '+' : ''}{toArabicDigits(m.difference)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="glass-panel border border-gray-800/50 rounded-2xl p-12 text-center max-w-lg">
                  <ClipboardList className="w-16 h-16 text-indigo-500/40 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">جاهز لبدء المطابقة والجرد</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    قم بتشغيل الجرد لمقارنة قاعدة بيانات النظام الحية مع ملف جرد المستودع الفعلي المحدث. 
                    ستتمكن من مراجعة الفروقات واعتماد تسويتها تلقائياً لتحديث النظام.
                  </p>
                  <button
                    onClick={runAudit}
                    disabled={auditLoading}
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold mx-auto transition-all shadow-xl shadow-indigo-600/20"
                  >
                    {auditLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    بدء الفحص الآن
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      default:
        return <Inventory />
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] flex">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-[#0e1220]/95 to-[#0B0F19]/95 border-l border-gray-800/40 backdrop-blur-xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800/40">
          <div className="flex items-center gap-3 mb-4 justify-end flex-row-reverse">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl border border-orange-500/30 flex items-center justify-center">
              <Boxes className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-right">
              <h1 className="text-white font-bold text-lg">بوابة المستودع</h1>
              <p className="text-xs text-gray-500">نظام إدارة المخزون المحلي</p>
            </div>
          </div>
          
          {/* User Info */}
          <div className="glass-panel border border-orange-500/20 rounded-xl p-3">
            <div className="flex items-center gap-3 justify-end flex-row-reverse">
              <div className="w-9 h-9 bg-orange-500/20 rounded-lg flex items-center justify-center border border-orange-500/30">
                <Package className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-white text-sm font-semibold truncate">{user?.FullName || user?.Username}</p>
                <p className="text-xs text-orange-400 font-medium">أمين المستودع</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-white border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/30 border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-right">
                  <p className="font-semibold">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Stock Alerts */}
        <div className="p-4 border-t border-gray-800/40 space-y-3 text-right">
          <div className="flex items-center gap-2 mb-2 justify-start flex-row-reverse">
            <span className="font-bold text-xs text-gray-500 uppercase tracking-wider">تنبيهات المخزون</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>

          {/* Low Stock Warning */}
          {lowStockCount > 0 && (
            <div className="glass-panel border border-amber-500/20 rounded-xl p-3 bg-amber-500/5">
              <div className="flex items-center justify-between mb-2 flex-row-reverse">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">مخزون منخفض</p>
                <span className="text-xl font-bold text-amber-400">{toArabicDigits(lowStockCount)}</span>
              </div>
              <p className="text-xs text-gray-400">أصناف تحت الحد الأدنى للمخزون</p>
            </div>
          )}

          {/* Out of Stock Critical */}
          {outOfStockCount > 0 && (
            <div className="glass-panel border border-red-500/20 rounded-xl p-3 bg-red-500/5">
              <div className="flex items-center justify-between mb-2 flex-row-reverse">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider">نفد من المخزون</p>
                <span className="text-xl font-bold text-red-400">{toArabicDigits(outOfStockCount)}</span>
              </div>
              <p className="text-xs text-gray-400">أصناف برصيد صفري</p>
            </div>
          )}

          {/* Total Items */}
          <div className="glass-panel border border-gray-800/30 rounded-xl p-3">
            <div className="flex items-center gap-3 justify-start flex-row-reverse">
              <PackageCheck className="w-8 h-8 text-emerald-400" />
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{toArabicDigits(totalItemsCount)}</p>
                <p className="text-xs text-gray-500">إجمالي الأصناف الفريدة</p>
              </div>
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
