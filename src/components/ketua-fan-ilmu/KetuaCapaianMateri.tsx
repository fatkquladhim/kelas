'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import {
  ClipboardCheck,
  BookOpen,
  Calendar,
  Edit2,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'
import { useAppStore } from '@/lib/store'

// ─── Types ───────────────────────────────────────────────────────

interface MataKuliah {
  id: string
  code: string
  name: string
  semester: number
  sks: number
}

interface SilabusItem {
  id: string
  pertemuan: number
  materiPokok: string
  subMateri: string
  mataKuliahId: string
}

interface MaterialAchievement {
  id: string
  silabusId: string
  kelasId: string
  userId: string
  tanggal: string
  persentase: number
  deskripsi: string
  silabus: {
    id: string
    pertemuan: number
    materiPokok: string
    mataKuliah: { id: string; code: string; name: string }
  }
  user: {
    id: string
    name: string
    email: string
  }
}

interface AchievementFormData {
  tanggal: string
  persentase: number
  deskripsi: string
}

// ─── Helpers ─────────────────────────────────────────────────────

function getProgressColor(value: number): string {
  if (value >= 80) return 'text-emerald-600'
  if (value >= 50) return 'text-amber-600'
  return 'text-red-500'
}

function getProgressBg(value: number): string {
  if (value >= 80) return 'bg-emerald-500'
  if (value >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function getProgressBadgeVariant(value: number): 'default' | 'secondary' | 'destructive' {
  if (value >= 80) return 'default'
  if (value >= 50) return 'secondary'
  return 'destructive'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getTodayDateString(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// ─── Component ───────────────────────────────────────────────────

export function KetuaCapaianMateri() {
  const { selectedKelas } = useAppStore()

  // Data state
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([])
  const [selectedMkId, setSelectedMkId] = useState<string>('')
  const [silabusItems, setSilabusItems] = useState<SilabusItem[]>([])
  const [achievements, setAchievements] = useState<MaterialAchievement[]>([])

  // UI state
  const [loadingMk, setLoadingMk] = useState(true)
  const [loadingSilabus, setLoadingSilabus] = useState(false)
  const [loadingAchievements, setLoadingAchievements] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAchievement, setEditingAchievement] = useState<MaterialAchievement | null>(null)
  const [selectedSilabus, setSelectedSilabus] = useState<SilabusItem | null>(null)
  const [formData, setFormData] = useState<AchievementFormData>({
    tanggal: getTodayDateString(),
    persentase: 0,
    deskripsi: '',
  })

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingAchievement, setDeletingAchievement] = useState<MaterialAchievement | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ─── Fetch mata kuliah ────────────────────────────────────────

  const fetchMataKuliah = useCallback(async () => {
    try {
      setLoadingMk(true)
      const res = await fetch('/api/matakuliah')
      if (res.ok) {
        const data = await res.json()
        setMataKuliahList(data.matakuliah || [])
      }
    } catch {
      toast.error('Gagal memuat daftar mata kuliah')
    } finally {
      setLoadingMk(false)
    }
  }, [])

  useEffect(() => {
    fetchMataKuliah()
  }, [fetchMataKuliah])

  // ─── Fetch silabus & achievements when course selected ───────

  const fetchSilabusAndAchievements = useCallback(async (mkId: string) => {
    if (!mkId || !selectedKelas?.id) return
    try {
      setLoadingSilabus(true)
      setLoadingAchievements(true)

      const [silabusRes, achRes] = await Promise.all([
        fetch(`/api/silabus?mataKuliahId=${mkId}`),
        fetch(`/api/material-achievement?kelasId=${selectedKelas.id}`),
      ])

      const silabusData = silabusRes.ok ? await silabusRes.json() : { silabus: [] }
      const achData = achRes.ok ? await achRes.json() : { achievements: [] }

      setSilabusItems(silabusData.silabus || [])

      // Filter achievements to only the ones matching this mata kuliah's silabus
      const mkSilabusIds = new Set((silabusData.silabus || []).map((s: SilabusItem) => s.id))
      const filteredAch = (achData.achievements || []).filter(
        (a: MaterialAchievement) => mkSilabusIds.has(a.silabusId)
      )
      setAchievements(filteredAch)
    } catch {
      toast.error('Gagal memuat data silabus')
    } finally {
      setLoadingSilabus(false)
      setLoadingAchievements(false)
    }
  }, [selectedKelas?.id])

  useEffect(() => {
    if (selectedMkId) {
      fetchSilabusAndAchievements(selectedMkId)
    } else {
      setSilabusItems([])
      setAchievements([])
    }
  }, [selectedMkId, fetchSilabusAndAchievements])

  // ─── Achievement map by silabusId ─────────────────────────────

  const achievementMap = new Map<string, MaterialAchievement>()
  achievements.forEach(a => {
    achievementMap.set(a.silabusId, a)
  })

  // ─── Overall stats ───────────────────────────────────────────

  const filledCount = achievements.length
  const totalCount = silabusItems.length
  const overallPercentage =
    totalCount > 0
      ? Math.round(achievements.reduce((sum, a) => sum + a.persentase, 0) / totalCount)
      : 0

  // ─── Dialog handlers ─────────────────────────────────────────

  const openCreateDialog = (silabus: SilabusItem) => {
    setSelectedSilabus(silabus)
    setEditingAchievement(null)
    setFormData({
      tanggal: getTodayDateString(),
      persentase: 0,
      deskripsi: '',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (achievement: MaterialAchievement) => {
    setEditingAchievement(achievement)
    setSelectedSilabus({
      id: achievement.silabusId,
      pertemuan: achievement.silabus.pertemuan,
      materiPokok: achievement.silabus.materiPokok,
      subMateri: '',
      mataKuliahId: achievement.silabus.mataKuliah.id,
    })
    setFormData({
      tanggal: achievement.tanggal.split('T')[0],
      persentase: achievement.persentase,
      deskripsi: achievement.deskripsi || '',
    })
    setDialogOpen(true)
  }

  const openDeleteDialog = (achievement: MaterialAchievement) => {
    setDeletingAchievement(achievement)
    setDeleteDialogOpen(true)
  }

  // ─── Submit handler ──────────────────────────────────────────

  const handleSubmit = async () => {
    if (!selectedSilabus || !selectedKelas?.id) return

    if (!formData.tanggal) {
      toast.error('Tanggal wajib diisi')
      return
    }

    try {
      setSubmitting(true)

      if (editingAchievement) {
        // Update
        const res = await fetch(`/api/material-achievement/${editingAchievement.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Gagal memperbarui capaian')
        }
        toast.success('Capaian materi berhasil diperbarui')
      } else {
        // Create
        const res = await fetch('/api/material-achievement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            silabusId: selectedSilabus.id,
            kelasId: selectedKelas.id,
            tanggal: formData.tanggal,
            persentase: formData.persentase,
            deskripsi: formData.deskripsi,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Gagal menyimpan capaian')
        }
        toast.success('Capaian materi berhasil disimpan')
      }

      setDialogOpen(false)
      // Refresh achievements
      await fetchSilabusAndAchievements(selectedMkId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Delete handler ──────────────────────────────────────────

  const handleDelete = async () => {
    if (!deletingAchievement) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/material-achievement/${deletingAchievement.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menghapus capaian')
      }
      toast.success('Capaian materi berhasil dihapus')
      setDeleteDialogOpen(false)
      setDeletingAchievement(null)
      await fetchSilabusAndAchievements(selectedMkId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setDeleting(false)
    }
  }

  // ─── Loading skeleton ────────────────────────────────────────

  if (loadingMk) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
        </div>
        <Skeleton className="h-11 w-full sm:w-80 rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
            <ClipboardCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Pengisian Capaian Materi</h2>
            <p className="text-sm text-slate-500">
              Isi dan kelola capaian materi untuk setiap pertemuan
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Course Selector */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Label className="text-sm font-medium text-slate-700 shrink-0">Mata Kuliah</Label>
        <Select value={selectedMkId} onValueChange={setSelectedMkId}>
          <SelectTrigger className="w-full sm:w-[320px]">
            <SelectValue placeholder="Pilih mata kuliah..." />
          </SelectTrigger>
          <SelectContent>
            {mataKuliahList.map(mk => (
              <SelectItem key={mk.id} value={mk.id}>
                <span className="font-mono text-xs mr-2">{mk.code}</span>
                {mk.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* No course selected */}
      {!selectedMkId && (
        <EmptyState
          icon={BookOpen}
          title="Pilih Mata Kuliah"
          description="Pilih mata kuliah untuk mulai mengisi capaian materi"
        />
      )}

      {/* Loading silabus */}
      {selectedMkId && loadingSilabus && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      )}

      {/* Course selected but no silabus items */}
      {selectedMkId && !loadingSilabus && silabusItems.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="Belum Ada Silabus"
          description="Mata kuliah ini belum memiliki silabus pertemuan"
        />
      )}

      {/* Silabus items list */}
      {selectedMkId && !loadingSilabus && silabusItems.length > 0 && (
        <>
          {/* Summary card */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">
                    {mataKuliahList.find(mk => mk.id === selectedMkId)?.name || 'Mata Kuliah'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {filledCount} dari {totalCount} pertemuan sudah diisi
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 sm:w-48">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">Rata-rata Capaian</span>
                      <span className={`text-sm font-bold ${getProgressColor(overallPercentage)}`}>
                        {overallPercentage}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressBg(overallPercentage)}`}
                        style={{ width: `${overallPercentage}%` }}
                      />
                    </div>
                  </div>
                  {filledCount === totalCount && totalCount > 0 && (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Lengkap
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Silabus items */}
          <div className="space-y-3">
            {silabusItems.map(item => {
              const achievement = achievementMap.get(item.id)
              const hasAchievement = !!achievement

              return (
                <Card
                  key={item.id}
                  className={`border-0 shadow-sm transition-all hover:shadow-md ${
                    hasAchievement ? '' : 'border-l-4 border-l-amber-300'
                  }`}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      {/* Pertemuan badge */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-bold text-sm">
                          {item.pertemuan}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px] font-mono">
                              Pertemuan {item.pertemuan}
                            </Badge>
                            {hasAchievement ? (
                              <Badge
                                className={`text-[10px] ${
                                  achievement!.persentase >= 80
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                    : achievement!.persentase >= 50
                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                                    : 'bg-red-100 text-red-700 hover:bg-red-100'
                                }`}
                              >
                                {achievement!.persentase}%
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500 hover:bg-slate-100">
                                Belum diisi
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-slate-800 mt-1.5 leading-snug">
                            {item.materiPokok}
                          </h4>
                          {item.subMateri && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                              {item.subMateri}
                            </p>
                          )}

                          {/* Achievement details */}
                          {hasAchievement && (
                            <div className="mt-3 space-y-2">
                              {/* Progress bar */}
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${getProgressBg(achievement!.persentase)}`}
                                    style={{ width: `${achievement!.persentase}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-bold shrink-0 ${getProgressColor(achievement!.persentase)}`}>
                                  {achievement!.persentase}%
                                </span>
                              </div>

                              {/* Date and description */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(achievement!.tanggal)}
                                </span>
                                {achievement!.deskripsi && (
                                  <span className="line-clamp-1">&mdash; {achievement!.deskripsi}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0 sm:ml-3">
                        {hasAchievement ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                              onClick={() => openEditDialog(achievement!)}
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => openDeleteDialog(achievement!)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => openCreateDialog(item)}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Isi Capaian
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* ─── Create / Edit Dialog ────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {editingAchievement ? 'Edit Capaian Materi' : 'Isi Capaian Materi'}
            </DialogTitle>
            <DialogDescription>
              {editingAchievement
                ? 'Perbarui capaian materi untuk pertemuan ini'
                : 'Isi capaian materi untuk pertemuan ini'}
            </DialogDescription>
          </DialogHeader>

          {selectedSilabus && (
            <div className="space-y-5 py-2">
              {/* Silabus info (read-only) */}
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Pertemuan {selectedSilabus.pertemuan}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {selectedSilabus.materiPokok}
                </p>
              </div>

              {/* Tanggal */}
              <div className="space-y-2">
                <Label htmlFor="tanggal" className="text-sm font-medium">
                  Tanggal <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tanggal"
                  type="date"
                  value={formData.tanggal}
                  onChange={e => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                  className="max-w-[200px]"
                />
              </div>

              {/* Persentase slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Persentase Capaian</Label>
                  <span className={`text-lg font-bold ${getProgressColor(formData.persentase)}`}>
                    {formData.persentase}%
                  </span>
                </div>
                <Slider
                  value={[formData.persentase]}
                  onValueChange={val => setFormData(prev => ({ ...prev, persentase: val[0] }))}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-2">
                <Label htmlFor="deskripsi" className="text-sm font-medium">
                  Deskripsi / Catatan
                </Label>
                <Textarea
                  id="deskripsi"
                  placeholder="Tuliskan catatan tentang capaian materi ini..."
                  value={formData.deskripsi}
                  onChange={e => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSubmit}
              disabled={submitting || !formData.tanggal}
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Menyimpan...
                </>
              ) : editingAchievement ? (
                'Simpan Perubahan'
              ) : (
                'Simpan Capaian'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ──────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Hapus Capaian Materi
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus capaian materi untuk pertemuan{' '}
              <strong>{deletingAchievement?.silabus?.pertemuan}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Hapus
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
