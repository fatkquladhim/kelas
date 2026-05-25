import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// In-memory session store (persists across requests in dev/server)
const sessions = new Map<string, { userId: string; createdAt: Date }>()

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function createSession(userId: string): string {
  const token = crypto.randomUUID()
  sessions.set(token, { userId, createdAt: new Date() })
  return token
}

export function destroySession(token: string): void {
  sessions.delete(token)
}

export function getSessionFromToken(
  token: string
): { userId: string } | null {
  const session = sessions.get(token)
  if (!session) return null
  return { userId: session.userId }
}

export async function getSession(
  request: Request
): Promise<{ userId: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session-token')?.value
  if (!token) return null
  return getSessionFromToken(token)
}

export async function requireAuth(
  request: Request
): Promise<{ userId: string } | Response> {
  const session = await getSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return session
}

export async function requireAdmin(
  request: Request
): Promise<{ userId: string } | Response> {
  const session = await getSession(request)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })

  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return session
}
