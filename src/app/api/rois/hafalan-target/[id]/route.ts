import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

type RouteContext = {
  params: Promise<{ id: string }>
}

// PATCH update target hafalan (Rois Am only)
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { id } = await context.params
    const body = await request.json()
    const { materi, tanggalTarget } = body

    const existing = await db.hafalanTarget.findUnique({
      where: { id },
      include: { kelompok: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 })
    }

    // Verify requesting user is ROIS_AM of the class
    const member = await db.classMember.findUnique({
      where: { kelasId_userId: { kelasId: existing.kelompok.kelasId, userId: auth.userId } },
    })
    if (!member || member.role !== 'ROIS_AM') {
      return NextResponse.json(
        { error: 'Only Rois A\'m can manage targets' },
        { status: 403 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (materi) updateData.materi = materi
    if (tanggalTarget) updateData.tanggalTarget = new Date(tanggalTarget)

    const updated = await db.hafalanTarget.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ target: updated })
  } catch (error) {
    console.error('Update target hafalan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE target hafalan (Rois Am only)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { id } = await context.params

    const existing = await db.hafalanTarget.findUnique({
      where: { id },
      include: { kelompok: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 })
    }

    // Verify requesting user is ROIS_AM of the class
    const member = await db.classMember.findUnique({
      where: { kelasId_userId: { kelasId: existing.kelompok.kelasId, userId: auth.userId } },
    })
    if (!member || member.role !== 'ROIS_AM') {
      return NextResponse.json(
        { error: 'Only Rois A\'m can manage targets' },
        { status: 403 }
      )
    }

    await db.hafalanTarget.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Target deleted successfully',
    })
  } catch (error) {
    console.error('Delete target hafalan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
