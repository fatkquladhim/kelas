'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Presentation, Edit2, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PresentasiItem {
  id: string
  pertemuan: number
  userId: string
  tanggal: string
  materi: string
  user: { id: string; name: string; email: string }
  mataKuliah: { id: string; name: string; code: string }
}

interface PresentasiJadwalSectionProps {
  kelasId: string
  mataKuliahId: string
}

export function PresentasiJadwalSection({ kelasId, mataKuliahId }: PresentasiJadwalSectionProps) {
  const [schedules, setSchedules] = useState<PresentasiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<{ userId: string; userName: string }[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<PresentasiItem | null>(null)
  const [pertemuan, setPertemuan] = useState('')
  const [userId, setUserId] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [materi, setMateri] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/rois-fan/presentasi?kelasId=${kelasId}&mataKuliahId=${mataKuliahId}`)
      if (res.ok) {
        const data = await res.json()
        setSchedules(data.schedules || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/admin/kelas/${kelasId}/members`)
      if (res.ok) {
        const data = await res.json()
        setMembers((data.members || []).map((m: any) => ({
          userId: m.userId,
          userName: m.user?.name || 'Unknown',
        })))
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    fetchSchedules()
    fetchMembers()
  }, [kelasId, mataKuliahId])

  const openCreate = () => {
    setEditItem(null)
    setPertemuan('')
    setUserId('')
    setTanggal('')
    setMateri('')
    setDialogOpen(true)
  }

  const openEdit = (item: PresentasiItem) => {
    setEditItem(item)
    setPertemuan(String(item.pertemuan))
    setUserId(item.userId)
    setTanggal(item.tanggal.split('T')[0])
    setMateri(item.materi || '')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!pertemuan || !userId || !tanggal) {
      toast.error('Pertemuan, mahasantri, dan tanggal wajib diisi')
      return
    }
    setSaving(true)
    try {
      const body: any = {
        kelasId,
        mataKuliahId,
        pertemuan: Number(pertemuan),
        userId,
        tanggal,
        materi,
      }

      const res = await fetch('/api/rois-fan/presentasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success('Jadwal presentasi berhasil disimpan')
        setDialogOpen(false)
        fetchSchedules()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menyimpan jadwal')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus jadwal presentasi ini?')) return
    try {
      const res = await fetch(`/api/rois-fan/presentasi?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Jadwal berhasil dihapus')
        fetchSchedules()
      } else {
        toast.error('Gagal menghapus jadwal')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Tambah Jadwal
        </Button>
      </div>

      {loading ? (
        <div className="h-32 rounded-lg bg-slate-100 animate-pulse" />
      ) : schedules.length === 0 ? (
        <Card className="border-0 shadow-sm bg-slate-50">
          <CardContent className="p-4 text-center text-sm text-slate-500">
            Belum ada jadwal presentasi untuk mata kuliah ini
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-16">Pertemuan</TableHead>
                  <TableHead>Mahasantri</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Materi</TableHead>
                  <TableHead className="w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono font-bold text-emerald-700">{s.pertemuan}</TableCell>
                    <TableCell className="font-medium">{s.user.name}</TableCell>
                    <TableCell className="text-slate-600">
                      {new Date(s.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </TableCell>
                    <TableCell className="text-slate-500 max-w-[200px] truncate">{s.materi || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(s)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDelete(s.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Jadwal Presentasi' : 'Tambah Jadwal Presentasi'}</DialogTitle>
            <DialogDescription>Atur jadwal mahasantri untuk menerangkan kitab</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pertemuan Ke-</Label>
                <Input type="number" min={1} max={16} value={pertemuan} onChange={e => setPertemuan(e.target.value)} placeholder="1-16" />
              </div>
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mahasantri</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Pilih Mahasantri --" />
                </SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.userId} value={m.userId}>{m.userName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Materi (opsional)</Label>
              <Input value={materi} onChange={e => setMateri(e.target.value)} placeholder="Contoh: Bab Shalat hal. 45" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={saving || !pertemuan || !userId || !tanggal}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}