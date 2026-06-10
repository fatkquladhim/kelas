import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, comparePassword, hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Password saat ini dan password baru wajib diisi' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: auth.userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Compare current password
    const isCorrect = await comparePassword(currentPassword, user.password)
    if (!isCorrect) {
      return NextResponse.json(
        { error: 'Password saat ini salah' },
        { status: 400 }
      )
    }

    // Hash and save new password
    const hashedPassword = await hashPassword(newPassword)
    await db.user.update({
      where: { id: auth.userId },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ message: 'Password berhasil diubah' })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
