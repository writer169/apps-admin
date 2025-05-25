// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, AuthPayload } from './lib/auth' // Убедитесь, что AuthPayload импортирован, если verifyToken его возвращает

export function middleware(request: NextRequest) {
  // --- ВРЕМЕННОЕ ЛОГИРОВАНИЕ ДЛЯ ОТЛАДКИ JWT_SECRET ---
  // Этот лог будет срабатывать для каждого запроса, проходящего через middleware
  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/dashboard')) { // Логируем только для ключевых путей, чтобы не засорять логи
    console.log(`[Middleware] Checking JWT_SECRET for path: ${request.nextUrl.pathname}`);
    console.log('[Middleware] JWT_SECRET is defined:', !!process.env.JWT_SECRET);
    console.log('[Middleware] JWT_SECRET length (if defined):', process.env.JWT_SECRET?.length);
    console.log('[Middleware] JWT_SECRET (first 5 chars, if defined):', process.env.JWT_SECRET?.substring(0, 5)); // ОСТОРОЖНО
  }
  // --- КОНЕЦ ВРЕМЕННОГО ЛОГИРОВАНИЯ ---

  const { pathname } = request.nextUrl
  console.log(`[Middleware] Path: ${pathname}`);

  const publicPaths = ['/login', '/api/auth/login'] // Также API для статики, если нужно

  if (publicPaths.includes(pathname) || pathname.startsWith('/_next/') || pathname.startsWith('/static/') || pathname.includes('.')) { // Добавил более общее исключение для файлов
    console.log(`[Middleware] Public or static path, allowing: ${pathname}`);
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/auth/logout')) { // Пример для logout, если он есть
    console.log(`[Middleware] Logout path, allowing: ${pathname}`);
    return NextResponse.next();
  }
  
  // Проверяем защищенные пути
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/generate-link') || pathname.startsWith('/api/apps')) { // Добавил /api/apps из структуры проекта
    console.log(`[Middleware] Protected path, checking auth for: ${pathname}`);
    const tokenCookie = request.cookies.get('auth-token');
    const token = tokenCookie?.value;

    if (!token) {
      console.log('[Middleware] No token found. Redirecting to /login or returning 401.');
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Не авторизован (нет токена)' }, { status: 401 })
      }
      const loginUrl = new URL('/login', request.url)
      // loginUrl.searchParams.set('from', pathname) // Можно добавить для отладки
      return NextResponse.redirect(loginUrl)
    }

    console.log('[Middleware] Token found. Value (first 10 chars):', token.substring(0, 10));

    // Проверяем, что JWT_SECRET загружен перед верификацией токена
    if (!process.env.JWT_SECRET) {
        console.error('[Middleware] Critical Error: JWT_SECRET is not set in environment variables. Cannot verify token.');
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Ошибка конфигурации сервера при проверке токена' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const payload = verifyToken(token) as AuthPayload | null; // Явно указываем тип, который ожидаем
      console.log('[Middleware] Token payload from verifyToken:', payload);

      if (!payload) {
        console.log('[Middleware] Token verification failed (payload is null/undefined). Redirecting to /login or returning 401.');
        // Дополнительно можно удалить невалидный cookie
        const response = pathname.startsWith('/api/')
            ? NextResponse.json({ error: 'Не авторизован (ошибка верификации токена)' }, { status: 401 })
            : NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth-token'); // Удаляем невалидный токен
        console.log('[Middleware] Deleted invalid auth-token cookie.');
        return response;
      }
      
      if (!payload.isAdmin) {
        console.log('[Middleware] Payload does not have isAdmin:true. Payload:', payload, 'Redirecting to /login or returning 401.');
        const response = pathname.startsWith('/api/')
            ? NextResponse.json({ error: 'Не авторизован (нет прав администратора)' }, { status: 401 })
            : NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth-token'); // Удаляем токен без прав
        console.log('[Middleware] Deleted auth-token cookie due to missing admin rights.');
        return response;
      }

      console.log('[Middleware] Auth successful for admin. Proceeding.');
      return NextResponse.next(); // <--- ВАЖНО! Пропускаем дальше, если все ОК
    } catch (error) {
        console.error('[Middleware] Error during token verification (exception):', error);
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Не авторизован (исключение при верификации)' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  console.log(`[Middleware] Path not matched by specific auth rules, allowing: ${pathname}`);
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth/login (login route itself to avoid redirect loop)
     *
     * We want middleware to run on /login as well to redirect authenticated users.
     * We want middleware to run on /api/auth/login to ensure it's not blocked by mistake.
     * The logic inside the middleware handles publicPaths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}