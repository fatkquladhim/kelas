'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, GraduationCap, BookOpen, CalendarCheck, Clock, UserCheck, UserX, Loader2 } from 'lucide-react'
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
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Mahasantri</p>
                <p className="text-2xl font-bold text-slate-800">{stats?.totalMahasantri || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Kelas Aktif</p>
                <p className="text-2xl font-bold text-slate-800">{stats?.kelasAktif || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Mata Kuliah</p>
                <p className="text-2xl font-bold text-slate-800">{stats?.totalMataKuliah || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pertemuan Hari Ini</p>
                <p className="text-2xl font-bold text-slate-800">{stats?.pertemuanHariIni || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <CalendarCheck className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Registrations */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">Pendaftaran Menunggu Konfirmasi</CardTitle>
            {pendingUsers.length > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                {pendingUsers.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="Tidak ada pendaftaran tertunda"
              description="Semua pendaftaran sudah dikonfirmasi"
            />
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
                        className="text-red-600 border-red-200 hover:bg-red-50"
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
