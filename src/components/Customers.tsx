import { useEffect, useState } from 'react'
import { toArabicDigits } from '../utils/format'
import { useData } from '../contexts/DataContext'
import { Users, Search, Plus, Edit, Trash2, X, Save, AlertTriangle } from 'lucide-react'
import type { Customer } from '../types/electron'

export default function Customers() {
  const { refreshStats } = useData()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    CustomerCode: '',
    CustomerName: '',
    Phone: '',
    Mobile2: '',
    Email: '',
    Address: '',
    Notes: '',
    IsActive: true,
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(
        (c) =>
          c.CustomerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.CustomerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.Phone || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers(customers)
    }
  }, [searchTerm, customers])

  const loadCustomers = async () => {
    setLoading(true)
    const result = await window.api.getCustomers()
    if (result.success && result.data) {
      setCustomers(result.data)
      setFilteredCustomers(result.data)
    }
    setLoading(false)
  }

  const handleAdd = () => {
    setEditingCustomer(null)
    setErrorMessage(null)
    setFormData({
      CustomerCode: '',
      CustomerName: '',
      Phone: '',
      Mobile2: '',
      Email: '',
      Address: '',
      Notes: '',
      IsActive: true,
    })
    setShowModal(true)
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setErrorMessage(null)
    setFormData({
      CustomerCode: customer.CustomerCode,
      CustomerName: customer.CustomerName,
      Phone: customer.Phone || '',
      Mobile2: customer.Mobile2 || '',
      Email: customer.Email || '',
      Address: customer.Address || '',
      Notes: customer.Notes || '',
      IsActive: customer.IsActive,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.CustomerCode.trim() || !formData.CustomerName.trim() || !formData.Phone.trim()) {
      setErrorMessage('رمز العميل، واسمه الكامل، ورقم الهاتف الأساسي حقول إجبارية.')
      return
    }

    try {
      let result
      if (editingCustomer) {
        // Update
        result = await window.api.updateCustomer({
          CustomerID: editingCustomer.CustomerID,
          ...formData,
        })
      } else {
        // Insert
        result = await window.api.addCustomer(formData)
      }

      if (result.success) {
        setShowModal(false)
        loadCustomers()
        refreshStats()
      } else {
        setErrorMessage(result.error || 'فشل حفظ تفاصيل العميل.')
      }
    } catch (error: any) {
      console.error('Save error:', error)
      setErrorMessage(error.message || 'حدث خطأ غير متوقع أثناء عملية الحفظ.')
    }
  }

  const handleDelete = async (customer: Customer) => {
    if (confirm(`هل أنت متأكد من رغبتك في حذف ملف العميل "${customer.CustomerName}"؟`)) {
      const result = await window.api.deleteCustomer(customer.CustomerID)
      if (result.success) {
        loadCustomers()
        refreshStats()
      } else {
        alert('فشل حذف العميل: ' + result.error)
      }
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden text-right">
      {/* Premium Header */}
      <header className="bg-gradient-to-b from-[#0e1220]/65 to-transparent border-b border-gray-800/40 backdrop-blur-md flex-shrink-0 z-10">
        <div className="px-8 py-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              دليل إدارة العملاء
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-2 flex items-center gap-2.5 justify-start">
              <Users className="w-6 h-6 text-emerald-400" />
              سجل حسابات العملاء
            </h2>
            <p className="text-xs text-gray-400">إدارة معلومات وبيانات العملاء، وتحديث سجلات الاتصال والهواتف والعناوين والملاحظات المرفقة.</p>
          </div>
          
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_20px_rgba(16,185,129,0.45)]"
          >
            <Plus className="w-4 h-4" />
            إضافة عميل جديد
          </button>
        </div>
      </header>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* Search Panel */}
        <div className="mb-6 relative group max-w-xl text-right">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500 transition-colors group-focus-within:text-emerald-400" />
          <input
            type="text"
            placeholder="البحث بالاسم، أو الرمز، أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-11 pl-4 py-3 input-premium text-sm text-right"
          />
        </div>

        {/* Premium Directory Table */}
        <div className="glass-panel border border-gray-800/50 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-950/60 border-b border-gray-800/80">
                  <th className="p-4 text-right">رمز العميل</th>
                  <th className="p-4 text-right">اسم العميل الكامل</th>
                  <th className="p-4 text-right">الهاتف</th>
                  <th className="p-4 text-right">البريد الإلكتروني</th>
                  <th className="p-4 text-right">العنوان</th>
                  <th className="p-4 text-center">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-xs text-gray-500">
                      جاري تحميل سجل العملاء...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-xs text-gray-500">
                      لا يوجد عملاء مسجلون بالنظام حالياً
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer.CustomerID}
                      className="hover:bg-gray-800/15 transition-colors group"
                    >
                      <td className="p-4 text-xs font-mono text-emerald-400 font-bold group-hover:text-emerald-300 text-right" dir="ltr">
                        {toArabicDigits(customer.CustomerCode)}
                      </td>
                      <td className="p-4 font-semibold text-gray-200 text-right">{customer.CustomerName}</td>
                      <td className="p-4 text-xs text-gray-400 text-right" dir="rtl">{toArabicDigits(customer.Phone)}</td>
                      <td className="p-4 text-xs text-gray-400 text-right">{customer.Email || '-'}</td>
                      <td className="p-4 text-xs text-gray-400 max-w-xs truncate text-right">{customer.Address || '-'}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${
                            customer.IsActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {customer.IsActive ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg border border-transparent hover:border-blue-500/25 transition-all"
                            title="تعديل"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/25 transition-all"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Premium Glassmorphic Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in text-right">
          <div className="glass-modal border border-gray-700/40 rounded-2xl p-6 w-full max-w-lg relative overflow-hidden">
            {/* Top subtle neon line indicator */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-row-reverse">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 justify-start flex-row-reverse">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>{editingCustomer ? 'تعديل بيانات حساب العميل' : 'تسجيل عميل جديد'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-gray-800/60 rounded-lg border border-transparent hover:border-gray-800 transition-all text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Alerts */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 justify-start flex-row-reverse">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-xs leading-relaxed text-right">{errorMessage}</p>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="text-right">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">رمز العميل</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.CustomerCode}
                    onChange={(e) => setFormData({ ...formData, CustomerCode: e.target.value })}
                    className="w-full px-3.5 py-2 input-premium text-xs text-left"
                    placeholder="مثال: CUST-01"
                  />
                </div>
                <div className="text-right">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">اسم العميل الكامل</label>
                  <input
                    type="text"
                    value={formData.CustomerName}
                    onChange={(e) => setFormData({ ...formData, CustomerName: e.target.value })}
                    className="w-full px-3.5 py-2 input-premium text-xs text-right"
                    placeholder="مثال: محمد أحمد"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="text-right">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">الهاتف الأساسي</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.Phone}
                    onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                    className="w-full px-3.5 py-2 input-premium text-xs text-left"
                    placeholder="مثال: 0500000000"
                  />
                </div>
                <div className="text-right">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">هاتف بديل / إضافي</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.Mobile2}
                    onChange={(e) => setFormData({ ...formData, Mobile2: e.target.value })}
                    className="w-full px-3.5 py-2 input-premium text-xs text-left"
                    placeholder="مثال: 0599999999"
                  />
                </div>
              </div>

              <div className="text-right">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">البريد الإلكتروني</label>
                <input
                  type="email"
                  dir="ltr"
                  value={formData.Email}
                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                  className="w-full px-3.5 py-2 input-premium text-xs text-left"
                  placeholder="john@example.com"
                />
              </div>

              <div className="text-right">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">العنوان السكني / التجاري</label>
                <textarea
                  value={formData.Address}
                  onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2 input-premium text-xs text-right"
                  placeholder="مثال: شارع الملك فهد، حي الياسمين..."
                />
              </div>

              <div className="text-right">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">ملاحظات / تفاصيل إضافية</label>
                <textarea
                  value={formData.Notes}
                  onChange={(e) => setFormData({ ...formData, Notes: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2 input-premium text-xs text-right"
                  placeholder="أدخل أي ملاحظات فنية أو تفاصيل تعاقدية..."
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2 justify-start flex-row-reverse">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.IsActive}
                  onChange={(e) => setFormData({ ...formData, IsActive: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 bg-gray-900 border-gray-700 rounded focus:ring-emerald-500 focus:ring-offset-gray-900"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-gray-300">
                  تنشيط الحساب (السماح بالعمليات والفواتير)
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700/50 rounded-xl text-gray-300 text-xs font-semibold transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                <Save className="w-4 h-4" />
                حفظ بيانات العميل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
