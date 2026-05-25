'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAppStore } from '@/lib/store'

interface Kelas {
  id: string
  name: string
  semester: number
  tahunAjaran: string
}

interface JadwalItem {
  id: string
  hari: string
  waktu: string
  mataKuliahId: string
  kelasId: string
  mataKuliah: { id: string; code: string; name: string; sks: number }
  kelas: Kelas
}

const HARI = ['AHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']
const WAKTU = ['PAGI', 'SORE', 'MALAM']
const HARI_LABELS: Record<string, string> = {
  AHAD: 'Ahad', SENIN: 'Senin', SELASA: 'Selasa', RABU: 'Rabu', KAMIS: 'Kamis', JUMAT: 'Jumat', SABTU: 'Sabtu'
}
const WAKTU_LABELS: Record<string, string> = { PAGI: 'Pagi', SORE: 'Sore', MALAM: 'Malam' }
const WAKTU_COLORS: Record<string, string> = {
  PAGI: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  SORE: 'bg-amber-100 text-amber-800 border-amber-200',
  MALAM: 'bg-purple-100 text-purple-800 border-purple-200',
}

export function StudentSchedule() {
  const { selectedKelas } = useAppStore()
  const [classes, setClasses] = useState<Kelas[]>([])
  const [selectedKelasId, setSelectedKelasId] = useState('')
  const [schedule, setSchedule] = useState<JadwalItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/kelas')
      if (res.ok) {
        const data = await res.json()
        const list: Kelas[] = data.kelas || []
        setClasses(list)
        if (list.length > 0 && !selectedKelasId) {
          const kelasId = selectedKelas?.id || list[0].id
          setSelectedKelasId(kelasId)
        }
      }
    } catch {
      // silent
    }
  }, [selectedKelas, selectedKelasId])

  const fetchSchedule = useCallback(async () => {
    if (!selectedKelasId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/jadwal?kelasId=${selectedKelasId}`)
      if (res.ok) {
        const data = await res.json()
        setSchedule(data.jadwal || [])
      }
    } catch {
      toast.error('Gagal memuat jadwal')
    } finally {
      setLoading(false)
    }
  }, [selectedKelasId])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  useEffect(() => {
    if (selectedKelasId) fetchSchedule()
  }, [selectedKelasId, fetchSchedule])

  const getScheduleCell = (hari: string, waktu: string) => {
    return schedule.find(s => s.hari === hari && s.waktu === waktu)
  }

  const todayIndex = new Date().getDay()
  const todayHari = HARI[todayIndex]

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-xl" />
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

      {/* Schedule Grid */}
      {!selectedKelasId ? (
        <EmptyState icon={Calendar} title="Pilih kelas" description="Pilih kelas untuk melihat jadwal" />
      ) : schedule.length === 0 ? (
        <EmptyState icon={Calendar} title="Belum ada jadwal" description="Jadwal belum tersedia untuk kelas ini" />
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">
              Jadwal Mingguan: {classes.find(c => c.id === selectedKelasId)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[80px] sticky left-0 bg-slate-50 z-10">Hari</TableHead>
                    {WAKTU.map(w => (
                      <TableHead key={w} className="text-center">
                        <Badge variant="outline" className={WAKTU_COLORS[w]}>
                          {WAKTU_LABELS[w]}
                        </Badge>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {HARI.map(hari => {
                    const isToday = hari === todayHari
                    return (
                      <TableRow key={hari} className={isToday ? 'bg-emerald-50/50' : ''}>
                        <TableCell className="font-medium sticky left-0 z-10 bg-white">
                          <div className="flex items-center gap-2">
                            {isToday && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                            {HARI_LABELS[hari]}
                          </div>
                        </TableCell>
                        {WAKTU.map(waktu => {
                          const cell = getScheduleCell(hari, waktu)
                          return (
                            <TableCell key={`${hari}-${waktu}`} className="text-center p-2">
                              {cell ? (
                                <div className={`rounded-lg border p-2 ${WAKTU_COLORS[cell.waktu]}`}>
                                  <p className="font-medium text-xs">{cell.mataKuliah.name}</p>
                                  <p className="text-[10px] opacity-70">{cell.mataKuliah.code} • {cell.mataKuliah.sks} SKS</p>
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs">-</span>
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
