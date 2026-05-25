'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
import { Plus, Trash2, Edit, BookOpen, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAppStore } from '@/lib/store'

interface MataKuliah {
  id: string
  code: string
  name: string
  sks: number
  semester: number
  programStudi: string
  standarKompetensi: string
  deskripsi: string
  _count: { syllabus: number; schedules: number }
}

export function AdminMataKuliah() {
  const { setCurrentPage } = useAppStore()
  const [courses, setCourses] = useState<MataKuliah[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<MataKuliah | null>(null)
  const [formCode, setFormCode] = useState('')
  const [formName, setFormName] = useState('')
  const [formSks, setFormSks] = useState('2')
  const [formSemester, setFormSemester] = useState('')
  const [formProgramStudi, setFormProgramStudi] = useState('')
  const [formStandarKompetensi, setFormStandarKompetensi] = useState('')
  const [formDeskripsi, setFormDeskripsi] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/matakuliah')
      if (res.ok) {
        const data = await res.json()
        setCourses(data.matakuliah || [])
      }
    } catch {
      toast.error('Gagal memuat data mata kuliah')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const filteredCourses = courses.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditingCourse(null)
    setFormCode('')
    setFormName('')
    setFormSks('2')
    setFormSemester('')
    setFormProgramStudi('')
    setFormStandarKompetensi('')
    setFormDeskripsi('')
    setDialogOpen(true)
  }

  const openEdit = (course: MataKuliah) => {
    setEditingCourse(course)
    setFormCode(course.code)
    setFormName(course.name)
    setFormSks(String(course.sks))
    setFormSemester(String(course.semester))
    setFormProgramStudi(course.programStudi)
    setFormStandarKompetensi(course.standarKompetensi)
    setFormDeskripsi(course.deskripsi)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formCode || !formName || !formSemester) {
      toast.error('Kode, Nama, dan Semester wajib diisi')
      return
    }
    setSaving(true)
    try {
      const body = {
        code: formCode,
        name: formName,
        sks: Number(formSks),
        semester: Number(formSemester),
        programStudi: formProgramStudi,
        standarKompetensi: formStandarKompetensi,
        deskripsi: formDeskripsi,
      }
      const url = editingCourse ? `/api/matakuliah/${editingCourse.id}` : '/api/matakuliah'
      const method = editingCourse ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success(editingCourse ? 'Mata kuliah diperbarui' : 'Mata kuliah ditambahkan')
        setDialogOpen(false)
        fetchCourses()
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

  const handleDelete = async (course: MataKuliah) => {
    if (!confirm(`Hapus mata kuliah "${course.name}"?`)) return
    try {
      const res = await fetch(`/api/matakuliah/${course.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Mata kuliah dihapus')
        fetchCourses()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Cari kode atau nama mata kuliah..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Tambah</span> MK
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCourse ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah'}</DialogTitle>
              <DialogDescription>Isi informasi mata kuliah</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Kode</label>
                  <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="MK001" disabled={!!editingCourse} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">SKS</label>
                  <Input type="number" value={formSks} onChange={(e) => setFormSks(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Semester</label>
                  <Input type="number" value={formSemester} onChange={(e) => setFormSemester(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Nama Mata Kuliah</label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nama lengkap mata kuliah" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Program Studi</label>
                <Input value={formProgramStudi} onChange={(e) => setFormProgramStudi(e.target.value)} placeholder="Contoh: Ilmu Al-Qur'an" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Standar Kompetensi</label>
                <Input value={formStandarKompetensi} onChange={(e) => setFormStandarKompetensi(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Deskripsi</label>
                <Input value={formDeskripsi} onChange={(e) => setFormDeskripsi(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingCourse ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Course List */}
      {filteredCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Tidak ada mata kuliah"
          description={search ? 'Coba ubah pencarian' : 'Tambahkan mata kuliah pertama'}
        />
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="hidden sm:table-cell">SKS</TableHead>
                  <TableHead className="hidden md:table-cell">Semester</TableHead>
                  <TableHead className="hidden lg:table-cell">Silabus</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{course.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-800">{course.name}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{course.sks}</TableCell>
                    <TableCell className="hidden md:table-cell">{course.semester}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="secondary" className="text-xs">{course._count.syllabus} item</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(course)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(course)}>
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
    </div>
  )
}
