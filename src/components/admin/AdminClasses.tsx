'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Users, Trash2, Edit, Loader2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAppStore } from '@/lib/store'

interface Kelas {
  id: string
  name: string
  semester: number
  tahunAjaran: string
  _count: { members: number; schedules: number; pertemuanLogs: number }
  createdAt: string
}

interface Member {
  id: string
  userId: string
  userName: string
  userEmail: string
  role: string
  kelasId: string
}

export function AdminClasses() {
  const { setCurrentPage } = useAppStore()
  const [classes, setClasses] = useState<Kelas[]>([])
  const [loading, setLoading] = useState(true)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSemester, setNewSemester] = useState('')
  const [newTahunAjaran, setNewTahunAjaran] = useState('')
  const [creating, setCreating] = useState(false)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editClass, setEditClass] = useState<Kelas | null>(null)
  const [editName, setEditName] = useState('')
  const [editSemester, setEditSemester] = useState('')
  const [editTahunAjaran, setEditTahunAjaran] = useState('')
  const [editing, setEditing] = useState(false)

  // Members dialog
  const [membersOpen, setMembersOpen] = useState(false)
  const [selectedKelasId, setSelectedKelasId] = useState<string>('')
  const [selectedKelasName, setSelectedKelasName] = useState('')
  const [members, setMembers] = useState<Member[]>([])

  // Add member dialog
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [allUsers, setAllUsers] = useState<{ id: string; name: string; email: string }[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [addingMember, setAddingMember] = useState(false)

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/kelas')
      if (res.ok) {
        const data = await res.json()
        setClasses(data.kelas || [])
      }
    } catch {
      toast.error('Gagal memuat data kelas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  const handleCreate = async () => {
    if (!newName || !newSemester || !newTahunAjaran) {
      toast.error('Semua field wajib diisi')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/kelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, semester: Number(newSemester), tahunAjaran: newTahunAjaran }),
      })
      if (res.ok) {
        toast.success('Kelas berhasil dibuat')
        setCreateOpen(false)
        setNewName('')
        setNewSemester('')
        setNewTahunAjaran('')
        fetchClasses()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal membuat kelas')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = async () => {
    if (!editClass || !editName || !editSemester || !editTahunAjaran) return
    setEditing(true)
    try {
      const res = await fetch(`/api/admin/kelas/${editClass.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, semester: Number(editSemester), tahunAjaran: editTahunAjaran }),
      })
      if (res.ok) {
        toast.success('Kelas berhasil diperbarui')
        setEditOpen(false)
        fetchClasses()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal memperbarui kelas')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setEditing(false)
    }
  }

  const handleDelete = async (kelas: Kelas) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kelas ${kelas.name}?`)) return
    try {
      const res = await fetch(`/api/admin/kelas/${kelas.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Kelas berhasil dihapus')
        fetchClasses()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus kelas')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }

  const handleViewMembers = async (kelas: Kelas) => {
    setSelectedKelasId(kelas.id)
    setSelectedKelasName(kelas.name)
    try {
      const res = await fetch(`/api/admin/kelas/${kelas.id}/members`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members || [])
        setMembersOpen(true)
      }
    } catch {
      toast.error('Gagal memuat anggota kelas')
    }
  }

  const handleAddMember = async () => {
    if (!selectedUserId) return
    setAddingMember(true)
    try {
      const res = await fetch(`/api/admin/kelas/${selectedKelasId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId }),
      })
      if (res.ok) {
        toast.success('Anggota berhasil ditambahkan')
        setAddMemberOpen(false)
        setSelectedUserId('')
        handleViewMembers({ id: selectedKelasId, name: selectedKelasName } as Kelas)
        fetchClasses()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menambahkan anggota')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setAddingMember(false)
    }
  }

  const openAddMemberDialog = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setAllUsers((data.users || []).filter((u: { isActive: boolean }) => u.isActive))
        setAddMemberOpen(true)
      }
    } catch {
      toast.error('Gagal memuat data pengguna')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Hapus anggota dari kelas ini?')) return
    try {
      const res = await fetch(`/api/admin/kelas/${selectedKelasId}/members/${memberId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Anggota berhasil dihapus')
        handleViewMembers({ id: selectedKelasId, name: selectedKelasName } as Kelas)
        fetchClasses()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus anggota')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{classes.length} kelas terdaftar</p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kelas
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Kelas Baru</DialogTitle>
              <DialogDescription>Masukkan informasi kelas yang akan dibuat</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Kelas</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Contoh: Kelas Al-Fatih" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Semester</label>
                  <Input type="number" value={newSemester} onChange={(e) => setNewSemester(e.target.value)} placeholder="1-8" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tahun Ajaran</label>
                  <Input value={newTahunAjaran} onChange={(e) => setNewTahunAjaran(e.target.value)} placeholder="2024/2025" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Buat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Class Cards */}
      {classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Belum ada kelas"
          description="Buat kelas pertama untuk memulai"
          action={
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Buat Kelas
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((kelas) => (
            <Card key={kelas.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{kelas.name}</CardTitle>
                    <p className="text-xs text-slate-500 mt-1">Semester {kelas.semester} • {kelas.tahunAjaran}</p>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">Aktif</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {kelas._count.members} anggota</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {kelas._count.schedules} jadwal</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleViewMembers(kelas)}>
                    <Users className="h-3 w-3 mr-1" />
                    Anggota
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditClass(kelas)
                    setEditName(kelas.name)
                    setEditSemester(String(kelas.semester))
                    setEditTahunAjaran(kelas.tahunAjaran)
                    setEditOpen(true)
                  }}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(kelas)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kelas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Kelas</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Semester</label>
                <Input type="number" value={editSemester} onChange={(e) => setEditSemester(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tahun Ajaran</label>
                <Input value={editTahunAjaran} onChange={(e) => setEditTahunAjaran(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleEdit} disabled={editing}>
              {editing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Anggota Kelas: {selectedKelasName}</DialogTitle>
            <DialogDescription>Daftar anggota kelas ini</DialogDescription>
          </DialogHeader>
          <div className="mb-4">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openAddMemberDialog}>
              <Plus className="h-3 w-3 mr-1" />
              Tambah Anggota
            </Button>
          </div>
          {members.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Belum ada anggota</p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-sm font-medium">{m.userName}</p>
                    <p className="text-xs text-slate-500">{m.userEmail}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{m.role}</Badge>
                    <Button size="sm" variant="ghost" className="text-red-500 h-7 w-7 p-0" onClick={() => handleRemoveMember(m.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Anggota</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Mahasantri</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">-- Pilih Mahasantri --</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Batal</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAddMember} disabled={addingMember}>
              {addingMember && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GraduationCap(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
      <path d="M22 10v6" />
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
    </svg>
  )
}
