// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET!;
const ADMIN_LOGIN = process.env.ADMIN_LOGIN!;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH!;

console.log('[auth.ts] Initializing...');
console.log(`[auth.ts] JWT_SECRET defined: ${!!JWT_SECRET}, length: ${JWT_SECRET?.length}, starts with: ${JWT_SECRET?.substring(0, 5)}`);
console.log(`[auth.ts] ADMIN_LOGIN defined: ${!!ADMIN_LOGIN}`);
console.log(`[auth.ts] ADMIN_PASSWORD_HASH defined: ${!!ADMIN_PASSWORD_HASH}`);

export interface AuthPayload {
  isAdmin: boolean;
  iat?: number;
  exp?: number;
  [key: string]: any;
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

export async function generateToken(): Promise<string> {
  if (!JWT_SECRET) {
    console.error("[generateToken] JWT_SECRET is not configured.");
    throw new Error("JWT_SECRET is not configured.");
  }
  const payload = { isAdmin: true };
  console.log("[generateToken] Generating token with payload:", payload);
  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret);
  console.log(`[generateToken] Token generated (first 10 chars): ${token.substring(0, 10)}`);
  return token;
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  if (!JWT_SECRET) {
    console.error("[verifyToken] JWT_SECRET is not configured.");
    return null;
  }
  try {
    console.log(`[verifyToken] Attempting to verify token (first 10): ${token.substring(0, 10)}...`);
    console.log(`[verifyToken] Runtime environment: ${process.env.NEXT_RUNTIME || 'unknown'}`);
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    console.log("[verifyToken] Verification successful, payload:", payload);
    return payload as AuthPayload;
  } catch (e: any) {
    console.error("[verifyToken] Error during JWT verification. Name:", e.name, "Message:", e.message);
    return null;
  }
}

export function getAuthToken(): string | null {
  try {
    const cookieStore = cookies();
    const tokenCookie = cookieStore.get('auth-token');
    return tokenCookie?.value || null;
  } catch (error) {
    console.warn("[getAuthToken] Could not access cookies.", error);
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