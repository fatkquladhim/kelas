'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Shield, Loader2, UserCog, BookOpen, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'

interface Kelas {
  id: string
  name: string
  semester: number
  tahunAjaran: string
}

interface Member {
  id: string
  userId: string
  userName: string
  userEmail: string
  role: string
  kelasId: string
  user?: { name: string; email: string }
}

interface MataKuliah {
  id: string
  code: string
  name: string
}

interface RoisFanAssignment {
  id: string
  userId: string
  mataKuliahId: string
  user: { id: string; name: string; email: string }
  mataKuliah: { id: string; name: string; code: string }
}

const ROLE_LABELS: Record<string, string> = {
  MAHASANTRI: 'Mahasantri',
  ROIS_AM: 'Rois A\'m',
  KETUA_FAN_ILMU: 'Ketua Fan Ilmu',
  KETUA_KELOMPOK: 'Ketua Kelompok',
  SEKRETARIS: 'Sekretaris',
  BENDAHARA: 'Bendahara',
}

const ROLE_COLORS: Record<string, string> = {
  ROIS_AM: 'bg-emerald-100 text-emerald-700',
  KETUA_FAN_ILMU: 'bg-blue-100 text-blue-700',
  KETUA_KELOMPOK: 'bg-purple-100 text-purple-700',
  SEKRETARIS: 'bg-amber-100 text-amber-700',
  BENDAHARA: 'bg-orange-100 text-orange-700',
  MAHASANTRI: 'bg-gray-100 text-gray-700',
}

