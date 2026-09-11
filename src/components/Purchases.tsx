import { useEffect, useState } from 'react'
import { useData } from '../contexts/DataContext'
import { toArabicDigits, formatArabicCurrency } from '../utils/format'
import { ShoppingCart, Plus, Trash2, Package, User, CreditCard, DollarSign, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { Supplier, Item, PaymentMethod, Purchase, PurchaseItem } from '../types/electron'

export default function Purchases() {
  const { refreshStats } = useData()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  
  // Purchase form
  const [invoiceNo, setInvoiceNo] = useState<string>('')
  const [selectedSupplier, setSelectedSupplier] = useState<number>(0)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number>(0)
  const [selectedItem, setSelectedItem] = useState<number>(0)
  const [quantity, setQuantity] = useState<number>(1)
  const [unitCost, setUnitCost] = useState<number>(0)
  const [cart, setCart] = useState<PurchaseItem[]>([])
  const [paidAmount, setPaidAmount] = useState<number>(0)

  // UX Alerts
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const item = items.find(i => i.ItemID === selectedItem)
    if (item) {
      setUnitCost(item.CostPrice)
    }
  }, [selectedItem, items])

  const showAlert = (text: string, type: 'success' | 'error') => {
    setAlertMsg({ type, text })
    setTimeout(() => setAlertMsg(null), 5000)
  }

  const loadData = async () => {
    const [suppResult, itemResult, pmResult, purchResult] = await Promise.all([
      window.api.getSuppliers(),
      window.api.getItems(),
      window.api.getPaymentMethods(),
      window.api.getPurchases(200),
    ])
    
    if (suppResult.success && suppResult.data) setSuppliers(suppResult.data.filter(s => s.IsActive))
    if (itemResult.success && itemResult.data) setItems(itemResult.data)
    if (pmResult.success && pmResult.data) setPaymentMethods(pmResult.data)
    if (purchResult.success && purchResult.data) setPurchases(purchResult.data)
  }

  const addToCart = () => {
    if (!selectedItem || quantity <= 0) {
      showAlert('يرجى تحديد الصنف والكمية الواردة أولاً', 'error')
      return
    }
    
    const lineTotal = quantity * unitCost
    const newItem: PurchaseItem = {
      itemID: selectedItem,
      quantity,
      unitCost,
      lineTotal,
    }
    
    setCart([...cart, newItem])
    setSelectedItem(0)
    setQuantity(1)
    setUnitCost(0)
    showAlert('تم إضافة الصنف إلى مسودة التوريد', 'success')
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
    showAlert('تم إزالة الصنف من مسودة التوريد', 'success')
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.lineTotal, 0)
  const remainingAmount = totalAmount - paidAmount

  const savePurchase = async () => {
    if (!invoiceNo.trim()) {
      showAlert('يرجى إدخال رقم الفاتورة أو المرجع', 'error')
      return
    }
    if (!selectedSupplier) {
      showAlert('يرجى اختيار المورد المسؤول', 'error')
      return
    }
    if (!selectedPaymentMethod) {
      showAlert('يرجى اختيار طريقة السداد المعتمدة', 'error')
      return
    }
    if (cart.length === 0) {
      showAlert('يرجى إضافة صنف توريد واحد على الأقل لحفظ الفاتورة', 'error')
      return
    }

    const result = await window.api.savePurchase({
      invoiceNo,
      supplierID: selectedSupplier,
      paymentMethodID: selectedPaymentMethod,
      totalAmount,
      paidAmount,
      remainingAmount,
      items: cart,
    })

    if (result.success) {
      showAlert('تم حفظ الفاتورة وتوريد المخزون بنجاح!', 'success')
      setInvoiceNo('')
      setSelectedSupplier(0)
      setSelectedPaymentMethod(0)
      setCart([])
      setPaidAmount(0)
      loadData()
      refreshStats()
    } else {
      showAlert('فشل حفظ عملية المشتريات: ' + result.error, 'error')
    }
  }

  return (
    <div className="min-h-screen pb-12 text-right">
      {/* Premium Header */}
      <header className="bg-gradient-to-b from-[#0e1220]/65 to-transparent border-b border-gray-800/40 backdrop-blur-md sticky top-0 z-10">
        <div className="px-8 py-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
              مركز المشتريات والتوريد
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-2 flex items-center gap-2.5 justify-start">
              <ShoppingCart className="w-6 h-6 text-purple-400" />
              المشتريات وتوريد المخزن
            </h2>
            <p className="text-xs text-gray-400">سجل فواتير توريد المنتجات الواردة، واضبط أسعار تكلفة التوريد، وتابع حسابات الموردين الدائنة.</p>
          </div>
        </div>
      </header>

      {/* Grid Content */}
      <div className="p-8">
        {/* Custom Alerts */}
        {alertMsg && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border animate-fade-in justify-start flex-row-reverse ${
            alertMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-red-500/10 border-red-500/20 text-red-300'
          }`}>
            {alertMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-xs font-semibold">{alertMsg.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT (RTL Right): New Purchase Builder */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel border border-gray-800/50 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2 border-b border-gray-800/40 pb-3 justify-start flex-row-reverse">
                <Package className="w-4.5 h-4.5 text-purple-400" />
                <span>تسجيل فاتورة توريد ومشتريات جديدة</span>
              </h3>

              {/* Supply Details Form */}
              <div className="space-y-4 mb-5 text-right">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1 justify-start flex-row-reverse">
                    <FileText className="w-3 h-3 text-indigo-400" /> <span>رقم الفاتورة / المرجع</span>
                  </label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    placeholder="أدخل رقم الفاتورة الصادر من المورد..."
                    className="w-full px-3 py-2 bg-[#0c101c]/80 border border-gray-800 rounded-lg text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/60 text-right"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-right">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1 justify-start flex-row-reverse">
                      <User className="w-3 h-3 text-indigo-400" /> <span>المورد المورد</span>
                    </label>
                    <select
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#0c101c]/80 border border-gray-800 rounded-lg text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/60 text-right"
                    >
                      <option value={0}>اختر المورد...</option>
                      {suppliers.map(s => (
                        <option key={s.SupplierID} value={s.SupplierID}>{s.SupplierName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1 justify-start flex-row-reverse">
                      <CreditCard className="w-3 h-3 text-indigo-400" /> <span>طريقة السداد</span>
                    </label>
                    <select
                      value={selectedPaymentMethod}
                      onChange={(e) => setSelectedPaymentMethod(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#0c101c]/80 border border-gray-800 rounded-lg text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/60 text-right"
                    >
                      <option value={0}>اختر طريقة السداد...</option>
                      {paymentMethods.map(pm => (
                        <option key={pm.PaymentMethodID} value={pm.PaymentMethodID}>{pm.MethodName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Add Item to Purchase */}
              <div className="bg-[#0b0e17]/50 border border-gray-800/80 rounded-xl p-4.5 space-y-4">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 justify-start">
                  إدراج صنف للمخازن
                </h4>
                
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 text-right">تحديد المنتج من المستودع</label>
                  <select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#080b12] border border-gray-800 rounded-lg text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500/50 text-right"
                  >
                    <option value={0}>اختر منتجاً...</option>
                    {items.map(item => (
                      <option key={item.ItemID} value={item.ItemID}>
                        {item.ItemName} (المخزون الحالي: {toArabicDigits(item.CurrentStock)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 text-right">الكمية الواردة</label>
                    <input
                      type="number"
                      dir="ltr"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-[#080b12] border border-gray-800 rounded-lg text-xs text-center font-mono text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500/50 text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 text-right">تكلفة الوحدة من المورد (جنيه)</label>
                    <input
                      type="number"
                      dir="ltr"
                      step="0.01"
                      value={unitCost}
                      onChange={(e) => setUnitCost(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-[#080b12] border border-gray-800 rounded-lg text-xs text-center font-mono text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500/50 text-left"
                    />
                  </div>
                </div>

                <button
                  onClick={addToCart}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  أضف المنتج لمسودة التوريد
                </button>
              </div>
            </div>

            {/* Cart list panel */}
            <div className="glass-panel border border-gray-800/50 rounded-2xl p-6 shadow-2xl">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between border-b border-gray-800/40 pb-3 flex-row-reverse">
                <span>الأصناف المدرجة للتوريد ({toArabicDigits(cart.length)})</span>
                <span className="font-mono text-purple-400 font-extrabold text-sm" dir="rtl">{formatArabicCurrency(totalAmount)}</span>
              </h4>
              
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pl-1">
                {cart.map((item, index) => {
                  const itemData = items.find(i => i.ItemID === item.itemID)
                  return (
                    <div key={index} className="flex items-center justify-between p-3.5 bg-[#0a0d18]/70 border border-gray-800/60 rounded-xl transition-colors hover:border-gray-700/50 flex-row-reverse">
                      <div className="flex-1 min-w-0 pl-4 text-right">
                        <p className="font-semibold text-xs text-gray-200 truncate">{itemData?.ItemName}</p>
                        <p className="text-[10px] text-gray-500 font-mono mt-1 text-right" dir="rtl">
                          الكمية {toArabicDigits(item.quantity)} × {formatArabicCurrency(item.unitCost)} تكلفة الوحدة
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-row-reverse">
                        <span className="text-xs font-extrabold text-purple-400 font-mono" dir="rtl">{formatArabicCurrency(item.lineTotal)}</span>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition-all"
                          title="إزالة المنتج"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                {cart.length === 0 && (
                  <p className="text-center text-xs text-gray-500 py-8 italic">المسودة فارغة. اختر بعض المنتجات من الأعلى لإعداد فاتورة المشتريات.</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT (RTL Left): Totals & Purchases History */}
          <div className="lg:col-span-5 space-y-6">
            {/* Purchase Totals Card */}
            <div className="glass-panel border border-gray-800/50 rounded-2xl p-6 shadow-2xl text-right">
              <h3 className="text-xs font-bold text-white mb-4 border-b border-gray-800/40 pb-3 flex items-center gap-1 justify-start flex-row-reverse">
                <DollarSign className="w-3.5 h-3.5 text-purple-400" /> <span>إجمالي الفاتورة والمدفوع</span>
              </h3>
              
              <div className="space-y-4 text-xs">
                <div className="flex justify-between border-b border-gray-800/40 pb-2 text-sm bg-purple-500/5 p-2 rounded-lg border border-purple-500/10 flex-row-reverse">
                  <span className="text-purple-300 font-bold">إجمالي تكلفة الفاتورة:</span>
                  <span className="font-extrabold font-mono text-purple-400" dir="rtl">{formatArabicCurrency(totalAmount)}</span>
                </div>

                <div className="text-right">
                  <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">المبلغ المدفوع للمورد (جنيه)</label>
                  <input
                    type="number"
                    dir="ltr"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-[#0c101c]/80 border border-gray-800 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500/50 text-left"
                  />
                </div>

                <div className="flex justify-between text-sm bg-orange-500/5 p-2 rounded-lg border border-orange-500/10 mb-4 flex-row-reverse">
                  <span className="text-orange-300 font-bold">رصيد حساب المورد الآجل (المديونية):</span>
                  <span className="font-extrabold font-mono text-orange-400" dir="rtl">{formatArabicCurrency(remainingAmount)}</span>
                </div>

                <button
                  onClick={savePurchase}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl transition-all font-bold tracking-wider shadow-[0_0_15px_rgba(147,51,234,0.2)]"
                >
                  حفظ وتسجيل عملية التوريد
                </button>
              </div>
            </div>

            {/* Purchases History Log */}
            <div className="glass-panel border border-gray-800/50 rounded-2xl p-6 shadow-2xl text-right">
              <h3 className="text-xs font-bold text-white mb-4 border-b border-gray-800/40 pb-3 flex items-center gap-1.5 justify-start flex-row-reverse">
                <FileText className="w-4 h-4 text-blue-400 animate-pulse" /> <span>آخر فواتير التوريد المدخلة</span>
              </h3>
              <div className="overflow-hidden rounded-xl border border-gray-800/80 bg-[#0a0d18]/40">
                <div className="overflow-y-auto max-h-[300px]">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-gray-400 bg-gray-950/60 border-b border-gray-800/80">
                        <th className="p-3 text-right">رقم الفاتورة</th>
                        <th className="p-3 text-right">المورد</th>
                        <th className="p-3 text-left">التكلفة</th>
                        <th className="p-3 text-left">الآجل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40 text-xs">
                      {purchases.map(purchase => (
                        <tr key={purchase.PurchaseID} className="hover:bg-gray-800/10 transition-colors">
                          <td className="p-3 font-mono text-blue-400 font-bold text-right">{toArabicDigits(purchase.InvoiceNo)}</td>
                          <td className="p-3 text-gray-300 font-semibold truncate max-w-[80px] text-right">{purchase.SupplierName}</td>
                          <td className="p-3 text-left text-purple-400 font-bold font-mono" dir="rtl">{formatArabicCurrency(purchase.TotalAmount)}</td>
                          <td className="p-3 text-left text-orange-400 font-bold font-mono" dir="rtl">{formatArabicCurrency(purchase.RemainingAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
