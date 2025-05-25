// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { verifyCredentials, generateToken } from '../../../../lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { login, password } = await request.json();

    if (!login || !password) {
      return NextResponse.json(
        { error: 'Логин и пароль обязательны' },
        { status: 400 }
      );
    }

    if (!process.env.ADMIN_LOGIN || !process.env.ADMIN_PASSWORD_HASH) {
      console.error('[Login API] Critical Error: Admin credentials not configured');
      return NextResponse.json(
        { error: 'Ошибка конфигурации сервера' },
        { status: 500 }
      );
    }

    const isValid = await verifyCredentials(login, password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error('[Login API] Critical Error: JWT_SECRET not configured');
      return NextResponse.json(
        { error: 'Ошибка конфигурации сервера' },
        { status: 500 }
      );
    }

    const token = await generateToken();

    const response = NextResponse.json({ success: true });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Login API] Internal Server Error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}