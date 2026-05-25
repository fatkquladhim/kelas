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

    const logs = await db.pertemuanLog.findMany({
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
        kelas: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('List pertemuan log error:', error)
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
    const { silabusId, kelasId, tanggal, status, catatan } = body

    if (!silabusId || !kelasId || !tanggal) {
      return NextResponse.json(
        { error: 'silabusId, kelasId, and tanggal are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['SELESAI', 'BELUM', 'DITUNDA', 'ABSEN']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const silabus = await db.silabus.findUnique({ where: { id: silabusId } })
    if (!silabus) {
      return NextResponse.json({ error: 'Silabus not found' }, { status: 404 })
    }

    const kelas = await db.kelas.findUnique({ where: { id: kelasId } })
    if (!kelas) {
      return NextResponse.json({ error: 'Kelas not found' }, { status: 404 })
    }

    const log = await db.pertemuanLog.create({
      data: {
        silabusId,
        kelasId,
        tanggal: new Date(tanggal),
        status: status || 'BELUM',
        catatan: catatan || '',
      },
    })

    return NextResponse.json({ log }, { status: 201 })
  } catch (error) {
    console.error('Create pertemuan log error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
