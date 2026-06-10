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

    // Verify role (Admin, Rois Am, or Dois Am of this class)
    const member = await db.classMember.findFirst({
      where: {
        kelasId,
        userId: auth.userId,
        role: 'ROIS_AM',
      },
    })

    const user = await db.user.findUnique({ where: { id: auth.userId } })
    const isGlobalAdmin = user?.role === 'ADMIN'

    if (!isGlobalAdmin && !member) {
      // Check if user is Rois Fan for any subject in this class
      const roisFan = await db.roisFanSubject.findFirst({
        where: { kelasId, userId: auth.userId },
      })
      if (!roisFan) {
        return NextResponse.json(
          { error: 'Hanya Rois A\'m, Dois A\'m, atau Admin yang dapat mengakses laporan ini' },
          { status: 403 }
        )
      }
    }

    // Load Class details
    const kelas = await db.kelas.findUnique({
      where: { id: kelasId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    if (!kelas) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 })
    }

    // Load all subjects/Mata Kuliah
    const courses = await db.mataKuliah.findMany({
      include: {
        syllabus: true,
      },
    })

    // Load all achievements for this class
    const achievements = await db.materialAchievement.findMany({
      where: { kelasId },
      include: {
        silabus: true,
      },
    })

    // Load recent meetings log
    const recentLogs = await db.pertemuanLog.findMany({
      where: { kelasId },
      include: {
        silabus: {
          include: {
            mataKuliah: true,
          },
        },
      },
      orderBy: { tanggal: 'desc' },
      take: 20,
    })

    // Load group details
    const groups = await db.kelompok.findMany({
      where: { kelasId },
      include: {
        leader: { select: { name: true } },
        members: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    })

    // Build the report data
    const courseProgress = courses.map(course => {
      const courseSyllabusIds = course.syllabus.map(s => s.id)
      const courseAchievements = achievements.filter(a => courseSyllabusIds.includes(a.silabusId))
      const totalSyllabus = courseSyllabusIds.length
      const completedSyllabus = courseAchievements.length

      const totalPercentage = courseAchievements.reduce((sum, a) => sum + a.persentase, 0)
      const avgPercentage = totalSyllabus > 0 ? Math.round(totalPercentage / totalSyllabus) : 0

      // Get Rois Fan name
      return {
        id: course.id,
        code: course.code,
        name: course.name,
        totalSyllabus,
        completedSyllabus,
        avgPercentage,
      }
    })

    // Formatting date
    const dateFormatted = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    // Build Word-compatible HTML string
    const htmlReport = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Laporan Akademik Kelas</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000000;
            margin: 1in;
          }
          h1 {
            font-size: 18pt;
            text-align: center;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 2pt;
            color: #064e3b;
          }
          h2 {
            font-size: 14pt;
            border-bottom: 2px solid #047857;
            padding-bottom: 3pt;
            margin-top: 20pt;
            margin-bottom: 10pt;
            color: #065f46;
          }
          h3 {
            font-size: 12pt;
            margin-top: 10pt;
            margin-bottom: 5pt;
          }
          .subtitle {
            text-align: center;
            font-size: 11pt;
            font-style: italic;
            margin-bottom: 20pt;
            color: #4b5563;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15pt;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
            text-align: left;
            padding: 6pt;
            border: 1px solid #d1d5db;
          }
          td {
            padding: 6pt;
            border: 1px solid #e5e7eb;
          }
          .text-center {
            text-align: center;
          }
          .font-semibold {
            font-weight: bold;
          }
          .badge {
            padding: 2px 6px;
            font-size: 9pt;
            border-radius: 4px;
            background-color: #e0f2fe;
            color: #0369a1;
          }
          .footer {
            margin-top: 40pt;
            text-align: right;
          }
          .signature-box {
            display: inline-block;
            text-align: center;
            width: 200px;
          }
        </style>
      </head>
      <body>
        <h1>Laporan Progres Akademik & Kelompok</h1>
        <div class="subtitle">Mata Kuliah & Kepengurusan &bull; ${kelas.name} &bull; ${dateFormatted}</div>

        <h2>I. Detail Kelas</h2>
        <table>
          <tr>
            <td width="30%" class="font-semibold">Nama Kelas</td>
            <td>${kelas.name}</td>
          </tr>
          <tr>
            <td class="font-semibold">Semester / Tahun Ajaran</td>
            <td>Semester ${kelas.semester} / ${kelas.tahunAjaran}</td>
          </tr>
          <tr>
            <td class="font-semibold">Jumlah Mahasantri</td>
            <td>${kelas.members.length} Orang</td>
          </tr>
          <tr>
            <td class="font-semibold">Tanggal Mulai Semester</td>
            <td>${kelas.startDate ? new Date(kelas.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum ditentukan'}</td>
          </tr>
        </table>

        <h2>II. Capaian Progres Silabus Kitab</h2>
        <table>
          <thead>
            <tr>
              <th width="15%">Kode</th>
              <th width="45%">Nama Mata Kuliah / Kitab</th>
              <th width="20%" class="text-center">Pertemuan Terisi</th>
              <th width="20%" class="text-center">Rata-rata Capaian</th>
            </tr>
          </thead>
          <tbody>
            ${courseProgress.map(cp => `
              <tr>
                <td>${cp.code}</td>
                <td class="font-semibold">${cp.name}</td>
                <td class="text-center">${cp.completedSyllabus} / ${cp.totalSyllabus}</td>
                <td class="text-center font-semibold">${cp.avgPercentage}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>III. Struktur Kelompok & Kepengurusan</h2>
        ${groups.length === 0 ? '<p>Belum ada kelompok belajar yang dibentuk di kelas ini.</p>' : `
          <table>
            <thead>
              <tr>
                <th width="30%">Nama Kelompok</th>
                <th width="30%">Ketua Kelompok</th>
                <th width="40%">Anggota</th>
              </tr>
            </thead>
            <tbody>
              ${groups.map(g => `
                <tr>
                  <td class="font-semibold">${g.name}</td>
                  <td>${g.leader.name}</td>
                  <td>${g.members.map(m => m.user.name).join(', ')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}

        <h2>IV. Log Pertemuan Terakhir (Max 20 Sesi)</h2>
        <table>
          <thead>
            <tr>
              <th width="20%">Tanggal</th>
              <th width="35%">Mata Kuliah / Kitab</th>
              <th width="15%" class="text-center">Pertemuan Ke</th>
              <th width="30%">Materi Bahasan</th>
            </tr>
          </thead>
          <tbody>
            ${recentLogs.length === 0 ? `
              <tr>
                <td colspan="4" class="text-center">Belum ada catatan pertemuan kelas</td>
              </tr>
            ` : recentLogs.map(log => `
              <tr>
                <td>${new Date(log.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</td>
                <td>${log.silabus.mataKuliah.name}</td>
                <td class="text-center">${log.silabus.pertemuan}</td>
                <td>${log.silabus.materiPokok} ${log.catatan ? `(${log.catatan})` : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div class="signature-box">
            <p>${member ? 'Rois A\'m Kelas' : isGlobalAdmin ? 'Administrator' : 'Rois Fan'},</p>
            <br><br><br>
            <p class="font-semibold" style="text-decoration: underline;">
              ${user?.name || 'Sistem'}
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    // Return the response as file download
    const filename = `Laporan_Akademik_${kelas.name.replace(/\s+/g, '_')}_Semester_${kelas.semester}.doc`
    return new NextResponse(htmlReport, {
      headers: {
        'Content-Type': 'application/msword',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Download report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
