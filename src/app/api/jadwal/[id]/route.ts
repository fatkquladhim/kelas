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
    const { mataKuliahId, kelasId, hari, waktu } = body

    const existing = await db.jadwal.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Jadwal not found' }, { status: 404 })
    }

    const validHari = ['AHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']
    const validWaktu = ['PAGI', 'SORE', 'MALAM']

    if (hari !== undefined && !validHari.includes(hari)) {
      return NextResponse.json({ error: 'Invalid hari' }, { status: 400 })
    }
    if (waktu !== undefined && !validWaktu.includes(waktu)) {
      return NextResponse.json({ error: 'Invalid waktu' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (mataKuliahId !== undefined) updateData.mataKuliahId = mataKuliahId
    if (kelasId !== undefined) updateData.kelasId = kelasId
    if (hari !== undefined) updateData.hari = hari
    if (waktu !== undefined) updateData.waktu = waktu

    // Check for conflict if kelasId, hari, or waktu changed
    const newKelasId = kelasId || existing.kelasId
    const newHari = hari || existing.hari
    const newWaktu = waktu || existing.waktu

    if (newKelasId !== existing.kelasId || newHari !== existing.hari || newWaktu !== existing.waktu) {
      const conflict = await db.jadwal.findFirst({
        where: {
          kelasId: newKelasId,
          hari: newHari,
          waktu: newWaktu,
          id: { not: id },
        },
      })
      if (conflict) {
        return NextResponse.json(
          { error: 'Schedule conflict: this class already has a schedule at this time' },
          { status: 409 }
        )
      }
    }

    const jadwal = await db.jadwal.update({
      where: { id },
      data: updateData,
      include: {
        mataKuliah: {
          select: { id: true, code: true, name: true },
        },
        kelas: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ jadwal })
  } catch (error) {
    console.error('Update jadwal error:', error)
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

    const existing = await db.jadwal.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Jadwal not found' }, { status: 404 })
    }

    await db.jadwal.delete({ where: { id } })

    return NextResponse.json({ message: 'Jadwal deleted successfully' })
  } catch (error) {
    console.error('Delete jadwal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
