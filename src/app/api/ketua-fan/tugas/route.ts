import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET all tugas for a class
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

    const where: Record<string, unknown> = { kelasId }
    if (mataKuliahId) where.mataKuliahId = mataKuliahId

    const tugasList = await db.tugas.findMany({
      where,
      include: {
        mataKuliah: {
          select: { id: true, code: true, name: true },
        },
        creator: {
          select: { id: true, name: true },
        },
        distributions: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        targetKelompok: {
          select: { id: true, name: true },
        },
        targetUser: {
          select: { id: true, name: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json({ tugas: tugasList })
  } catch (error) {
    console.error('List tugas error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create a tugas (Ketua Fan Ilmu only)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { kelasId, mataKuliahId, title, description, dueDate, targetType, targetKelompokId, targetUserId } = body

    if (!kelasId || !mataKuliahId || !title || !dueDate) {
      return NextResponse.json(
        { error: 'kelasId, mataKuliahId, title, and dueDate are required' },
        { status: 400 }
      )
    }

    // Verify user is KETUA_FAN_ILMU of the class
    const member = await db.classMember.findUnique({
      where: { kelasId_userId: { kelasId, userId: auth.userId } },
    })
    if (!member || member.role !== 'KETUA_FAN_ILMU') {
      return NextResponse.json(
        { error: 'Only Ketua Fan Ilmu can create tasks' },
        { status: 403 }
      )
    }

    const tugas = await db.tugas.create({
      data: {
        kelasId,
        mataKuliahId,
        title,
        description: description || '',
        dueDate: new Date(dueDate),
        creatorId: auth.userId,
        targetType: targetType || 'KELAS',
        targetKelompokId: targetType === 'KELOMPOK' ? targetKelompokId : null,
        targetUserId: targetType === 'INDIVIDU' ? targetUserId : null,
      },
      include: {
        mataKuliah: { select: { id: true, code: true, name: true } },
        targetKelompok: { select: { id: true, name: true } },
        targetUser: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ tugas }, { status: 201 })
  } catch (error) {
    console.error('Create tugas error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
