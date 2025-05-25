// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET!;
const ADMIN_LOGIN = process.env.ADMIN_LOGIN!;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH!;

export interface AuthPayload {
  isAdmin: boolean;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

export async function verifyCredentials(login: string, password: string): Promise<boolean> {
  if (!ADMIN_LOGIN || !ADMIN_PASSWORD_HASH) {
    console.error("[verifyCredentials] Admin credentials not configured");
    return false;
  }
  
  if (login !== ADMIN_LOGIN) {
    return false;
  }
  
  return await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
}

export async function generateToken(): Promise<string> {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  
  const payload = { isAdmin: true };
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  if (!JWT_SECRET) {
    console.error("[verifyToken] JWT_SECRET not configured");
    return null;
  }
  
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as AuthPayload;
  } catch (error) {
    // Не логируем детали ошибки для безопасности
    return null;
  }
}

export function getAuthToken(): string | null {
  try {
    const cookieStore = cookies();
    const tokenCookie = cookieStore.get('auth-token');
    return tokenCookie?.value || null;
  } catch (error) {
    return null;
  }
}

export async function isAuthenticated(): Promise<{ authenticated: boolean; payload: AuthPayload | null }> {
  const token = getAuthToken();
  if (!token) {
    return { authenticated: false, payload: null };
  }
  
  const payload = await verifyToken(token);
  if (payload?.isAdmin) {
    return { authenticated: true, payload };
  }
  
  return { authenticated: false, payload };
}