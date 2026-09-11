import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useData } from '../../contexts/DataContext'
import { toArabicDigits, formatArabicCurrency } from '../../utils/format'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search,
  CreditCard,
  User,
  Package,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react'
import type { Customer, Item, PaymentMethod, SaleItem } from '../../types/electron'

interface CartItem extends SaleItem {
  itemName: string
  itemCode: string
}

export default function PointOfSale() {
  const { refreshStats } = useData()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<number>(0)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number>(0)
  const [paidAmount, setPaidAmount] = useState<string>('')
  const [notes, setNotes] = useState('')
  
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [completedSale, setCompletedSale] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [custResult, itemResult, pmResult] = await Promise.all([
      window.api.getCustomers(),
      window.api.getItems(),
      window.api.getPaymentMethods(),
    ])
    
    if (custResult.success && custResult.data) setCustomers(custResult.data.filter(c => c.IsActive))
    if (itemResult.success && itemResult.data) setItems(itemResult.data)
    if (pmResult.success && pmResult.data) {
      setPaymentMethods(pmResult.data)
      if (pmResult.data.length > 0) setSelectedPaymentMethod(pmResult.data[0].PaymentMethodID)
    }
  }

  const showAlert = (text: string, type: 'success' | 'error') => {
    setAlertMsg({ type, text })
    setTimeout(() => setAlertMsg(null), 5000)
  }

  const filteredItems = items.filter(item => 
    item.ItemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ItemName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addToCart = (item: Item) => {
    const existingIndex = cart.findIndex(c => c.itemID === item.ItemID)
    
    if (existingIndex >= 0) {
      // Item already in cart, increase quantity
      const newCart = [...cart]
      newCart[existingIndex].quantity += 1
      newCart[existingIndex].lineTotal = newCart[existingIndex].quantity * newCart[existingIndex].unitPrice
      setCart(newCart)
    } else {
      // Add new item to cart
      setCart([...cart, {
        itemID: item.ItemID,
        itemName: item.ItemName,
        itemCode: item.ItemCode,
        quantity: 1,
        unitPrice: item.SalePrice,
        discount: 0,
        lineTotal: item.SalePrice
      }])
    }
    showAlert(`تم إضافة ${item.ItemName} إلى سلة المشتريات`, 'success')
  }

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart]
    newCart[index].quantity = Math.max(1, newCart[index].quantity + delta)
    newCart[index].lineTotal = newCart[index].quantity * newCart[index].unitPrice - newCart[index].discount
    setCart(newCart)
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const clearCart = () => {
    setCart([])
    setPaidAmount('')
    setNotes('')
    setSearchTerm('')
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.lineTotal, 0)
  const remainingAmount = totalAmount - (parseFloat(paidAmount) || 0)

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showAlert('السلة فارغة!', 'error')
      return
    }

    if (!selectedCustomer) {
      showAlert('يرجى اختيار العميل أولاً', 'error')
      return
    }

    if (!selectedPaymentMethod) {
      showAlert('يرجى اختيار طريقة الدفع', 'error')
      return
    }

    const paid = parseFloat(paidAmount) || 0
    if (paid < 0) {
      showAlert('قيمة المبلغ المدفوع غير صالحة', 'error')
      return
    }

    setIsProcessing(true)

    const saleData = {
      customerID: selectedCustomer,
      paymentMethodID: selectedPaymentMethod,
      totalAmount,
      discount: 0,
      paidAmount: paid,
      remainingAmount: totalAmount - paid,
      notes,
      items: cart.map(item => ({
        itemID: item.itemID,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        lineTotal: item.lineTotal
      }))
    }

    const result = await window.api.saveSale(saleData)
    
    setIsProcessing(false)

    if (result.success) {
      setCompletedSale({
        saleID: result.data?.saleID || 0,
        customerName: customers.find(c => c.CustomerID === selectedCustomer)?.CustomerName || 'عميل نقدي',
        paymentMethodName: paymentMethods.find(pm => pm.PaymentMethodID === selectedPaymentMethod)?.MethodName || 'نقدي',
        totalAmount,
        paidAmount: paid,
        remainingAmount: totalAmount - paid,
        date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
        items: cart.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal
        }))
      })
      clearCart()
      await loadData() // Reload items to update stock
      refreshStats() // Update global dashboard stats
    } else {
      showAlert(`فشل تسجيل عملية البيع: ${result.error}`, 'error')
    }
  }

  return (
    <div className="h-screen bg-[#0B0F19] flex flex-col text-right">
      {/* Alert */}
      {alertMsg && (
        <div className={`absolute top-4 left-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl animate-in slide-in-from-top flex-row-reverse ${
          alertMsg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {alertMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="font-medium">{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="mr-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-800/40 bg-gradient-to-r from-[#0e1220]/95 to-[#0B0F19]/95 backdrop-blur-xl flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 justify-start flex-row-reverse">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl border border-emerald-500/30 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-right">
              <h1 className="text-xl font-bold text-white">نقطة البيع</h1>
              <p className="text-xs text-gray-500">نظام المبيعات المباشر وإصدار الفواتير الفورية</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left (RTL Right): Product Selection */}
        <div className="flex-1 flex flex-col border-l border-gray-800/40 overflow-hidden">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-800/40 flex-shrink-0 text-right">
            <div className="relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="البحث عن المنتجات بالرمز أو الاسم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 text-right"
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredItems.map((item) => (
                <button
                  key={item.ItemID}
                  onClick={() => addToCart(item)}
                  className="glass-panel border border-gray-800/50 rounded-xl p-4 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all group text-right flex flex-col justify-between min-h-[140px]"
                >
                  <div>
                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-lg mb-3 border border-emerald-500/20 group-hover:border-emerald-500/40">
                      <Package className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-white font-semibold text-sm mb-1 truncate">{item.ItemName}</h3>
                    <p className="text-gray-500 text-xs mb-2 text-left" dir="ltr">{toArabicDigits(item.ItemCode)}</p>
                  </div>
                  <div className="flex items-center justify-between flex-row-reverse w-full">
                    <span className="text-emerald-400 font-bold">{formatArabicCurrency(item.SalePrice)}</span>
                    <span className={`text-xs ${item.CurrentStock > item.MinStock ? 'text-gray-500' : 'text-red-400'}`}>
                      المخزون: {toArabicDigits(item.CurrentStock)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right (RTL Left): Cart & Checkout */}
        <div className="w-[480px] flex flex-col bg-gradient-to-b from-[#0e1220]/95 to-[#0B0F19]/95 overflow-hidden border-r border-gray-800/40">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0 text-right">
            <h2 className="text-white font-bold mb-3 flex items-center gap-2 justify-start flex-row-reverse">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <span>سلة المبيعات ({toArabicDigits(cart.length)} أصناف)</span>
            </h2>

            {cart.length === 0 ? (
              <div className="glass-panel border border-gray-800/50 rounded-xl p-8 text-center">
                <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">سلة المشتريات فارغة. أضف منتجات للبدء بالعملية.</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={index} className="glass-panel border border-gray-800/50 rounded-xl p-3 text-right">
                  <div className="flex items-start gap-3 justify-between flex-row-reverse">
                    <div className="flex-1 min-w-0 text-right">
                      <h4 className="text-white font-medium text-sm truncate">{item.itemName}</h4>
                      <p className="text-gray-500 text-xs text-left" dir="ltr">{toArabicDigits(item.itemCode)}</p>
                      <p className="text-emerald-400 font-semibold text-sm mt-1 text-left" dir="ltr">
                        {formatArabicCurrency(item.unitPrice)} × {toArabicDigits(item.quantity)} = {formatArabicCurrency(item.lineTotal)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        className="w-7 h-7 bg-gray-800/50 hover:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700/50"
                      >
                        <Plus className="w-4 h-4 text-gray-400" />
                      </button>
                      <span className="text-white font-bold w-8 text-center">{toArabicDigits(item.quantity)}</span>
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        className="w-7 h-7 bg-gray-800/50 hover:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700/50"
                      >
                        <Minus className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="w-7 h-7 bg-red-500/10 hover:bg-red-500/20 rounded-lg flex items-center justify-center border border-red-500/30 mr-1"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Section */}
          <div className="border-t border-gray-800/40 p-4 space-y-3 flex-shrink-0 max-h-[50vh] overflow-y-auto text-right">
            {/* Customer Selection */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-bold justify-start flex-row-reverse">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>العميل</span>
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 text-right"
              >
                <option value={0}>اختر عميلاً...</option>
                {customers.map(c => (
                  <option key={c.CustomerID} value={c.CustomerID}>{c.CustomerName}</option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="flex items-center gap-2 text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-bold justify-start flex-row-reverse">
                <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                <span>طريقة الدفع</span>
              </label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-gray-900/50 border border-gray-800/50 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500/50 text-right"
              >
                {paymentMethods.map(pm => (
                  <option key={pm.PaymentMethodID} value={pm.PaymentMethodID}>{pm.MethodName}</option>
                ))}
              </select>
            </div>

            {/* Total */}
            <div className="glass-panel border border-emerald-500/30 rounded-xl p-4 space-y-2 text-right">
              <div className="flex items-center justify-between text-lg flex-row-reverse">
                <span className="text-gray-400 font-medium">إجمالي الفاتورة:</span>
                <span className="text-emerald-400 font-bold" dir="ltr">{formatArabicCurrency(totalAmount)}</span>
              </div>
              
              <div className="pt-2 border-t border-gray-800/50 text-right">
                <label className="text-xs text-gray-500 mb-1.5 block">المبلغ المدفوع:</label>
                <input
                  type="number"
                  dir="ltr"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800/50 rounded-lg text-white focus:outline-none focus:border-emerald-500/50 text-left"
                />
              </div>

              {paidAmount && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-800/50 flex-row-reverse">
                  <span className="text-gray-500 text-sm">المتبقي / الباقي:</span>
                  <span className={`font-bold ${remainingAmount < 0 ? 'text-yellow-400' : 'text-red-400'}`} dir="ltr">
                    {formatArabicCurrency(Math.abs(remainingAmount))}
                  </span>
                </div>
              )}
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={isProcessing || cart.length === 0}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
            >
              {isProcessing ? 'جاري إرسال العملية...' : 'اعتماد وتسجيل الفاتورة'}
            </button>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="w-full py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all text-sm border border-red-500/30"
              >
                تفريغ سلة المشتريات
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success checkout modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in text-right">
          <div className="glass-modal w-full max-w-md rounded-2xl overflow-hidden border border-gray-800/80 shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-b border-gray-800/40 flex items-center justify-between">
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
                  <ShoppingCart className="w-6 h-6 text-emerald-400" />
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
                  <span className="text-emerald-400 font-bold">{formatArabicCurrency(completedSale.totalAmount)}</span>
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
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-xs font-semibold rounded-xl border border-emerald-500/30 hover:border-emerald-500/40 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
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
            <p style={{ margin: '3px 0 0 0', fontSize: '10px' }}>نظام إدارة مستودعات عبدالله v٢.٠</p>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
