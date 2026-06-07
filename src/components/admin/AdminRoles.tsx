'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Shield, Loader2, UserCog } from 'lucide-react'
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

  const currentRois = members.find(m => m.role === 'ROIS_AM')

  const handleAssignRois = async () => {
    if (!selectedUserId || !selectedKelasId) return
    setAssigning(true)
    try {
      // First, demote current ROIS if exists
      if (currentRois) {
        await fetch(`/api/admin/kelas/${selectedKelasId}/members/${currentRois.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'MAHASANTRI' }),
        })
      }
      // Then assign new ROIS - find the member ID for this user
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

      {/* Members Table */}
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

      {/* Assign ROIS Dialog */}
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
                  {members
                    .filter(m => m.role !== 'ROIS_AM')
                    .map(m => (
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
    </div>
  )
}
