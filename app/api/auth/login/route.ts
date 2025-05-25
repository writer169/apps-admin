import { NextResponse } from 'next/server'
import { verifyCredentials, generateToken } from '../../../../lib/auth'

export async function POST(request: Request) {
  console.log('=== LOGIN API CALLED ===')
  
  try {
    const body = await request.json()
    const { login, password } = body
    
    console.log('Request body:', { login, passwordProvided: !!password })
    console.log('Environment variables check:', {
      JWT_SECRET: !!process.env.JWT_SECRET,
      ADMIN_LOGIN: !!process.env.ADMIN_LOGIN,
      ADMIN_PASSWORD_HASH: !!process.env.ADMIN_PASSWORD_HASH,
      ADMIN_LOGIN_VALUE: process.env.ADMIN_LOGIN,
    })
    
    if (!login || !password) {
      console.log('Missing credentials')
      return NextResponse.json(
        { error: 'Логин и пароль обязательны' },
        { status: 400 }
      )
    }
    
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not set')
      return NextResponse.json(
        { error: 'Ошибка конфигурации сервера: JWT_SECRET' },
        { status: 500 }
      )
    }
    
    if (!process.env.ADMIN_LOGIN) {
      console.error('ADMIN_LOGIN not set')
      return NextResponse.json(
        { error: 'Ошибка конфигурации сервера: ADMIN_LOGIN' },
        { status: 500 }
      )
    }
    
    if (!process.env.ADMIN_PASSWORD_HASH) {
      console.error('ADMIN_PASSWORD_HASH not set')
      return NextResponse.json(
        { error: 'Ошибка конфигурации сервера: ADMIN_PASSWORD_HASH' },
        { status: 500 }
      )
    }
    
    console.log('Verifying credentials...')
    const isValid = await verifyCredentials(login, password)
    console.log('Credentials valid:', isValid)
    
    if (!isValid) {
      console.log('Invalid credentials')
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      )
    }
    
    console.log('Generating token...')
    const token = generateToken()
    console.log('Token generated:', !!token)
    
    const response = NextResponse.json({ 
      success: true,
      debug: {
        tokenGenerated: !!token,
        cookieWillBeSet: true
      }
    })
    
    // Устанавливаем httpOnly cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 30 * 24 * 60 * 60, // 30 дней
      path: '/' // Убедимся, что cookie доступно для всего сайта
    }
    
    console.log('Setting cookie with options:', cookieOptions)
    response.cookies.set('auth-token', token, cookieOptions)
    
    console.log('=== LOGIN SUCCESS ===')
    return response
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        debug: {
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack
        }
      },
      { status: 500 }
    )
  }
}