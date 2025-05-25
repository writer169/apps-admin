import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Публичные пути, не требующие аутентификации
  const publicPaths = ['/login', '/api/auth/login']
  
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }
  
  // Проверяем защищенные пути
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/generate-link')) {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    const payload = verifyToken(token)
    if (!payload || !payload.isAdmin) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}