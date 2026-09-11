import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useData } from '../contexts/DataContext'
import { toArabicDigits, formatArabicCurrency } from '../utils/format'
import { TrendingUp, Plus, Trash2, ShoppingCart, User, CreditCard, DollarSign, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react'
import type { Customer, Item, PaymentMethod, Sale, SaleItem } from '../types/electron'

export default function Sales() {
  const { refreshStats } = useData()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  
  // Invoice form
  const [selectedCustomer, setSelectedCustomer] = useState<number>(0)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number>(0)
  const [selectedItem, setSelectedItem] = useState<number>(0)
  const [quantity, setQuantity] = useState<number>(1)
  const [unitPrice, setUnitPrice] = useState<number>(0)
  const [itemDiscount, setItemDiscount] = useState<number>(0)
  const [cart, setCart] = useState<SaleItem[]>([])
  const [globalDiscount, setGlobalDiscount] = useState<number>(0)
  const [paidAmount, setPaidAmount] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')

  // UX Alerts
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [completedSale, setCompletedSale] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const item = items.find(i => i.ItemID === selectedItem)
    if (item) {
      setUnitPrice(item.SalePrice)
    }
  }, [selectedItem, items])

  const showAlert = (text: string, type: 'success' | 'error') => {
    setAlertMsg({ type, text })
    setTimeout(() => setAlertMsg(null), 5000)
  }

  const loadData = async () => {
    const [custResult, itemResult, pmResult, salesResult] = await Promise.all([
      window.api.getCustomers(),
      window.api.getItems(),
      window.api.getPaymentMethods(),
      window.api.getSales(200),
    ])
    
    if (custResult.success && custResult.data) setCustomers(custResult.data.filter(c => c.IsActive))
    if (itemResult.success && itemResult.data) setItems(itemResult.data)
    if (pmResult.success && pmResult.data) setPaymentMethods(pmResult.data)
    if (salesResult.success && salesResult.data) setSales(salesResult.data)
  }

  const addToCart = () => {
    if (!selectedItem || quantity <= 0) {
      showAlert('يرجى تحديد المنتج والكمية المطلوبة أولاً', 'error')
      return
    }

    const item = items.find(i => i.ItemID === selectedItem)
    if (item && item.CurrentStock < quantity) {
      showAlert(`تحذير: المخزون غير كافٍ. الكمية المتوفرة في المخزن هي ${toArabicDigits(item.CurrentStock)} فقط.`, 'error')
      return
    }
    
    const lineTotal = (quantity * unitPrice) - itemDiscount
    const newItem: SaleItem = {
      itemID: selectedItem,
      quantity,
      unitPrice,
      discount: itemDiscount,
      lineTotal,
    }
    
    setCart([...cart, newItem])
    setSelectedItem(0)
    setQuantity(1)
    setUnitPrice(0)
    setItemDiscount(0)
    showAlert('تم إضافة الصنف للفاتورة بنجاح', 'success')
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
    showAlert('تم إزالة الصنف من الفاتورة', 'success')
  }

  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0)
  const totalAmount = subtotal - globalDiscount
  const remainingAmount = totalAmount - paidAmount

  const saveSale = async () => {
    if (!selectedCustomer) {
      showAlert('يرجى تحديد حساب العميل', 'error')
      return
    }
    if (!selectedPaymentMethod) {
      showAlert('يرجى تحديد طريقة السداد', 'error')
      return
    }
    if (cart.length === 0) {
      showAlert('يرجى إضافة صنف واحد على الأقل إلى السلة لحفظ الفاتورة', 'error')
      return
    }

    const result = await window.api.saveSale({
      customerID: selectedCustomer,
      paymentMethodID: selectedPaymentMethod,
      totalAmount,
      discount: globalDiscount,
      paidAmount,
      remainingAmount,
      notes,
      items: cart,
    })

    if (result.success) {
      setCompletedSale({
        saleID: result.data?.saleID || 0,
        customerName: customers.find(c => c.CustomerID === selectedCustomer)?.CustomerName || 'عميل نقدي',
        paymentMethodName: paymentMethods.find(pm => pm.PaymentMethodID === selectedPaymentMethod)?.MethodName || 'نقدي',
        totalAmount,
        paidAmount,
        remainingAmount,
        date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
        items: cart.map(item => {
          const itemData = items.find(i => i.ItemID === item.itemID)
          return {
            itemName: itemData?.ItemName || 'صنف غير معروف',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal
          }
        })
      })
      setSelectedCustomer(0)
      setSelectedPaymentMethod(0)
      setCart([])
      setGlobalDiscount(0)
      setPaidAmount(0)
      setNotes('')
      loadData()
      refreshStats()
    } else {
      showAlert('فشل حفظ الفاتورة: ' + result.error, 'error')
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden text-right">
      {/* Premium Header */}
      <header className="bg-gradient-to-b from-[#0e1220]/65 to-transparent border-b border-gray-800/40 backdrop-blur-md flex-shrink-0 z-10">
        <div className="px-8 py-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
              مركز إدارة الحسابات المالية
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-2 flex items-center gap-2.5 justify-start">
              <TrendingUp className="w-6 h-6 text-rose-400" />
              فواتير المبيعات
            </h2>
            <p className="text-xs text-gray-400">إصدار فواتير العملاء وتتبع المدفوعات والذمم المدينة، ومراجعة قيود البيع الفورية.</p>
          </div>
        </div>
      </header>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-8">
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
          {/* LEFT (RTL Right): New Invoice Builder */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel border border-gray-800/50 rounded-2xl p-6 shadow-2xl relative">
              <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2 border-b border-gray-800/40 pb-3 justify-start flex-row-reverse">
                <ShoppingCart className="w-4.5 h-4.5 text-rose-400" />
                <span>إعداد فاتورة مبيعات جديدة</span>
              </h3>

              {/* Customer & Payment Options */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1 justify-start flex-row-reverse">
                    <User className="w-3 h-3 text-indigo-400" /> <span>حساب العميل</span>
                  </label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#0c101c]/80 border border-gray-800 rounded-lg text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/60 text-right"
                  >
                    <option value={0}>اختر عميلاً...</option>
                    {customers.map(c => (
                      <option key={c.CustomerID} value={c.CustomerID}>{c.CustomerName} ({toArabicDigits(c.CustomerCode)})</option>
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
                    className="w-full px-3 py-2 bg-[#0c101c]/80 border border-gray-800 rounded-lg text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/60 text-right"
                  >
                    <option value={0}>اختر طريقة الدفع...</option>
                    {paymentMethods.map(pm => (
                      <option key={pm.PaymentMethodID} value={pm.PaymentMethodID}>{pm.MethodName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Item Section */}
              <div className="bg-[#0b0e17]/50 border border-gray-800/80 rounded-xl p-4.5 space-y-4">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 justify-start">
                  إضافة صنف
                </h4>
                
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 text-right">تحديد المنتج من القائمة</label>
                  <select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#080b12] border border-gray-800 rounded-lg text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 text-right"
                  >
                    <option value={0}>اختر صنفاً...</option>
                    {items.map(item => (
                      <option key={item.ItemID} value={item.ItemID} disabled={item.CurrentStock <= 0}>
                        {item.ItemName} (الرمز: {toArabicDigits(item.ItemCode)}) — المخزون المتوفر: {toArabicDigits(item.CurrentStock)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 text-right">الكمية</label>
                    <input
                      type="number"
                      dir="ltr"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-[#080b12] border border-gray-800 rounded-lg text-xs text-center font-mono text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 text-right">سعر الوحدة (جنيه)</label>
                    <input
                      type="number"
                      dir="ltr"
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-[#080b12] border border-gray-800 rounded-lg text-xs text-center font-mono text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 text-right">خصم المنتج (جنيه)</label>
                    <input
                      type="number"
                      dir="ltr"
                      step="0.01"
                      value={itemDiscount}
                      onChange={(e) => setItemDiscount(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-[#080b12] border border-gray-800 rounded-lg text-xs text-center font-mono text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 text-left"
                    />
                  </div>
                </div>

                <button
                  onClick={addToCart}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold rounded-xl transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  أدرج الصنف في الفاتورة
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="glass-panel border border-gray-800/50 rounded-2xl p-6 shadow-2xl">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between border-b border-gray-800/40 pb-3 flex-row-reverse">
                <span>الأصناف المدرجة ({toArabicDigits(cart.length)})</span>
                <span className="font-mono text-rose-400 font-extrabold text-sm" dir="ltr">{formatArabicCurrency(subtotal)}</span>
              </h4>
              
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pl-1">
                {cart.map((item, index) => {
                  const itemData = items.find(i => i.ItemID === item.itemID)
                  return (
                    <div key={index} className="flex items-center justify-between p-3.5 bg-[#0a0d18]/70 border border-gray-800/60 rounded-xl transition-colors hover:border-gray-700/50 flex-row-reverse">
                      <div className="flex-1 min-w-0 pl-4 text-right">
                        <p className="font-semibold text-xs text-gray-200 truncate">{itemData?.ItemName}</p>
                        <p className="text-[10px] text-gray-500 font-mono mt-1 text-right" dir="rtl">
                          الكمية {toArabicDigits(item.quantity)} × {formatArabicCurrency(item.unitPrice)} — الخصم المباشر: {formatArabicCurrency(item.discount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-row-reverse">
                        <span className="text-xs font-extrabold text-emerald-400 font-mono" dir="ltr">{formatArabicCurrency(item.lineTotal)}</span>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition-all"
                          title="إزالة الصنف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                {cart.length === 0 && (
                  <p className="text-center text-xs text-gray-500 py-8 italic">الفاتورة فارغة حالياً. أضف بعض المنتجات من الأعلى للبدء.</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT (RTL Left): Totals & Sales History */}
          <div className="lg:col-span-5 space-y-6">
            {/* Invoice Totals Summary */}
            <div className="glass-panel border border-gray-800/50 rounded-2xl p-6 shadow-2xl text-right">
              <h3 className="text-xs font-bold text-white mb-4 border-b border-gray-800/40 pb-3 flex items-center gap-1 justify-start flex-row-reverse">
                <DollarSign className="w-3.5 h-3.5 text-rose-400" /> <span>ملخص قيمة الفاتورة</span>
              </h3>
              
              <div className="space-y-4 text-xs">
                <div className="flex justify-between border-b border-gray-800/40 pb-2 flex-row-reverse">
                  <span className="text-gray-400">المجموع الفرعي:</span>
                  <span className="font-bold font-mono text-gray-200" dir="ltr">{formatArabicCurrency(subtotal)}</span>
                </div>
                
                <div className="text-right">
                  <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">خصم إضافي للفاتورة (جنيه)</label>
                  <input
                    type="number"
                    dir="ltr"
                    step="0.01"
                    value={globalDiscount}
                    onChange={(e) => setGlobalDiscount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-[#0c101c]/80 border border-gray-800 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 text-left"
                  />
                </div>

                <div className="flex justify-between border-b border-gray-800/40 pb-2 text-sm bg-rose-500/5 p-2 rounded-lg border border-rose-500/10 flex-row-reverse">
                  <span className="text-rose-300 font-bold">المطلوب سداده النهائي:</span>
                  <span className="font-extrabold font-mono text-rose-400" dir="ltr">{formatArabicCurrency(totalAmount)}</span>
                </div>

                <div className="text-right">
                  <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">المبلغ المدفوع نقداً (جنيه)</label>
                  <input
                    type="number"
                    dir="ltr"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-[#0c101c]/80 border border-gray-800 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 text-left"
                  />
                </div>

                <div className="flex justify-between text-sm bg-orange-500/5 p-2 rounded-lg border border-orange-500/10 flex-row-reverse">
                  <span className="text-orange-300 font-bold">المتبقي المطلوب (الدين/الآجل):</span>
                  <span className="font-extrabold font-mono text-orange-400" dir="ltr">{formatArabicCurrency(remainingAmount)}</span>
                </div>

                <div className="text-right">
                  <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">ملاحظات الفاتورة</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-[#0c101c]/80 border border-gray-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 text-right"
                    placeholder="شروط التسليم، تفاصيل الدفع، أو أي شروط أخرى..."
                  />
                </div>

                <button
                  onClick={saveSale}
                  className="w-full px-4 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl transition-all font-bold tracking-wider shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                >
                  حفظ الفاتورة والطباعة
                </button>
              </div>
            </div>

            {/* Sales History Log */}
            <div className="glass-panel border border-gray-800/50 rounded-2xl p-6 shadow-2xl text-right">
              <h3 className="text-xs font-bold text-white mb-4 border-b border-gray-800/40 pb-3 flex items-center gap-1.5 justify-start flex-row-reverse">
                <FileText className="w-4 h-4 text-blue-400 animate-pulse" /> <span>آخر عمليات البيع والتحصيل</span>
              </h3>
              <div className="overflow-hidden rounded-xl border border-gray-800/80 bg-[#0a0d18]/40">
                <div className="overflow-y-auto max-h-[300px]">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-gray-400 bg-gray-900/60 border-b border-gray-800/80">
                        <th className="p-3 text-right">المعرف</th>
                        <th className="p-3 text-right">العميل</th>
                        <th className="p-3 text-left">المجموع</th>
                        <th className="p-3 text-left">الآجل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40 text-xs">
                      {sales.map(sale => (
                        <tr key={sale.SaleID} className="hover:bg-gray-800/10 transition-colors">
                          <td className="p-3 font-mono text-blue-400 font-bold text-right" dir="ltr">#{toArabicDigits(sale.SaleID)}</td>
                          <td className="p-3 text-gray-300 font-semibold truncate max-w-[80px] text-right">{sale.CustomerName}</td>
                          <td className="p-3 text-left text-emerald-400 font-bold font-mono" dir="rtl">{formatArabicCurrency(sale.TotalAmount)}</td>
                          <td className="p-3 text-left text-orange-400 font-bold font-mono" dir="rtl">{formatArabicCurrency(sale.RemainingAmount)}</td>
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

      {/* Success checkout modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in text-right">
          <div className="glass-modal w-full max-w-md rounded-2xl overflow-hidden border border-gray-800/80 shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-gradient-to-r from-rose-500/10 to-red-500/10 border-b border-gray-800/40 flex items-center justify-between">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                تم تسجيل الفاتورة بنجاح
              </h3>
              <button
                onClick={() => setCompletedSale(null)}
                className="p-1.5 hover:bg-gray-850 rounded-lg text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart className="w-6 h-6 text-rose-400" />
                </div>
                <h4 className="text-white font-bold text-lg">رقم الفاتورة: #{toArabicDigits(completedSale.saleID)}</h4>
                <p className="text-gray-400 text-xs mt-1">التاريخ: {toArabicDigits(completedSale.date)}</p>
              </div>

              <div className="space-y-2 border-t border-b border-gray-800/40 py-3 text-sm">
                <div className="flex justify-between flex-row-reverse text-gray-400">
                  <span>العميل:</span>
                  <span className="text-white font-semibold">{completedSale.customerName}</span>
                </div>
                <div className="flex justify-between flex-row-reverse text-gray-400">
                  <span>طريقة الدفع:</span>
                  <span className="text-white font-semibold">{completedSale.paymentMethodName}</span>
                </div>
                <div className="flex justify-between flex-row-reverse text-gray-400">
                  <span>إجمالي المبلغ:</span>
                  <span className="text-rose-400 font-bold">{formatArabicCurrency(completedSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between flex-row-reverse text-gray-400">
                  <span>المبلغ المدفوع:</span>
                  <span className="text-white font-semibold">{formatArabicCurrency(completedSale.paidAmount)}</span>
                </div>
                <div className="flex justify-between flex-row-reverse text-gray-400">
                  <span>المبلغ المتبقي:</span>
                  <span className={`font-bold ${completedSale.remainingAmount > 0 ? 'text-red-400' : 'text-gray-300'}`}>
                    {formatArabicCurrency(completedSale.remainingAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-900/40 border-t border-gray-800/40 flex items-center justify-end gap-3">
              <button
                onClick={() => setCompletedSale(null)}
                className="px-5 py-2.5 bg-gray-800/50 hover:bg-gray-800 text-gray-300 text-xs font-semibold rounded-xl border border-gray-700/30 transition-all"
              >
                موافق / عملية جديدة
              </button>
              <button
                onClick={() => {
                  setTimeout(() => {
                    window.print()
                  }, 100)
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-semibold rounded-xl border border-rose-500/30 hover:border-rose-500/40 transition-all shadow-[0_0_15px_rgba(244,63,94,0.2)]"
              >
                <span>طباعة الفاتورة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable receipt outside React Root */}
      {completedSale && createPortal(
        <div id="print-receipt-container-direct" style={{ direction: 'rtl', fontFamily: 'monospace', padding: '10px' }}>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>مستودع عبدالله</h2>
            <p style={{ margin: '0', fontSize: '12px' }}>فاتورة مبيعات مبسطة</p>
            <p style={{ margin: '5px 0', fontSize: '12px' }}>رقم الفاتورة: #{toArabicDigits(completedSale.saleID)}</p>
            <p style={{ margin: '0', fontSize: '12px' }}>التاريخ: {toArabicDigits(completedSale.date)}</p>
          </div>
          
          <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '5px 0', margin: '10px 0' }}>
            <p style={{ margin: '3px 0', fontSize: '12px' }}>العميل: {completedSale.customerName}</p>
            <p style={{ margin: '3px 0', fontSize: '12px' }}>طريقة الدفع: {completedSale.paymentMethodName}</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'right' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ textAlign: 'right', paddingBottom: '5px' }}>الصنف</th>
                <th style={{ textAlign: 'center', paddingBottom: '5px' }}>الكمية</th>
                <th style={{ textAlign: 'left', paddingBottom: '5px' }}>السعر</th>
                <th style={{ textAlign: 'left', paddingBottom: '5px' }}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {completedSale.items.map((item: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px dashed #ccc' }}>
                  <td style={{ padding: '5px 0' }}>{item.itemName}</td>
                  <td style={{ textAlign: 'center', padding: '5px 0' }}>{toArabicDigits(item.quantity)}</td>
                  <td style={{ textAlign: 'left', padding: '5px 0' }}>{formatArabicCurrency(item.unitPrice)}</td>
                  <td style={{ textAlign: 'left', padding: '5px 0' }}>{formatArabicCurrency(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px solid #000', paddingTop: '5px', marginTop: '10px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
              <span>الإجمالي:</span>
              <span style={{ fontWeight: 'bold' }}>{formatArabicCurrency(completedSale.totalAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
              <span>المدفوع:</span>
              <span>{formatArabicCurrency(completedSale.paidAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
              <span>المتبقي:</span>
              <span style={{ fontWeight: completedSale.remainingAmount > 0 ? 'bold' : 'normal' }}>
                {formatArabicCurrency(completedSale.remainingAmount)}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px dashed #000', paddingTop: '10px' }}>
            <p style={{ margin: '0', fontSize: '11px' }}>شكراً لتسوقكم معنا!</p>
            <p style={{ margin: '3px 0 0 0', fontSize: '10px' }}>نظام إدارة مستودعات عبدالله v2.0</p>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
