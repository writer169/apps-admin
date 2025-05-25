// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth' // Убедитесь, что путь правильный

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  console.log(`[Middleware] Path: ${pathname}`);

  const publicPaths = ['/login', '/api/auth/login']

  if (publicPaths.includes(pathname)) {
    console.log(`[Middleware] Public path, allowing: ${pathname}`);
    return NextResponse.next()
  }

  // Проверяем защищенные пути
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/generate-link')) {
    console.log(`[Middleware] Protected path, checking auth for: ${pathname}`);
    const tokenCookie = request.cookies.get('auth-token');
    const token = tokenCookie?.value;

    if (!token) {
      console.log('[Middleware] No token found. Redirecting to /login.');
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Не авторизован (нет токена)' }, { status: 401 })
      }
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname) // Для отладки или редиректа назад
      return NextResponse.redirect(loginUrl)
    }

    console.log('[Middleware] Token found:', token ? 'Present' : 'Absent', '; Value (first 10 chars):', token?.substring(0, 10));

    try {
      const payload = verifyToken(token); // Убедитесь, что verifyToken не асинхронная или используйте await
      console.log('[Middleware] Token payload from verifyToken:', payload);

      if (!payload) {
        console.log('[Middleware] Token verification failed (payload is null/undefined). Redirecting to /login.');
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Не авторизован (ошибка верификации токена)' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', request.url))
      }
      
      if (!payload.isAdmin) {
        console.log('[Middleware] Payload does not have isAdmin:true. Payload:', payload, 'Redirecting to /login.');
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Не авторизован (нет прав администратора)' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', request.url))
      }

      console.log('[Middleware] Auth successful for admin. Proceeding.');
    } catch (error) {
        console.error('[Middleware] Error during token verification:', error);
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Не авторизован (исключение при верификации)' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  console.log(`[Middleware] Path not matched by specific rules, allowing: ${pathname}`);
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}