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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ClipboardList, BookOpen, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAppStore } from '@/lib/store'

interface MataKuliah {
  id: string
  code: string
  name: string
}

interface Silabus {
  id: string
  pertemuan: number
  materiPokok: string
  subMateri: string
  referensi: string
  mataKuliah?: MataKuliah
}

interface PertemuanLog {
  id: string
  silabusId: string
  tanggal: string
  status: string
  catatan: string
  silabus: {
    pertemuan: number
    materiPokok: string
    mataKuliah: { code: string; name: string }
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

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  SELESAI: { icon: CheckCircle2, color: 'text-emerald-600', label: 'Selesai' },
  BELUM: { icon: Clock, color: 'text-slate-400', label: 'Belum' },
  DITUNDA: { icon: AlertCircle, color: 'text-amber-500', label: 'Ditunda' },
  ABSEN: { icon: XCircle, color: 'text-red-500', label: 'Absen' },
}

export function StudentSyllabus() {
  const { selectedKelas } = useAppStore()
  const [courses, setCourses] = useState<MataKuliah[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [syllabus, setSyllabus] = useState<Silabus[]>([])
  const [pertemuanLogs, setPertemuanLogs] = useState<PertemuanLog[]>([])
  const [achievements, setAchievements] = useState<MaterialAchievement[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/matakuliah')
      if (res.ok) {
        const data = await res.json()
        const list: MataKuliah[] = data.matakuliah || []
        setCourses(list)
        if (list.length > 0 && !selectedCourseId) {
          setSelectedCourseId(list[0].id)
        }
      }
    } catch {
      // silent
    }
  }, [selectedCourseId])

  const fetchSyllabusData = useCallback(async () => {
    if (!selectedCourseId || !selectedKelas) return
    try {
      setLoading(true)
      const [silabusRes, logsRes, achRes] = await Promise.all([
        fetch(`/api/silabus?mataKuliahId=${selectedCourseId}`),
        fetch(`/api/pertemuan-log?kelasId=${selectedKelas.id}`),
        fetch(`/api/material-achievement?kelasId=${selectedKelas.id}`),
      ])

      if (silabusRes.ok) {
        const data = await silabusRes.json()
        setSyllabus(data.silabus || [])
      }
      if (logsRes.ok) {
        const data = await logsRes.json()
        setPertemuanLogs(data.logs || [])
      }
      if (achRes.ok) {
        const data = await achRes.json()
        setAchievements(data.achievements || [])
      }
    } catch {
      toast.error('Gagal memuat silabus')
    } finally {
      setLoading(false)
    }
  }, [selectedCourseId, selectedKelas])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  useEffect(() => {
    if (selectedCourseId) fetchSyllabusData()
  }, [selectedCourseId, fetchSyllabusData])

  const getLogForSilabus = (silabusId: string) => {
    return pertemuanLogs.find(l => l.silabusId === silabusId)
  }

  const getAchievementForSilabus = (silabusId: string) => {
    return achievements.filter(a => a.silabusId === silabusId)
  }

  const completedCount = syllabus.filter(s => {
    const log = getLogForSilabus(s.id)
    return log?.status === 'SELESAI'
  }).length
  const progress = syllabus.length > 0 ? Math.round((completedCount / syllabus.length) * 100) : 0

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-xl" />
  }

  return (
    <div className="space-y-4">
      {/* Course Selector */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Pilih Mata Kuliah" />
          </SelectTrigger>
          <SelectContent>
            {courses.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Progress */}
      {!selectedKelas ? (
        <EmptyState icon={BookOpen} title="Pilih kelas" description="Gunakan selector kelas di header" />
      ) : !selectedCourseId ? (
        <EmptyState icon={ClipboardList} title="Pilih mata kuliah" description="Pilih mata kuliah untuk melihat silabus" />
      ) : syllabus.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Belum ada silabus" description="Silabus untuk mata kuliah ini belum tersedia" />
      ) : (
        <>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">Progres Pertemuan</p>
                <p className="text-sm font-bold text-emerald-600">{progress}%</p>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-slate-500 mt-1">{completedCount} dari {syllabus.length} pertemuan selesai</p>
            </CardContent>
          </Card>

          {/* Syllabus Accordion */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">
                Silabus: {courses.find(c => c.id === selectedCourseId)?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="space-y-2">
                {syllabus.map((item) => {
                  const log = getLogForSilabus(item.id)
                  const achList = getAchievementForSilabus(item.id)
                  const statusConf = log ? STATUS_CONFIG[log.status] || STATUS_CONFIG.BELUM : STATUS_CONFIG.BELUM
                  const StatusIcon = statusConf.icon

                  return (
                    <AccordionItem key={item.id} value={item.id} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-3 text-left">
                          <Badge variant="outline" className="font-mono text-xs shrink-0">{item.pertemuan}</Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.materiPokok || `Pertemuan ${item.pertemuan}`}</p>
                          </div>
                          <div className={`shrink-0 flex items-center gap-1 text-xs ${statusConf.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            <span className="hidden sm:inline">{statusConf.label}</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pb-2">
                          {item.subMateri && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">Sub Materi</p>
                              <p className="text-sm text-slate-700">{item.subMateri}</p>
                            </div>
                          )}
                          {item.referensi && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">Referensi</p>
                              <p className="text-sm text-slate-700">{item.referensi}</p>
                            </div>
                          )}
                          {log && (
                            <div className="bg-slate-50 rounded-lg p-2">
                              <p className="text-xs text-slate-500">
                                Status: <span className={statusConf.color}>{statusConf.label}</span>
                                {log.tanggal && ` • ${new Date(log.tanggal).toLocaleDateString('id-ID')}`}
                              </p>
                              {log.catatan && <p className="text-xs text-slate-600 mt-1">Catatan: {log.catatan}</p>}
                            </div>
                          )}
                          {achList.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">Capaian Materi</p>
                              {achList.map(ach => (
                                <div key={ach.id} className="bg-emerald-50 rounded-lg p-2 mb-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-emerald-700">{new Date(ach.tanggal).toLocaleDateString('id-ID')}</span>
                                    <span className="text-xs font-bold text-emerald-700">{ach.persentase}%</span>
                                  </div>
                                  <Progress value={ach.persentase} className="h-1.5 mt-1" />
                                  {ach.deskripsi && <p className="text-xs text-slate-600 mt-1">{ach.deskripsi}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
