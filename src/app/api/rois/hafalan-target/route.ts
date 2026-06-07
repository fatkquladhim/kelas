import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// GET all target hafalans for a class/kelompok
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const { searchParams } = new URL(request.url)
    const kelompokId = searchParams.get('kelompokId')
    const kelasId = searchParams.get('kelasId')

    if (!kelompokId && !kelasId) {
      return NextResponse.json({ error: 'kelompokId or kelasId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = {}
    if (kelompokId) {
      where.kelompokId = kelompokId
    } else if (kelasId) {
      where.kelompok = { kelasId }
    }

    const targets = await db.hafalanTarget.findMany({
      where,
      include: {
        kelompok: {
          select: { id: true, name: true },
        },
        logs: {
          include: {
            member: {
              include: {
                user: {
                  select: { id: true, name: true },
                },
              },
            },
            verifier: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { tanggalTarget: 'desc' },
    })

    return NextResponse.json({ targets })
  } catch (error) {
    console.error('List target hafalan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create a target hafalan (Rois Am only)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { kelompokId, materi, tanggalTarget } = body

    if (!kelompokId || !materi || !tanggalTarget) {
      return NextResponse.json(
        { error: 'kelompokId, materi, and tanggalTarget are required' },
        { status: 400 }
      )
    }

    const kelompok = await db.kelompok.findUnique({
      where: { id: kelompokId },
    })

    if (!kelompok) {
      return NextResponse.json({ error: 'Kelompok not found' }, { status: 404 })
    }

    // Verify requesting user is ROIS_AM of the class
    const member = await db.classMember.findUnique({
      where: { kelasId_userId: { kelasId: kelompok.kelasId, userId: auth.userId } },
    })
    if (!member || member.role !== 'ROIS_AM') {
      return NextResponse.json(
        { error: 'Only Rois A\'m can set targets' },
        { status: 403 }
      )
    }

    const target = await db.hafalanTarget.create({
      data: {
        kelompokId,
        materi,
        tanggalTarget: new Date(tanggalTarget),
      },
    })

    return NextResponse.json({ target }, { status: 201 })
  } catch (error) {
    console.error('Create target hafalan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
