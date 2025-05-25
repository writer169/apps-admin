// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, AuthPayload } from './lib/auth' // Убедитесь, что AuthPayload импортирован

// Конфигурация Middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
  runtime: 'nodejs', // Явно указываем Node.js runtime
}

// Функция Middleware
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // Логируем только один раз при входе в middleware для пути
  console.log(`[Middleware] Path: ${pathname}, Runtime specified: nodejs`);


  const publicPaths = ['/login', '/api/auth/login']

  // Пропускаем публичные пути и статические/внутренние файлы Next.js
  if (publicPaths.includes(pathname) || 
      pathname.startsWith('/_next/') || 
      pathname.startsWith('/static/') || // Если у вас есть папка /static
      pathname.includes('.')) { // Общее правило для файлов с расширением
    console.log(`[Middleware] Public or asset path, allowing: ${pathname}`);
    return NextResponse.next()
  }
  
  // Обработка защищенных путей
  // (Пример: /dashboard, /api/apps, /api/generate-link)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/apps') || pathname.startsWith('/api/generate-link')) {
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

    console.log('[Middleware] Token found (first 10 chars):', token.substring(0, 10));

    // verifyToken вызывается здесь. Если runtime не переключился на nodejs, будет ошибка crypto
    const payload = verifyToken(token) as AuthPayload | null; 
    console.log('[Middleware] Token payload from verifyToken:', payload); // Этот лог важен

    if (!payload || !payload.isAdmin) {
      const message = !payload ? 'Token verification failed' : 'User is not admin';
      console.log(`[Middleware] ${message}. Payload: ${JSON.stringify(payload)}. Redirecting/returning 401.`);
      
      const response = pathname.startsWith('/api/')
          ? NextResponse.json({ error: !payload ? 'Не авторизован (ошибка верификации токена)' : 'Не авторизован (нет прав администратора)' }, { status: 401 })
          : NextResponse.redirect(new URL('/login', request.url));
      
      // Удаляем невалидный или неавторизованный токен
      response.cookies.delete('auth-token', { path: '/' }); 
      console.log('[Middleware] Deleted "auth-token" cookie.');
      return response;
    }

    console.log('[Middleware] Auth successful for admin. Proceeding.');
    return NextResponse.next();
  }

  console.log(`[Middleware] Path not matched by specific auth rules, allowing by default: ${pathname}`);
  return NextResponse.next()
}