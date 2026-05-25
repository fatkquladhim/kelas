import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { searchParams } = new URL(request.url)
    const mataKuliahId = searchParams.get('mataKuliahId')

    const where: Record<string, unknown> = {}
    if (mataKuliahId) where.mataKuliahId = mataKuliahId

    const silabusList = await db.silabus.findMany({
      where,
      orderBy: { pertemuan: 'asc' },
      include: {
        mataKuliah: {
          select: { id: true, code: true, name: true },
        },
      },
    })

    return NextResponse.json({ silabus: silabusList })
  } catch (error) {
    console.error('List silabus error:', error)
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
    const { mataKuliahId, pertemuan, materiPokok, subMateri, referensi } = body

    if (!mataKuliahId || pertemuan === undefined) {
      return NextResponse.json(
        { error: 'mataKuliahId and pertemuan are required' },
        { status: 400 }
      )
    }

    const matakuliah = await db.mataKuliah.findUnique({
      where: { id: mataKuliahId },
    })
    if (!matakuliah) {
      return NextResponse.json(
        { error: 'Mata kuliah not found' },
        { status: 404 }
      )
    }

    const silabus = await db.silabus.create({
      data: {
        mataKuliahId,
        pertemuan: Number(pertemuan),
        materiPokok: materiPokok || '',
        subMateri: subMateri || '',
        referensi: referensi || '',
      },
    })

    return NextResponse.json({ silabus }, { status: 201 })
  } catch (error) {
    console.error('Create silabus error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
