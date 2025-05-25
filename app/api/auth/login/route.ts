// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { verifyCredentials, generateToken } from '../../../../lib/auth';

export const config = {
  runtime: 'nodejs', // Добавляем Node.js Runtime
};

export async function POST(request: Request) {
  console.log('[Login API] Checking environment variables...');
  console.log('[Login API] JWT_SECRET is defined:', !!process.env.JWT_SECRET);
  console.log('[Login API] JWT_SECRET length (if defined):', process.env.JWT_SECRET?.length);
  console.log('[Login API] JWT_SECRET (first 5 chars, if defined):', process.env.JWT_SECRET?.substring(0, 5));
  console.log('[Login API] ADMIN_LOGIN is defined:', !!process.env.ADMIN_LOGIN);
  console.log('[Login API] ADMIN_PASSWORD_HASH is defined:', !!process.env.ADMIN_PASSWORD_HASH);

  try {
    const { login, password } = await request.json();

    if (!login || !password) {
      console.log('[Login API] Error: Login or password missing');
      return NextResponse.json(
        { error: 'Логин и пароль обязательны' },
        { status: 400 }
      );
    }

    if (!process.env.ADMIN_LOGIN || !process.env.ADMIN_PASSWORD_HASH) {
      console.error('[Login API] Critical Error: ADMIN_LOGIN or ADMIN_PASSWORD_HASH is not set in environment variables.');
      return NextResponse.json(
        { error: 'Ошибка конфигурации сервера' },
        { status: 500 }
      );
    }

    const isValid = await verifyCredentials(login, password);
    console.log(`[Login API] Credentials verification for login "${login}": ${isValid}`);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error('[Login API] Critical Error: JWT_SECRET is not set in environment variables. Cannot generate token.');
      return NextResponse.json(
        { error: 'Ошибка конфигурации сервера при генерации токена' },
        { status: 500 }
      );
    }

    const token = await generateToken(); // Обновлено для асинхронности, если используете jose
    console.log('[Login API] Token generated (first 10 chars):', token.substring(0, 10));

    const response = NextResponse.json({ success: true });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
    console.log('[Login API] Cookie "auth-token" set.');

    return response;
  } catch (error) {
    console.error('[Login API] Internal Server Error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}