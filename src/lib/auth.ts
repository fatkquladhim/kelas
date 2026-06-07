import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// ===== JWT-based session (works on Vercel serverless) =====

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me'

// Simple base64url encoding/decoding
function base64urlEncode(str: string): string {
  return Buffer.from(str).toString('base64url')
}

function base64urlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf-8')
}

// Simple HMAC signing using Web Crypto API
async function sign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return Buffer.from(signature).toString('base64url')
}

async function verify(payload: string, signature: string, secret: string): Promise<boolean> {
  const expected = await sign(payload, secret)
  return expected === signature
}

// Create a JWT token
async function createJWT(data: Record<string, unknown>, expiresInMs: number = 7 * 24 * 60 * 60 * 1000): Promise<string> {
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64urlEncode(JSON.stringify({
    ...data,
    exp: Date.now() + expiresInMs,
  }))
  const content = `${header}.${payload}`
  const sig = await sign(content, JWT_SECRET)
  return `${content}.${sig}`
}

// Verify and decode a JWT token
async function verifyJWT(token: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [header, payload, sig] = parts
    const content = `${header}.${payload}`
    const isValid = await verify(content, sig, JWT_SECRET)
    if (!isValid) return null

    const data = JSON.parse(base64urlDecode(payload))
    if (data.exp && Date.now() > data.exp) return null

    return data
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string): Promise<string> {
  return createJWT({ userId })
}

export function destroySession(_token: string): void {
  // JWT is stateless — client just needs to delete the cookie
}

export async function getSessionFromToken(
  token: string
): Promise<{ userId: string } | null> {
  const data = await verifyJWT(token)
  if (!data || !data.userId) return null
  return { userId: data.userId as string }
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
