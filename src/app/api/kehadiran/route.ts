import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { searchParams } = new URL(request.url)
    const pertemuanLogId = searchParams.get('pertemuanLogId')

    if (!pertemuanLogId) {
      return NextResponse.json(
        { error: 'pertemuanLogId is required' },
        { status: 400 }
      )
    }

    // Verify pertemuan log exists
    const pertemuanLog = await db.pertemuanLog.findUnique({
      where: { id: pertemuanLogId },
    })
    if (!pertemuanLog) {
      return NextResponse.json(
        { error: 'Pertemuan log not found' },
        { status: 404 }
      )
    }

    const kehadiran = await db.kehadiran.findMany({
      where: { pertemuanLogId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ kehadiran })
  } catch (error) {
    console.error('Get kehadiran error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
