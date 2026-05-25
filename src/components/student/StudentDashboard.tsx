'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { Users, BookOpen, Calendar, GraduationCap, Clock } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'

interface JadwalItem {
  id: string
  hari: string
  waktu: string
  mataKuliah: { id: string; code: string; name: string; sks: number }
  kelas: { id: string; name: string; semester: number; tahunAjaran: string }
}

const HARI_LABELS: Record<string, string> = {
  AHAD: 'Ahad', SENIN: 'Senin', SELASA: 'Selasa', RABU: 'Rabu', KAMIS: 'Kamis', JUMAT: 'Jumat', SABTU: 'Sabtu'
}
const WAKTU_COLORS: Record<string, string> = {
  PAGI: 'border-emerald-300 bg-emerald-50',
  SORE: 'border-amber-300 bg-amber-50',
  MALAM: 'border-purple-300 bg-purple-50',
}
const WAKTU_ICONS: Record<string, string> = { PAGI: '🌅', SORE: '🌤️', MALAM: '🌙' }

export function StudentDashboard() {
  const { user, selectedKelas, getMyRole } = useAppStore()
  const [todaySchedule, setTodaySchedule] = useState<JadwalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ courses: 0, schedule: 0 })

  const myRole = getMyRole()

  useEffect(() => {
    fetchTodaySchedule()
  }, [selectedKelas])

  const fetchTodaySchedule = async () => {
    if (!selectedKelas) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const res = await fetch(`/api/jadwal?kelasId=${selectedKelas.id}`)
      if (res.ok) {
        const data = await res.json()
        const allSchedules: JadwalItem[] = data.jadwal || []
        const days = ['AHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']
        const today = days[new Date().getDay()]
        const todayItems = allSchedules.filter(s => s.hari === today)
        setTodaySchedule(todayItems)

        const uniqueCourses = new Set(allSchedules.map(s => s.mataKuliahId))
        setStats({ courses: uniqueCourses.size, schedule: allSchedules.length })
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
        <h2 className="text-xl font-bold">Assalamu&apos;alaikum, {user?.name}! 👋</h2>
        <p className="text-emerald-100 mt-1">
          {selectedKelas
            ? `Kelas ${selectedKelas.name} — Semester ${selectedKelas.semester}`
            : 'Pilih kelas untuk melihat informasi'}
        </p>
        {myRole && myRole !== 'MAHASANTRI' && (
          <Badge className="mt-2 bg-white/20 text-white border-0">
            {myRole === 'ROIS_AM' ? "Rois A'm" : myRole.replace(/_/g, ' ')}
          </Badge>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.courses}</p>
                <p className="text-xs text-slate-500">Mata Kuliah</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.schedule}</p>
                <p className="text-xs text-slate-500">Jadwal/Minggu</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todaySchedule.length}</p>
                <p className="text-xs text-slate-500">Kuliah Hari Ini</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" />
            Jadwal Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedKelas ? (
            <EmptyState
              icon={GraduationCap}
              title="Pilih kelas terlebih dahulu"
              description="Gunakan selector kelas di header untuk memilih kelas"
            />
          ) : todaySchedule.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Tidak ada jadwal hari ini"
              description="Nikmati waktu luang Anda!"
            />
          ) : (
            <div className="space-y-3">
              {todaySchedule.map(item => (
                <div key={item.id} className={`flex items-center gap-4 p-3 rounded-lg border ${WAKTU_COLORS[item.waktu]}`}>
                  <div className="text-2xl">{WAKTU_ICONS[item.waktu]}</div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{item.mataKuliah.name}</p>
                    <p className="text-xs text-slate-500">{item.mataKuliah.code} • {item.mataKuliah.sks} SKS</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{item.waktu}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
