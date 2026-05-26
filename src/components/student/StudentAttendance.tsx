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
import { UserCheck, CalendarDays, BookOpen, CheckCircle2, AlertCircle, AlertTriangle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAppStore } from '@/lib/store'

interface AttendanceStats {
  totalMeetings: number
  totalRecorded: number
  hadir: number
  izin: number
  sakit: number
  alpa: number
  percentage: number
}

interface KehadiranRecord {
  id: string
  status: string
  keterangan: string | null
  pertemuanLog: {
    id: string
    tanggal: string
    status: string
    silabus: {
      pertemuan: number
      materiPokok: string
      mataKuliah: { code: string; name: string }
    }
  }
}

interface Kelas {
  id: string
  name: string
  semester: number
  tahunAjaran: string
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'HADIR':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Hadir
        </Badge>
      )
    case 'IZIN':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
          <AlertCircle className="h-3 w-3 mr-1" />
          Izin
        </Badge>
      )
    case 'SAKIT':
      return (
        <Badge className="bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Sakit
        </Badge>
      )
    case 'ALPA':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
          <XCircle className="h-3 w-3 mr-1" />
          Alpa
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function StudentAttendance() {
  const { user, selectedKelas } = useAppStore()
  const [classes, setClasses] = useState<Kelas[]>([])
  const [selectedKelasId, setSelectedKelasId] = useState('')
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [records, setRecords] = useState<KehadiranRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(false)

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

  const fetchStats = useCallback(async () => {
    if (!selectedKelasId || !user?.id) return
    try {
      const res = await fetch(`/api/kehadiran/stats?kelasId=${selectedKelasId}&userId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
      }
    } catch {
      toast.error('Gagal memuat statistik kehadiran')
    }
  }, [selectedKelasId, user?.id])

  const fetchRecords = useCallback(async () => {
    if (!selectedKelasId) return
    try {
      setRecordsLoading(true)
      // Get all pertemuan logs for the class
      const logsRes = await fetch(`/api/pertemuan-log?kelasId=${selectedKelasId}`)
      if (!logsRes.ok) return
      const logsData = await logsRes.json()
      const logs = logsData.logs || []

      if (logs.length === 0) {
        setRecords([])
        return
      }

      // Get attendance for all logs (in parallel, limit concurrency)
      const allRecords: KehadiranRecord[] = []
      const batchSize = 5
      for (let i = 0; i < logs.length; i += batchSize) {
        const batch = logs.slice(i, i + batchSize)
        const results = await Promise.allSettled(
          batch.map(async (log: { id: string }) => {
            const attRes = await fetch(`/api/kehadiran?pertemuanLogId=${log.id}`)
            if (!attRes.ok) return []
            const attData = await attRes.json()
            return attData.kehadiran || []
          })
        )
        for (const result of results) {
          if (result.status === 'fulfilled') {
            allRecords.push(...result.value)
          }
        }
      }

      // Enrich records with pertemuan log data
      const enriched = allRecords
        .filter((r) => r.user?.id === user?.id)
        .map((r: { id: string; status: string; keterangan: string | null }) => {
          const log = logs.find((l: { id: string }) => l.id === r.pertemuanLogId || logs.find((l: { id: string }) => {
            // Find log by matching the kehadiran's pertemuanLogId
            return false
          }))
          return r
        })

      // Better approach: merge kehadiran data with pertemuan log data
      const kehadiranMap = new Map<string, { status: string; keterangan: string | null }>()
      for (const r of allRecords) {
        if ((r as { user?: { id: string } }).user?.id === user?.id) {
          kehadiranMap.set((r as { pertemuanLogId?: string }).pertemuanLogId || '', {
            status: r.status,
            keterangan: r.keterangan,
          })
        }
      }

      const merged: KehadiranRecord[] = logs
        .filter((log: { id: string }) => kehadiranMap.has(log.id))
        .map((log: { id: string; tanggal: string; status: string; silabus: { pertemuan: number; materiPokok: string; mataKuliah: { code: string; name: string } } }) => ({
          id: `${log.id}-${user?.id}`,
          status: kehadiranMap.get(log.id)!.status,
          keterangan: kehadiranMap.get(log.id)!.keterangan,
          pertemuanLog: {
            id: log.id,
            tanggal: log.tanggal,
            status: log.status,
            silabus: log.silabus,
          },
        }))
        .sort((a: KehadiranRecord, b: KehadiranRecord) => new Date(b.pertemuanLog.tanggal).getTime() - new Date(a.pertemuanLog.tanggal).getTime())

      setRecords(merged)
    } catch {
      toast.error('Gagal memuat riwayat kehadiran')
    } finally {
      setRecordsLoading(false)
    }
  }, [selectedKelasId, user?.id])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  useEffect(() => {
    if (selectedKelasId) {
      setLoading(true)
      Promise.all([fetchStats(), fetchRecords()]).finally(() => {
        setLoading(false)
      })
    }
  }, [selectedKelasId, fetchStats, fetchRecords])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
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
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} - Semester {c.semester}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedKelasId ? (
        <EmptyState
          icon={UserCheck}
          title="Pilih kelas"
          description="Pilih kelas untuk melihat riwayat kehadiran"
        />
      ) : (
        <>
          {/* Overall Stats Card */}
          {stats && stats.totalMeetings > 0 && (
            <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Persentase Kehadiran
                    </h3>
                    <p className="text-sm text-slate-500">
                      {stats.totalRecorded} dari {stats.totalMeetings} pertemuan tercatat
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-3xl font-bold ${
                        stats.percentage >= 80
                          ? 'text-emerald-600'
                          : stats.percentage >= 60
                            ? 'text-amber-600'
                            : 'text-red-600'
                      }`}
                    >
                      {stats.percentage}%
                    </p>
                  </div>
                </div>
                <Progress value={stats.percentage} className="h-3" />
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats?.hadir ?? 0}
                </p>
                <p className="text-xs text-slate-500">Hadir</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-amber-600">
                  {stats?.izin ?? 0}
                </p>
                <p className="text-xs text-slate-500">Izin</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                </div>
                <p className="text-2xl font-bold text-rose-600">
                  {stats?.sakit ?? 0}
                </p>
                <p className="text-xs text-slate-500">Sakit</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.alpa ?? 0}
                </p>
                <p className="text-xs text-slate-500">Alpa</p>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Records */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-emerald-600" />
                Riwayat Kehadiran Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recordsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : records.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="Belum ada data kehadiran"
                  description="Data kehadiran akan muncul setelah pertemuan dicatat"
                />
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono text-xs shrink-0">
                            {record.pertemuanLog.silabus?.mataKuliah?.code}
                          </Badge>
                          <span className="text-sm font-medium truncate">
                            {record.pertemuanLog.silabus?.mataKuliah?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>Pertemuan {record.pertemuanLog.silabus?.pertemuan}</span>
                          <span>•</span>
                          <span>{formatDate(record.pertemuanLog.tanggal)}</span>
                        </div>
                        {record.keterangan && (
                          <p className="text-xs text-slate-600 mt-1 italic">
                            {record.keterangan}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(record.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
