import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

type RouteContext = {
  params: Promise<{ id: string }>
}

// PATCH update kelompok (Rois Am only)
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { id } = await context.params
    const body = await request.json()
    const { name, leaderId, members: memberUserIds } = body

    const existing = await db.kelompok.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Kelompok not found' }, { status: 404 })
    }

    // Verify requesting user is ROIS_AM of the class
    const member = await db.classMember.findUnique({
      where: { kelasId_userId: { kelasId: existing.kelasId, userId: auth.userId } },
    })
    if (!member || member.role !== 'ROIS_AM') {
      return NextResponse.json(
        { error: 'Only Rois A\'m can manage groups' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    if (name) updateData.name = name
    if (leaderId) updateData.leaderId = leaderId

    // Update the group
    await db.kelompok.update({
      where: { id },
      data: updateData,
    })

    if (leaderId || memberUserIds) {
      // Re-manage the members mapping
      // Delete existing member mappings
      await db.kelompokMember.deleteMany({
        where: { kelompokId: id },
      })

      // Add new mappings
      const uniqueUserIds = Array.from(
        new Set([leaderId || existing.leaderId, ...(memberUserIds || [])])
      ) as string[]

      for (const userId of uniqueUserIds) {
        await db.kelompokMember.create({
          data: {
            kelompokId: id,
            userId,
          },
        })
      }

      // Update new leader role in the class
      if (leaderId) {
        const classLeaderMember = await db.classMember.findUnique({
          where: { kelasId_userId: { kelasId: existing.kelasId, userId: leaderId } },
        })
        if (classLeaderMember && classLeaderMember.role === 'MAHASANTRI') {
          await db.classMember.update({
            where: { id: classLeaderMember.id },
            data: { role: 'KETUA_KELOMPOK' },
          })
        }
      }
    }

    // Fetch updated group details
    const updatedGroup = await db.kelompok.findUnique({
      where: { id },
      include: {
        leader: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ kelompok: updatedGroup })
  } catch (error) {
    console.error('Update kelompok error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE a kelompok (Rois Am only)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { id } = await context.params

    const existing = await db.kelompok.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Kelompok not found' }, { status: 404 })
    }

    // Verify requesting user is ROIS_AM of the class
    const member = await db.classMember.findUnique({
      where: { kelasId_userId: { kelasId: existing.kelasId, userId: auth.userId } },
    })
    if (!member || member.role !== 'ROIS_AM') {
      return NextResponse.json(
        { error: 'Only Rois A\'m can manage groups' },
        { status: 403 }
      )
    }

    // Delete group
    await db.kelompok.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Kelompok deleted successfully',
    })
  } catch (error) {
    console.error('Delete kelompok error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
