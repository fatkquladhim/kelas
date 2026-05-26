import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { pertemuanLogId, attendances } = body

    if (!pertemuanLogId || !attendances || !Array.isArray(attendances)) {
      return NextResponse.json(
        { error: 'pertemuanLogId and attendances array are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['HADIR', 'IZIN', 'SAKIT', 'ALPA']

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

    // Validate all attendances
    for (const att of attendances) {
      if (!att.userId || !att.status) {
        return NextResponse.json(
          { error: 'Each attendance must have userId and status' },
          { status: 400 }
        )
      }
      if (!validStatuses.includes(att.status)) {
        return NextResponse.json(
          { error: `Invalid status: ${att.status}. Must be HADIR, IZIN, SAKIT, or ALPA` },
          { status: 400 }
        )
      }
    }

    // Upsert each attendance record
    const results = await Promise.all(
      attendances.map((att: { userId: string; status: string; keterangan?: string }) =>
        db.kehadiran.upsert({
          where: {
            pertemuanLogId_userId: {
              pertemuanLogId,
              userId: att.userId,
            },
          },
          create: {
            pertemuanLogId,
            userId: att.userId,
            status: att.status,
            keterangan: att.keterangan || null,
          },
          update: {
            status: att.status,
            keterangan: att.keterangan || null,
          },
        })
      )
    )

    return NextResponse.json({
      message: 'Kehadiran saved successfully',
      count: results.length,
    })
  } catch (error) {
    console.error('Batch save kehadiran error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
