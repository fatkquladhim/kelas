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

    const { id, memberId } = await context.params
    const body = await request.json()
    const { role } = body

    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      )
    }

    const validRoles = [
      'MAHASANTRI',
      'ROIS_AM',
      'KETUA_FAN_ILMU',
      'KETUA_KELOMPOK',
      'SEKRETARIS',
      'BENDAHARA',
    ]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const member = await db.classMember.findUnique({
      where: { id: memberId },
    })
    if (!member || member.kelasId !== id) {
      return NextResponse.json(
        { error: 'Member not found in this class' },
        { status: 404 }
      )
    }

    // If assigning as ROIS_AM, check no existing ROIS_AM (other than this member)
    if (role === 'ROIS_AM') {
      const existingRois = await db.classMember.findFirst({
        where: { kelasId: id, role: 'ROIS_AM', id: { not: memberId } },
      })
      if (existingRois) {
        return NextResponse.json(
          { error: 'This class already has a Rois A\'m' },
          { status: 409 }
        )
      }
    }

    const updatedMember = await db.classMember.update({
      where: { id: memberId },
      data: { role },
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
    console.error('Update member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof Response) return auth

    const { id, memberId } = await context.params

    const member = await db.classMember.findUnique({
      where: { id: memberId },
    })
    if (!member || member.kelasId !== id) {
      return NextResponse.json(
        { error: 'Member not found in this class' },
        { status: 404 }
      )
    }

    await db.classMember.delete({ where: { id: memberId } })

    return NextResponse.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
