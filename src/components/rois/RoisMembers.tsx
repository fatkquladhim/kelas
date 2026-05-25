'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { UserCog, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAppStore } from '@/lib/store'
import { getRoleBadgeColor, getRoleLabel } from '@/components/Sidebar'
import type { MemberRole } from '@/lib/store'

const ASSIGNABLE_ROLES: { value: MemberRole; label: string }[] = [
  { value: 'KETUA_FAN_ILMU', label: 'Ketua Fan Ilmu' },
  { value: 'KETUA_KELOMPOK', label: 'Ketua Kelompok' },
  { value: 'SEKRETARIS', label: 'Sekretaris' },
  { value: 'BENDAHARA', label: 'Bendahara' },
  { value: 'MAHASANTRI', label: 'Mahasantri' },
]

export function RoisMembers() {
  const { selectedKelas, classMembers, setClassMembers } = useAppStore()
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [newRole, setNewRole] = useState<MemberRole>('MAHASANTRI')
  const [assigning, setAssigning] = useState(false)

  const handleAssign = async () => {
    if (!selectedUserId || !newRole || !selectedKelas) {
      toast.error('Pilih anggota dan role')
      return
    }

    setAssigning(true)
    try {
      const res = await fetch(`/api/kelas/${selectedKelas.id}/assign-role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, newRole }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(`Role berhasil diubah menjadi ${getRoleLabel(newRole)}`)
        setAssignOpen(false)
        setSelectedUserId('')
        setNewRole('MAHASANTRI')

        // Update class members in store
        if (data.member) {
          setClassMembers(
            classMembers.map(m =>
              m.userId === selectedUserId
                ? { ...m, role: newRole }
                : m
            )
          )
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

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {classMembers.length} anggota di kelas
          {selectedKelas ? ` ${selectedKelas.name}` : ''}
        </p>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => {
            if (!selectedKelas) { toast.error('Pilih kelas terlebih dahulu'); return }
            if (classMembers.length === 0) { toast.error('Belum ada anggota di kelas'); return }
            setAssignOpen(true)
          }}
        >
          <UserCog className="h-4 w-4 mr-2" />
          Ubah Role
        </Button>
      </div>

      {/* Members List */}
      {!selectedKelas ? (
        <EmptyState icon={UserCog} title="Pilih kelas" description="Gunakan selector kelas di header" />
      ) : classMembers.length === 0 ? (
        <EmptyState icon={UserCog} title="Belum ada anggota" description="Belum ada anggota di kelas ini" />
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
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
                  <Badge
                    variant="secondary"
                    className={getRoleBadgeColor(member.role)}
                  >
                    {getRoleLabel(member.role)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assign Role Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Role Anggota</DialogTitle>
            <DialogDescription>Pilih anggota dan role baru yang akan ditetapkan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih Anggota</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih anggota" />
                </SelectTrigger>
                <SelectContent>
                  {classMembers
                    .filter(m => m.role !== 'ROIS_AM')
                    .map(m => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.userName} ({getRoleLabel(m.role)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role Baru</label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as MemberRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
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
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAssign} disabled={assigning}>
              {assigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tetapkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
