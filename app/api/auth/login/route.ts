// app/api/auth/login/route.ts
import { NextResponse } from 'next/server'
import { verifyCredentials, generateToken } from '../../../../lib/auth'

export async function POST(request: Request) {
  try {
    const { login, password } = await request.json()

    if (!login || !password) {
      return NextResponse.json(
        { error: 'Логин и пароль обязательны' },
        { status: 400 }
      )
    }

    const isValid = await verifyCredentials(login, password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      )
    }

    const token = generateToken() // Убедитесь, что эта функция корректно генерирует токен

    const response = NextResponse.json({ success: true })

    // Устанавливаем httpOnly cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // 'lax' может быть менее строгим, если есть проблемы с редиректами между поддоменами
      maxAge: 30 * 24 * 60 * 60, // 30 дней
      path: '/', // <--- ВАЖНОЕ ИЗМЕНЕНИЕ
    })

    return response

  } catch (error) {
    console.error('Login API error:', error); // Добавьте логирование ошибок на сервере
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}