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

    const { id } = await context.params
    const body = await request.json()
    const { tanggal, status, catatan } = body

    const existing = await db.pertemuanLog.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Pertemuan log not found' },
        { status: 404 }
      )
    }

    const validStatuses = ['SELESAI', 'BELUM', 'DITUNDA', 'ABSEN']
    if (status !== undefined && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (tanggal !== undefined) updateData.tanggal = new Date(tanggal)
    if (status !== undefined) updateData.status = status
    if (catatan !== undefined) updateData.catatan = catatan

    const log = await db.pertemuanLog.update({
      where: { id },
      data: updateData,
      include: {
        silabus: {
          select: {
            id: true,
            pertemuan: true,
            materiPokok: true,
            mataKuliah: {
              select: { id: true, code: true, name: true },
            },
          },
        },
        kelas: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ log })
  } catch (error) {
    console.error('Update pertemuan log error:', error)
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
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { id } = await context.params

    const existing = await db.pertemuanLog.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Pertemuan log not found' },
        { status: 404 }
      )
    }

    await db.pertemuanLog.delete({ where: { id } })

    return NextResponse.json({ message: 'Pertemuan log deleted successfully' })
  } catch (error) {
    console.error('Delete pertemuan log error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
