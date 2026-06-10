'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { BookOpen, User, Shield, Lock, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export function ProfilePage() {
  const { user, classMembers, allClasses } = useAppStore()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [changing, setChanging] = useState(false)
  const [roisFanSubjects, setRoisFanSubjects] = useState<any[]>([])

  const passwordStrength = (pass: string): { label: string; color: string; score: number } => {
    let score = 0
    if (pass.length >= 6) score++
    if (pass.length >= 10) score++
    if (/[A-Z]/.test(pass)) score++
    if (/[a-z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[^A-Za-z0-9]/.test(pass)) score++
    if (score <= 2) return { label: 'Lemah', color: 'bg-red-500', score }
    if (score <= 4) return { label: 'Sedang', color: 'bg-amber-500', score }
    return { label: 'Kuat', color: 'bg-emerald-500', score }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Semua field wajib diisi')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Password baru tidak cocok')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    setChanging(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Password berhasil diubah')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast.error(data.error || 'Gagal mengubah password')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setChanging(false)
    }
  }

  useEffect(() => {
    const fetchAllRoisFan = async () => {
      if (!user || classMembers.length === 0) return
      const results: any[] = []
      for (const m of classMembers) {
        try {
          const res = await fetch(`/api/admin/rois-fan?kelasId=${m.kelasId}`)
          if (res.ok) {
            const data = await res.json()
            const userAssignments = (data.assignments || []).filter((a: any) => a.userId === user.id)
            results.push(...userAssignments)
          }
        } catch {}
      }
      setRoisFanSubjects(results)
    }
    fetchAllRoisFan()
  }, [user, classMembers])

  const myClasses = classMembers
    .filter(m => m.userId === user?.id)
    .map(m => ({
      ...m,
      className: allClasses.find(c => c.id === m.kelasId)?.name || 'Unknown',
    }))

  const strength = newPassword ? passwordStrength(newPassword) : null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Profil Saya</CardTitle>
              <p className="text-sm text-slate-500">Informasi biodata akun Anda</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Nama Lengkap</Label>
              <p className="text-sm font-medium text-slate-800">{user?.name}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Email</Label>
              <p className="text-sm font-medium text-slate-800">{user?.email}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Role Sistem</Label>
              <Badge variant="secondary" className={user?.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}>
                {user?.role === 'ADMIN' ? 'Admin' : 'Mahasantri'}
              </Badge>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Status</Label>
              <Badge variant="secondary" className={user?.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                {user?.isActive ? 'Aktif' : 'Belum Aktif'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {myClasses.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <BookOpen className="h-5 w-5 text-emerald-600" />
              </div>
              <CardTitle className="text-base">Kelas & Peran Aktif</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {myClasses.map(m => {
              const subjectAssignments = roisFanSubjects.filter(rfs =>
                classMembers.find(c => c.kelasId === rfs.kelasId)?.kelasId === m.kelasId
              )
              return (
                <div key={m.id} className="p-3 rounded-lg border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{m.className}</p>
                      <p className="text-xs text-slate-500">Semester {allClasses.find(c => c.id === m.kelasId)?.semester}</p>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                      {m.role === 'KETUA_FAN_ILMU' ? 'Rois Fan' : m.role}
                    </Badge>
                  </div>
                  {m.role === 'KETUA_KELOMPOK' && (
                    <p className="text-xs text-purple-600 font-medium">
                      Ketua Kelompok di kelas ini
                    </p>
                  )}
                  {subjectAssignments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {subjectAssignments.map((rfs: any) => (
                        <Badge key={rfs.id} variant="secondary" className="bg-blue-100 text-blue-700 text-[10px]">
                          Rois Fan {rfs.mataKuliah?.name || 'Unknown'}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <Lock className="h-5 w-5 text-amber-600" />
            </div>
            <CardTitle className="text-base">Ubah Password</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Password Saat Ini</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {strength && (
                <div className="space-y-1 mt-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${
                    strength.score <= 2 ? 'text-red-600' : strength.score <= 4 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    Kekuatan: {strength.label}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <XCircle className="h-3 w-3" />
                  Password tidak cocok
                </p>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Password cocok
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={changing || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            >
              {changing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan Password Baru
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}