import { useEffect, useState } from 'react'
import { toArabicDigits, formatArabicCurrency } from '../utils/format'
import { useData } from '../contexts/DataContext'
import { DollarSign, Search, Plus, Trash2, X, Save, Calendar, Activity, AlertTriangle } from 'lucide-react'

interface Expense {
  ExpenseID: number
  Description: string
  Amount: number
  ExpenseDate: string
  CreatedDate?: string
}

export default function Expenses() {
  const { refreshStats } = useData()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0] // Defaults to YYYY-MM-DD
  })

  useEffect(() => {
    loadExpenses()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = expenses.filter((exp) =>
        (exp.Description || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredExpenses(filtered)
    } else {
      setFilteredExpenses(expenses)
    }
  }, [searchTerm, expenses])

  const loadExpenses = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const result = await window.api.getExpenses()
      if (result && result.success && Array.isArray(result.data)) {
        setExpenses(result.data)
        setFilteredExpenses(result.data)
      } else {
        setFetchError(result?.error || 'فشل جلب المصروفات من قاعدة البيانات.')
        setExpenses([])
        setFilteredExpenses([])
      }
    } catch (err: any) {
      console.error('Error loading expenses:', err)
      setFetchError(err.message || 'حدث خطأ غير متوقع أثناء الاتصال بالخادم.')
      setExpenses([])
      setFilteredExpenses([])
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setErrorMessage(null)
    setFormData({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0]
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number, desc: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف المصروف "${desc}"؟`)) {
      return
    }

    try {
      const result = await window.api.deleteExpense(id)
      if (result.success) {
        loadExpenses()
        refreshStats()
      } else {
        alert('فشل حذف المصروف: ' + result.error)
      }
    } catch (err: any) {
      alert('حدث خطأ أثناء الاتصال بالخادم لحذف المصروف: ' + err.message)
    }
  }

  const handleSave = async () => {
    if (!formData.description.trim() || !formData.amount.trim() || !formData.date) {
      setErrorMessage('الوصف، القيمة، والتاريخ حقول إجبارية.')
      return
    }

    const parsedAmount = parseFloat(formData.amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('يرجى إدخال قيمة مالية صالحة أكبر من الصفر.')
      return
    }

    try {
      const result = await window.api.addExpense({
        description: formData.description.trim(),
        amount: parsedAmount,
        date: formData.date
      })

      if (result.success) {
        setShowModal(false)
        loadExpenses()
        refreshStats()
      } else {
        setErrorMessage(result.error || 'فشل تسجيل المصروف في قاعدة البيانات.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ البيانات.')
    }
  }

  const totalSum = expenses.reduce((sum, exp) => sum + (Number(exp.Amount) || 0), 0)

  return (
    <div className="h-screen flex flex-col overflow-hidden text-right">
      {/* Premium Header */}
      <header className="bg-gradient-to-b from-[#0e1220]/65 to-transparent border-b border-gray-800/40 backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
        <div className="px-8 py-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
              إدارة النفقات
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-2 flex items-center gap-2.5 justify-start">
              <DollarSign className="w-6 h-6 text-red-400" />
              إدارة وسجل المصروفات العامة
            </h2>
            <p className="text-xs text-gray-400">إضافة وتتبع المصروفات التشغيلية والنفقات وتحديث لوحات التحكم تلقائياً.</p>
          </div>

          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.25)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مصروف جديد</span>
          </button>
        </div>
      </header>

      {/* Grid Content */}
      <div className="flex-1 p-8 overflow-y-auto space-y-6 min-h-0">
        {fetchError && (
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-3.5 shadow-2xl justify-start">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-400 font-semibold text-sm mb-1">خطأ في جلب البيانات</h3>
              <p className="text-red-300/80 text-xs">{fetchError}</p>
            </div>
          </div>
        )}

        {/* Expenses Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel bg-gradient-to-br from-red-500/10 via-rose-600/5 to-transparent rounded-2xl p-5 border border-red-500/20 transition-all duration-300 hover:border-red-500/30">
            <div className="flex items-start justify-between flex-row-reverse">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">إجمالي المصروفات المسجلة</p>
                <h3 className="text-3xl font-extrabold tracking-tight text-white" dir="rtl">{formatArabicCurrency(totalSum)}</h3>
                <p className="text-[10px] text-gray-500 mt-2 font-medium">مجموع كل المصروفات المدخلة بالنظام</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 shadow-inner">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="glass-panel border border-gray-800/40 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
            <input
              type="text"
              placeholder="البحث عن المصروف بالوصف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 text-sm"
            />
          </div>
        </div>

        {/* Table View */}
        <div className="glass-panel border border-gray-800/40 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-right">
              <thead>
                <tr className="border-b border-gray-800/60 bg-[#0a0d18]/60 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">رقم القيد</th>
                  <th className="px-6 py-4">التاريخ</th>
                  <th className="px-6 py-4">بيان / وصف المصروف</th>
                  <th className="px-6 py-4 text-left">المبلغ</th>
                  <th className="px-6 py-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Activity className="w-6 h-6 text-red-400 animate-spin" />
                        <p className="text-gray-400 text-xs">جاري تحميل سجل المصروفات...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-gray-500 text-sm">لا توجد أي مصروفات مسجلة تطابق بحثك.</p>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.ExpenseID} className="hover:bg-gray-800/10 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-400">#{toArabicDigits(exp.ExpenseID)}</td>
                      <td className="px-6 py-4 text-gray-300">
                        {exp.ExpenseDate ? toArabicDigits(new Date(exp.ExpenseDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })) : '-'}
                      </td>
                      <td className="px-6 py-4 text-white font-medium">{exp.Description}</td>
                      <td className="px-6 py-4 font-bold text-red-400 text-left" dir="rtl">
                        {formatArabicCurrency(exp.Amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDelete(exp.ExpenseID, exp.Description)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-all"
                          title="حذف القيد"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modern Glassmorphic Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-modal w-full max-w-lg rounded-2xl overflow-hidden border border-gray-800/80 shadow-2xl flex flex-col text-right">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-red-500/10 to-rose-500/10 border-b border-gray-800/40 flex items-center justify-between">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-red-400" />
                إضافة مصروف جديد
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-gray-800/50 rounded-lg text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 flex-1">
              {errorMessage && (
                <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-2.5 justify-start">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-xs">{errorMessage}</p>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 block">بيان / وصف المصروف *</label>
                <input
                  type="text"
                  placeholder="مثال: فاتورة كهرباء، مرتبات، إيجار..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-850 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 text-right"
                />
              </div>

              {/* Amount & Date Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 block">القيمة المالية *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    dir="ltr"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-850 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 text-left font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 block">التاريخ *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-900/60 border border-gray-850 rounded-xl text-white focus:outline-none focus:border-red-500/50 text-right"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-900/40 border-t border-gray-800/40 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-800/40 hover:bg-gray-800 text-gray-300 text-xs font-semibold rounded-xl border border-gray-700/30 transition-all"
              >
                إلغاء الأمر
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-semibold rounded-xl border border-red-500/30 hover:border-red-500/40 transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ المصروف</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
