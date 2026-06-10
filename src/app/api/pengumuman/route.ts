import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof Response) return auth

  try {
    const body = await request.json()
    const { title, content, category, kelasId, isPinned } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Judul dan konten wajib diisi' },
        { status: 400 }
      )
    }

    // Check permissions: Admin can do anything. Rois/Dois Am can only do for their own class.
    const user = await db.user.findUnique({ where: { id: auth.userId } })
    const isAdmin = user?.role === 'ADMIN'

    if (!isAdmin) {
      if (!kelasId) {
        return NextResponse.json(
          { error: 'Hanya Admin yang dapat membuat pengumuman global (Semua Kelas)' },
          { status: 403 }
        )
      }

      // Check if user is ROIS_AM or KETUA_FAN_ILMU in the specified class
      const classMembership = await db.classMember.findFirst({
        where: {
          kelasId,
          userId: auth.userId,
          role: { in: ['ROIS_AM', 'KETUA_FAN_ILMU'] },
        },
      })

      if (!classMembership) {
        return NextResponse.json(
          { error: 'Hanya Rois A\'m atau Rois Fan yang dapat membuat pengumuman kelas ini' },
          { status: 403 }
        )
      }
    }

    const pengumuman = await db.pengumuman.create({
      data: {
        title,
        content,
        category: category || 'UMUM',
        kelasId: kelasId || null,
        authorId: auth.userId,
        isPinned: isPinned || false,
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

    return NextResponse.json({ pengumuman }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}

// GET /api/pengumuman - List announcements
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof Response) return auth

  try {
    const { searchParams } = new URL(request.url)
    const kelasId = searchParams.get('kelasId')

    const where = kelasId
      ? {
          OR: [
            { kelasId },        // class-specific
            { kelasId: null },  // global
          ],
        }
      : {}

    const pengumuman = await db.pengumuman.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        kelas: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ pengumuman })
  } catch {
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}
