import { NextResponse } from 'next/server'
import { isAuthenticated } from '../../../lib/auth'
import { getAppsInfo } from '../../../lib/config'

export async function GET() {
  try {
    // Проверяем аутентификацию
    if (!isAuthenticated()) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }
    
    const apps = getAppsInfo()
    
    return NextResponse.json({ apps })
    
  } catch (error) {
    console.error('Get apps error:', error)
    return NextResponse.json(
      { error: 'Ошибка получения списка приложений' },
      { status: 500 }
    )
  }
}