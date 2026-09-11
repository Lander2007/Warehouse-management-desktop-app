import { useState, useEffect } from 'react'
import { Save, Server, Network, AlertCircle, CheckCircle, CreditCard, Info } from 'lucide-react'
import type { PaymentMethod } from '../types/electron'

type SettingsTab = 'server' | 'payments' | 'system'

export default function DatabaseSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('server')
  const [serverIP, setServerIP] = useState('')
  const [serverPort, setServerPort] = useState(3001)
  const [currentIP, setCurrentIP] = useState('')
  const [currentPort, setCurrentPort] = useState(3001)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Payment Methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

  useEffect(() => {
    loadConfig()
    if (activeTab === 'payments') {
      loadPaymentMethods()
    }
  }, [activeTab])

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const loadConfig = async () => {
    try {
      const config = await window.api.getConfig()
      if (config) {
        setServerIP(config.serverIP)
        setServerPort(config.serverPort)
        setCurrentIP(config.serverIP)
        setCurrentPort(config.serverPort)
      }
    } catch (error) {
      console.error('Failed to load server config:', error)
    }
  }

  const loadPaymentMethods = async () => {
    try {
      const result = await window.api.getPaymentMethods()
      if (result.success && result.data) {
        setPaymentMethods(result.data)
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error)
    }
  }

  const handleSave = async () => {
    if (!serverIP.trim()) {
      showMessage('لا يمكن ترك عنوان IP الخاص بالخادم فارغاً', 'error')
      return
    }
    if (!serverPort || isNaN(serverPort)) {
      showMessage('يجب أن يكون منفذ الخادم رقماً صحيحاً', 'error')
      return
    }

    setSaving(true)
    try {
      const result = await window.api.setConfig(serverIP, serverPort)
      if (result.success) {
        setCurrentIP(serverIP)
        setCurrentPort(serverPort)
        showMessage('تم حفظ إعدادات الاتصال بالخادم بنجاح! يرجى إعادة تشغيل التطبيق لتطبيق التغييرات الجديدة.', 'success')
      } else {
        showMessage(result.error || 'فشل حفظ الإعدادات والاتصال بالخادم', 'error')
      }
    } catch (error: any) {
      showMessage(error.message || 'فشل حفظ إعدادات التهيئة', 'error')
    }
    setSaving(false)
  }

  const connectionExamples = [
    {
      type: 'خادم محلي (Local Server)',
      icon: Server,
      ip: 'localhost',
      port: 3001,
      description: 'واجهة برمجة تطبيقات REST تعمل محلياً على هذا الجهاز'
    },
    {
      type: 'خادم شبكة (Network Server)',
      icon: Network,
      ip: '192.168.1.100',
      port: 3001,
      description: 'واجهة برمجة تطبيقات REST تعمل على خادم مركزي في الشبكة المحلية'
    },
  ]

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0B0F19] text-right">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#0e1220]/65 to-transparent border-b border-gray-800/40 backdrop-blur-md flex-shrink-0">
        <div className="px-8 py-5">
          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
            إعدادات وتهيئة النظام
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-2 flex items-center gap-2.5 justify-start">
            <Server className="w-6 h-6 text-purple-400" />
            التفضيلات والاتصال بقاعدة البيانات
          </h2>
          <p className="text-xs text-gray-400">إدارة الاتصال بخادم API الرئيسي، وعرض طرق الدفع المتاحة، والتحقق من معلومات النظام الفنية</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800/40 bg-[#0e1220]/30 flex-shrink-0">
        <div className="px-8 flex gap-2 justify-start flex-row-reverse">
          {[
            { id: 'server' as SettingsTab, icon: Server, label: 'اتصال الخادم' },
            { id: 'payments' as SettingsTab, icon: CreditCard, label: 'طرق الدفع المتاحة' },
            { id: 'system' as SettingsTab, icon: Info, label: 'معلومات النظام' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {message && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 animate-fade-in justify-start flex-row-reverse ${
            message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
            <p className={`text-sm font-medium ${message.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>{message.text}</p>
          </div>
        )}

        <div className="max-w-4xl space-y-6">
          {activeTab === 'server' && (
            <>
              <div className="glass-panel border border-gray-800/50 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2 justify-start flex-row-reverse">
                  <span>عنوان الاتصال النشط حالياً</span>
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </h3>
                <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">رابط الخادم المفعل</p>
                  <p className="text-sm text-indigo-400 font-mono break-all text-left animate-pulse" dir="ltr">
                    http://{currentIP || 'localhost'}:{currentPort || 3001}/api
                  </p>
                </div>
              </div>

              <div className="glass-panel border border-gray-800/50 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-4">تحديث إعدادات الاتصال</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 text-right">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">عنوان IP للخادم / اسم المضيف</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={serverIP}
                        onChange={(e) => setServerIP(e.target.value)}
                        className="w-full px-4 py-3 input-premium text-sm font-mono text-left bg-[#0c101c]/80 border border-gray-800"
                        placeholder="e.g. localhost or 192.168.1.100"
                      />
                    </div>
                    <div className="text-right">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">المنفذ (Port)</label>
                      <input
                        type="number"
                        dir="ltr"
                        value={serverPort}
                        onChange={(e) => setServerPort(parseInt(e.target.value) || 3001)}
                        className="w-full px-4 py-3 input-premium text-sm font-mono text-center bg-[#0c101c]/80 border border-gray-800"
                        placeholder="e.g. 3001"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/10"
                  >
                    {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                    {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </button>
                </div>
              </div>

              <div className="glass-panel border border-gray-800/50 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-4">أمثلة شائعة للعناوين</h3>
                <div className="space-y-3">
                  {connectionExamples.map((example) => (
                    <div
                      key={example.type}
                      onClick={() => {
                        setServerIP(example.ip)
                        setServerPort(example.port)
                      }}
                      className="bg-gray-900/30 border border-gray-800/40 hover:border-indigo-500/30 rounded-xl p-4 cursor-pointer transition-all text-right"
                    >
                      <div className="flex items-start gap-3 justify-start flex-row-reverse">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20">
                          <example.icon className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-sm font-semibold text-white mb-1">{example.type}</p>
                          <p className="text-xs text-gray-400 mb-2">{example.description}</p>
                          <code className="text-xs text-indigo-400 bg-indigo-500/5 px-2 py-1 rounded border border-indigo-500/10 font-mono text-left inline-block" dir="ltr">
                            http://{example.ip}:{example.port}/api
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'payments' && (
            <>
              <div className="flex items-center justify-between mb-4 flex-row-reverse">
                <div className="text-right">
                  <h3 className="text-lg font-bold text-white">طرق الدفع المتاحة</h3>
                  <p className="text-sm text-gray-400">وسائل وخيارات الدفع المهيأة في النظام المالي للخادم</p>
                </div>
              </div>

              <div className="mb-6 p-4 rounded-xl border bg-indigo-500/5 border-indigo-500/10 flex items-start gap-3 justify-start flex-row-reverse">
                <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-300 leading-relaxed text-right">
                  تتم إدارة طرق الدفع وتخزينها بشكل مركزي على خادم PostgreSQL. لإضافة أو تعديل أو تمكين وسائل جديدة، يرجى التواصل مع المشرف المسؤول لتعديل الإعدادات في سجل قاعدة البيانات الرئيسي.
                </p>
              </div>

              <div className="glass-panel border border-gray-800/50 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-gray-400 bg-gray-950/60 border-b border-gray-800/80">
                        <th className="p-4 text-right">المعرف</th>
                        <th className="p-4 text-right">طريقة السداد / الدفع</th>
                        <th className="p-4 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40 text-sm">
                      {paymentMethods.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-10 text-center text-xs text-gray-500">لم يتم العثور على أي طرق دفع مهيأة حالياً</td>
                        </tr>
                      ) : (
                        paymentMethods.map((pm) => (
                          <tr key={pm.PaymentMethodID} className="hover:bg-gray-800/15 transition-colors">
                            <td className="p-4 text-xs font-mono text-purple-400 font-bold text-right">{pm.PaymentMethodID}</td>
                            <td className="p-4 font-semibold text-gray-200 text-right">{pm.MethodName}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                pm.IsActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                              }`}>
                                {pm.IsActive ? 'نشط' : 'غير نشط'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'system' && (
            <>
              <div className="glass-panel border border-gray-800/50 rounded-2xl p-6 text-right">
                <h3 className="text-base font-bold text-white mb-4">معلومات النظام</h3>
                <div className="space-y-3">
                  {[
                    { label: 'اسم التطبيق', value: 'نظام إدارة المستودعات (عبدالله)' },
                    { label: 'الإصدار الحركي', value: '2.0.0 (عميل مستقل Thin Client)' },
                    { label: 'قاعدة البيانات', value: 'خادم PostgreSQL الخلفي' },
                    { label: 'المنصة والمحيط التطويري', value: 'Electron + React + TypeScript' },
                    { label: 'رابط خادم الاتصال الفعلي', value: `http://${currentIP || 'localhost'}:${currentPort || 3001}/api`, mono: true }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-800/40 last:border-0 flex-row-reverse">
                      <span className="text-sm text-gray-400">{item.label}</span>
                      <span className={`text-sm text-right ${item.mono ? 'font-mono text-xs text-indigo-400' : 'text-white font-semibold'}`} dir={item.mono ? 'ltr' : 'rtl'}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel border border-gray-800/50 rounded-2xl p-6 text-right">
                <h3 className="text-base font-bold text-white mb-4">ميزات النظام المهيأة</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'دعم تشغيل النظام على عدة أجهزة في الشبكة المحلية (LAN)',
                    'نظام تحكم في الصلاحيات مبني على الأدوار والمسميات الوظيفية',
                    'إدارة المخازن وقوائم المنتجات والجرد الكمي',
                    'إصدار فواتير المبيعات ونقاط البيع السريعة',
                    'تسجيل فواتير المشتريات وإيصالات الشحن',
                    'سجل العملاء وإدارة الحسابات والمدفوعات',
                    'سجل الموردين وتتبع فواتير التوريد والمدفوعات',
                    'مزامنة فورية ومباشرة للبيانات بين الأجهزة',
                    'نظام تقارير ذكي متكامل للمبيعات والمخازن'
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-gray-900/30 border border-gray-800/40 rounded-lg justify-start flex-row-reverse">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-300 text-right">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
