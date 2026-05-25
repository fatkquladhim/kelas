import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { searchParams } = new URL(request.url)
    const kelasId = searchParams.get('kelasId')
    const silabusId = searchParams.get('silabusId')

    const where: Record<string, unknown> = {}
    if (kelasId) where.kelasId = kelasId
    if (silabusId) where.silabusId = silabusId

    const achievements = await db.materialAchievement.findMany({
      where,
      orderBy: { tanggal: 'desc' },
      include: {
        silabus: {
          select: {
            id: true,
            pertemuan: true,
            materiPokok: true,
            mataKuliah: {
              select: { id: true, code: true, name: true },
            },
          },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ achievements })
  } catch (error) {
    console.error('List material achievements error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { silabusId, kelasId, tanggal, persentase, deskripsi } = body

    if (!silabusId || !kelasId || !tanggal) {
      return NextResponse.json(
        { error: 'silabusId, kelasId, and tanggal are required' },
        { status: 400 }
      )
    }

    // Only KETUA_FAN_ILMU of the class can create material achievements
    const member = await db.classMember.findUnique({
      where: { kelasId_userId: { kelasId, userId: auth.userId } },
    })
    if (!member || member.role !== 'KETUA_FAN_ILMU') {
      return NextResponse.json(
        { error: 'Only Ketua Fan Ilmu can create material achievements' },
        { status: 403 }
      )
    }

    const persentaseVal = persentase !== undefined ? Number(persentase) : 0
    if (persentaseVal < 0 || persentaseVal > 100) {
      return NextResponse.json(
        { error: 'Persentase must be between 0 and 100' },
        { status: 400 }
      )
    }

    const silabus = await db.silabus.findUnique({ where: { id: silabusId } })
    if (!silabus) {
      return NextResponse.json({ error: 'Silabus not found' }, { status: 404 })
    }

    const achievement = await db.materialAchievement.create({
      data: {
        silabusId,
        kelasId,
        userId: auth.userId,
        tanggal: new Date(tanggal),
        persentase: persentaseVal,
        deskripsi: deskripsi || '',
      },
    })

    return NextResponse.json({ achievement }, { status: 201 })
  } catch (error) {
    console.error('Create material achievement error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
