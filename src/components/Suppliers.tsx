import { useEffect, useState } from 'react'
import { toArabicDigits } from '../utils/format'
import { Users, Search, Plus, Edit, Trash2, X, Save, AlertTriangle } from 'lucide-react'
import type { Supplier } from '../types/electron'

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    SupplierCode: '',
    SupplierName: '',
    Phone: '',
    Email: '',
    Address: '',
    IsActive: true,
  })

  useEffect(() => {
    loadSuppliers()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = suppliers.filter(
        (s) =>
          s.SupplierCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.SupplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.Phone || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredSuppliers(filtered)
    } else {
      setFilteredSuppliers(suppliers)
    }
  }, [searchTerm, suppliers])

  const loadSuppliers = async () => {
    setLoading(true)
    const result = await window.api.getSuppliers()
    if (result.success && result.data) {
      setSuppliers(result.data)
      setFilteredSuppliers(result.data)
    }
    setLoading(false)
  }

  const handleAdd = () => {
    setEditingSupplier(null)
    setErrorMessage(null)
    setFormData({
      SupplierCode: '',
      SupplierName: '',
      Phone: '',
      Email: '',
      Address: '',
      IsActive: true,
    })
    setShowModal(true)
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setErrorMessage(null)
    setFormData({
      SupplierCode: supplier.SupplierCode,
      SupplierName: supplier.SupplierName,
      Phone: supplier.Phone || '',
      Email: supplier.Email || '',
      Address: supplier.Address || '',
      IsActive: supplier.IsActive,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.SupplierCode.trim() || !formData.SupplierName.trim() || !formData.Phone.trim()) {
      setErrorMessage('رمز المورد، واسمه الكامل، ورقم الهاتف حقول إجبارية.')
      return
    }

    try {
      let result
      if (editingSupplier) {
        // Update
        result = await window.api.updateSupplier({
          SupplierID: editingSupplier.SupplierID,
          ...formData,
        })
      } else {
        // Insert
        result = await window.api.addSupplier(formData)
      }

      if (result.success) {
        setShowModal(false)
        loadSuppliers()
      } else {
        setErrorMessage(result.error || 'فشل حفظ تفاصيل المورد.')
      }
    } catch (error: any) {
      console.error('Save error:', error)
      setErrorMessage(error.message || 'حدث خطأ غير متوقع أثناء عملية الحفظ.')
    }
  }

  const handleDelete = async (supplier: Supplier) => {
    if (confirm(`هل أنت متأكد من رغبتك في حذف ملف المورد "${supplier.SupplierName}"؟`)) {
      const result = await window.api.deleteSupplier(supplier.SupplierID)
      if (result.success) {
        loadSuppliers()
      } else {
        alert('فشل حذف المورد: ' + result.error)
      }
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden text-right">
      {/* Premium Header */}
      <header className="bg-gradient-to-b from-[#0e1220]/65 to-transparent border-b border-gray-800/40 backdrop-blur-md flex-shrink-0 z-10">
        <div className="px-8 py-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
              دليل الموردين والتجارة
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-2 flex items-center gap-2.5 justify-start">
              <Users className="w-6 h-6 text-teal-400" />
              سجل حسابات الموردين
            </h2>
            <p className="text-xs text-gray-400">إدارة معلومات وبيانات الموردين، وسجلات الاتصال، والبريد الإلكتروني، وعناوين الفروع ومستودعات التوريد.</p>
          </div>
          
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.25)] hover:shadow-[0_0_20px_rgba(20,184,166,0.45)]"
          >
            <Plus className="w-4 h-4" />
            إضافة مورد جديد
          </button>
        </div>
      </header>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* Search Panel */}
        <div className="mb-6 relative group max-w-xl text-right">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500 transition-colors group-focus-within:text-teal-400" />
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
                  <th className="p-4 text-right">رمز المورد</th>
                  <th className="p-4 text-right">اسم المورد الكامل</th>
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
                      جاري تحميل سجل الموردين...
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-xs text-gray-500">
                      لا يوجد موردون مسجلون بالنظام حالياً
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <tr
                      key={supplier.SupplierID}
                      className="hover:bg-gray-800/15 transition-colors group"
                    >
                      <td className="p-4 text-xs font-mono text-teal-400 font-bold group-hover:text-teal-300 text-right" dir="ltr">
                        {toArabicDigits(supplier.SupplierCode)}
                      </td>
                      <td className="p-4 font-semibold text-gray-200 text-right">{supplier.SupplierName}</td>
                      <td className="p-4 text-xs text-gray-400 text-right" dir="rtl">{toArabicDigits(supplier.Phone)}</td>
                      <td className="p-4 text-xs text-gray-400 text-right">{supplier.Email || '-'}</td>
                      <td className="p-4 text-xs text-gray-400 max-w-xs truncate text-right">{supplier.Address || '-'}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${
                            supplier.IsActive
                              ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {supplier.IsActive ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg border border-transparent hover:border-blue-500/25 transition-all"
                            title="تعديل"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(supplier)}
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
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-teal-500/60 to-transparent"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-row-reverse">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 justify-start flex-row-reverse">
                <Users className="w-5 h-5 text-teal-400" />
                <span>{editingSupplier ? 'تعديل بيانات حساب المورد' : 'تسجيل مورد جديد'}</span>
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
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">رمز المورد</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.SupplierCode}
                    onChange={(e) => setFormData({ ...formData, SupplierCode: e.target.value })}
                    className="w-full px-3.5 py-2 input-premium text-xs text-left"
                    placeholder="مثال: SUPP-01"
                  />
                </div>
                <div className="text-right">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">اسم شركة المورد</label>
                  <input
                    type="text"
                    value={formData.SupplierName}
                    onChange={(e) => setFormData({ ...formData, SupplierName: e.target.value })}
                    className="w-full px-3.5 py-2 input-premium text-xs text-right"
                    placeholder="مثال: شركة النجم للتوريدات"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="text-right">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">هاتف الشركة</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.Phone}
                    onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                    className="w-full px-3.5 py-2 input-premium text-xs text-left"
                    placeholder="مثال: 0110002222"
                  />
                </div>
                <div className="text-right">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">البريد الإلكتروني</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={formData.Email}
                    onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                    className="w-full px-3.5 py-2 input-premium text-xs text-left"
                    placeholder="contact@example.com"
                  />
                </div>
              </div>

              <div className="text-right">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">عنوان الشركة / المستودع</label>
                <textarea
                  value={formData.Address}
                  onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2 input-premium text-xs text-right"
                  placeholder="مثال: المنطقة الصناعية الثانية، الشارع العام..."
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2 justify-start flex-row-reverse">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.IsActive}
                  onChange={(e) => setFormData({ ...formData, IsActive: e.target.checked })}
                  className="w-4 h-4 text-teal-600 bg-gray-900 border-gray-700 rounded focus:ring-teal-500 focus:ring-offset-gray-900"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-gray-300">
                  تنشيط الحساب (السماح بعمليات الشحن والفوترة)
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
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_12px_rgba(20,184,166,0.2)]"
              >
                <Save className="w-4 h-4" />
                حفظ بيانات المورد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
