import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Any authenticated user can view mata kuliah list
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const matakuliahList = await db.mataKuliah.findMany({
      orderBy: [{ semester: 'asc' }, { code: 'asc' }],
      include: {
        _count: {
          select: { syllabus: true, schedules: true },
        },
      },
    })

    return NextResponse.json({ matakuliah: matakuliahList })
  } catch (error) {
    console.error('List matakuliah error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { code, name, sks, semester, programStudi, standarKompetensi, deskripsi } = body

    if (!code || !name || semester === undefined) {
      return NextResponse.json(
        { error: 'Code, name, and semester are required' },
        { status: 400 }
      )
    }

    const existing = await db.mataKuliah.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 409 }
      )
    }

    const matakuliah = await db.mataKuliah.create({
      data: {
        code,
        name,
        sks: sks ? Number(sks) : 2,
        semester: Number(semester),
        programStudi: programStudi || '',
        standarKompetensi: standarKompetensi || '',
        deskripsi: deskripsi || '',
      },
    })

    return NextResponse.json({ matakuliah }, { status: 201 })
  } catch (error) {
    console.error('Create matakuliah error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
