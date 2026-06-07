'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BarChart3, BookOpen, TrendingUp, Calendar, CheckCircle2, XCircle, ChevronRight, Trophy } from 'lucide-react'
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
  latestAchDate: string
  avgAchievement: number
}

interface SilabusWithAch extends Silabus {
  achievement: MaterialAchievement | null
  hasLog: boolean
}

function ProgressRing({ value, size = 80, strokeWidth = 6, colorClass = 'text-emerald-500' }: {
  value: number
  size?: number
  strokeWidth?: number
  colorClass?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={colorClass}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 0.8s ease-in-out',
          }}
        />
      </svg>
      <span className="absolute text-sm font-bold text-slate-700">{value}%</span>
    </div>
  )
}

function getProgressColor(pct: number): { bg: string; text: string; badge: string; ring: string; gradient: string } {
  if (pct >= 80) return {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    ring: 'text-emerald-500',
    gradient: 'from-emerald-50 via-teal-50 to-cyan-50',
  }
  if (pct >= 50) return {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    ring: 'text-amber-500',
    gradient: 'from-amber-50 via-orange-50 to-yellow-50',
  }
  return {
    bg: 'bg-red-50',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700 border-red-200',
    ring: 'text-red-500',
    gradient: 'from-red-50 via-rose-50 to-pink-50',
  }
}

