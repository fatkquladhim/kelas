import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

// Day mapper for Indonesian day names
const DAY_MAP: Record<string, number> = {
  AHAD: 0,
  SENIN: 1,
  SELASA: 2,
  RABU: 3,
  KAMIS: 4,
  JUMAT: 5,
  SABTU: 6,
}

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

    const { mataKuliahId, pertemuan: selectedPertemuan } = selectedSilabus

    // Fetch all syllabus items for this course, ordered by pertemuan
    const syllabusList = await db.silabus.findMany({
      where: { mataKuliahId },
      orderBy: { pertemuan: 'asc' },
    })

    // Fetch weekly schedules for this subject in this class
    const schedules = await db.jadwal.findMany({
      where: { kelasId, mataKuliahId },
    })

    const scheduleDays = schedules.map(s => DAY_MAP[s.hari.toUpperCase()]).filter(d => d !== undefined)

    // Calculate actual dates based on schedule starting Jan 3, 2026
    const startDate = new Date('2026-01-03')
    const endDate = new Date() // Today
    const scheduledDates: string[] = []

    if (scheduleDays.length > 0) {
      let currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay()
        if (scheduleDays.includes(dayOfWeek)) {
          scheduledDates.push(currentDate.toISOString().split('T')[0])
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    // Delete existing achievements for this course's syllabus items in this class
    const syllabusIds = syllabusList.map(s => s.id)
    await db.materialAchievement.deleteMany({
      where: {
        kelasId,
        silabusId: { in: syllabusIds },
      },
    })

    // Auto-create material achievements up to selectedPertemuan
    const achievementsToCreate = []
    const todayStr = new Date().toISOString().split('T')[0]

    for (let i = 0; i < syllabusList.length; i++) {
      const s = syllabusList[i]
      if (s.pertemuan <= selectedPertemuan) {
        // Find date for this meeting from calculated schedule, fallback to today
        const dateStr = scheduledDates[s.pertemuan - 1] || todayStr
        
        // If it's the exact selected pertemuan, we can use the custom percentage (e.g. 50% if currently studying)
        // or default to 100%
        let pct = 100
        if (s.pertemuan === selectedPertemuan && customPercentage !== undefined) {
          pct = Number(customPercentage)
        }

        achievementsToCreate.push({
          silabusId: s.id,
          kelasId,
          userId: auth.userId,
          tanggal: new Date(dateStr),
          persentase: pct,
          deskripsi: `Otomatis diisi hingga akhir pembahasan (Pertemuan ${selectedPertemuan}: ${selectedSilabus.materiPokok})`,
        })
      }
    }

    // Create achievements
    let count = 0
    for (const ach of achievementsToCreate) {
      await db.materialAchievement.create({ data: ach })
      count++
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengisi otomatis ${count} capaian materi.`,
    })
  } catch (error) {
    console.error('Auto fill achievement error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
