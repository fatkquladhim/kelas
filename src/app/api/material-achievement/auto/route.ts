import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { silabusId, kelasId, customPercentage } = body

    if (!silabusId || !kelasId) {
      return NextResponse.json(
        { error: 'silabusId and kelasId are required' },
        { status: 400 }
      )
    }

    // Verify user is KETUA_FAN_ILMU of the class
    const member = await db.classMember.findUnique({
      where: { kelasId_userId: { kelasId, userId: auth.userId } },
    })
    if (!member || member.role !== 'KETUA_FAN_ILMU') {
      return NextResponse.json(
        { error: 'Only Ketua Fan Ilmu can update material achievements' },
        { status: 403 }
      )
    }

    // Get the selected syllabus item
    const selectedSilabus = await db.silabus.findUnique({
      where: { id: silabusId },
      include: { mataKuliah: true },
    })

    if (!selectedSilabus) {
      return NextResponse.json({ error: 'Silabus not found' }, { status: 404 })
    }

    // Fetch class to get dynamic startDate for description
    const kelas = await db.kelas.findUnique({ where: { id: kelasId } })

    const pct = customPercentage !== undefined ? Number(customPercentage) : 100

    // Upsert achievement for this specific silabus item (replace old entry)
    await db.materialAchievement.deleteMany({
      where: {
        kelasId,
        silabusId,
      },
    })

    await db.materialAchievement.create({
      data: {
        silabusId,
        kelasId,
        userId: auth.userId,
        tanggal: new Date(),
        persentase: Math.min(Math.max(pct, 0), 100),
        deskripsi: `Pembahasan hingga Pertemuan ${selectedSilabus.pertemuan}: ${selectedSilabus.materiPokok}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Capaian untuk pertemuan ${selectedSilabus.pertemuan} berhasil disimpan.`,
    })
  } catch (error) {
    console.error('Save achievement error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}