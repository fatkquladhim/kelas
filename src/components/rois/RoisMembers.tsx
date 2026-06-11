'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Skeleton,
} from '@/components/ui/skeleton'
import { UserCog, Loader2, CheckCircle2, BookOpen, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAppStore } from '@/lib/store'
import { getRoleBadgeColor, getRoleLabel } from '@/components/Sidebar'
import type { MemberRole } from '@/lib/store'

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

const ASSIGNABLE_ROLES: { value: MemberRole; label: string }[] = [
  { value: 'KETUA_FAN_ILMU', label: 'Ketua Fan Ilmu' },
  { value: 'KETUA_KELOMPOK', label: 'Ketua Kelompok' },
  { value: 'SEKRETARIS', label: 'Sekretaris' },
  { value: 'BENDAHARA', label: 'Bendahara' },
  { value: 'MAHASANTRI', label: 'Mahasantri' },
]

export function RoisMembers() {
  const { selectedKelas, classMembers, setClassMembers } = useAppStore()

  // Role assignment
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [newRole, setNewRole] = useState<MemberRole>('MAHASANTRI')
  const [assigning, setAssigning] = useState(false)

  // Rois Fan management
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([])
  const [roisFanAssignments, setRoisFanAssignments] = useState<RoisFanAssignment[]>([])
  const [loadingRoisFan, setLoadingRoisFan] = useState(false)
  const [roisFanOpen, setRoisFanOpen] = useState(false)
  const [rfUserId, setRfUserId] = useState('')
  const [rfMkId, setRfMkId] = useState('')

  const fetchRoisFan = useCallback(async () => {
    if (!selectedKelas?.id) return
    try {
      setLoadingRoisFan(true)
      const res = await fetch(`/api/admin/rois-fan?kelasId=${selectedKelas.id}`)
      if (res.ok) {
        const data = await res.json()
        setRoisFanAssignments(data.assignments || [])
      }
    } catch {
      // silent
    } finally {
      setLoadingRoisFan(false)
    }
  }, [selectedKelas?.id])

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
    if (selectedKelas?.id) {
      fetchRoisFan()
      fetchMataKuliah()
    }
  }, [selectedKelas?.id, fetchRoisFan, fetchMataKuliah])

  const handleAssign = async () => {
    if (!selectedUserId || !newRole || !selectedKelas) {
      toast.error('Pilih anggota dan role')
      return
    }

    setAssigning(true)
    try {
      const targetMember = classMembers.find(m => m.userId === selectedUserId)
      if (!targetMember) {
        toast.error('Anggota tidak ditemukan')
        return
      }

      const res = await fetch(`/api/admin/kelas/${selectedKelas.id}/members/${targetMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (res.ok) {
        toast.success(`Role berhasil diubah menjadi ${ASSIGNABLE_ROLES.find(r => r.value === newRole)?.label}`)
        setAssignOpen(false)
        setSelectedUserId('')

        // Refresh members
        const membersRes = await fetch(`/api/admin/kelas/${selectedKelas.id}/members`)
        if (membersRes.ok) {
          const data = await membersRes.json()
          const members = (data.members || []).map((m: any) => ({
            id: m.id,
            userId: m.userId,
            userName: m.user?.name || 'Unknown',
            userEmail: m.user?.email || '',
            role: m.role,
            kelasId: m.kelasId,
          }))
          setClassMembers(members)
        }
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengubah role')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setAssigning(false)
    }
  }

  const handleAddRoisFan = async () => {
    if (!selectedKelas?.id || !rfUserId || !rfMkId) return
    try {
      const res = await fetch('/api/admin/rois-fan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kelasId: selectedKelas.id, userId: rfUserId, mataKuliahId: rfMkId }),
      })
      if (res.ok) {
        toast.success('Rois Fan berhasil ditugaskan')
        setRoisFanOpen(false)
        setRfUserId('')
        setRfMkId('')
        fetchRoisFan()
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
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }

  if (!selectedKelas) {
    return (
      <EmptyState
        icon={UserCog}
        title="Pilih Kelas"
        description="Gunakan selector kelas di header untuk memilih kelas"
      />
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="anggota" className="w-full">
        <TabsList>
          <TabsTrigger value="anggota">
            <UserCog className="h-4 w-4 mr-2" />
            Atur Peran Anggota
          </TabsTrigger>
          <TabsTrigger value="rois-fan">
            <BookOpen className="h-4 w-4 mr-2" />
            Spesifikasi Rois Fan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anggota" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Atur peran anggota kelas</p>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setAssignOpen(true)}
            >
              <UserCog className="h-4 w-4 mr-2" />
              Atur Role
            </Button>
          </div>

          {classMembers.length === 0 ? (
            <EmptyState icon={UserCog} title="Belum ada anggota" description="Belum ada anggota di kelas ini" />
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Nama</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classMembers.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.userName}</TableCell>
                        <TableCell className="hidden md:table-cell text-slate-600">{m.userEmail}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={getRoleBadgeColor(m.role as any)}>
                            {getRoleLabel(m.role as any)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Atur Role Anggota</DialogTitle>
                <DialogDescription>Pilih anggota dan role baru</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Anggota</label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="-- Pilih Anggota --" />
                    </SelectTrigger>
                    <SelectContent>
                      {classMembers.map(m => (
                        <SelectItem key={m.userId} value={m.userId}>
                          {m.userName} ({getRoleLabel(m.role as any)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role Baru</label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as MemberRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSIGNABLE_ROLES.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignOpen(false)}>Batal</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAssign} disabled={assigning || !selectedUserId}>
                  {assigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="rois-fan" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Petakan Rois Fan ke mata kuliah tertentu</p>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setRoisFanOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Penugasan
            </Button>
          </div>

          {loadingRoisFan ? (
            <Skeleton className="h-48 w-full rounded-xl" />
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
                    {roisFanAssignments.map(a => (
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
                      {classMembers.map(m => (
                        <SelectItem key={m.userId} value={m.userId}>
                          {m.userName} ({getRoleLabel(m.role as any)})
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