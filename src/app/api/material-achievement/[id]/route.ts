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
    const { tanggal, persentase, deskripsi } = body

    const existing = await db.materialAchievement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Material achievement not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (tanggal !== undefined) updateData.tanggal = new Date(tanggal)
    if (persentase !== undefined) {
      const val = Number(persentase)
      if (val < 0 || val > 100) {
        return NextResponse.json(
          { error: 'Persentase must be between 0 and 100' },
          { status: 400 }
        )
      }
      updateData.persentase = val
    }
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi

    const achievement = await db.materialAchievement.update({
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
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ achievement })
  } catch (error) {
    console.error('Update material achievement error:', error)
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

    const existing = await db.materialAchievement.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Material achievement not found' },
        { status: 404 }
      )
    }

    await db.materialAchievement.delete({ where: { id } })

    return NextResponse.json({
      message: 'Material achievement deleted successfully',
    })
  } catch (error) {
    console.error('Delete material achievement error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
