'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, GraduationCap, BookOpen, CalendarCheck, Clock, UserCheck, UserX, Loader2, TrendingUp, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'

interface Stats {
  totalMahasantri: number
  kelasAktif: number
  totalMataKuliah: number
  pertemuanHariIni: number
}

interface PendingUser {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

const statCards = [
  { key: 'totalMahasantri' as const, label: 'Total Mahasantri', icon: Users, gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', textColor: 'text-emerald-600' },
  { key: 'kelasAktif' as const, label: 'Kelas Aktif', icon: GraduationCap, gradient: 'from-teal-500 to-teal-600', bg: 'bg-teal-50', iconBg: 'bg-teal-100', iconColor: 'text-teal-600', textColor: 'text-teal-600' },
  { key: 'totalMataKuliah' as const, label: 'Mata Kuliah', icon: BookOpen, gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', textColor: 'text-amber-600' },
  { key: 'pertemuanHariIni' as const, label: 'Pertemuan Hari Ini', icon: CalendarCheck, gradient: 'from-violet-500 to-violet-600', bg: 'bg-violet-50', iconBg: 'bg-violet-100', iconColor: 'text-violet-600', textColor: 'text-violet-600' },
]

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersRes, kelasRes, mkRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/kelas'),
        fetch('/api/matakuliah'),
      ])

      if (!usersRes.ok || !kelasRes.ok || !mkRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const usersData = await usersRes.json()
      const kelasData = await kelasRes.json()
      const mkData = await mkRes.json()

      const allUsers = usersData.users || []
      const allKelas = kelasData.kelas || []
      const allMk = mkData.matakuliah || []

      setStats({
        totalMahasantri: allUsers.filter((u: { isActive: boolean }) => u.isActive).length,
        kelasAktif: allKelas.length,
        totalMataKuliah: allMk.length,
        pertemuanHariIni: 0,
      })

      setPendingUsers(
        allUsers.filter((u: { isActive: boolean }) => !u.isActive).map((u: PendingUser) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
        }))
      )
    } catch {
      toast.error('Gagal memuat data dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (userId: string) => {
    setConfirming(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })
      if (res.ok) {
        toast.success('Mahasantri berhasil dikonfirmasi')
        setPendingUsers(prev => prev.filter(u => u.id !== userId))
        if (stats) setStats({ ...stats, totalMahasantri: stats.totalMahasantri + 1 })
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengkonfirmasi')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setConfirming(null)
    }
  }

  const handleReject = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin menolak pendaftaran ini?')) return
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Pendaftaran ditolak')
        setPendingUsers(prev => prev.filter(u => u.id !== userId))
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menolak')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Welcome skeleton */}
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

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
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Assalamu&apos;alaikum, Administrator!</h2>
            <p className="text-emerald-100 mt-1">Kelola sistem perkuliahan pesantren dengan mudah</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2 backdrop-blur-sm">
            <TrendingUp className="h-5 w-5" />
            <div className="text-right">
              <p className="text-xs text-emerald-100">Semester Aktif</p>
              <p className="font-bold">2025/2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.key} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">{card.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${card.textColor}`}>{stats?.[card.key] || 0}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl ${card.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
              </div>
              <div className={`mt-3 h-1 w-full rounded-full ${card.bg}`}>
                <div className={`h-1 rounded-full bg-gradient-to-r ${card.gradient}`} style={{ width: '100%' }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Registrations */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <CardTitle className="text-base">Pendaftaran Menunggu Konfirmasi</CardTitle>
            {pendingUsers.length > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-semibold">
                {pendingUsers.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <Sparkles className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-slate-700">Semua pendaftaran sudah dikonfirmasi</p>
              <p className="text-xs text-slate-500 mt-1">Tidak ada yang perlu ditinjau saat ini</p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all duration-150 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-slate-500">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm"
                        onClick={() => handleConfirm(user.id)}
                        disabled={confirming === user.id}
                      >
                        {confirming === user.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <UserCheck className="h-3 w-3 mr-1" />
                        )}
                        <span className="hidden sm:inline">Konfirmasi</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300"
                        onClick={() => handleReject(user.id)}
                      >
                        <UserX className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
