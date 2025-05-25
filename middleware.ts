// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, AuthPayload } from '@/lib/auth';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = ['/login', '/api/auth/login'];

  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/api/apps') ||
    pathname.startsWith('/api/generate-link')
  ) {
    const tokenCookie = request.cookies.get('auth-token');
    const token = tokenCookie?.value;

    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
      }
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyToken(token) as AuthPayload | null;

    if (!payload || !payload.isAdmin) {
      const response = pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url));

      response.cookies.delete({
        name: 'auth-token',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      
      return response;
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}