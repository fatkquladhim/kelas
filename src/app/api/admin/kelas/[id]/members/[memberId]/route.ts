import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

type RouteContext = {
  params: Promise<{ id: string; memberId: string }>
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof Response) return auth

    const { id: kelasId, memberId } = await context.params
    const body = await request.json()
    const { role: newRole } = body

    if (!newRole) {
      return NextResponse.json(
        { error: 'role is required' },
        { status: 400 }
      )
    }

    const validRoles = [
      'MAHASANTRI',
      'ROIS_AM',
      'DOIS_AM',
      'KETUA_FAN_ILMU',
      'KETUA_KELOMPOK',
      'SEKRETARIS',
      'BENDAHARA',
    ]
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // If assigning ROIS_AM, check no existing ROIS_AM (except the one being updated)
    if (newRole === 'ROIS_AM') {
      const existingRois = await db.classMember.findFirst({
        where: { kelasId, role: 'ROIS_AM', id: { not: memberId } },
      })
      if (existingRois) {
        return NextResponse.json(
          { error: 'Kelas ini sudah memiliki Rois A\'m' },
          { status: 409 }
        )
      }
    }

    const member = await db.classMember.findUnique({
      where: { id: memberId },
    })
    if (!member || member.kelasId !== kelasId) {
      return NextResponse.json(
        { error: 'Member not found in this class' },
        { status: 404 }
      )
    }

    const updated = await db.classMember.update({
      where: { id: memberId },
      data: { role: newRole },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ member: updated })
  } catch (error) {
    console.error('Update member role error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
