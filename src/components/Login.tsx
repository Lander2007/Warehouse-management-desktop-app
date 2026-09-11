import { useState, FormEvent, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Lock, User, AlertCircle, LogIn, Database, Shield, Server, Wifi, WifiOff } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [systemError, setSystemError] = useState(false)
  const [serverEndpoint, setServerEndpoint] = useState('')
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const verifyApiConnection = async (): Promise<boolean> => {
    if (!window.api) return false

    try {
      const config = await window.api.getConfig()
      const endpoint = `http://${config.serverIP}:${config.serverPort}/api`
      setServerEndpoint(endpoint)

      const result = await window.api.checkConnection()
      setApiOnline(result.success)
      if (!result.success) {
        setError(
          result.error ||
            `لا يمكن الاتصال بواجهة برمجة التطبيقات (API) في ${endpoint}. يرجى تشغيل النظام الخلفي عبر الأمر "npm run server" أو تحديث إعدادات الخادم.`
        )
      } else {
        setError('')
      }
      return result.success
    } catch (err: unknown) {
      setApiOnline(false)
      const message = err instanceof Error ? err.message : 'فشل التحقق من الاتصال بالخادم'
      setError(message)
      return false
    }
  }

  // Check window.api, load config.json target, and verify backend is reachable
  useEffect(() => {
    if (!window.api) {
      console.error('❌ window.api is undefined!')
      setSystemError(true)
      setError('فشل الاتصال بالنظام. window.api غير متاح. يرجى إعادة تشغيل التطبيق.')
      return
    }

    console.log('✅ window.api is available')
    verifyApiConnection()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Check if window.api exists
    if (!window.api) {
      setError('فشل الاتصال بالنظام. يرجى إعادة تشغيل التطبيق.')
      return
    }
    
    if (!username.trim() || !password.trim()) {
      setError('اسم المستخدم وكلمة المرور مطلوبان')
      return
    }

    if (apiOnline === false) {
      const online = await verifyApiConnection()
      if (!online) {
        setError(
          serverEndpoint
            ? `خادم API غير متصل في ${serverEndpoint}. قم بتشغيل الخلفية "npm run server" على الجهاز الرئيسي أولاً.`
            : 'خادم API غير متصل. يرجى تشغيل النظام الخلفي قبل تسجيل الدخول.'
        )
        return
      }
    }

    setIsLoading(true)
    try {
      const result = await login(username, password)
      setIsLoading(false)

      if (result.success) {
        // Navigation will be handled by App.tsx based on role
        navigate('/', { replace: true })
      } else {
        setError(result.error || 'فشل عملية التحقق من الهوية')
      }
    } catch (err: any) {
      setIsLoading(false)
      setError(err.message || 'حدث خطأ غير متوقع')
    }
  }

  // Show system error screen
  if (systemError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#060913] via-[#0b0f19] to-[#04060b] flex items-center justify-center p-4">
        <div className="glass-modal border border-red-500/40 rounded-2xl p-8 shadow-2xl backdrop-blur-xl max-w-md w-full relative overflow-hidden">
          {/* Neon Glow behind the error card */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-amber-500 rounded-2xl blur opacity-10 pointer-events-none"></div>
          
          <div className="text-center relative z-10">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-white mb-2">خطأ في النظام</h2>
            <p className="text-gray-400 mb-6 text-sm">
              فشل تهيئة التطبيق بشكل صحيح. لم يتم تحميل برنامج التحميل المسبق (Preload Script) بشكل صحيح.
            </p>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-right">
              <p className="text-red-300 text-sm font-mono text-left" dir="ltr">
                window.api is undefined
              </p>
              <p className="text-gray-400 text-xs mt-2">
                هذا يعني عادةً أن برنامج التحميل المسبق (preload.cjs) لم يتم تحميله بواسطة Electron.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]"
            >
              إعادة تحميل التطبيق
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060913] via-[#0b0f19] to-[#04060b] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium Ambient Light Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px]"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-2xl border border-indigo-500/30 mb-4 backdrop-blur-xl shadow-[0_0_30px_rgba(99,102,241,0.15)]">
            <Database className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            نظام إدارة المستودعات
          </h1>
          <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            بوابة الوصول الآمن
          </p>
        </div>

        {/* Glassmorphic Login Form */}
        <div className="glass-modal border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
          {/* Top subtle neon line indicator */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent"></div>

          {/* API connection status */}
          {serverEndpoint && (
            <div
              className={`mb-6 p-3.5 rounded-xl border flex items-start gap-3 transition-all duration-300 ${
                apiOnline
                  ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                  : apiOnline === false
                    ? 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                    : 'bg-gray-500/10 border-gray-500/20'
              }`}
            >
              {apiOnline ? (
                <Wifi className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0 text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 justify-start flex-row-reverse">
                  <span>خادم API</span>
                  <Server className="w-3 h-3 text-indigo-400" />
                </p>
                <p className="text-xs text-gray-300 font-mono truncate mt-1 text-left" dir="ltr">{serverEndpoint}</p>
                <p className="text-[11px] mt-1 text-gray-400">
                  {apiOnline === null
                    ? 'جاري التحقق من الاتصال...'
                    : apiOnline
                      ? 'متصل بالخادم بنجاح'
                      : 'غير متصل بالخادم — يرجى تشغيل backend'}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-right">
                  <p className="text-red-300 text-sm font-bold">فشل عملية التحقق</p>
                  <p className="text-red-400/90 text-xs mt-1 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wider mb-2 text-right">
                اسم المستخدم
              </label>
              <div className="relative group">
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors duration-200" />
                <input
                  type="text"
                  dir="ltr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pr-11 pl-4 py-3 input-premium text-sm text-left bg-[#0c101c]/80 border border-gray-800/80 rounded-xl text-gray-100 placeholder-gray-600 transition-all duration-300 focus:border-indigo-500/80 outline-none ring-2 ring-indigo-500/20 bg-[#0e1424] hover:border-gray-700/80 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                  placeholder="Username"
                  autoFocus
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wider mb-2 text-right">
                كلمة المرور
              </label>
              <div className="relative group">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors duration-200" />
                <input
                  type="password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-11 pl-4 py-3 input-premium text-sm text-left bg-[#0c101c]/80 border border-gray-800/80 rounded-xl text-gray-100 placeholder-gray-600 transition-all duration-300 focus:border-indigo-500/80 outline-none ring-2 ring-indigo-500/20 bg-[#0e1424] hover:border-gray-700/80 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                  placeholder="Password"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:via-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl transition-all duration-300 transform active:scale-[0.98] shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.55)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>جاري التحقق من الهوية...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-6 pt-6 border-t border-gray-800/50">
            <p className="text-center text-xs text-gray-500">
              الوصول مقتصر على الموظفين المصرح لهم فقط
            </p>
          </div>
        </div>

        {/* Version Info */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-600">
            النسخة 2.0.0 • قاعدة بيانات PostgreSQL • معتمد على API
          </p>
        </div>
      </div>
    </div>
  )
}
