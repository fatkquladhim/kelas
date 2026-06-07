import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET all hafalan logs for a kelompok or a specific member
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { searchParams } = new URL(request.url)
    const kelompokId = searchParams.get('kelompokId')
    const kelompokMemberId = searchParams.get('kelompokMemberId')

    if (!kelompokId && !kelompokMemberId) {
      return NextResponse.json({ error: 'kelompokId or kelompokMemberId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = {}
    if (kelompokMemberId) {
      where.kelompokMemberId = kelompokMemberId
    } else if (kelompokId) {
      where.member = { kelompokId }
    }

    const logs = await db.hafalanLog.findMany({
      where,
      include: {
        member: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        verifier: {
          select: { id: true, name: true },
        },
      },
      orderBy: { tanggalSetor: 'desc' },
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('List hafalan logs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST record a new hafalan setoran — Ketua Kelompok mengisi materi secara dinamis
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { kelompokMemberId, materi, status, catatan } = body

    if (!kelompokMemberId || !materi || !status) {
      return NextResponse.json(
        { error: 'kelompokMemberId, materi, dan status wajib diisi' },
        { status: 400 }
      )
    }

    // Verify the requesting user is the group leader or Rois A'm
    const km = await db.kelompokMember.findUnique({
      where: { id: kelompokMemberId },
      include: { kelompok: true },
    })

    if (!km) {
      return NextResponse.json({ error: 'Anggota kelompok tidak ditemukan' }, { status: 404 })
    }

    const isLeader = km.kelompok.leaderId === auth.userId

    let isRois = false
    const cm = await db.classMember.findUnique({
      where: { kelasId_userId: { kelasId: km.kelompok.kelasId, userId: auth.userId } },
    })
    if (cm && cm.role === 'ROIS_AM') {
      isRois = true
    }

    if (!isLeader && !isRois) {
      return NextResponse.json(
        { error: 'Hanya Ketua Kelompok atau Rois A\'m yang dapat mengabsen hafalan' },
        { status: 403 }
      )
    }

    // Create a new log entry — setiap setoran adalah record baru
    const log = await db.hafalanLog.create({
      data: {
        kelompokMemberId,
        materi: materi.trim(),
        status,
        catatan: catatan?.trim() || '',
        tanggalSetor: new Date(),
        verifierId: auth.userId,
      },
      include: {
        member: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        verifier: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ log })
  } catch (error) {
    console.error('Record hafalan log error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
