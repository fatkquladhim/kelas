import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { searchParams } = new URL(request.url)
    const kelasId = searchParams.get('kelasId')
    const userId = searchParams.get('userId')

    if (!kelasId || !userId) {
      return NextResponse.json(
        { error: 'kelasId and userId are required' },
        { status: 400 }
      )
    }

    // Get all pertemuan log IDs for this class
    const pertemuanLogs = await db.pertemuanLog.findMany({
      where: { kelasId },
      select: { id: true },
    })

    const pertemuanLogIds = pertemuanLogs.map((log) => log.id)

    // Get all attendance records for this user in these meetings
    const allKehadiran = await db.kehadiran.findMany({
      where: {
        pertemuanLogId: { in: pertemuanLogIds },
        userId,
      },
      select: { status: true },
    })

    const totalMeetings = pertemuanLogIds.length
    const hadir = allKehadiran.filter((k) => k.status === 'HADIR').length
    const izin = allKehadiran.filter((k) => k.status === 'IZIN').length
    const sakit = allKehadiran.filter((k) => k.status === 'SAKIT').length
    const alpa = allKehadiran.filter((k) => k.status === 'ALPA').length
    const totalRecorded = allKehadiran.length

    const percentage =
      totalMeetings > 0 ? Math.round((hadir / totalMeetings) * 100) : 0

    return NextResponse.json({
      stats: {
        totalMeetings,
        totalRecorded,
        hadir,
        izin,
        sakit,
        alpa,
        percentage,
      },
    })
  } catch (error) {
    console.error('Get kehadiran stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
