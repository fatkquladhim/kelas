import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Email tidak terdaftar dalam sistem' },
        { status: 404 }
      )
    }

    // Check if there's already a pending request
    const existingPending = await db.resetPasswordRequest.findFirst({
      where: { userId: user.id, status: 'PENDING' },
    })

    if (existingPending) {
      return NextResponse.json({
        message: 'Permohonan reset password Anda sedang diproses oleh Admin. Silakan tunggu.',
      })
    }

    await db.resetPasswordRequest.create({
      data: {
        userId: user.id,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      message: 'Permohonan reset password berhasil dikirim. Silakan hubungi Admin untuk persetujuan.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
