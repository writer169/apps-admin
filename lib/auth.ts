// lib/auth.ts
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET!
const ADMIN_LOGIN = process.env.ADMIN_LOGIN!
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH!

// Важно: Убедитесь, что эти переменные окружения установлены на Vercel!
// Логирование для проверки при запуске (сработает один раз при инициализации модуля на сервере)
console.log('[auth.ts] Initializing...');
console.log(`[auth.ts] JWT_SECRET defined: ${!!JWT_SECRET}, length: ${JWT_SECRET?.length}, starts with: ${JWT_SECRET?.substring(0, 5)}`);
console.log(`[auth.ts] ADMIN_LOGIN defined: ${!!ADMIN_LOGIN}`);
console.log(`[auth.ts] ADMIN_PASSWORD_HASH defined: ${!!ADMIN_PASSWORD_HASH}`);


export interface AuthPayload {
  isAdmin: boolean;
  // Стандартные поля JWT, которые jwt.verify может вернуть:
  iat?: number; // Issued at
  exp?: number; // Expiration time
  // Могут быть и другие поля, если вы их добавляете в payload
  [key: string]: any; // Для других возможных полей
}

export async function verifyCredentials(login: string, password: string): Promise<boolean> {
  if (!ADMIN_LOGIN || !ADMIN_PASSWORD_HASH) {
    console.error("[verifyCredentials] ADMIN_LOGIN or ADMIN_PASSWORD_HASH is not configured.");
    return false;
  }
  if (login !== ADMIN_LOGIN) {
    console.log(`[verifyCredentials] Login mismatch. Expected: ${ADMIN_LOGIN}, Got: ${login}`);
    return false;
  }
  
  console.log("[verifyCredentials] Comparing password for user:", login);
  const isMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  console.log("[verifyCredentials] Password match result:", isMatch);
  return isMatch;
}

export function generateToken(): string {
  if (!JWT_SECRET) {
    console.error("[generateToken] JWT_SECRET is not configured. Cannot generate token.");
    // В реальном приложении здесь лучше выбросить ошибку, чтобы сразу стало понятно
    throw new Error("JWT_SECRET is not configured. Cannot generate token.");
  }
  const payload = { // Не обязательно явно типизировать как AuthPayload, jwt.sign примет объект
    isAdmin: true,
    // exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 дней - jwt.sign сам добавит iat и обработает expiresIn
  };
  
  console.log("[generateToken] Generating token with payload:", payload);
  // Библиотека jsonwebtoken сама установит 'iat' (issued at)
  // и рассчитает 'exp' (expiration time) на основе 'expiresIn'
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
  console.log(`[generateToken] Token generated (first 10 chars): ${token.substring(0, 10)}`);
  return token;
}

export function verifyToken(token: string): AuthPayload | null {
  if (!JWT_SECRET) {
    console.error("[verifyToken] JWT_SECRET is not configured. Cannot verify token.");
    return null; // Или выбросить ошибку
  }
  try {
    console.log(`[verifyToken] Attempting to verify token (first 10): ${token.substring(0, 10)}... with secret (first 5): ${JWT_SECRET.substring(0,5)}`);
    // При верификации, jwt.verify вернет объект payload, включая isAdmin, iat, exp
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload; // Типизируем результат
    console.log("[verifyToken] Verification successful, payload:", decoded);
    return decoded; // decoded будет содержать isAdmin, iat, exp
  } catch (e: any) {
    console.error("[verifyToken] Error during JWT verification. Name:", e.name, "Message:", e.message);
    // Для более детального лога, если e.message не информативен:
    // console.error("[verifyToken] Full error object:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
    return null;
  }
}

export function getAuthToken(): string | null {
  try {
    const cookieStore = cookies(); // Может выбросить ошибку, если вызван не в том контексте
    const tokenCookie = cookieStore.get('auth-token');
    return tokenCookie?.value || null;
  } catch (error) {
    console.warn("[getAuthToken] Could not access cookies. This function should be called in a Server Component or Route Handler.", error);
    return null;
  }
}

// Эта функция для использования на стороне сервера (Server Components, API Routes)
export function isAuthenticated(): { authenticated: boolean, payload: AuthPayload | null } {
  const token = getAuthToken();
  if (!token) {
    return { authenticated: false, payload: null };
  }
  
  const payload = verifyToken(token);
  if (payload?.isAdmin) {
    return { authenticated: true, payload };
  }
  return { authenticated: false, payload }; // payload может быть null или не содержать isAdmin
}