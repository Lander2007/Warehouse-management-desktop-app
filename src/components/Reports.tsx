import { useState } from 'react'
import { toArabicDigits, formatArabicCurrency } from '../utils/format'
import { FileText, TrendingUp, Package, DollarSign, Calendar } from 'lucide-react'

type ReportTab = 'sales' | 'stock' | 'debt'

export default function Reports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [salesReport, setSalesReport] = useState<any[]>([])
  const [stockReport, setStockReport] = useState<any[]>([])
  const [debtReport, setDebtReport] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState({ totalRevenue: 0, invoiceCount: 0, totalDebt: 0 })

  const generateSalesReport = async () => {
    if (!dateFrom || !dateTo) {
      alert('يرجى تحديد النطاق الزمني أولاً')
      return
    }
    
    setLoading(true)
    try {
      const result = await window.api.getSalesReport(dateFrom, dateTo)
      
      if (result.success && result.data) {
        setSalesReport(result.data)
        const totalRev = result.data.reduce((sum: number, s: any) => sum + (Number(s.TotalAmount) || 0), 0)
        const totalDebt = result.data.reduce((sum: number, s: any) => sum + (Number(s.RemainingAmount) || 0), 0)
        setSummary({
          totalRevenue: totalRev,
          invoiceCount: result.data.length,
          totalDebt: totalDebt,
        })
      }
    } catch (error) {
      console.error('Report error:', error)
    }
    setLoading(false)
  }

  const generateStockReport = async () => {
    setLoading(true)
    try {
      const result = await window.api.getStockReport()
      
      if (result.success && result.data) {
        setStockReport(result.data)
      }
    } catch (error) {
      console.error('Report error:', error)
    }
    setLoading(false)
  }

  const generateDebtReport = async () => {
    setLoading(true)
    try {
      const result = await window.api.getDebtsReport()
      
      if (result.success && result.data && result.data.customerDebts) {
        setDebtReport(result.data.customerDebts)
      }
    } catch (error) {
      console.error('Report error:', error)
    }
    setLoading(false)
  }

  const handleTabChange = (tab: ReportTab) => {
    setActiveTab(tab)
    if (tab === 'stock' && stockReport.length === 0) {
      generateStockReport()
    } else if (tab === 'debt' && debtReport.length === 0) {
      generateDebtReport()
    }
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Premium Header */}
      <header className="bg-gradient-to-b from-[#0e1220]/65 to-transparent border-b border-gray-800/40 backdrop-blur-md sticky top-0 z-10">
        <div className="px-8 py-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
              محرك التحليلات
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-2 flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-purple-400" />
              التقارير والسجلات المالية
            </h2>
            <p className="text-xs text-gray-400">مراجعة مؤشرات الأداء، واستخراج كشوفات المخزون، وتقييم الديون والذمم المستحقة.</p>
          </div>
        </div>
      </header>

      {/* Grid Content */}
      <div className="p-8">
        {/* Sliding Tabs Selection */}
        <div className="flex gap-1.5 p-1 bg-[#0a0d17]/80 border border-gray-800/70 rounded-xl max-w-md mb-6 shadow-inner">
          <button
            onClick={() => handleTabChange('sales')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'sales'
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-md'
                : 'text-gray-400 hover:text-gray-200 border border-transparent'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            تقرير المبيعات
          </button>
          <button
            onClick={() => handleTabChange('stock')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'stock'
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-md'
                : 'text-gray-400 hover:text-gray-200 border border-transparent'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            دفتر المخزون
          </button>
          <button
            onClick={() => handleTabChange('debt')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'debt'
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-md'
                : 'text-gray-400 hover:text-gray-200 border border-transparent'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            سجل الديون والذمم
          </button>
        </div>

        {/* Reports Panel */}
        <div className="glass-panel border border-gray-800/50 rounded-2xl p-6 shadow-2xl">
          {/* Sales Report Tab */}
          {activeTab === 'sales' && (
            <div className="space-y-6 animate-fade-in text-right">
              {/* Date Filters */}
              <div className="flex gap-4 items-end max-w-3xl">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1 justify-start">
                    <Calendar className="w-3 h-3 text-blue-400" /> تاريخ البدء
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3.5 py-2 input-premium text-xs text-left"
                    dir="ltr"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1 justify-start">
                    <Calendar className="w-3 h-3 text-blue-400" /> تاريخ الانتهاء
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3.5 py-2 input-premium text-xs text-left"
                    dir="ltr"
                  />
                </div>
                <button
                  onClick={generateSalesReport}
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_12px_rgba(59,130,246,0.2)] disabled:opacity-50 h-[34px]"
                >
                  {loading ? 'جاري التجميع...' : 'إنشاء التقرير'}
                </button>
              </div>

              {salesReport.length > 0 && (
                <div className="space-y-6">
                  {/* Summary Metric Boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                    <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-4.5 shadow-inner">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">إجمالي إيرادات الفترة</p>
                      <p className="text-2xl font-extrabold text-emerald-400 font-mono text-right" dir="rtl">
                        {formatArabicCurrency(summary.totalRevenue)}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-4.5 shadow-inner">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">عدد الفواتير الصادرة</p>
                      <p className="text-2xl font-extrabold text-blue-400 font-mono text-right" dir="rtl">{toArabicDigits(summary.invoiceCount)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl p-4.5 shadow-inner">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">إجمالي الديون غير المسددة</p>
                      <p className="text-2xl font-extrabold text-orange-400 font-mono text-right" dir="rtl">
                        {formatArabicCurrency(summary.totalDebt)}
                      </p>
                    </div>
                  </div>

                  {/* High Density Table */}
                  <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#0a0d18]/40">
                    <div className="max-h-[600px] overflow-y-auto">
                      <table className="w-full text-right">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-950/60 border-b border-gray-800">
                          <th className="p-3.5 text-right">رقم الفاتورة</th>
                          <th className="p-3.5 text-right">تاريخ الفاتورة</th>
                          <th className="p-3.5 text-right">حساب العميل</th>
                          <th className="p-3.5 text-left">إجمالي الفاتورة</th>
                          <th className="p-3.5 text-left">الخصم الإجمالي</th>
                          <th className="p-3.5 text-left">المسدد</th>
                          <th className="p-3.5 text-left">الدين المتبقي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/40 text-xs">
                        {salesReport.map((sale) => (
                          <tr key={sale.SaleID} className="hover:bg-gray-800/10 transition-colors">
                            <td className="p-3.5 font-mono text-blue-400 font-bold text-right" dir="ltr">#{toArabicDigits(sale.SaleID)}</td>
                            <td className="p-3.5 text-gray-400 text-right">{toArabicDigits(new Date(sale.SaleDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }))}</td>
                            <td className="p-3.5 font-semibold text-gray-200 text-right">{sale.CustomerName}</td>
                            <td className="p-3.5 text-left text-emerald-400 font-bold font-mono" dir="rtl">{formatArabicCurrency(sale.TotalAmount)}</td>
                            <td className="p-3.5 text-left text-gray-500 font-mono" dir="rtl">{formatArabicCurrency(sale.Discount)}</td>
                            <td className="p-3.5 text-left text-blue-400 font-bold font-mono" dir="rtl">{formatArabicCurrency(sale.PaidAmount)}</td>
                            <td className="p-3.5 text-left text-orange-400 font-bold font-mono" dir="rtl">{formatArabicCurrency(sale.RemainingAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stock Report Tab */}
          {activeTab === 'stock' && (
            <div className="animate-fade-in text-right">
              {loading ? (
                <div className="text-center py-10 text-xs text-gray-500">جاري تحميل تفاصيل المخزون...</div>
              ) : stockReport.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#0a0d18]/40">
                  <div className="max-h-[600px] overflow-y-auto">
                    <table className="w-full text-right">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-950/60 border-b border-gray-800">
                        <th className="p-3.5 text-right">رمز المنتج</th>
                        <th className="p-3.5 text-right">وصف المنتج</th>
                        <th className="p-3.5 text-right">الوحدة</th>
                        <th className="p-3.5 text-center">المخزون المتوفر</th>
                        <th className="p-3.5 text-center">حد الطلب الأدنى</th>
                        <th className="p-3.5 text-left">سعر التجزئة</th>
                        <th className="p-3.5 text-left">متوسط التكلفة</th>
                        <th className="p-3.5 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40 text-xs">
                      {stockReport.map((item, index) => {
                        const isLow = item.CurrentStock < item.MinStock
                        return (
                          <tr
                            key={index}
                            className={`hover:bg-gray-800/10 transition-colors ${
                              isLow ? 'bg-red-500/5 hover:bg-red-500/10' : ''
                            }`}
                          >
                            <td className="p-3.5 font-mono text-blue-400 font-bold text-right" dir="ltr">{toArabicDigits(item.ItemCode)}</td>
                            <td className="p-3.5 font-semibold text-gray-200 text-right">{item.ItemName}</td>
                            <td className="p-3.5 text-gray-400 text-right">{item.Unit}</td>
                            <td className={`p-3.5 text-center font-bold font-mono ${isLow ? 'text-red-400' : 'text-emerald-400'}`} dir="rtl">
                              {toArabicDigits(item.CurrentStock)}
                            </td>
                            <td className="p-3.5 text-center text-gray-500 font-mono" dir="rtl">{toArabicDigits(item.MinStock)}</td>
                            <td className="p-3.5 text-left text-emerald-400 font-bold font-mono" dir="rtl">{formatArabicCurrency(item.SalePrice)}</td>
                            <td className="p-3.5 text-left text-orange-400 font-bold font-mono" dir="rtl">{formatArabicCurrency(item.CostPrice)}</td>
                            <td className="p-3.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold border inline-block ${
                                  isLow
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}
                              >
                                {isLow ? 'إعادة طلب' : 'متوفر'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-gray-500">لا توجد بيانات متوفرة في دفتر المخزون</div>
              )}
            </div>
          )}

          {/* Debt Report Tab */}
          {activeTab === 'debt' && (
            <div className="animate-fade-in text-right">
              {loading ? (
                <div className="text-center py-10 text-xs text-gray-500">جاري تحميل كشف الديون المستحقة...</div>
              ) : debtReport.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#0a0d18]/40 max-w-4xl">
                  <div className="max-h-[600px] overflow-y-auto">
                    <table className="w-full text-right">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-950/60 border-b border-gray-800">
                        <th className="p-3.5 text-right">رقم العميل</th>
                        <th className="p-3.5 text-right">اسم حساب العميل</th>
                        <th className="p-3.5 text-right">الهاتف</th>
                        <th className="p-3.5 text-left">إجمالي الرصيد المستحق</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40 text-xs">
                      {debtReport.map((customer, index) => (
                        <tr key={index} className="hover:bg-gray-800/10 transition-colors">
                          <td className="p-3.5 font-mono text-blue-400 font-bold text-right" dir="ltr">#{toArabicDigits(customer.CustomerID)}</td>
                          <td className="p-3.5 font-semibold text-gray-200 text-right">{customer.CustomerName}</td>
                          <td className="p-3.5 text-gray-400 text-right" dir="rtl">{toArabicDigits(customer.Phone)}</td>
                          <td className="p-3.5 text-left text-red-400 font-extrabold font-mono text-sm bg-red-500/5" dir="rtl">
                            {formatArabicCurrency(customer.TotalDebt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-emerald-400 font-bold">✅ ممتاز! لا توجد أرصدة مستحقة على أي من حسابات العملاء.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
