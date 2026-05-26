'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { Users, BookOpen, Calendar, GraduationCap, Clock, TrendingUp } from 'lucide-react'
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
const WAKTU_STYLES: Record<string, { bg: string; border: string; icon: string; label: string }> = {
  PAGI: { bg: 'bg-gradient-to-r from-emerald-50 to-green-50', border: 'border-emerald-200/60', icon: '🌅', label: 'Pagi' },
  SORE: { bg: 'bg-gradient-to-r from-amber-50 to-yellow-50', border: 'border-amber-200/60', icon: '🌤️', label: 'Sore' },
  MALAM: { bg: 'bg-gradient-to-r from-violet-50 to-purple-50', border: 'border-violet-200/60', icon: '🌙', label: 'Malam' },
}

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
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  const todayName = HARI_LABELS[['AHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'][new Date().getDay()]] || 'Hari ini'

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 p-6 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='white' stroke-width='0.5'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z'/%3E%3Cpath d='M30 10L50 30L30 50L10 30Z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative">
          <h2 className="text-xl font-bold">Assalamu&apos;alaikum, {user?.name}! 👋</h2>
          <p className="text-emerald-100 mt-1">
            {selectedKelas
              ? `Kelas ${selectedKelas.name} — Semester ${selectedKelas.semester}`
              : 'Pilih kelas untuk melihat informasi'}
          </p>
          {myRole && myRole !== 'MAHASANTRI' && (
            <Badge className="mt-2.5 bg-white/15 text-white border border-white/20 backdrop-blur-sm">
              {myRole === 'ROIS_AM' ? "Rois A'm" : myRole.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Mata Kuliah</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.courses}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3 h-1 w-full rounded-full bg-emerald-50">
              <div className="h-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600" style={{ width: '100%' }} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Jadwal/Minggu</p>
                <p className="text-3xl font-bold text-teal-600 mt-1">{stats.schedule}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-teal-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-teal-600" />
              </div>
            </div>
            <div className="mt-3 h-1 w-full rounded-full bg-teal-50">
              <div className="h-1 rounded-full bg-gradient-to-r from-teal-500 to-teal-600" style={{ width: '100%' }} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">Kuliah Hari Ini</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{todaySchedule.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-3 h-1 w-full rounded-full bg-amber-50">
              <div className="h-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600" style={{ width: `${todaySchedule.length > 0 ? 50 : 0}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-base">Jadwal Hari Ini</CardTitle>
              <p className="text-xs text-slate-500">{todayName}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedKelas ? (
            <EmptyState
              icon={GraduationCap}
              title="Pilih kelas terlebih dahulu"
              description="Gunakan selector kelas di header untuk memilih kelas"
            />
          ) : todaySchedule.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-slate-700">Tidak ada jadwal hari ini</p>
              <p className="text-xs text-slate-500 mt-1">Nikmati waktu luang Anda!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySchedule.map((item) => {
                const waktu = WAKTU_STYLES[item.waktu] || WAKTU_STYLES.PAGI
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border ${waktu.border} ${waktu.bg} transition-all duration-150 hover:shadow-sm`}
                  >
                    <div className="text-2xl shrink-0">{waktu.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800">{item.mataKuliah.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.mataKuliah.code} &bull; {item.mataKuliah.sks} SKS</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 bg-white/80 text-slate-600 font-medium">
                      {waktu.label}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
