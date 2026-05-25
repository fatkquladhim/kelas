import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { searchParams } = new URL(request.url)
    const kelasId = searchParams.get('kelasId')

    const where: Record<string, unknown> = {}
    if (kelasId) where.kelasId = kelasId

    const jadwalList = await db.jadwal.findMany({
      where,
      include: {
        mataKuliah: {
          select: { id: true, code: true, name: true, sks: true },
        },
        kelas: {
          select: { id: true, name: true, semester: true, tahunAjaran: true },
        },
      },
      orderBy: [{ hari: 'asc' }, { waktu: 'asc' }],
    })

    return NextResponse.json({ jadwal: jadwalList })
  } catch (error) {
    console.error('List jadwal error:', error)
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
    const { mataKuliahId, kelasId, hari, waktu } = body

    if (!mataKuliahId || !kelasId || !hari || !waktu) {
      return NextResponse.json(
        { error: 'mataKuliahId, kelasId, hari, and waktu are required' },
        { status: 400 }
      )
    }

    const validHari = ['AHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']
    const validWaktu = ['PAGI', 'SORE', 'MALAM']

    if (!validHari.includes(hari)) {
      return NextResponse.json({ error: 'Invalid hari' }, { status: 400 })
    }
    if (!validWaktu.includes(waktu)) {
      return NextResponse.json({ error: 'Invalid waktu' }, { status: 400 })
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

    const kelas = await db.kelas.findUnique({ where: { id: kelasId } })
    if (!kelas) {
      return NextResponse.json({ error: 'Kelas not found' }, { status: 404 })
    }

    // Check for time slot conflict
    const conflict = await db.jadwal.findUnique({
      where: { kelasId_hari_waktu: { kelasId, hari, waktu } },
    })
    if (conflict) {
      return NextResponse.json(
        { error: 'This class already has a schedule at this time' },
        { status: 409 }
      )
    }

    const jadwal = await db.jadwal.create({
      data: {
        mataKuliahId,
        kelasId,
        hari,
        waktu,
      },
      include: {
        mataKuliah: {
          select: { id: true, code: true, name: true },
        },
        kelas: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ jadwal }, { status: 201 })
  } catch (error) {
    console.error('Create jadwal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
