'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BarChart3, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAppStore } from '@/lib/store'

interface Kelas {
  id: string
  name: string
  semester: number
  tahunAjaran: string
}

interface MataKuliah {
  id: string
  code: string
  name: string
}

interface Silabus {
  id: string
  pertemuan: number
  materiPokok: string
  mataKuliahId: string
}

interface PertemuanLog {
  id: string
  silabusId: string
  tanggal: string
  status: string
  silabus: {
    pertemuan: number
    materiPokok: string
    mataKuliah: { code: string; name: string; id: string }
  }
}

interface MaterialAchievement {
  id: string
  silabusId: string
  tanggal: string
  persentase: number
  deskripsi: string
  silabus: {
    pertemuan: number
    materiPokok: string
    mataKuliah: { code: string; name: string }
  }
}

interface CourseProgress {
  mataKuliahId: string
  code: string
  name: string
  totalPertemuan: number
  selesai: number
  persentase: number
  latestAchievement: number
}

export function StudentProgress() {
  const { selectedKelas } = useAppStore()
  const [classes, setClasses] = useState<Kelas[]>([])
  const [selectedKelasId, setSelectedKelasId] = useState('')
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [achievements, setAchievements] = useState<MaterialAchievement[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/kelas')
      if (res.ok) {
        const data = await res.json()
        const list: Kelas[] = data.kelas || []
        setClasses(list)
        const kelasId = selectedKelas?.id || (list.length > 0 ? list[0].id : '')
        if (kelasId && !selectedKelasId) setSelectedKelasId(kelasId)
      }
    } catch {
      // silent
    }
  }, [selectedKelas, selectedKelasId])

  const fetchProgress = useCallback(async () => {
    if (!selectedKelasId) return
    try {
      setLoading(true)
      const [mkRes, silabusRes, logsRes, achRes] = await Promise.all([
        fetch('/api/matakuliah'),
        fetch('/api/silabus'),
        fetch(`/api/pertemuan-log?kelasId=${selectedKelasId}`),
        fetch(`/api/material-achievement?kelasId=${selectedKelasId}`),
      ])

      const mkData = mkRes.ok ? await mkRes.json() : { matakuliah: [] }
      const silabusData = silabusRes.ok ? await silabusRes.json() : { silabus: [] }
      const logsData = logsRes.ok ? await logsRes.json() : { logs: [] }
      const achData = achRes.ok ? await achRes.json() : { achievements: [] }

      const courses: MataKuliah[] = mkData.matakuliah || []
      const allSilabus: Silabus[] = silabusData.silabus || []
      const allLogs: PertemuanLog[] = logsData.logs || []
      const allAch: MaterialAchievement[] = achData.achievements || []

      const progress: CourseProgress[] = courses.map(mk => {
        const mkSilabus = allSilabus.filter(s => s.mataKuliahId === mk.id)
        const mkLogIds = new Set(
          allLogs
            .filter(l => l.silabus?.mataKuliah?.id === mk.id && l.status === 'SELESAI')
            .map(l => l.silabusId)
        )
        const selesai = mkSilabus.filter(s => mkLogIds.has(s.id)).length
        const mkAch = allAch.filter(a => a.silabus?.mataKuliah?.id === mk.id)
        const latestAch = mkAch.length > 0 ? mkAch.reduce((max, a) => a.persentase > max.persentase ? a : max, mkAch[0]).persentase : 0

        return {
          mataKuliahId: mk.id,
          code: mk.code,
          name: mk.name,
          totalPertemuan: mkSilabus.length,
          selesai,
          persentase: mkSilabus.length > 0 ? Math.round((selesai / mkSilabus.length) * 100) : 0,
          latestAchievement: latestAch,
        }
      }).filter(p => p.totalPertemuan > 0)

      setCourseProgress(progress)
      setAchievements(allAch)
    } catch {
      toast.error('Gagal memuat progres')
    } finally {
      setLoading(false)
    }
  }, [selectedKelasId])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  useEffect(() => {
    if (selectedKelasId) fetchProgress()
  }, [selectedKelasId, fetchProgress])

  const selectedCourseAchievements = selectedCourseId
    ? achievements.filter(a => a.silabus?.mataKuliah?.id === selectedCourseId)
    : []

  const overallProgress = courseProgress.length > 0
    ? Math.round(courseProgress.reduce((sum, p) => sum + p.persentase, 0) / courseProgress.length)
    : 0

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Class Selector */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedKelasId} onValueChange={setSelectedKelasId}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Pilih Kelas" />
          </SelectTrigger>
          <SelectContent>
            {classes.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name} - Semester {c.semester}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedKelasId ? (
        <EmptyState icon={BarChart3} title="Pilih kelas" description="Pilih kelas untuk melihat progres materi" />
      ) : courseProgress.length === 0 ? (
        <EmptyState icon={BookOpen} title="Belum ada data progres" description="Progres akan muncul setelah ada silabus dan pertemuan" />
      ) : (
        <>
          {/* Overall Progress */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Progres Keseluruhan</h3>
                  <p className="text-sm text-slate-500">{courseProgress.length} mata kuliah</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-emerald-600">{overallProgress}%</p>
                </div>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </CardContent>
          </Card>

          {/* Course Progress Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {courseProgress.map(course => (
              <Card
                key={course.mataKuliahId}
                className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedCourseId(
                  selectedCourseId === course.mataKuliahId ? null : course.mataKuliahId
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <Badge variant="outline" className="font-mono text-xs mb-1">{course.code}</Badge>
                      <p className="text-sm font-medium truncate">{course.name}</p>
                    </div>
                    <p className="text-lg font-bold text-emerald-600 shrink-0">{course.persentase}%</p>
                  </div>
                  <Progress value={course.persentase} className="h-2 mb-2" />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{course.selesai}/{course.totalPertemuan} pertemuan</span>
                    {course.latestAchievement > 0 && (
                      <span>Capaian: {course.latestAchievement}%</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Achievement Details for Selected Course */}
          {selectedCourseId && selectedCourseAchievements.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Detail Capaian: {courseProgress.find(c => c.mataKuliahId === selectedCourseId)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedCourseAchievements.map(ach => (
                    <div key={ach.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{ach.silabus?.materiPokok}</p>
                        <p className="text-xs text-slate-500">
                          Pertemuan {ach.silabus?.pertemuan} • {new Date(ach.tanggal).toLocaleDateString('id-ID')}
                        </p>
                        {ach.deskripsi && <p className="text-xs text-slate-600 mt-1">{ach.deskripsi}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-emerald-600">{ach.persentase}%</p>
                        <Progress value={ach.persentase} className="h-1.5 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
