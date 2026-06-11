import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        nis: true,
        phone: true,
        tempatLahir: true,
        tanggalLahir: true,
        alamat: true,
        imageUrl: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { name, nis, phone, tempatLahir, tanggalLahir, alamat, imageUrl } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (nis !== undefined) updateData.nis = nis
    if (phone !== undefined) updateData.phone = phone
    if (tempatLahir !== undefined) updateData.tempatLahir = tempatLahir
    if (tanggalLahir !== undefined) updateData.tanggalLahir = tanggalLahir ? new Date(tanggalLahir) : null
    if (alamat !== undefined) updateData.alamat = alamat
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl

    const user = await db.user.update({
      where: { id: auth.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        nis: true,
        phone: true,
        tempatLahir: true,
        tanggalLahir: true,
        alamat: true,
        imageUrl: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}