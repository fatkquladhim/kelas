'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit2, 
  Target, 
  Plus, 
  Calendar, 
  Loader2, 
  CheckCircle2, 
  Award,
  BookOpen,
  ClipboardList
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { EmptyState } from '@/components/shared/EmptyState'

interface UserSelectInfo {
  id: string
  name: string
  email: string
}

interface TargetHafalan {
  id: string
  materi: string
  tanggalTarget: string
}

interface KelompokMemberInfo {
  id: string
  user: UserSelectInfo
}

interface Kelompok {
  id: string
  name: string
  leader: UserSelectInfo
  members: KelompokMemberInfo[]
  targets: TargetHafalan[]
}

export function RoisKelompok() {
  const { selectedKelas, classMembers } = useAppStore()
  const [kelompoks, setKelompoks] = useState<Kelompok[]>([])
  const [loading, setLoading] = useState(true)

  // Group Dialog State
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Kelompok | null>(null)
  const [groupName, setGroupName] = useState('')
  const [leaderId, setLeaderId] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [savingGroup, setSavingGroup] = useState(false)



  // Delete Group State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingGroupId, setDeletingGroupId] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    if (!selectedKelas?.id) return
    try {
      setLoading(true)
      const res = await fetch(`/api/rois/kelompok?kelasId=${selectedKelas.id}`)
      if (res.ok) {
        const data = await res.json()
        setKelompoks(data.kelompoks || [])
      }
    } catch {
      toast.error('Gagal memuat kelompok')
    } finally {
      setLoading(false)
    }
  }, [selectedKelas?.id])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  // Get eligible users in class (excluding admins)
  const availableUsers: UserSelectInfo[] = classMembers.map(m => ({
    id: m.userId,
    name: m.userName,
    email: m.userEmail,
  }))

  const openCreateGroup = () => {
    setEditingGroup(null)
    setGroupName('')
    setLeaderId('')
    setSelectedMemberIds([])
    setGroupDialogOpen(true)
  }

  const openEditGroup = (group: Kelompok) => {
    setEditingGroup(group)
    setGroupName(group.name)
    setLeaderId(group.leader.id)
    setSelectedMemberIds(group.members.map(m => m.user.id))
    setGroupDialogOpen(true)
  }

  const handleSaveGroup = async () => {
    if (!groupName || !leaderId || !selectedKelas?.id) {
      toast.error('Nama kelompok dan Ketua Kelompok wajib diisi')
      return
    }

    try {
      setSavingGroup(true)
      const url = editingGroup 
        ? `/api/rois/kelompok/${editingGroup.id}`
        : '/api/rois/kelompok'
      
      const method = editingGroup ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          kelasId: selectedKelas.id,
          leaderId,
          members: selectedMemberIds,
        }),
      })

      if (res.ok) {
        toast.success(editingGroup ? 'Kelompok berhasil diubah' : 'Kelompok berhasil dibuat')
        setGroupDialogOpen(false)
        await fetchGroups()
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menyimpan kelompok')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSavingGroup(false)
    }
  }

  const openDeleteGroup = (id: string) => {
    setDeletingGroupId(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteGroup = async () => {
    if (!deletingGroupId) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/rois/kelompok/${deletingGroupId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Kelompok berhasil dihapus')
        setDeleteDialogOpen(false)
        await fetchGroups()
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menghapus kelompok')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setDeleting(false)
    }
  }



  const toggleMemberSelection = (userId: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => <Card key={i} className="h-48 skeleton" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manajemen Kelompok</h2>
          <p className="text-sm text-slate-500">
            Kelola pembagian kelompok mahasantri, ketua kelompok, dan target hafalan
          </p>
        </div>
        <Button onClick={openCreateGroup} className="bg-emerald-600 hover:bg-emerald-700 text-white self-start sm:self-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          Tambah Kelompok
        </Button>
      </div>

      <Separator />

      {kelompoks.length === 0 ? (
        <EmptyState 
          icon={Users} 
          title="Belum Ada Kelompok" 
          description="Rois A'm belum membagi mahasantri ke dalam kelompok. Klik button di atas untuk membuat kelompok baru." 
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {kelompoks.map(group => (
            <Card key={group.id} className="border border-emerald-100/50 shadow-xl shadow-slate-200/40 rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 bg-white/90 backdrop-blur-xl">
              <CardHeader className="bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Users className="h-5 w-5 text-emerald-300" />
                      {group.name}
                    </CardTitle>
                    <CardDescription className="text-emerald-100/90 text-xs mt-1.5">
                      Ketua: <strong className="text-white bg-emerald-800/50 px-2 py-0.5 rounded-full ml-1">{group.leader.name}</strong>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openEditGroup(group)} 
                      className="text-white hover:bg-white/10 h-8 w-8"
                      title="Edit Kelompok"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openDeleteGroup(group.id)} 
                      className="text-white hover:bg-white/10 hover:text-red-300 h-8 w-8"
                      title="Hapus Kelompok"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                {/* Members list */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Anggota Kelompok ({group.members.length})</h4>
                  <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {group.members.map(m => (
                      <Badge key={m.id} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100 border border-slate-200">
                        {m.user.name}
                        {m.user.id === group.leader.id && (
                          <Award className="h-3 w-3 text-emerald-600 ml-1 shrink-0" />
                        )}
                      </Badge>
                    ))}
                    {group.members.length === 0 && (
                      <p className="text-xs text-slate-400 italic">Belum ada anggota</p>
                    )}
                  </div>
                </div>


              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Group Create/Edit Dialog */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Ubah Kelompok' : 'Tambah Kelompok Baru'}</DialogTitle>
            <DialogDescription>
              Tentukan nama kelompok, tunjuk ketua kelompok, dan pilih anggota kelompoknya
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Nama Kelompok */}
            <div className="space-y-1.5">
              <Label htmlFor="group-name">Nama Kelompok</Label>
              <Input 
                id="group-name" 
                placeholder="Misal: Kelompok Abu Bakar" 
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
              />
            </div>

            {/* Ketua Kelompok */}
            <div className="space-y-1.5">
              <Label htmlFor="leader">Ketua Kelompok (Leader)</Label>
              <Select value={leaderId} onValueChange={setLeaderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Ketua Kelompok..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Anggota Kelompok */}
            <div className="space-y-1.5">
              <Label>Pilih Anggota Kelompok</Label>
              <Card className="border border-slate-200">
                <ScrollArea className="h-[180px] p-3">
                  <div className="space-y-2">
                    {availableUsers.map(u => {
                      const isLeader = u.id === leaderId
                      return (
                        <div key={u.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`user-${u.id}`} 
                            checked={selectedMemberIds.includes(u.id) || isLeader} 
                            disabled={isLeader}
                            onCheckedChange={() => toggleMemberSelection(u.id)}
                          />
                          <label 
                            htmlFor={`user-${u.id}`} 
                            className={`text-xs cursor-pointer select-none flex-1 flex items-center justify-between ${
                              isLeader ? 'font-semibold text-emerald-600' : ''
                            }`}
                          >
                            <span>{u.name}</span>
                            {isLeader && <Badge className="bg-emerald-100 text-emerald-700 text-[9px] hover:bg-emerald-100">Ketua</Badge>}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveGroup} disabled={savingGroup} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {savingGroup && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingGroup ? 'Simpan Perubahan' : 'Buat Kelompok'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Delete Group Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Hapus Kelompok</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kelompok ini? Seluruh data riwayat target hafalan dan anggota kelompok akan terhapus permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <Button onClick={handleDeleteGroup} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Hapus Kelompok
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
