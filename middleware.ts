// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, AuthPayload } from '@/lib/auth';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs', // Оставляем, если не хотите использовать Edge Runtime
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] Path: ${pathname}, Runtime specified: nodejs`);

  const publicPaths = ['/login', '/api/auth/login'];

  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    console.log(`[Middleware] Public or asset path, allowing: ${pathname}`);
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api/apps') ||
    pathname.startsWith('/api/generate-link')
  ) {
    console.log(`[Middleware] Protected path, checking auth for: ${pathname}`);
    const tokenCookie = request.cookies.get('auth-token');
    const token = tokenCookie?.value;

    if (!token) {
      console.log('[Middleware] No token found. Redirecting to /login or returning 401.');
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Не авторизован (нет токена)' }, { status: 401 });
      }
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    console.log('[Middleware] Token found (first 10 chars):', token.substring(0, 10));

    const payload = await verifyToken(token) as AuthPayload | null;
    console.log('[Middleware] Token payload from verifyToken:', payload);

    if (!payload || !payload.isAdmin) {
      const message = !payload ? 'Token verification failed' : 'User is not admin';
      console.log(`[Middleware] ${message}. Payload: ${JSON.stringify(payload)}. Redirecting/returning 401.`);

      const response = pathname.startsWith('/api/')
        ? NextResponse.json(
            { error: !payload ? 'Не авторизован (ошибка верификации токена)' : 'Не авторизован (нет прав администратора)' },
            { status: 401 }
          )
        : NextResponse.redirect(new URL('/login', request.url));

      response.cookies.delete({
        name: 'auth-token',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      console.log('[Middleware] Deleted "auth-token" cookie.');
      return response;
    }

    console.log('[Middleware] Auth successful for admin. Proceeding.');
    return NextResponse.next();
  }

  console.log(`[Middleware] Path not matched by specific auth rules, allowing by default: ${pathname}`);
  return NextResponse.next();
}