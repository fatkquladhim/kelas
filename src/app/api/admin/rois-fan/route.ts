import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

async function authorizeRoisManagement(request: NextRequest, kelasId?: string) {
  const auth = await requireAuth(request)
  if (auth instanceof Response) return auth

  const user = await db.user.findUnique({ where: { id: auth.userId } })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admin can manage all
  if (user.role === 'ADMIN') return auth

  // Rois Am can manage for their own class
  if (kelasId) {
    const member = await db.classMember.findUnique({
      where: { kelasId_userId: { kelasId, userId: auth.userId } },
    })
    if (member && member.role === 'ROIS_AM') return auth
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const kelasId = searchParams.get('kelasId')

    if (!kelasId) {
      return NextResponse.json({ error: 'kelasId is required' }, { status: 400 })
    }

    const auth = await authorizeRoisManagement(request, kelasId)
    if (auth instanceof Response) return auth

    const assignments = await db.roisFanSubject.findMany({
      where: { kelasId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        mataKuliah: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('List Rois Fan assignments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { kelasId, userId, mataKuliahId } = body

    if (!kelasId || !userId || !mataKuliahId) {
      return NextResponse.json(
        { error: 'kelasId, userId, and mataKuliahId are required' },
        { status: 400 }
      )
    }

    const auth = await authorizeRoisManagement(request, kelasId)
    if (auth instanceof Response) return auth

    // Check if member is in class
    const member = await db.classMember.findUnique({
      where: { kelasId_userId: { kelasId, userId } },
    })
    if (!member) {
      return NextResponse.json(
        { error: 'User is not a member of this class' },
        { status: 400 }
      )
    }

    // Create assignment
    const assignment = await db.roisFanSubject.create({
      data: {
        kelasId,
        userId,
        mataKuliahId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        mataKuliah: { select: { id: true, name: true, code: true } },
      },
    })

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    console.error('Create Rois Fan assignment error:', error)
    const err = error as any
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: 'User is already assigned as Rois Fan for this course in this class' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id parameter is required' }, { status: 400 })
    }

    const assignment = await db.roisFanSubject.findUnique({
      where: { id },
    })
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    const auth = await authorizeRoisManagement(request, assignment.kelasId)
    if (auth instanceof Response) return auth

    await db.roisFanSubject.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Delete Rois Fan assignment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}