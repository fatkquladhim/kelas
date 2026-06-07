import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof Response) return auth

    const { id } = await context.params
    const body = await request.json()
    const { pertemuan, materiPokok, subMateri, referensi } = body

    const existing = await db.silabus.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Silabus not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (pertemuan !== undefined) updateData.pertemuan = Number(pertemuan)
    if (materiPokok !== undefined) updateData.materiPokok = materiPokok
    if (subMateri !== undefined) updateData.subMateri = subMateri
    if (referensi !== undefined) updateData.referensi = referensi

    const silabus = await db.silabus.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ silabus })
  } catch (error) {
    console.error('Update silabus error:', error)
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

    const { id } = await context.params

    const existing = await db.silabus.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Silabus not found' }, { status: 404 })
    }

    await db.silabus.delete({ where: { id } })

    return NextResponse.json({ message: 'Silabus deleted successfully' })
  } catch (error) {
    console.error('Delete silabus error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
