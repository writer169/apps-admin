// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, AuthPayload } from './lib/auth'

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
  // Добавьте эту строку:
  runtime: 'nodejs', // или 'experimental-edge' по умолчанию
}

export function middleware(request: NextRequest) {
  // ... ваш остальной код middleware без изменений ...
  // --- ВРЕМЕННОЕ ЛОГИРОВАНИЕ ДЛЯ ОТЛАДКИ JWT_SECRET ---
  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/dashboard')) {
    console.log(`[Middleware] Checking JWT_SECRET for path: ${request.nextUrl.pathname} (RUNTIME: nodejs)`); // Добавим для ясности
    console.log('[Middleware] JWT_SECRET is defined:', !!process.env.JWT_SECRET);
    console.log('[Middleware] JWT_SECRET length (if defined):', process.env.JWT_SECRET?.length);
  }
  // --- КОНЕЦ ВРЕМЕННОГО ЛОГИРОВАНИЯ ---

  const { pathname } = request.nextUrl
  console.log(`[Middleware] Path: ${pathname}`);

  const publicPaths = ['/login', '/api/auth/login']

  if (publicPaths.includes(pathname) || pathname.startsWith('/_next/') || pathname.startsWith('/static/') || pathname.includes('.')) {
    console.log(`[Middleware] Public or static path, allowing: ${pathname}`);
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/auth/logout')) {
    console.log(`[Middleware] Logout path, allowing: ${pathname}`);
    return NextResponse.next();
  }
  
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/generate-link') || pathname.startsWith('/api/apps')) {
    console.log(`[Middleware] Protected path, checking auth for: ${pathname}`);
    const tokenCookie = request.cookies.get('auth-token');
    const token = tokenCookie?.value;

    if (!token) {
      console.log('[Middleware] No token found. Redirecting to /login or returning 401.');
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Не авторизован (нет токена)' }, { status: 401 })
      }
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    console.log('[Middleware] Token found. Value (first 10 chars):', token.substring(0, 10));

    if (!process.env.JWT_SECRET) {
        console.error('[Middleware] Critical Error: JWT_SECRET is not set. Cannot verify token.');
        // ... (обработка ошибки)
    }

    try {
      const payload = verifyToken(token) as AuthPayload | null;
      console.log('[Middleware] Token payload from verifyToken:', payload);

      if (!payload) {
        console.log('[Middleware] Token verification failed (payload is null/undefined). Redirecting to /login or returning 401.');
        const response = pathname.startsWith('/api/')
            ? NextResponse.json({ error: 'Не авторизован (ошибка верификации токена)' }, { status: 401 })
            : NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth-token');
        console.log('[Middleware] Deleted invalid auth-token cookie.');
        return response;
      }
      
      if (!payload.isAdmin) {
        console.log('[Middleware] Payload does not have isAdmin:true. Payload:', payload, 'Redirecting to /login or returning 401.');
        const response = pathname.startsWith('/api/')
            ? NextResponse.json({ error: 'Не авторизован (нет прав администратора)' }, { status: 401 })
            : NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth-token');
        console.log('[Middleware] Deleted auth-token cookie due to missing admin rights.');
        return response;
      }

      console.log('[Middleware] Auth successful for admin. Proceeding.');
      return NextResponse.next();
    } catch (error) { // Этот catch теперь может и не понадобиться, если verifyToken сам обрабатывает
        console.error('[Middleware] Error during token verification (exception in middleware):', error);
        // ... (обработка ошибки)
    }
  }

  console.log(`[Middleware] Path not matched by specific auth rules, allowing: ${pathname}`);
  return NextResponse.next()
}