export function AdminRoles() {
  const [classes, setClasses] = useState<Kelas[]>([])
  const [selectedKelasId, setSelectedKelasId] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  // Assign ROIS dialog
  const [roisOpen, setRoisOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [assigning, setAssigning] = useState(false)

  // Rois Fan subjects
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([])
  const [roisFanAssignments, setRoisFanAssignments] = useState<RoisFanAssignment[]>([])
  const [loadingRoisFan, setLoadingRoisFan] = useState(false)
  const [roisFanOpen, setRoisFanOpen] = useState(false)
  const [rfUserId, setRfUserId] = useState('')
  const [rfMkId, setRfMkId] = useState('')

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/kelas')
      if (res.ok) {
        const data = await res.json()
        const list = data.kelas || []
        setClasses(list)
        if (list.length > 0 && !selectedKelasId) {
          setSelectedKelasId(list[0].id)
        }
      }
    } catch {
      // silent
    }
  }, [selectedKelasId])

  const fetchMembers = useCallback(async () => {
    if (!selectedKelasId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/kelas/${selectedKelasId}/members`)
      if (res.ok) {
        const data = await res.json()
        const raw = data.members || []
        setMembers(raw.map((m: { id: string; userId: string; role: string; kelasId: string; user?: { name: string; email: string } }) => ({
          id: m.id,
          userId: m.userId,
          userName: m.user?.name || 'Unknown',
          userEmail: m.user?.email || '',
          role: m.role,
          kelasId: m.kelasId,
        })))
      }
    } catch {
      toast.error('Gagal memuat anggota')
    } finally {
      setLoading(false)
    }
  }, [selectedKelasId])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  useEffect(() => {
    if (selectedKelasId) fetchMembers()
  }, [selectedKelasId, fetchMembers])

  const fetchRoisFan = useCallback(async () => {
    if (!selectedKelasId) return
    try {
      setLoadingRoisFan(true)
      const res = await fetch(`/api/admin/rois-fan?kelasId=${selectedKelasId}`)
      if (res.ok) {
        const data = await res.json()
        setRoisFanAssignments(data.assignments || [])
      }
    } catch {
      // silent
    } finally {
      setLoadingRoisFan(false)
    }
  }, [selectedKelasId])

  const fetchMataKuliah = useCallback(async () => {
    try {
      const res = await fetch('/api/matakuliah')
      if (res.ok) {
        const data = await res.json()
        setMataKuliahList(data.matakuliah || [])
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    if (selectedKelasId) {
      fetchRoisFan()
      fetchMataKuliah()
    }
  }, [selectedKelasId, fetchRoisFan, fetchMataKuliah])

  const currentRois = members.find(m => m.role === 'ROIS_AM')

  const handleAssignRois = async () => {
    if (!selectedUserId || !selectedKelasId) return
    setAssigning(true)
    try {
      if (currentRois) {
        await fetch(`/api/admin/kelas/${selectedKelasId}/members/${currentRois.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'MAHASANTRI' }),
        })
      }
      const targetMember = members.find(m => m.userId === selectedUserId)
      if (!targetMember) {
        toast.error('Anggota tidak ditemukan di kelas ini')
        return
      }
      const res = await fetch(`/api/admin/kelas/${selectedKelasId}/members/${targetMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'ROIS_AM' }),
      })
      if (res.ok) {
        toast.success('Rois A\'m berhasil ditetapkan')
        setRoisOpen(false)
        setSelectedUserId('')
        fetchMembers()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menetapkan Rois')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setAssigning(false)
    }
  }

  const handleAddRoisFan = async () => {
    if (!selectedKelasId || !rfUserId || !rfMkId) return
    try {
      const res = await fetch('/api/admin/rois-fan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kelasId: selectedKelasId, userId: rfUserId, mataKuliahId: rfMkId }),
      })
      if (res.ok) {
        toast.success('Rois Fan berhasil ditugaskan')
        setRoisFanOpen(false)
        setRfUserId('')
        setRfMkId('')
        fetchRoisFan()
        fetchMembers()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menugaskan Rois Fan')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }

  const handleDeleteRoisFan = async (id: string) => {
    if (!confirm('Hapus penugasan Rois Fan ini?')) return
    try {
      const res = await fetch(`/api/admin/rois-fan?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Penugasan dihapus')
        fetchRoisFan()
        fetchMembers()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }

  const roisCandidates = members.filter(m => m.role !== 'ROIS_AM')

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

      <Tabs defaultValue="roles" className="w-full">
        <TabsList>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Pengaturan Role
          </TabsTrigger>
          <TabsTrigger value="rois-fan">
            <BookOpen className="h-4 w-4 mr-2" />
            Spesifikasi Rois Fan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Atur role anggota kelas</p>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                if (!selectedKelasId) { toast.error('Pilih kelas terlebih dahulu'); return }
                setRoisOpen(true)
              }}
            >
              <Shield className="h-4 w-4 mr-2" />
              Tetapkan Rois A&apos;m
            </Button>
          </div>

          {loading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : !selectedKelasId ? (
            <EmptyState icon={UserCog} title="Pilih kelas" description="Pilih kelas untuk mengatur role anggota" />
          ) : members.length === 0 ? (
            <EmptyState icon={UserCog} title="Belum ada anggota" description="Tambahkan anggota ke kelas ini terlebih dahulu" />
          ) : (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-500">
                  Anggota Kelas: {classes.find(c => c.id === selectedKelasId)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead>Nama</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.userName}</TableCell>
                        <TableCell className="hidden md:table-cell text-slate-600">{member.userEmail}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={ROLE_COLORS[member.role] || 'bg-gray-100 text-gray-700'}>
                            {ROLE_LABELS[member.role] || member.role}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Dialog open={roisOpen} onOpenChange={setRoisOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tetapkan Rois A&apos;m</DialogTitle>
                <DialogDescription>
                  {currentRois
                    ? `Rois A'm saat ini: ${currentRois.userName}`
                    : 'Belum ada Rois A\'m untuk kelas ini'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pilih Mahasantri</label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="-- Pilih Mahasantri --" />
                    </SelectTrigger>
                    <SelectContent>
                      {roisCandidates.map(m => (
                        <SelectItem key={m.userId} value={m.userId}>
                          {m.userName} ({ROLE_LABELS[m.role] || m.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRoisOpen(false)}>Batal</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAssignRois} disabled={assigning}>
                  {assigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Tetapkan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="rois-fan" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Petakan Rois Fan ke mata kuliah tertentu</p>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                if (!selectedKelasId) { toast.error('Pilih kelas terlebih dahulu'); return }
                setRoisFanOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Penugasan
            </Button>
          </div>

          {loadingRoisFan ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : !selectedKelasId ? (
            <EmptyState icon={BookOpen} title="Pilih kelas" description="Pilih kelas untuk mengelola Rois Fan" />
          ) : roisFanAssignments.length === 0 ? (
            <EmptyState icon={BookOpen} title="Belum ada penugasan" description="Tambahkan Rois Fan untuk mata kuliah tertentu" />
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Mahasantri</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Mata Kuliah</TableHead>
                      <TableHead className="w-20">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roisFanAssignments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.user.name}</TableCell>
                        <TableCell className="text-slate-600">{a.user.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            {a.mataKuliah.code} - {a.mataKuliah.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" className="text-red-500 h-8 w-8 p-0" onClick={() => handleDeleteRoisFan(a.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Dialog open={roisFanOpen} onOpenChange={setRoisFanOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Penugasan Rois Fan</DialogTitle>
                <DialogDescription>Petakan mahasantri sebagai Rois Fan untuk mata kuliah tertentu</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mahasantri</label>
                  <Select value={rfUserId} onValueChange={setRfUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="-- Pilih Mahasantri --" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map(m => (
                        <SelectItem key={m.userId} value={m.userId}>
                          {m.userName} ({ROLE_LABELS[m.role] || m.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mata Kuliah</label>
                  <Select value={rfMkId} onValueChange={setRfMkId}>
                    <SelectTrigger>
                      <SelectValue placeholder="-- Pilih Mata Kuliah --" />
                    </SelectTrigger>
                    <SelectContent>
                      {mataKuliahList.map(mk => (
                        <SelectItem key={mk.id} value={mk.id}>
                          {mk.code} - {mk.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRoisFanOpen(false)}>Batal</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAddRoisFan} disabled={!rfUserId || !rfMkId}>
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}