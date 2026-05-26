import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// POST /api/pengumuman - Create announcement
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
