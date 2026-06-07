import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET distributed tasks for a kelompok/tugas
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { searchParams } = new URL(request.url)
    const tugasId = searchParams.get('tugasId')
    const kelompokId = searchParams.get('kelompokId')

    if (!tugasId && !kelompokId) {
      return NextResponse.json({ error: 'tugasId or kelompokId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = {}
    if (tugasId) where.tugasId = tugasId
    if (kelompokId) where.kelompokId = kelompokId

    const distributions = await db.tugasDistribution.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        tugas: {
          include: {
            mataKuliah: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ distributions })
  } catch (error) {
    console.error('List tugas distribution error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST distribute or update task distribution (Ketua Kelompok or Assigned Student)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { tugasId, kelompokId, userId, taskDetail, status, catatan } = body

    if (!tugasId || !kelompokId || !userId) {
      return NextResponse.json(
        { error: 'tugasId, kelompokId, and userId are required' },
        { status: 400 }
      )
    }

    // Retrieve group info
    const kelompok = await db.kelompok.findUnique({
      where: { id: kelompokId },
    })

    if (!kelompok) {
      return NextResponse.json({ error: 'Kelompok not found' }, { status: 404 })
    }

    const isLeader = kelompok.leaderId === auth.userId
    const isAssignedUser = userId === auth.userId

    // Only leader can change details/assign. But assigned user can mark status as 'SELESAI'.
    if (!isLeader && !isAssignedUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Only Group Leader or the assigned student can modify this task.' },
        { status: 403 }
      )
    }

    // If it's a student marking their own task as complete
    const updateData: Record<string, unknown> = {}
    if (isLeader) {
      if (taskDetail !== undefined) updateData.taskDetail = taskDetail
      if (status !== undefined) updateData.status = status
      if (catatan !== undefined) updateData.catatan = catatan
    } else {
      // Student can only toggle status and add/modify their comment (catatan)
      if (status !== undefined) updateData.status = status
      if (catatan !== undefined) updateData.catatan = catatan
    }

    const distribution = await db.tugasDistribution.upsert({
      where: {
        tugasId_kelompokId_userId: {
          tugasId,
          kelompokId,
          userId,
        },
      },
      update: updateData,
      create: {
        tugasId,
        kelompokId,
        userId,
        taskDetail: taskDetail || '',
        status: status || 'BELUM',
        catatan: catatan || '',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ distribution })
  } catch (error) {
    console.error('Record tugas distribution error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
