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
    const { name, semester, tahunAjaran, startDate } = body

    const existingKelas = await db.kelas.findUnique({ where: { id } })
    if (!existingKelas) {
      return NextResponse.json({ error: 'Kelas not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (semester !== undefined) updateData.semester = Number(semester)
    if (tahunAjaran !== undefined) updateData.tahunAjaran = tahunAjaran
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null

    const kelas = await db.kelas.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ kelas })
  } catch (error) {
    console.error('Update kelas error:', error)
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

    const existingKelas = await db.kelas.findUnique({ where: { id } })
    if (!existingKelas) {
      return NextResponse.json({ error: 'Kelas not found' }, { status: 404 })
    }

    await db.kelas.delete({ where: { id } })

    return NextResponse.json({ message: 'Kelas deleted successfully' })
  } catch (error) {
    console.error('Delete kelas error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