function getAchBadge(pct: number) {
  if (pct >= 80) return { label: 'Sangat Baik', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
  if (pct >= 60) return { label: 'Baik', className: 'bg-teal-100 text-teal-700 border-teal-200' }
  if (pct >= 50) return { label: 'Cukup', className: 'bg-amber-100 text-amber-700 border-amber-200' }
  return { label: 'Perlu Diperbaiki', className: 'bg-red-100 text-red-700 border-red-200' }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function StudentProgress() {
  const { selectedKelas } = useAppStore()
  const [classes, setClasses] = useState<Kelas[]>([])
  const [selectedKelasId, setSelectedKelasId] = useState('')
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [achievements, setAchievements] = useState<MaterialAchievement[]>([])
  const [allSilabus, setAllSilabus] = useState<Silabus[]>([])
  const [allLogs, setAllLogs] = useState<PertemuanLog[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

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
      const silabus: Silabus[] = silabusData.silabus || []
      const logs: PertemuanLog[] = logsData.logs || []
      const achs: MaterialAchievement[] = achData.achievements || []

      setAllSilabus(silabus)
      setAllLogs(logs)

      const progress: CourseProgress[] = courses.map(mk => {
        const mkSilabus = silabus.filter(s => s.mataKuliahId === mk.id)
        const mkLogIds = new Set(
          logs
            .filter(l => l.silabus?.mataKuliah?.id === mk.id && l.status === 'SELESAI')
            .map(l => l.silabusId)
        )
        const selesai = mkSilabus.filter(s => mkLogIds.has(s.id)).length
        const mkAch = achs.filter(a => a.silabus?.mataKuliah?.id === mk.id)

        // Calculate average achievement percentage for this course
        const avgAchievement = mkAch.length > 0
          ? Math.round(mkAch.reduce((sum, a) => sum + a.persentase, 0) / mkAch.length)
          : 0

        // Get latest achievement date
        const sortedAch = [...mkAch].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
        const latestAchDate = sortedAch.length > 0 ? sortedAch[0].tanggal : ''
        const latestAch = sortedAch.length > 0 ? sortedAch[0].persentase : 0

        return {
          mataKuliahId: mk.id,
          code: mk.code,
          name: mk.name,
          totalPertemuan: mkSilabus.length,
          selesai,
          persentase: mkSilabus.length > 0 ? Math.round((selesai / mkSilabus.length) * 100) : 0,
          latestAchievement: latestAch,
          latestAchDate,
          avgAchievement,
        }
      }).filter(p => p.totalPertemuan > 0)

      setCourseProgress(progress)
      setAchievements(achs)
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

  const overallProgress = courseProgress.length > 0
    ? Math.round(courseProgress.reduce((sum, p) => sum + p.persentase, 0) / courseProgress.length)
    : 0

  const greenCount = courseProgress.filter(p => p.persentase >= 80).length
  const amberCount = courseProgress.filter(p => p.persentase >= 50 && p.persentase < 80).length
  const redCount = courseProgress.filter(p => p.persentase < 50).length
  const overallColor = getProgressColor(overallProgress)

  const handleOpenCourse = (courseId: string) => {
    setSelectedCourseId(courseId)
    setDialogOpen(true)
  }

  // Compute silabus items with achievements for the selected course
  const courseSilabusItems: SilabusWithAch[] = selectedCourseId
    ? allSilabus
        .filter(s => s.mataKuliahId === selectedCourseId)
        .sort((a, b) => a.pertemuan - b.pertemuan)
        .map(s => {
          const ach = achievements.find(a => a.silabusId === s.id) || null
          const hasLog = allLogs.some(l => l.silabusId === s.id && l.status === 'SELESAI')
          return { ...s, achievement: ach, hasLog }
        })
    : []

  const selectedCourse = courseProgress.find(c => c.mataKuliahId === selectedCourseId)

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 w-full rounded-xl" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
          {/* ===== OVERALL SEMESTER PROGRESS SUMMARY ===== */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className={`bg-gradient-to-r ${overallColor.gradient} p-6`}>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Progress Ring */}
                <div className="shrink-0">
                  <ProgressRing value={overallProgress} size={96} strokeWidth={8} colorClass={overallColor.ring} />
                </div>

                {/* Summary Stats */}
                <div className="flex-1 min-w-0 w-full">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Ringkasan Progres Semester</h3>
                  <p className="text-sm text-slate-500 mb-4">{courseProgress.length} mata kuliah terdaftar</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-slate-800">{courseProgress.length}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Total MK</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <p className="text-2xl font-bold text-emerald-700">{greenCount}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">≥ 80%</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <p className="text-2xl font-bold text-amber-700">{amberCount}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">50–79%</p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <p className="text-2xl font-bold text-red-700">{redCount}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">&lt; 50%</p>
                    </div>
                  </div>
                </div>

                {/* Trophy / Status */}
                <div className="shrink-0 hidden sm:flex flex-col items-center gap-2">
                  <div className="rounded-full bg-white/70 backdrop-blur-sm p-3">
                    <Trophy className={`h-8 w-8 ${overallColor.text}`} />
                  </div>
                  <Badge className={`${overallColor.badge} border text-xs`}>
                    {overallProgress >= 80 ? 'Sangat Baik' : overallProgress >= 50 ? 'Cukup Baik' : 'Perlu Ditingkatkan'}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* ===== COURSE PROGRESS CARDS ===== */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {courseProgress.map(course => {
              const colors = getProgressColor(course.persentase)
              return (
                <Card
                  key={course.mataKuliahId}
                  className={`border-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group overflow-hidden`}
                  onClick={() => handleOpenCourse(course.mataKuliahId)}
                >
                  {/* Color accent bar */}
                  <div className={`h-1 bg-gradient-to-r ${course.persentase >= 80 ? 'from-emerald-400 to-teal-400' : course.persentase >= 50 ? 'from-amber-400 to-orange-400' : 'from-red-400 to-rose-400'}`} />

                  <CardContent className="p-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="outline" className="font-mono text-xs border-slate-200 text-slate-500">{course.code}</Badge>
                          {course.avgAchievement > 0 && (
                            <Badge className={`${getAchBadge(course.avgAchievement).className} border text-[10px] px-1.5 py-0`}>
                              {getAchBadge(course.avgAchievement).label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{course.name}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <p className={`text-2xl font-bold ${colors.text}`}>{course.persentase}%</p>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </div>
                    </div>

                    {/* Progress bar */}
                    <Progress value={course.persentase} className="h-2 mb-3" />

                    {/* Details row */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {course.selesai}/{course.totalPertemuan}
                        </span>
                        {course.avgAchievement > 0 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {course.avgAchievement}% avg
                          </span>
                        )}
                      </div>
                      {course.latestAchDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(course.latestAchDate)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* ===== DETAIL MODAL ===== */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
              {selectedCourse && (
                <>
                  {/* Modal header with gradient */}
                  <div className={`bg-gradient-to-r ${getProgressColor(selectedCourse.persentase).gradient} p-6 pb-4 shrink-0`}>
                    <DialogHeader>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono text-xs border-slate-200 text-slate-500">{selectedCourse.code}</Badge>
                        <Badge className={`${getAchBadge(selectedCourse.avgAchievement).className} border text-xs`}>
                          {selectedCourse.avgAchievement > 0 ? getAchBadge(selectedCourse.avgAchievement).label : 'Belum Ada Capaian'}
                        </Badge>
                      </div>
                      <DialogTitle className="text-lg text-slate-800">{selectedCourse.name}</DialogTitle>
                      <DialogDescription className="text-sm text-slate-500">
                        {courseSilabusItems.length} materi silabus &middot; {selectedCourse.selesai} pertemuan selesai
                      </DialogDescription>
                    </DialogHeader>

                    {/* Course average bar in header */}
                    <div className="mt-4 bg-white/60 backdrop-blur-sm rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-slate-600">Rata-rata Capaian</span>
                        <span className={`text-sm font-bold ${getProgressColor(selectedCourse.avgAchievement || 0).text}`}>
                          {selectedCourse.avgAchievement > 0 ? `${selectedCourse.avgAchievement}%` : '—'}
                        </span>
                      </div>
                      <Progress value={selectedCourse.avgAchievement} className="h-2.5" />
                      <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
                        <span>Progres Pertemuan: {selectedCourse.persentase}%</span>
                        {selectedCourse.latestAchDate && (
                          <span>Terakhir: {formatDate(selectedCourse.latestAchDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Silabus items list */}
                  <div className="p-4 overflow-y-auto flex-1" style={{ maxHeight: 'calc(85vh - 260px)' }}>
                    <style>{`
                      .silabus-scroll::-webkit-scrollbar { width: 6px; }
                      .silabus-scroll::-webkit-scrollbar-track { background: transparent; }
                      .silabus-scroll::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 3px; }
                      .silabus-scroll::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
                    `}</style>
                    <div className="space-y-2.5 silabus-scroll max-h-[400px] overflow-y-auto pr-1">
                      {courseSilabusItems.map((item) => {
                        const hasAch = item.achievement !== null
                        const achPct = item.achievement?.persentase || 0
                        const achColors = hasAch ? getProgressColor(achPct) : null

                        return (
                          <div
                            key={item.id}
                            className={`rounded-xl border p-3.5 transition-colors ${
                              hasAch
                                ? 'border-emerald-100 bg-white hover:border-emerald-200'
                                : 'border-slate-100 bg-slate-50/50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Status icon */}
                              <div className={`shrink-0 mt-0.5 rounded-full p-1.5 ${
                                hasAch
                                  ? (achPct >= 80 ? 'bg-emerald-100' : achPct >= 50 ? 'bg-amber-100' : 'bg-red-100')
                                  : 'bg-slate-100'
                              }`}>
                                {hasAch ? (
                                  <CheckCircle2 className={`h-4 w-4 ${
                                    achPct >= 80 ? 'text-emerald-600' : achPct >= 50 ? 'text-amber-600' : 'text-red-600'
                                  }`} />
                                ) : item.hasLog ? (
                                  <XCircle className="h-4 w-4 text-slate-400" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-slate-300" />
                                )}
                              </div>

                              {/* Content */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-mono text-slate-400">Pertemuan {item.pertemuan}</span>
                                  {hasAch && (
                                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${achColors?.badge || ''}`}>
                                      {achPct}%
                                    </span>
                                  )}
                                </div>
                                <p className={`text-sm ${hasAch ? 'font-medium text-slate-800' : 'text-slate-500'}`}>
                                  {item.materiPokok}
                                </p>

                                {/* Achievement details */}
                                {hasAch && (
                                  <div className="mt-2 space-y-1">
                                    {item.achievement!.deskripsi && (
                                      <p className="text-xs text-slate-600 leading-relaxed">{item.achievement!.deskripsi}</p>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(item.achievement!.tanggal)}
                                      </span>
                                      <Progress value={achPct} className="h-1 w-20" />
                                    </div>
                                  </div>
                                )}

                                {/* No achievement */}
                                {!hasAch && (
                                  <p className="mt-1.5 text-xs text-slate-400 italic">
                                    {item.hasLog ? 'Belum ada capaian' : 'Pertemuan belum dilaksanakan'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {courseSilabusItems.length === 0 && (
                        <EmptyState
                          icon={BookOpen}
                          title="Belum ada silabus"
                          description="Silabus untuk mata kuliah ini belum tersedia"
                          className="py-8"
                        />
                      )}
                    </div>
                  </div>

                  {/* Modal footer */}
                  <div className="border-t p-4 flex items-center justify-between shrink-0 bg-slate-50/50">
                    <div className="text-xs text-slate-400">
                      {courseSilabusItems.filter(s => s.achievement).length} dari {courseSilabusItems.length} materi memiliki capaian
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                      Tutup
                    </Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
