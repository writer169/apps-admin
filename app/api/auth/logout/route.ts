import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  
  // Для Vercel устанавливаем cookie через заголовок Set-Cookie
  const cookieValue = [
    'auth-token=',
    'HttpOnly',
    'Path=/',
    'Max-Age=0', // Удаляем cookie
    'SameSite=Strict',
    process.env.NODE_ENV === 'production' ? 'Secure' : ''
  ].filter(Boolean).join('; ')
  
  response.headers.set('Set-Cookie', cookieValue)
  
  return response
}