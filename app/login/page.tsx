'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setDebugInfo(null)

    console.log('Login attempt:', { login, passwordLength: password.length })

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login, password }),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log('Response data:', data)

      // Добавляем отладочную информацию
      setDebugInfo({
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data: data,
        cookies: document.cookie
      })

      if (response.ok) {
        console.log('Login successful, redirecting...')
        // Добавим небольшую задержку для отладки
        setTimeout(() => {
          router.push('/dashboard')
        }, 100)
      } else {
        console.error('Login failed:', data.error)
        setError(data.error || 'Ошибка входа')
      }
    } catch (err) {
      console.error('Network error:', err)
      setError('Ошибка сети: ' + (err as Error).message)
      setDebugInfo({ networkError: (err as Error).message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Apps Admin</h1>
            <p className="text-gray-600 mt-2">Войдите в систему управления</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login" className="block text-sm font-medium text-gray-700 mb-2">
                Логин
              </label>
              <input
                id="login"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="Введите логин"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="Введите пароль"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Debug информация */}
            {debugInfo && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Debug Info:</h4>
                <pre className="text-xs text-gray-600 overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-medium py-3 px-4 rounded-xl transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 outline-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Вход...
                </div>
              ) : (
                'Войти'
              )}
            </button>
          </form>

          {/* Информация о переменных окружения */}
          <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Проверьте переменные окружения:</h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• JWT_SECRET должен быть установлен</li>
              <li>• ADMIN_LOGIN должен быть установлен</li>
              <li>• ADMIN_PASSWORD_HASH должен быть установлен</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}