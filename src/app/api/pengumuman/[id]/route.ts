import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// PUT /api/pengumuman/[id] - Update announcement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if (auth instanceof Response) return auth

  const { id } = await params

  try {
    const existing = await db.pengumuman.findUnique({
      where: { id },
      include: { author: { select: { id: true } } },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Pengumuman tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if user is author or admin
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    if (existing.authorId !== auth.userId && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Tidak memiliki akses' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, content, category, kelasId, isPinned } = body

    const pengumuman = await db.pengumuman.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(kelasId !== undefined && { kelasId: kelasId || null }),
        ...(isPinned !== undefined && { isPinned }),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        kelas: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ pengumuman })
  } catch {
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}

// DELETE /api/pengumuman/[id] - Delete announcement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if (auth instanceof Response) return auth

  const { id } = await params

  try {
    const existing = await db.pengumuman.findUnique({
      where: { id },
      include: { author: { select: { id: true } } },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Pengumuman tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if user is author or admin
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    if (existing.authorId !== auth.userId && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Tidak memiliki akses' },
        { status: 403 }
      )
    }

    await db.pengumuman.delete({ where: { id } })

    return NextResponse.json({ message: 'Pengumuman dihapus' })
  } catch {
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}
