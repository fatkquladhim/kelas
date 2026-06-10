import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { id: kelasId } = await context.params
    const body = await request.json()
    const { userId, newRole } = body

    if (!userId || !newRole) {
      return NextResponse.json(
        { error: 'userId and newRole are required' },
        { status: 400 }
      )
    }

    const assignableRoles = [
      'DOIS_AM',
      'KETUA_FAN_ILMU',
      'KETUA_KELOMPOK',
      'SEKRETARIS',
      'BENDAHARA',
      'MAHASANTRI',
    ]
    if (!assignableRoles.includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Cannot assign ROIS_AM through this endpoint.' },
        { status: 400 }
      )
    }

    // Check the requesting user is ROIS_AM of this class
    const requesterMember = await db.classMember.findUnique({
      where: { kelasId_userId: { kelasId, userId: auth.userId } },
    })
    if (!requesterMember || requesterMember.role !== 'ROIS_AM') {
      return NextResponse.json(
        { error: 'Only Rois A\'m can assign roles' },
        { status: 403 }
      )
    }

    // Check target member exists in this class
    const targetMember = await db.classMember.findUnique({
      where: { kelasId_userId: { kelasId, userId } },
    })
    if (!targetMember) {
      return NextResponse.json(
        { error: 'Target user is not a member of this class' },
        { status: 404 }
      )
    }

    const updatedMember = await db.classMember.update({
      where: { id: targetMember.id },
      data: { role: newRole },
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

    return NextResponse.json({ member: updatedMember })
  } catch (error) {
    console.error('Assign role error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
