import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET all kelompok for a class
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { searchParams } = new URL(request.url)
    const kelasId = searchParams.get('kelasId')

    if (!kelasId) {
      return NextResponse.json({ error: 'kelasId is required' }, { status: 400 })
    }

    const kelompoks = await db.kelompok.findMany({
      where: { kelasId },
      include: {
        leader: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        targets: {
          orderBy: { tanggalTarget: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ kelompoks })
  } catch (error) {
    console.error('List kelompok error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create a new kelompok (Rois Am only)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { name, kelasId, leaderId, members: memberUserIds } = body

    if (!name || !kelasId || !leaderId) {
      return NextResponse.json(
        { error: 'name, kelasId, and leaderId are required' },
        { status: 400 }
      )
    }

    // Verify requesting user is ROIS_AM of the class
    const member = await db.classMember.findUnique({
      where: { kelasId_userId: { kelasId, userId: auth.userId } },
    })
    if (!member || member.role !== 'ROIS_AM') {
      return NextResponse.json(
        { error: 'Only Rois A\'m can manage groups' },
        { status: 403 }
      )
    }

    // Create Group
    const kelompok = await db.kelompok.create({
      data: {
        name,
        kelasId,
        leaderId,
      },
    })

    // Add leader and members to KelompokMember mapping
    const uniqueUserIds = Array.from(new Set([leaderId, ...(memberUserIds || [])])) as string[]
    
    for (const userId of uniqueUserIds) {
      await db.kelompokMember.create({
        data: {
          kelompokId: kelompok.id,
          userId,
        },
      })

      // Update the class membership role of the leader to KETUA_KELOMPOK if it was MAHASANTRI
      if (userId === leaderId) {
        const classLeaderMember = await db.classMember.findUnique({
          where: { kelasId_userId: { kelasId, userId } },
        })
        if (classLeaderMember && classLeaderMember.role === 'MAHASANTRI') {
          await db.classMember.update({
            where: { id: classLeaderMember.id },
            data: { role: 'KETUA_KELOMPOK' },
          })
        }
      }
    }

    // Fetch the created group with details
    const createdGroup = await db.kelompok.findUnique({
      where: { id: kelompok.id },
      include: {
        leader: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ kelompok: createdGroup }, { status: 201 })
  } catch (error) {
    console.error('Create kelompok error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
