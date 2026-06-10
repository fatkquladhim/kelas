'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { Users, GraduationCap, Calendar, Shield, CheckCircle2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'
import { getRoleBadgeColor, getRoleLabel } from '@/components/Sidebar'

interface Member {
  id: string
  userId: string
  userName: string
  userEmail: string
  role: string
  createdAt: string
}

interface Stats {
  totalMembers: number
  roleCounts: Record<string, number>
}

export function RoisDashboard() {
  const { user, selectedKelas, classMembers } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [scheduleCount, setScheduleCount] = useState(0)
  const [downloading, setDownloading] = useState(false)

  const handleDownloadReport = async () => {
    if (!selectedKelas) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/rois/download-report?kelasId=${selectedKelas.id}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Laporan_${selectedKelas.name}_Semester_${selectedKelas.semester}.doc`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('Laporan berhasil diunduh')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengunduh laporan')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!selectedKelas) return
      try {
        const res = await fetch(`/api/jadwal?kelasId=${selectedKelas.id}`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setScheduleCount(data.jadwal?.length || 0)
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    if (selectedKelas) {
      load()
    } else {
      setLoading(false)
    }
    return () => { cancelled = true }
  }, [selectedKelas])

  const stats: Stats = {
    totalMembers: classMembers.length,
    roleCounts: classMembers.reduce((acc, m) => {
      acc[m.role] = (acc[m.role] || 0) + 1
      return acc
    }, {} as Record<string, number>),
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
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5" />
          <Badge className="bg-white/20 text-white border-0">Rois A&apos;m</Badge>
        </div>
        <h2 className="text-xl font-bold">Assalamu&apos;alaikum, {user?.name}!</h2>
        <p className="text-emerald-100 mt-1">
          {selectedKelas
            ? `Kelas ${selectedKelas.name} — Semester ${selectedKelas.semester}`
            : 'Pilih kelas untuk melihat informasi'}
        </p>
      </div>

      {/* Download Report */}
      {selectedKelas && (
        <div className="flex justify-end">
          <Button
            onClick={handleDownloadReport}
            disabled={downloading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloading ? 'Mengunduh...' : 'Unduh Laporan Progres (.doc)'}
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-xs text-slate-500">Total Anggota</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.roleCounts.KETUA_FAN_ILMU || 0}</p>
                <p className="text-xs text-slate-500">Ketua Fan Ilmu</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduleCount}</p>
                <p className="text-xs text-slate-500">Jadwal/Minggu</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" />
            Daftar Anggota
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedKelas ? (
            <EmptyState icon={GraduationCap} title="Pilih kelas" description="Gunakan selector kelas di header" />
          ) : classMembers.length === 0 ? (
            <EmptyState icon={Users} title="Belum ada anggota" description="Belum ada anggota di kelas ini" />
          ) : (
            <div className="space-y-2">
              {classMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-700">{member.userName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.userName}</p>
                      <p className="text-xs text-slate-500">{member.userEmail}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className={getRoleBadgeColor(member.role as 'MAHASANTRI' | 'ROIS_AM' | 'KETUA_FAN_ILMU' | 'KETUA_KELOMPOK' | 'SEKRETARIS' | 'BENDAHARA')}>
                    {getRoleLabel(member.role as 'MAHASANTRI' | 'ROIS_AM' | 'KETUA_FAN_ILMU' | 'KETUA_KELOMPOK' | 'SEKRETARIS' | 'BENDAHARA')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
