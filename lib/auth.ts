import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET!
const ADMIN_LOGIN = process.env.ADMIN_LOGIN!
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH!

export interface AuthPayload {
  isAdmin: boolean
  exp: number
}

export async function verifyCredentials(login: string, password: string): Promise<boolean> {
  if (login !== ADMIN_LOGIN) {
    return false
  }
  
  return await bcrypt.compare(password, ADMIN_PASSWORD_HASH)
}

export function generateToken(): string {
  const payload: AuthPayload = {
    isAdmin: true,
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 дней
  }
  
  return jwt.sign(payload, JWT_SECRET)
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload
  } catch {
    return null
  }
}

export function getAuthToken(): string | null {
  const cookieStore = cookies()
  const token = cookieStore.get('auth-token')
  return token?.value || null
}

export function isAuthenticated(): boolean {
  const token = getAuthToken()
  if (!token) return false
  
  const payload = verifyToken(token)
  return payload?.isAdmin === true
}