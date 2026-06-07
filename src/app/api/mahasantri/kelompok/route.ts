import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { searchParams } = new URL(request.url)
    const kelasId = searchParams.get('kelasId')

    if (!kelasId) {
      return NextResponse.json({ error: 'kelasId is required' }, { status: 400 })
    }

    // Find if user is a member of any group in this class
    const kelompokMember = await db.kelompokMember.findFirst({
      where: {
        userId: auth.userId,
        kelompok: { kelasId },
      },
      include: {
        kelompok: {
          include: {
            leader: { select: { id: true, name: true, email: true } },
            members: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
            targets: {
              orderBy: { tanggalTarget: 'desc' },
            },
          },
        },
      },
    })

    if (!kelompokMember) {
      return NextResponse.json({
        inGroup: false,
        message: 'Mahasantri belum terdaftar di kelompok manapun',
      })
    }

    const { kelompok } = kelompokMember

    // Get logs for the user in this group
    const myLogs = await db.hafalanLog.findMany({
      where: {
        kelompokMemberId: kelompokMember.id,
      },
      include: {
        target: true,
        verifier: { select: { id: true, name: true } },
      },
      orderBy: { tanggalSetor: 'desc' },
    })

    // Get distributed tasks for the user in this group
    const myTasks = await db.tugasDistribution.findMany({
      where: {
        kelompokId: kelompok.id,
        userId: auth.userId,
      },
      include: {
        tugas: {
          include: {
            mataKuliah: { select: { id: true, code: true, name: true } },
            creator: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      inGroup: true,
      kelompokId: kelompok.id,
      name: kelompok.name,
      leader: kelompok.leader,
      members: kelompok.members.map(m => ({
        ...m.user,
        kelompokMemberId: m.id
      })),
      targets: kelompok.targets,
      myLogs,
      myTasks,
    })
  } catch (error) {
    console.error('Get mahasantri kelompok error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
