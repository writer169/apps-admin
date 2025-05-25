// app/api/generate-link/route.ts
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { isAuthenticated } from '../../../lib/auth';
import { storeMagicLinkToken } from '../../../lib/redis';
import { getAppsConfig } from '../../../lib/config';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { authenticated, payload } = await isAuthenticated();
    if (!authenticated || !payload?.isAdmin) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const { appId } = await request.json();

    if (!appId) {
      return NextResponse.json(
        { error: 'appId обязательно' },
        { status: 400 }
      );
    }

    const appsConfig = getAppsConfig();
    const baseUrl = appsConfig[appId];

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Приложение не найдено' },
        { status: 404 }
      );
    }

    const token = uuidv4();
    const stored = await storeMagicLinkToken(token, appId);

    if (!stored) {
      return NextResponse.json(
        { error: 'Ошибка при сохранении токена' },
        { status: 500 }
      );
    }

    const magicUrl = `${baseUrl}/auth/magic-link?token=${token}`;

    return NextResponse.json({
      success: true,
      url: magicUrl,
      token,
      expiresIn: 15 * 60, // 15 минут в секундах
    });
  } catch (error) {
    console.error('Generate link error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}