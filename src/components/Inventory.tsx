import { useEffect, useState } from 'react'
import { useData } from '../contexts/DataContext'
import { Package, Search, Plus, Edit, Trash2, X, Save, AlertTriangle } from 'lucide-react'
import type { Item } from '../types/electron'

export default function Inventory() {
  const { refreshStats } = useData()
  const [items, setItems] = useState<Item[]>([])
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    ItemCode: '',
    ItemName: '',
    Unit: '',
    MinStock: 0,
    CurrentStock: 0,
    SalePrice: 0,
    CostPrice: 0,
  })

  useEffect(() => {
    loadItems()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = items.filter(
        (item) =>
          (item.ItemCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.ItemName || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredItems(filtered)
    } else {
      setFilteredItems(items)
    }
  }, [searchTerm, items])

  const loadItems = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const result = await window.api.getItems()
      if (result && result.success && Array.isArray(result.data)) {
        setItems(result.data)
        setFilteredItems(result.data)
      } else {
        setFetchError(result?.error || 'فشل جلب دليل الأصناف من قاعدة البيانات.')
        setItems([])
        setFilteredItems([])
      }
    } catch (err: any) {
      console.error('Error loading inventory items:', err)
      setFetchError(err.message || 'حدث خطأ غير متوقع أثناء الاتصال بالخادم.')
      setItems([])
      setFilteredItems([])
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: any) => {
    if (price === null || price === undefined) return '0.00'
    const num = typeof price === 'number' ? price : parseFloat(price)
    return isNaN(num) ? '0.00' : num.toFixed(2)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setErrorMessage(null)
    setFormData({
      ItemCode: '',
      ItemName: '',
      Unit: 'حبة',
      MinStock: 0,
      CurrentStock: 0,
      SalePrice: 0,
      CostPrice: 0,
    })
    setShowModal(true)
  }

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setErrorMessage(null)
    setFormData({
      ItemCode: item.ItemCode,
      ItemName: item.ItemName,
      Unit: item.Unit,
      MinStock: item.MinStock,
      CurrentStock: item.CurrentStock,
      SalePrice: item.SalePrice,
      CostPrice: item.CostPrice,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.ItemCode.trim() || !formData.ItemName.trim()) {
      setErrorMessage('رمز المنتج واسم المنتج حقول إجبارية.')
      return
    }

    try {
      let result
      if (editingItem) {
        // Update
        result = await window.api.updateItem({
          ItemID: editingItem.ItemID,
          ...formData,
        })
      } else {
        // Insert
        result = await window.api.addItem(formData)
      }

      if (result.success) {
        setShowModal(false)
        loadItems()
        refreshStats()
      } else {
        setErrorMessage(result.error || 'فشل حفظ تفاصيل المنتج.')
      }
    } catch (error: any) {
      console.error('Save error:', error)
      setErrorMessage(error.message || 'حدث خطأ أثناء عملية الحفظ.')
    }
  }

  const handleDelete = async (item: Item) => {
    if (confirm(`هل أنت متأكد من رغبتك في حذف المنتج "${item.ItemName}"؟`)) {
      const result = await window.api.deleteItem(item.ItemID)
      if (result.success) {
        loadItems()
        refreshStats()
      } else {
        alert('فشل حذف المنتج: ' + result.error)
      }
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden text-right">
      {/* Premium Header */}
      <header className="bg-gradient-to-b from-[#0e1220]/65 to-transparent border-b border-gray-800/40 backdrop-blur-md flex-shrink-0 z-10">
        <div className="px-8 py-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
              نظام المخزون والمنتجات
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-2 flex items-center gap-2.5 justify-start">
              <Package className="w-6 h-6 text-indigo-400" />
              دليل المستودع
            </h2>
            <p className="text-xs text-gray-400">إدارة المنتجات، وضبط مستويات الطلب وتنبيه الرصيد، وتحديث الأسعار والمقاييس الماليّة.</p>
          </div>
          
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.25)] hover:shadow-[0_0_20px_rgba(59,130,246,0.45)]"
          >
            <Plus className="w-4 h-4" />
            إضافة منتج جديد
          </button>
        </div>
      </header>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* Fetch Error Banner */}
        {fetchError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3.5 shadow-2xl shadow-red-500/5 animate-fade-in max-w-xl justify-start">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-right">
              <h3 className="text-red-400 font-semibold text-sm">مشكلة مزامنة قاعدة البيانات</h3>
              <p className="text-red-300/80 text-xs mt-1 leading-relaxed">{fetchError}</p>
            </div>
          </div>
        )}

        {/* Search Panel */}
        <div className="mb-6 relative group max-w-xl text-right">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500 transition-colors group-focus-within:text-blue-400" />
          <input
            type="text"
            placeholder="البحث عن المنتجات بالرمز أو الوصف..."
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
                  <th className="p-4 text-right">رمز الصنف</th>
                  <th className="p-4 text-right">اسم / وصف المنتج</th>
                  <th className="p-4 text-right">الوحدة</th>
                  <th className="p-4 text-center">الرصيد الحالي</th>
                  <th className="p-4 text-center">الحد الأدنى</th>
                  <th className="p-4 text-left">سعر البيع</th>
                  <th className="p-4 text-left">سعر التكلفة</th>
                  <th className="p-4 text-center">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-xs text-gray-500">
                      جاري تحميل دليل المخزون...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-xs text-gray-500">
                      لا توجد منتجات مسجلة بالمخزن
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLowStock = item.CurrentStock < item.MinStock
                    return (
                      <tr
                        key={item.ItemID}
                        className="hover:bg-gray-800/15 transition-colors group"
                      >
                        <td className="p-4 text-xs font-mono text-indigo-400 font-bold group-hover:text-indigo-300 text-right" dir="ltr">
                          {item.ItemCode}
                        </td>
                        <td className="p-4 font-semibold text-gray-200 text-right">{item.ItemName}</td>
                        <td className="p-4 text-xs text-gray-400 text-right">{item.Unit}</td>
                        <td
                          className={`p-4 text-center font-bold text-xs ${
                            isLowStock ? 'text-red-400 bg-red-500/5' : 'text-emerald-400'
                          }`}
                        >
                          {item.CurrentStock}
                        </td>
                        <td className="p-4 text-center text-xs text-gray-500">{item.MinStock}</td>
                        <td className="p-4 text-left text-xs font-bold text-emerald-400">${formatPrice(item.SalePrice)}</td>
                        <td className="p-4 text-left text-xs font-bold text-orange-400">${formatPrice(item.CostPrice)}</td>
                        <td className="p-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${
                              isLowStock
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {isLowStock ? 'مخزون منخفض' : 'متوفر'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg border border-transparent hover:border-blue-500/25 transition-all"
                              title="تعديل"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/25 transition-all"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Premium Glassmorphic Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in text-right">
          <div className="glass-modal border border-gray-700/40 rounded-2xl p-6 w-full max-w-md animate-fade-in relative overflow-hidden">
            {/* Top subtle neon line indicator */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-row-reverse">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 justify-start flex-row-reverse">
                <Package className="w-5 h-5 text-indigo-400" />
                <span>{editingItem ? 'تعديل بيانات المنتج' : 'تسجيل منتج جديد'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-gray-800/60 rounded-lg border border-transparent hover:border-gray-800 transition-all text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error alerts inside modal */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 justify-start flex-row-reverse">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-xs leading-relaxed text-right">{errorMessage}</p>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4 text-right">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 text-right">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">رمز الصنف</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.ItemCode}
                    onChange={(e) => setFormData({ ...formData, ItemCode: e.target.value })}
                    className="w-full px-3.5 py-2 input-premium text-xs text-left"
                    placeholder="e.g. ITEM-01"
                  />
                </div>
                <div className="text-right">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">الوحدة</label>
                  <input
                    type="text"
                    value={formData.Unit}
                    onChange={(e) => setFormData({ ...formData, Unit: e.target.value })}
                    className="w-full px-3.5 py-2 input-premium text-xs text-right"
                    placeholder="مثال: حبة"
                  />
                </div>
              </div>

              <div className="text-right">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">اسم المنتج / الوصف</label>
                <input
                  type="text"
                  value={formData.ItemName}
                  onChange={(e) => setFormData({ ...formData, ItemName: e.target.value })}
                  className="w-full px-3.5 py-2 input-premium text-xs text-right"
                  placeholder="مثال: كرتون تعبئة وتغليف"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-right">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-right">الحد الأدنى للطلب</label>
                  <input
                    type="number"
                    dir="ltr"
                    value={formData.MinStock}
                    onChange={(e) =>
                      setFormData({ ...formData, MinStock: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className="w-full px-3.5 py-2 input-premium text-xs text-center font-mono text-left"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-right">الرصيد الحالي</label>
                  <input
                    type="number"
                    dir="ltr"
                    value={formData.CurrentStock}
                    disabled={!!editingItem} // Normally adjusted via purchase/sales
                    onChange={(e) =>
                      setFormData({ ...formData, CurrentStock: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className="w-full px-3.5 py-2 input-premium text-xs text-center font-mono disabled:opacity-55 disabled:cursor-not-allowed text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-right">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-right">سعر البيع ($)</label>
                  <input
                    type="number"
                    dir="ltr"
                    step="0.01"
                    value={formData.SalePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, SalePrice: Math.max(0, parseFloat(e.target.value) || 0) })
                    }
                    className="w-full px-3.5 py-2 input-premium text-xs text-center font-mono text-left"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 text-right">تكلفة الشراء ($)</label>
                  <input
                    type="number"
                    dir="ltr"
                    step="0.01"
                    value={formData.CostPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, CostPrice: Math.max(0, parseFloat(e.target.value) || 0) })
                    }
                    className="w-full px-3.5 py-2 input-premium text-xs text-center font-mono text-left"
                  />
                </div>
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
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_12px_rgba(59,130,246,0.2)]"
              >
                <Save className="w-4 h-4" />
                حفظ المنتج
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
