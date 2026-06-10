import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// Helper to verify user is Rois Fan of the course in the class
async function verifyRoisFan(userId: string, kelasId: string, mataKuliahId: string) {
  const assignment = await db.roisFanSubject.findFirst({
    where: { kelasId, userId, mataKuliahId },
  })
  return !!assignment
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { searchParams } = new URL(request.url)
    const kelasId = searchParams.get('kelasId')
    const mataKuliahId = searchParams.get('mataKuliahId')

    if (!kelasId) {
      return NextResponse.json({ error: 'kelasId is required' }, { status: 400 })
    }

    const where: Record<string, any> = { kelasId }
    if (mataKuliahId) {
      where.mataKuliahId = mataKuliahId
    }

    const schedules = await db.presentasiJadwal.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        mataKuliah: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { pertemuan: 'asc' },
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error('List presentation schedules error:', error)
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
    const { kelasId, mataKuliahId, pertemuan, userId, tanggal, materi } = body

    if (!kelasId || !mataKuliahId || !pertemuan || !userId || !tanggal) {
      return NextResponse.json(
        { error: 'kelasId, mataKuliahId, pertemuan, userId, and tanggal are required' },
        { status: 400 }
      )
    }

    // Verify requesting user is Rois Fan for this course in the class
    const isRois = await verifyRoisFan(auth.userId, kelasId, mataKuliahId)
    if (!isRois) {
      return NextResponse.json(
        { error: 'Only Rois Fan of this course can manage its presentation schedule' },
        { status: 403 }
      )
    }

    // Create or update presentation schedule
    const schedule = await db.presentasiJadwal.upsert({
      where: {
        kelasId_mataKuliahId_pertemuan: {
          kelasId,
          mataKuliahId,
          pertemuan: Number(pertemuan),
        },
      },
      update: {
        userId,
        tanggal: new Date(tanggal),
        materi: materi || '',
      },
      create: {
        kelasId,
        mataKuliahId,
        pertemuan: Number(pertemuan),
        userId,
        tanggal: new Date(tanggal),
        materi: materi || '',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('Save presentation schedule error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id parameter is required' }, { status: 400 })
    }

    const schedule = await db.presentasiJadwal.findUnique({
      where: { id },
    })

    if (!schedule) {
      return NextResponse.json({ error: 'Presentation schedule entry not found' }, { status: 404 })
    }

    // Verify requesting user is Rois Fan for this course in the class
    const isRois = await verifyRoisFan(auth.userId, schedule.kelasId, schedule.mataKuliahId)
    if (!isRois) {
      return NextResponse.json(
        { error: 'Only Rois Fan of this course can delete its presentation schedule' },
        { status: 403 }
      )
    }

    await db.presentasiJadwal.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Presentation schedule entry deleted successfully' })
  } catch (error) {
    console.error('Delete presentation schedule error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
