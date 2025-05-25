'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AppInfo {
  id: string
  name: string
  url: string
}

export default function DashboardPage() {
  const [apps, setApps] = useState<AppInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingLink, setGeneratingLink] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const router = useRouter()

  useEffect(() => {
    // В реальном приложении здесь будет API call для получения списка приложений
    // Пока используем статичные данные для демонстрации
    const mockApps: AppInfo[] = [
      { id: 'notes_app', name: 'Notes App', url: 'https://notes.example.com' },
      { id: 'todo_app', name: 'Todo App', url: 'https://todo.example.com' },
      { id: 'blog_app', name: 'Blog App', url: 'https://blog.example.com' },
    ]
    
    setApps(mockApps)
    setLoading(false)
  }, [])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const generateMagicLink = async (appId: string) => {
    setGeneratingLink(appId)

    try {
      const response = await fetch('/api/generate-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appId }),
      })

      const data = await response.json()

      if (response.ok) {
        // Копируем ссылку в буфер обмена
        await navigator.clipboard.writeText(data.url)
        showNotification('success', 'Ссылка скопирована в буфер обмена!')
      } else {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        showNotification('error', data.error || 'Ошибка генерации ссылки')
      }
    } catch (err) {
      showNotification('error', 'Ошибка сети')
    } finally {
      setGeneratingLink(null)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Apps Admin</h1>
              <p className="text-sm text-gray-600">Управление доступом к приложениям</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Выйти"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-xl shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Apps List */}
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Приложения</h2>
          <p className="text-sm text-gray-600">Нажмите на приложение для генерации магической ссылки</p>
        </div>

        <div className="space-y-3">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => generateMagicLink(app.id)}
              disabled={generatingLink === app.id}
              className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 010 18z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">{app.name}</h3>
                    <p className="text-sm text-gray-500">{app.id}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  {generatingLink === app.id ? (
                    <svg className="animate-spin h-5 w-5 text-primary-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {apps.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет приложений</h3>
            <p className="text-gray-500">Добавьте приложения в конфигурацию</p>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="p-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">Как это работает</h4>
              <p className="text-sm text-blue-800">
                При нажатии на приложение генерируется уникальная ссылка со сроком действия 15 минут. 
                Ссылка автоматически копируется в буфер обмена.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}