'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Plus, FileText, Loader2, Users, Target, User } from 'lucide-react'
import { toast } from 'sonner'

interface TugasItem {
  id: string
  title: string
  description: string
  dueDate: string
  targetType: string
  targetKelompokId: string | null
  targetUserId: string | null
  creator: { id: string; name: string }
  mataKuliah: { id: string; code: string; name: string }
  targetKelompok: { id: string; name: string } | null
  targetUser: { id: string; name: string } | null
  distributions: any[]
}

interface Kelompok {
  id: string
  name: string
  leader: { id: string; name: string }
}

interface TugasSectionProps {
  kelasId: string
  mataKuliahId: string
}

const TARGET_LABELS: Record<string, string> = {
  KELAS: 'Seluruh Kelas',
  KELOMPOK: 'Per Kelompok',
  INDIVIDU: 'Mahasantri Tertentu',
}

export function TugasSection({ kelasId, mataKuliahId }: TugasSectionProps) {
  const [tugasList, setTugasList] = useState<TugasItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [targetType, setTargetType] = useState('KELAS')
  const [targetKelompokId, setTargetKelompokId] = useState('')
  const [targetUserId, setTargetUserId] = useState('')
  const [kelompokList, setKelompokList] = useState<Kelompok[]>([])
  const [members, setMembers] = useState<{ id: string; userId: string; userName: string }[]>([])
  const [creating, setCreating] = useState(false)

  const fetchTugas = async () => {
    try {
      const res = await fetch(`/api/ketua-fan/tugas?kelasId=${kelasId}&mataKuliahId=${mataKuliahId}`)
      if (res.ok) {
        const data = await res.json()
        setTugasList(data.tugas || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const fetchKelompok = async () => {
    try {
      const res = await fetch(`/api/rois/kelompok?kelasId=${kelasId}`)
      if (res.ok) {
        const data = await res.json()
        setKelompokList(data.kelompok || [])
      }
    } catch {
      // silent
    }
  }

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/admin/kelas/${kelasId}/members`)
      if (res.ok) {
        const data = await res.json()
        setMembers((data.members || []).map((m: any) => ({
          id: m.id,
          userId: m.userId,
          userName: m.user?.name || 'Unknown',
        })))
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    fetchTugas()
    fetchKelompok()
    fetchMembers()
  }, [kelasId, mataKuliahId])

  const handleCreate = async () => {
    if (!title || !dueDate) {
      toast.error('Judul dan tenggat wajib diisi')
      return
    }
    setCreating(true)
    try {
      const body: any = {
        kelasId,
        mataKuliahId,
        title,
        description,
        dueDate,
        targetType,
      }
      if (targetType === 'KELOMPOK') body.targetKelompokId = targetKelompokId
      if (targetType === 'INDIVIDU') body.targetUserId = targetUserId

      const res = await fetch('/api/ketua-fan/tugas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success('Tugas berhasil dibuat')
        setDialogOpen(false)
        setTitle('')
        setDescription('')
        setDueDate('')
        setTargetType('KELAS')
        setTargetKelompokId('')
        setTargetUserId('')
        fetchTugas()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal membuat tugas')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setCreating(false)
    }
  }

  const getTargetLabel = (t: TugasItem) => {
    if (t.targetType === 'KELOMPOK' && t.targetKelompok) return `Kelompok: ${t.targetKelompok.name}`
    if (t.targetType === 'INDIVIDU' && t.targetUser) return `Individu: ${t.targetUser.name}`
    return TARGET_LABELS[t.targetType] || t.targetType
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Buat Tugas
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-20 rounded-lg bg-slate-100 animate-pulse" />)}
        </div>
      ) : tugasList.length === 0 ? (
        <Card className="border-0 shadow-sm bg-slate-50">
          <CardContent className="p-4 text-center text-sm text-slate-500">
            Belum ada tugas untuk mata kuliah ini
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tugasList.map(t => (
            <Card key={t.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-slate-800">{t.title}</h4>
                      <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700">
                        {getTargetLabel(t)}
                      </Badge>
                    </div>
                    {t.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>Tenggat: {new Date(t.dueDate).toLocaleDateString('id-ID')}</span>
                      <span>Oleh: {t.creator.name}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {t.distributions.length} distribusi
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Tugas Baru</DialogTitle>
            <DialogDescription>Buat tugas untuk mata kuliah ini</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul Tugas</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nama tugas..." />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Deskripsi tugas..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tenggat</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Target</Label>
                <Select value={targetType} onValueChange={setTargetType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KELAS">Seluruh Kelas</SelectItem>
                    <SelectItem value="KELOMPOK">Per Kelompok</SelectItem>
                    <SelectItem value="INDIVIDU">Mahasantri Tertentu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {targetType === 'KELOMPOK' && (
              <div className="space-y-2">
                <Label>Pilih Kelompok</Label>
                <Select value={targetKelompokId} onValueChange={setTargetKelompokId}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- Pilih Kelompok --" />
                  </SelectTrigger>
                  <SelectContent>
                    {kelompokList.map(k => (
                      <SelectItem key={k.id} value={k.id}>
                        {k.name} (Ketua: {k.leader.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {targetType === 'INDIVIDU' && (
              <div className="space-y-2">
                <Label>Pilih Mahasantri</Label>
                <Select value={targetUserId} onValueChange={setTargetUserId}>
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
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreate} disabled={creating || !title || !dueDate}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Buat Tugas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}