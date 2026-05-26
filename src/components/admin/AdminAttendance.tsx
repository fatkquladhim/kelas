'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  UserCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  CalendarDays,
  BookOpen,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAppStore } from '@/lib/store'

interface Kelas {
  id: string
  name: string
  semester: number
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
    mataKuliah: { id: string; code: string; name: string }
  }
}

interface ClassMember {
  id: string
  userId: string
  userName: string
  userEmail: string
}

interface AttendanceEntry {
  userId: string
  status: string
  keterangan: string
}

const STATUS_OPTIONS = [
  { value: 'HADIR', label: 'Hadir', color: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
  { value: 'IZIN', label: 'Izin', color: 'bg-amber-500 hover:bg-amber-600 text-white' },
  { value: 'SAKIT', label: 'Sakit', color: 'bg-rose-500 hover:bg-rose-600 text-white' },
  { value: 'ALPA', label: 'Alpa', color: 'bg-red-500 hover:bg-red-600 text-white' },
]

export function AdminAttendance() {
  const { selectedKelas } = useAppStore()
  const [classes, setClasses] = useState<Kelas[]>([])
  const [selectedKelasId, setSelectedKelasId] = useState('')
  const [pertemuanLogs, setPertemuanLogs] = useState<PertemuanLog[]>([])
  const [selectedPertemuanId, setSelectedPertemuanId] = useState('')
  const [members, setMembers] = useState<ClassMember[]>([])
  const [attendances, setAttendances] = useState<Map<string, AttendanceEntry>>(new Map())
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMembers, setLoadingMembers] = useState(false)

  const selectedPertemuan = pertemuanLogs.find((l) => l.id === selectedPertemuanId)

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

  const fetchPertemuanLogs = useCallback(async () => {
    if (!selectedKelasId) return
    try {
      const res = await fetch(`/api/pertemuan-log?kelasId=${selectedKelasId}`)
      if (res.ok) {
        const data = await res.json()
        const logs: PertemuanLog[] = data.logs || []
        setPertemuanLogs(logs)
        // Reset selection if current one is no longer valid
        if (selectedPertemuanId && !logs.find((l) => l.id === selectedPertemuanId)) {
          setSelectedPertemuanId('')
        }
      }
    } catch {
      toast.error('Gagal memuat pertemuan')
    }
  }, [selectedKelasId, selectedPertemuanId])

  const fetchMembersAndAttendance = useCallback(async () => {
    if (!selectedKelasId || !selectedPertemuanId) return
    try {
      setLoadingMembers(true)

      // Fetch class members
      const membersRes = await fetch(`/api/admin/kelas/${selectedKelasId}/members`)
      if (membersRes.ok) {
        const membersData = await membersRes.json()
        const list: ClassMember[] = (membersData.members || []).map(
          (m: { id: string; userId: string; user: { name: string; email: string } }) => ({
            id: m.id,
            userId: m.userId,
            userName: m.user.name,
            userEmail: m.user.email,
          })
        )
        setMembers(list)

        // Fetch existing attendance
        const attRes = await fetch(`/api/kehadiran?pertemuanLogId=${selectedPertemuanId}`)
        if (attRes.ok) {
          const attData = await attRes.json()
          const existingAtt = attData.kehadiran || []

          const newMap = new Map<string, AttendanceEntry>()
          for (const member of list) {
            const existing = existingAtt.find((e: { userId: string }) => e.userId === member.userId)
            newMap.set(member.userId, {
              userId: member.userId,
              status: existing?.status || 'HADIR',
              keterangan: existing?.keterangan || '',
            })
          }
          setAttendances(newMap)
        } else {
          // Initialize all as HADIR
          const newMap = new Map<string, AttendanceEntry>()
          for (const member of list) {
            newMap.set(member.userId, {
              userId: member.userId,
              status: 'HADIR',
              keterangan: '',
            })
          }
          setAttendances(newMap)
        }
      }
    } catch {
      toast.error('Gagal memuat data anggota')
    } finally {
      setLoadingMembers(false)
    }
  }, [selectedKelasId, selectedPertemuanId])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  useEffect(() => {
    if (selectedKelasId) fetchPertemuanLogs()
  }, [selectedKelasId, fetchPertemuanLogs])

  useEffect(() => {
    if (selectedKelasId && selectedPertemuanId) {
      fetchMembersAndAttendance()
    } else {
      setMembers([])
      setAttendances(new Map())
    }
  }, [selectedKelasId, selectedPertemuanId, fetchMembersAndAttendance])

  const handleStatusChange = (userId: string, status: string) => {
    setAttendances((prev) => {
      const next = new Map(prev)
      const existing = next.get(userId)
      next.set(userId, {
        userId,
        status,
        keterangan: existing?.keterangan || '',
      })
      return next
    })
  }

  const handleKeteranganChange = (userId: string, keterangan: string) => {
    setAttendances((prev) => {
      const next = new Map(prev)
      const existing = next.get(userId)
      if (existing) {
        next.set(userId, { ...existing, keterangan })
      }
      return next
    })
  }

  const handleSave = async () => {
    if (!selectedPertemuanId) return
    try {
      setSaving(true)
      const attendancesArray = Array.from(attendances.values())
      const res = await fetch('/api/kehadiran/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pertemuanLogId: selectedPertemuanId,
          attendances: attendancesArray,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(`Kehadiran berhasil disimpan (${data.count} mahasantri)`)
      } else {
        const errData = await res.json()
        toast.error(errData.error || 'Gagal menyimpan kehadiran')
      }
    } catch {
      toast.error('Gagal menyimpan kehadiran')
    } finally {
      setSaving(false)
    }
  }

  const handleSetAllStatus = (status: string) => {
    setAttendances((prev) => {
      const next = new Map(prev)
      for (const [userId, entry] of next) {
        next.set(userId, { ...entry, status })
      }
      return next
    })
  }

  // Calculate summary
  const summary = {
    hadir: Array.from(attendances.values()).filter((a) => a.status === 'HADIR').length,
    izin: Array.from(attendances.values()).filter((a) => a.status === 'IZIN').length,
    sakit: Array.from(attendances.values()).filter((a) => a.status === 'SAKIT').length,
    alpa: Array.from(attendances.values()).filter((a) => a.status === 'ALPA').length,
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedKelasId} onValueChange={(val) => {
          setSelectedKelasId(val)
          setSelectedPertemuanId('')
        }}>
          <SelectTrigger className="w-full sm:w-[260px]">
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

        <Select value={selectedPertemuanId} onValueChange={setSelectedPertemuanId} disabled={!selectedKelasId}>
          <SelectTrigger className="w-full sm:w-[340px]">
            <SelectValue placeholder="Pilih Pertemuan" />
          </SelectTrigger>
          <SelectContent>
            {pertemuanLogs.length === 0 ? (
              <SelectItem value="__none" disabled>
                Tidak ada pertemuan
              </SelectItem>
            ) : (
              pertemuanLogs.map((log) => (
                <SelectItem key={log.id} value={log.id}>
                  {log.silabus?.mataKuliah?.name || 'Mata Kuliah'} — Pertemuan {log.silabus?.pertemuan} — {new Date(log.tanggal).toLocaleDateString('id-ID')}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {!selectedKelasId || !selectedPertemuanId ? (
        <EmptyState
          icon={UserCheck}
          title="Pilih kelas dan pertemuan"
          description="Pilih kelas dan pertemuan untuk mengelola kehadiran mahasantri"
        />
      ) : (
        <>
          {/* Pertemuan Info */}
          {selectedPertemuan && (
            <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <BookOpen className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {selectedPertemuan.silabus?.mataKuliah?.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono">{selectedPertemuan.silabus?.mataKuliah?.code}</span>
                      <span>•</span>
                      <span>Pertemuan {selectedPertemuan.silabus?.pertemuan}</span>
                      <span>•</span>
                      <span>{new Date(selectedPertemuan.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      selectedPertemuan.status === 'SELESAI'
                        ? 'border-emerald-300 text-emerald-700'
                        : 'border-slate-300 text-slate-600'
                    }
                  >
                    {selectedPertemuan.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary & Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Hadir: {summary.hadir}
              </Badge>
              <Badge className="bg-amber-100 text-amber-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                Izin: {summary.izin}
              </Badge>
              <Badge className="bg-rose-100 text-rose-700">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Sakit: {summary.sakit}
              </Badge>
              <Badge className="bg-red-100 text-red-700">
                <XCircle className="h-3 w-3 mr-1" />
                Alpa: {summary.alpa}
              </Badge>
              <span className="text-xs text-slate-500">Total: {members.length}</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSetAllStatus('HADIR')}
                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              >
                Semua Hadir
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || members.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {saving ? (
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Menyimpan...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Save className="h-4 w-4" />
                    Simpan Kehadiran
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Attendance List */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-emerald-600" />
                Daftar Kehadiran ({members.length} mahasantri)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMembers ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : members.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Tidak ada anggota kelas"
                  description="Kelas ini belum memiliki anggota"
                />
              ) : (
                <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
                  {members.map((member) => {
                    const att = attendances.get(member.userId)
                    if (!att) return null
                    const needsKeterangan = att.status === 'IZIN' || att.status === 'SAKIT'

                    return (
                      <div
                        key={member.userId}
                        className={`p-3 rounded-lg border transition-colors ${
                          att.status === 'HADIR'
                            ? 'border-emerald-100 bg-emerald-50/30'
                            : att.status === 'ALPA'
                              ? 'border-red-100 bg-red-50/30'
                              : att.status === 'IZIN'
                                ? 'border-amber-100 bg-amber-50/30'
                                : 'border-rose-100 bg-rose-50/30'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          {/* Name */}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {member.userName}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {member.userEmail}
                            </p>
                          </div>

                          {/* Status Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {STATUS_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handleStatusChange(member.userId, opt.value)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                  att.status === opt.value
                                    ? opt.color + ' shadow-sm'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Keterangan field for IZIN/SAKIT */}
                        {needsKeterangan && (
                          <div className="mt-2 pl-1">
                            <Input
                              type="text"
                              placeholder="Keterangan (opsional)..."
                              value={att.keterangan}
                              onChange={(e) => handleKeteranganChange(member.userId, e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
