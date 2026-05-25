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
import { Plus, Trash2, Edit, Loader2, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'

interface MataKuliah {
  id: string
  code: string
  name: string
}

interface Silabus {
  id: string
  mataKuliahId: string
  pertemuan: number
  materiPokok: string
  subMateri: string
  referensi: string
  mataKuliah?: MataKuliah
}

export function AdminSyllabus() {
  const [courses, setCourses] = useState<MataKuliah[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [syllabus, setSyllabus] = useState<Silabus[]>([])
  const [loading, setLoading] = useState(true)

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Silabus | null>(null)
  const [formPertemuan, setFormPertemuan] = useState('')
  const [formMateri, setFormMateri] = useState('')
  const [formSubMateri, setFormSubMateri] = useState('')
  const [formReferensi, setFormReferensi] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/matakuliah')
      if (res.ok) {
        const data = await res.json()
        const list = data.matakuliah || []
        setCourses(list)
        if (list.length > 0 && !selectedCourseId) {
          setSelectedCourseId(list[0].id)
        }
      }
    } catch {
      // silent
    }
  }, [selectedCourseId])

  const fetchSyllabus = useCallback(async () => {
    if (!selectedCourseId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/silabus?mataKuliahId=${selectedCourseId}`)
      if (res.ok) {
        const data = await res.json()
        setSyllabus(data.silabus || [])
      }
    } catch {
      toast.error('Gagal memuat silabus')
    } finally {
      setLoading(false)
    }
  }, [selectedCourseId])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  useEffect(() => {
    if (selectedCourseId) fetchSyllabus()
  }, [selectedCourseId, fetchSyllabus])

  const openCreate = () => {
    if (!selectedCourseId) {
      toast.error('Pilih mata kuliah terlebih dahulu')
      return
    }
    setEditingItem(null)
    setFormPertemuan(String(syllabus.length + 1))
    setFormMateri('')
    setFormSubMateri('')
    setFormReferensi('')
    setDialogOpen(true)
  }

  const openEdit = (item: Silabus) => {
    setEditingItem(item)
    setFormPertemuan(String(item.pertemuan))
    setFormMateri(item.materiPokok)
    setFormSubMateri(item.subMateri)
    setFormReferensi(item.referensi)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formPertemuan || !formMateri) {
      toast.error('Pertemuan dan Materi Pokok wajib diisi')
      return
    }
    setSaving(true)
    try {
      const body = {
        mataKuliahId: selectedCourseId,
        pertemuan: Number(formPertemuan),
        materiPokok: formMateri,
        subMateri: formSubMateri,
        referensi: formReferensi,
      }
      const url = editingItem ? `/api/silabus/${editingItem.id}` : '/api/silabus'
      const method = editingItem ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success(editingItem ? 'Silabus diperbarui' : 'Silabus ditambahkan')
        setDialogOpen(false)
        fetchSyllabus()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menyimpan')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: Silabus) => {
    if (!confirm(`Hapus silabus pertemuan ke-${item.pertemuan}?`)) return
    try {
      const res = await fetch(`/api/silabus/${item.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Silabus dihapus')
        fetchSyllabus()
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
      {/* Course Selector & Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Pilih Mata Kuliah" />
          </SelectTrigger>
          <SelectContent>
            {courses.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Pertemuan
        </Button>
      </div>

      {/* Syllabus Table */}
      {loading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : !selectedCourseId ? (
        <EmptyState icon={ClipboardList} title="Pilih mata kuliah" description="Pilih mata kuliah untuk melihat silabus" />
      ) : syllabus.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Belum ada silabus"
          description="Tambahkan pertemuan pertama untuk mata kuliah ini"
          action={
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah
            </Button>
          }
        />
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">
              Silabus: {courses.find(c => c.id === selectedCourseId)?.name} ({syllabus.length} pertemuan)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-[80px]">Pertemuan</TableHead>
                  <TableHead>Materi Pokok</TableHead>
                  <TableHead className="hidden md:table-cell">Sub Materi</TableHead>
                  <TableHead className="hidden lg:table-cell">Referensi</TableHead>
                  <TableHead className="text-right w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syllabus.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{item.pertemuan}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{item.materiPokok}</p>
                      <p className="text-xs text-slate-500 md:hidden mt-1">{item.subMateri}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-slate-600">{item.subMateri}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-slate-600">{item.referensi}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(item)}>
                          <Trash2 className="h-3 w-3" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Silabus' : 'Tambah Silabus'}</DialogTitle>
            <DialogDescription>Pertemuan ke-{editingItem ? editingItem.pertemuan : formPertemuan}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nomor Pertemuan</label>
              <Input type="number" value={formPertemuan} onChange={(e) => setFormPertemuan(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Materi Pokok</label>
              <Input value={formMateri} onChange={(e) => setFormMateri(e.target.value)} placeholder="Topik utama pertemuan" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Sub Materi</label>
              <Input value={formSubMateri} onChange={(e) => setFormSubMateri(e.target.value)} placeholder="Detail sub materi" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Referensi</label>
              <Input value={formReferensi} onChange={(e) => setFormReferensi(e.target.value)} placeholder="Buku atau sumber referensi" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingItem ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
