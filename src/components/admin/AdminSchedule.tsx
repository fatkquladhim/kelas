'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Plus, Trash2, Calendar, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'

interface Kelas {
  id: string
  name: string
  semester: number
  tahunAjaran: string
}

interface MataKuliah {
  id: string
  code: string
  name: string
  sks: number
}

interface JadwalItem {
  id: string
  hari: string
  waktu: string
  mataKuliahId: string
  kelasId: string
  mataKuliah: MataKuliah
  kelas: Kelas
}

const HARI = ['AHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU']
const WAKTU = ['PAGI', 'SORE', 'MALAM']
const HARI_LABELS: Record<string, string> = {
  AHAD: 'Ahad', SENIN: 'Senin', SELASA: 'Selasa', RABU: 'Rabu', KAMIS: 'Kamis', JUMAT: 'Jumat', SABTU: 'Sabtu'
}
const WAKTU_LABELS: Record<string, string> = { PAGI: 'Pagi', SORE: 'Sore', MALAM: 'Malam' }
const WAKTU_COLORS: Record<string, string> = {
  PAGI: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  SORE: 'bg-amber-100 text-amber-800 border-amber-200',
  MALAM: 'bg-purple-100 text-purple-800 border-purple-200',
}

export function AdminSchedule() {
  const [classes, setClasses] = useState<Kelas[]>([])
  const [courses, setCourses] = useState<MataKuliah[]>([])
  const [selectedKelasId, setSelectedKelasId] = useState('')
  const [schedule, setSchedule] = useState<JadwalItem[]>([])
  const [loading, setLoading] = useState(true)

  // Add dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formHari, setFormHari] = useState('')
  const [formWaktu, setFormWaktu] = useState('')
  const [formMkId, setFormMkId] = useState('')
  const [saving, setSaving] = useState(false)

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

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/matakuliah')
      if (res.ok) {
        const data = await res.json()
        setCourses(data.matakuliah || [])
      }
    } catch {
      // silent
    }
  }, [])

  const fetchSchedule = useCallback(async () => {
    if (!selectedKelasId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/jadwal?kelasId=${selectedKelasId}`)
      if (res.ok) {
        const data = await res.json()
        setSchedule(data.jadwal || [])
      }
    } catch {
      toast.error('Gagal memuat jadwal')
    } finally {
      setLoading(false)
    }
  }, [selectedKelasId])

  useEffect(() => {
    fetchClasses()
    fetchCourses()
  }, [fetchClasses, fetchCourses])

  useEffect(() => {
    if (selectedKelasId) fetchSchedule()
  }, [selectedKelasId, fetchSchedule])

  const getScheduleCell = (hari: string, waktu: string) => {
    return schedule.find(s => s.hari === hari && s.waktu === waktu)
  }

  const handleAdd = async () => {
    if (!formHari || !formWaktu || !formMkId) {
      toast.error('Semua field wajib diisi')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/jadwal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mataKuliahId: formMkId, kelasId: selectedKelasId, hari: formHari, waktu: formWaktu }),
      })
      if (res.ok) {
        toast.success('Jadwal ditambahkan')
        setDialogOpen(false)
        setFormHari('')
        setFormWaktu('')
        setFormMkId('')
        fetchSchedule()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menambahkan')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: JadwalItem) => {
    if (!confirm('Hapus jadwal ini?')) return
    try {
      const res = await fetch(`/api/jadwal/${item.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Jadwal dihapus')
        fetchSchedule()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }

  return (
    <div className="space-y-4">
      {/* Selector & Actions */}
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
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
          if (!selectedKelasId) { toast.error('Pilih kelas terlebih dahulu'); return }
          setDialogOpen(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Jadwal
        </Button>
      </div>

      {/* Schedule Grid */}
      {loading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : !selectedKelasId ? (
        <EmptyState icon={Calendar} title="Pilih kelas" description="Pilih kelas untuk melihat jadwal" />
      ) : schedule.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Belum ada jadwal"
          description="Tambahkan jadwal perkuliahan untuk kelas ini"
          action={
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Jadwal
            </Button>
          }
        />
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[80px] sticky left-0 bg-slate-50 z-10">Hari</TableHead>
                    {WAKTU.map(w => (
                      <TableHead key={w} className="text-center">{WAKTU_LABELS[w]}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {HARI.map(hari => (
                    <TableRow key={hari}>
                      <TableCell className="font-medium sticky left-0 bg-white z-10">
                        {HARI_LABELS[hari]}
                      </TableCell>
                      {WAKTU.map(waktu => {
                        const cell = getScheduleCell(hari, waktu)
                        return (
                          <TableCell key={`${hari}-${waktu}`} className="text-center p-2">
                            {cell ? (
                              <div className={`rounded-lg border p-2 ${WAKTU_COLORS[cell.waktu]} relative group`}>
                                <p className="font-medium text-xs">{cell.mataKuliah.name}</p>
                                <p className="text-[10px] opacity-70">{cell.mataKuliah.code} • {cell.mataKuliah.sks} SKS</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-600"
                                  onClick={() => handleDelete(cell)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="text-slate-300 text-xs">-</div>
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Jadwal</DialogTitle>
            <DialogDescription>Pilih hari, waktu, dan mata kuliah</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Hari</label>
              <Select value={formHari} onValueChange={setFormHari}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih hari" />
                </SelectTrigger>
                <SelectContent>
                  {HARI.map(h => (
                    <SelectItem key={h} value={h}>{HARI_LABELS[h]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Waktu</label>
              <Select value={formWaktu} onValueChange={setFormWaktu}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih waktu" />
                </SelectTrigger>
                <SelectContent>
                  {WAKTU.map(w => (
                    <SelectItem key={w} value={w}>{WAKTU_LABELS[w]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Mata Kuliah</label>
              <Select value={formMkId} onValueChange={setFormMkId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih mata kuliah" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
