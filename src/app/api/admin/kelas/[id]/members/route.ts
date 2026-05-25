import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, requireAdmin } from '@/lib/auth'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { id } = await context.params

    const kelas = await db.kelas.findUnique({ where: { id } })
    if (!kelas) {
      return NextResponse.json({ error: 'Kelas not found' }, { status: 404 })
    }

    const members = await db.classMember.findMany({
      where: { kelasId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('List members error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof Response) return auth

    const { id } = await context.params
    const body = await request.json()
    const { userId, role } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const kelas = await db.kelas.findUnique({ where: { id } })
    if (!kelas) {
      return NextResponse.json({ error: 'Kelas not found' }, { status: 404 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const validRoles = [
      'MAHASANTRI',
      'ROIS_AM',
      'KETUA_FAN_ILMU',
      'KETUA_KELOMPOK',
      'SEKRETARIS',
      'BENDAHARA',
    ]
    const memberRole = role || 'MAHASANTRI'
    if (!validRoles.includes(memberRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if already a member
    const existing = await db.classMember.findUnique({
      where: { kelasId_userId: { kelasId: id, userId } },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'User is already a member of this class' },
        { status: 409 }
      )
    }

    // If assigning as ROIS_AM, check no existing ROIS_AM in this class
    if (memberRole === 'ROIS_AM') {
      const existingRois = await db.classMember.findFirst({
        where: { kelasId: id, role: 'ROIS_AM' },
      })
      if (existingRois) {
        return NextResponse.json(
          { error: 'This class already has a Rois A\'m' },
          { status: 409 }
        )
      }
    }

    const member = await db.classMember.create({
      data: {
        kelasId: id,
        userId,
        role: memberRole,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error('Add member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
