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
    const { code, name, sks, semester, programStudi, standarKompetensi, deskripsi } = body

    const existing = await db.mataKuliah.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Mata kuliah not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (code !== undefined) {
      const codeTaken = await db.mataKuliah.findFirst({
        where: { code, id: { not: id } },
      })
      if (codeTaken) {
        return NextResponse.json({ error: 'Code already taken' }, { status: 409 })
      }
      updateData.code = code
    }
    if (name !== undefined) updateData.name = name
    if (sks !== undefined) updateData.sks = Number(sks)
    if (semester !== undefined) updateData.semester = Number(semester)
    if (programStudi !== undefined) updateData.programStudi = programStudi
    if (standarKompetensi !== undefined) updateData.standarKompetensi = standarKompetensi
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi

    const matakuliah = await db.mataKuliah.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ matakuliah })
  } catch (error) {
    console.error('Update matakuliah error:', error)
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

    const existing = await db.mataKuliah.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Mata kuliah not found' }, { status: 404 })
    }

    await db.mataKuliah.delete({ where: { id } })

    return NextResponse.json({ message: 'Mata kuliah deleted successfully' })
  } catch (error) {
    console.error('Delete matakuliah error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
