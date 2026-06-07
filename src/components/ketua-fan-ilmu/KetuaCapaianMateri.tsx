'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
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
  Eye,
  GraduationCap,
  ArrowUpDown,
  Filter,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
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

interface CourseOverviewStats {
  mkId: string
  filled: number
  total: number
  avgPercentage: number
}

type FilterType = 'all' | 'filled' | 'empty'
type SortType = 'pertemuan' | 'persentase-high' | 'persentase-low'

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

// ─── Islamic Empty State SVG ─────────────────────────────────────

function IslamicEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Animated geometric pattern */}
      <div className="relative mb-6">
        <div className="h-32 w-32 relative">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-200 animate-[spin_20s_linear_infinite]" />
          {/* Middle pulsing circle */}
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 animate-[pulse_3s_ease-in-out_infinite]" />
          {/* Inner icon container */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          {/* Decorative dots */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-emerald-400 animate-[pulse_2s_ease-in-out_infinite]" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-teal-400 animate-[pulse_2s_ease-in-out_infinite_0.5s]" />
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 h-2 w-2 rounded-full bg-emerald-300 animate-[pulse_2s_ease-in-out_infinite_1s]" />
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 h-2 w-2 rounded-full bg-teal-300 animate-[pulse_2s_ease-in-out_infinite_1.5s]" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-slate-700 mb-1.5">Pilih Mata Kuliah</h3>
      <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
        Pilih mata kuliah dari daftar di atas atau gunakan dropdown untuk mulai mengisi capaian materi
      </p>
      <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600">
        <Sparkles className="h-3.5 w-3.5" />
        <span className="font-medium">Atau klik salah satu karto ringkasan di atas</span>
      </div>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────

export function KetuaCapaianMateri() {
  const { selectedKelas } = useAppStore()

  // Data state
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([])
  const [allSilabusItems, setAllSilabusItems] = useState<SilabusItem[]>([])
  const [allAchievements, setAllAchievements] = useState<MaterialAchievement[]>([])
  const [selectedMkId, setSelectedMkId] = useState<string>('')
  const [silabusItems, setSilabusItems] = useState<SilabusItem[]>([])
  const [achievements, setAchievements] = useState<MaterialAchievement[]>([])

  // UI state
  const [loadingMk, setLoadingMk] = useState(true)
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [loadingSilabus, setLoadingSilabus] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Filter & sort
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortType, setSortType] = useState<SortType>('pertemuan')

  // Student preview
  const [studentPreview, setStudentPreview] = useState(false)

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

  // Auto-fill state
  const [autoFillSilabusId, setAutoFillSilabusId] = useState<string>('')
  const [autoFillPct, setAutoFillPct] = useState<number>(100)
  const [classSchedules, setClassSchedules] = useState<any[]>([])

  // Fetch schedules for schedule-based progress calculations
  const fetchSchedules = useCallback(async () => {
    if (!selectedKelas?.id) return
    try {
      const res = await fetch(`/api/jadwal?kelasId=${selectedKelas.id}`)
      if (res.ok) {
        const data = await res.json()
        setClassSchedules(data.jadwal || [])
      }
    } catch {
      // silent
    }
  }, [selectedKelas?.id])

  useEffect(() => {
    if (selectedKelas?.id) {
      fetchSchedules()
    }
  }, [selectedKelas?.id, fetchSchedules])

  // Map Indonesian day names to standard indices
  const DAY_MAP = useMemo(() => ({
    AHAD: 0,
    SENIN: 1,
    SELASA: 2,
    RABU: 3,
    KAMIS: 4,
    JUMAT: 5,
    SABTU: 6,
  }), [])

  // Calculate expected meetings count since Jan 3, 2026 based on weekly schedule
  const expectedMeetings = useMemo(() => {
    if (!selectedMkId || classSchedules.length === 0) return 0
    
    // Filter schedules for this course
    const mkSchedules = classSchedules.filter(s => s.mataKuliahId === selectedMkId)
    if (mkSchedules.length === 0) return 0
    
    const dayIndices = mkSchedules.map(s => DAY_MAP[s.hari.toUpperCase() as keyof typeof DAY_MAP]).filter(d => d !== undefined)
    if (dayIndices.length === 0) return 0
    
    const startDate = new Date('2026-01-03')
    const endDate = new Date() // Today
    
    let count = 0
    let tempDate = new Date(startDate)
    while (tempDate <= endDate) {
      if (dayIndices.includes(tempDate.getDay())) {
        count++
      }
      tempDate.setDate(tempDate.getDate() + 1)
    }
    return count
  }, [selectedMkId, classSchedules, DAY_MAP])

  // Submit auto fill capaian
  const handleAutoFillSubmit = async () => {
    if (!autoFillSilabusId || !selectedKelas?.id) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/material-achievement/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          silabusId: autoFillSilabusId,
          kelasId: selectedKelas.id,
          customPercentage: autoFillPct,
        }),
      })

      if (res.ok) {
        toast.success('Capaian materi berhasil diisi secara otomatis!')
        setAutoFillSilabusId('')
        setAutoFillPct(100)
        await fetchSilabusAndAchievements(selectedMkId)
        await fetchOverviewData()
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Gagal mengisi capaian secara otomatis')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

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

  // ─── Fetch overview data (all silabus + all achievements) ────

  const fetchOverviewData = useCallback(async () => {
    if (!selectedKelas?.id) return
    try {
      setLoadingOverview(true)

      const [silabusRes, achRes] = await Promise.all([
        fetch('/api/silabus'),
        fetch(`/api/material-achievement?kelasId=${selectedKelas.id}`),
      ])

      const silabusData = silabusRes.ok ? await silabusRes.json() : { silabus: [] }
      const achData = achRes.ok ? await achRes.json() : { achievements: [] }

      setAllSilabusItems(silabusData.silabus || [])
      setAllAchievements(achData.achievements || [])
    } catch {
      toast.error('Gagal memuat ringkasan mata kuliah')
    } finally {
      setLoadingOverview(false)
    }
  }, [selectedKelas?.id])

  useEffect(() => {
    fetchMataKuliah()
  }, [fetchMataKuliah])

  useEffect(() => {
    if (selectedKelas?.id) {
      fetchOverviewData()
    }
  }, [selectedKelas?.id, fetchOverviewData])

  // ─── Fetch per-course silabus & achievements ──────────────────

  const fetchSilabusAndAchievements = useCallback(async (mkId: string) => {
    if (!mkId || !selectedKelas?.id) return
    try {
      setLoadingSilabus(true)

      const [silabusRes, achRes] = await Promise.all([
        fetch(`/api/silabus?mataKuliahId=${mkId}`),
        fetch(`/api/material-achievement?kelasId=${selectedKelas.id}`),
      ])

      const silabusData = silabusRes.ok ? await silabusRes.json() : { silabus: [] }
      const achData = achRes.ok ? await achRes.json() : { achievements: [] }

      const newSilabusItems = silabusData.silabus || []
      setSilabusItems(newSilabusItems)

      const mkSilabusIds = new Set(newSilabusItems.map((s: SilabusItem) => s.id))
      const filteredAch = (achData.achievements || []).filter(
        (a: MaterialAchievement) => mkSilabusIds.has(a.silabusId)
      )
      setAchievements(filteredAch)

      // Also update allAchievements & allSilabusItems if needed
      setAllSilabusItems(prev => {
        const otherItems = prev.filter((s: SilabusItem) => s.mataKuliahId !== mkId)
        return [...otherItems, ...newSilabusItems]
      })
      setAllAchievements(prev => {
        const otherAch = prev.filter((a: MaterialAchievement) => !mkSilabusIds.has(a.silabusId))
        return [...otherAch, ...filteredAch]
      })
    } catch {
      toast.error('Gagal memuat data silabus')
    } finally {
      setLoadingSilabus(false)
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

  // ─── Course overview stats ────────────────────────────────────

  const courseStats = useMemo<CourseOverviewStats[]>(() => {
    const achievementMap = new Map<string, MaterialAchievement>()
    allAchievements.forEach(a => {
      achievementMap.set(a.silabusId, a)
    })

    return mataKuliahList.map(mk => {
      const mkSilabus = allSilabusItems.filter(s => s.mataKuliahId === mk.id)
      const total = mkSilabus.length
      const filled = mkSilabus.filter(s => achievementMap.has(s.id)).length
      const avgPercentage =
        total > 0
          ? Math.round(
              mkSilabus.reduce((sum, s) => {
                const ach = achievementMap.get(s.id)
                return sum + (ach ? ach.persentase : 0)
              }, 0) / total
            )
          : 0

      return { mkId: mk.id, filled, total, avgPercentage }
    })
  }, [mataKuliahList, allSilabusItems, allAchievements])

  // ─── Achievement map by silabusId ─────────────────────────────

  const achievementMap = useMemo(() => {
    const map = new Map<string, MaterialAchievement>()
    achievements.forEach(a => {
      map.set(a.silabusId, a)
    })
    return map
  }, [achievements])

  // ─── Overall stats for selected course ───────────────────────

  const filledCount = achievements.length
  const totalCount = silabusItems.length
  const overallPercentage =
    totalCount > 0
      ? Math.round(achievements.reduce((sum, a) => sum + a.persentase, 0) / totalCount)
      : 0

  // ─── Filtered & sorted silabus items ──────────────────────────

  const filteredSortedItems = useMemo(() => {
    let items = [...silabusItems]

    // Filter
    if (filterType === 'filled') {
      items = items.filter(item => achievementMap.has(item.id))
    } else if (filterType === 'empty') {
      items = items.filter(item => !achievementMap.has(item.id))
    }

    // Sort
    if (sortType === 'pertemuan') {
      items.sort((a, b) => a.pertemuan - b.pertemuan)
    } else if (sortType === 'persentase-high') {
      items.sort((a, b) => {
        const aPct = achievementMap.get(a.id)?.persentase ?? -1
        const bPct = achievementMap.get(b.id)?.persentase ?? -1
        return bPct - aPct
      })
    } else if (sortType === 'persentase-low') {
      items.sort((a, b) => {
        const aPct = achievementMap.get(a.id)?.persentase ?? 101
        const bPct = achievementMap.get(b.id)?.persentase ?? 101
        return aPct - bPct
      })
    }

    return items
  }, [silabusItems, filterType, sortType, achievementMap])

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
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
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-800">Pengisian Capaian Materi</h2>
            <p className="text-sm text-slate-500">
              Isi dan kelola capaian materi untuk setiap pertemuan
            </p>
          </div>
          {/* Student preview toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <Label
              htmlFor="student-preview"
              className="text-xs font-medium text-slate-500 cursor-pointer hidden sm:flex items-center gap-1.5"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Mahasantri
            </Label>
            <Switch
              id="student-preview"
              checked={studentPreview}
              onCheckedChange={setStudentPreview}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* ─── Ringkasan Per Mata Kuliah (Course Overview) ──────── */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-600" />
          Ringkasan Per Mata Kuliah
        </h3>

        {loadingOverview ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : mataKuliahList.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center text-sm text-slate-500">
              Belum ada mata kuliah tersedia
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mataKuliahList.map(mk => {
              const stats = courseStats.find(s => s.mkId === mk.id)
              const filled = stats?.filled ?? 0
              const total = stats?.total ?? 0
              const avgPct = stats?.avgPercentage ?? 0
              const isSelected = selectedMkId === mk.id

              return (
                <Card
                  key={mk.id}
                  className={`border-0 shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
                    isSelected
                      ? 'ring-2 ring-emerald-500 ring-offset-2 bg-emerald-50/50'
                      : 'hover:bg-slate-50'
                  }`}
                  onClick={() => setSelectedMkId(mk.id)}
                >
                  <CardContent className="p-4">
                    {/* Course code + name */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded inline-block mb-1">
                          {mk.code}
                        </p>
                        <h4 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                          {mk.name}
                        </h4>
                      </div>
                      {/* Completion badge */}
                      {filled === total && total > 0 && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      )}
                    </div>

                    {/* Meeting count */}
                    <p className="text-xs text-slate-500 mb-2">
                      <span className="font-semibold text-slate-700">{filled}</span> / {total} pertemuan
                    </p>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${getProgressBg(avgPct)}`}
                          style={{ width: `${avgPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Rata-rata</span>
                        <span className={`text-xs font-bold ${getProgressColor(avgPct)}`}>
                          {avgPct}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Course Selector + Student Preview Label (mobile) */}
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
        {/* Mobile student preview label */}
        <div className="flex items-center gap-2 sm:hidden">
          <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
          <Label
            htmlFor="student-preview-mobile"
            className="text-xs font-medium text-slate-500 cursor-pointer"
          >
            Tampilan Mahasantri
          </Label>
          <Switch
            id="student-preview-mobile"
            checked={studentPreview}
            onCheckedChange={setStudentPreview}
            className="data-[state=checked]:bg-emerald-600"
          />
        </div>
      </div>

      {/* Student Preview Banner */}
      {studentPreview && selectedMkId && (
        <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
          <Eye className="h-4 w-4 text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-800">
              Mode Tampilan Mahasantri
            </p>
            <p className="text-xs text-emerald-600">
              Anda sedang melihat data capaian materi dari sudut pandang mahasantri (read-only)
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-100"
            onClick={() => setStudentPreview(false)}
          >
            Keluar
          </Button>
        </div>
      )}

      {/* No course selected - Islamic themed empty state */}
      {!selectedMkId && <IslamicEmptyState />}

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
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="rounded-full bg-slate-100 p-4 mb-4">
            <BookOpen className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Belum Ada Silabus</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Mata kuliah ini belum memiliki silabus pertemuan
          </p>
        </div>
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

          {/* Auto-Fill / Auto-Capaian Card */}
          {!studentPreview && (
            <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white overflow-hidden relative">
              {/* Geometric pattern decoration */}
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4">
                <BookOpen className="h-48 w-48" />
              </div>
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-400 animate-pulse" />
                  <h3 className="text-sm font-bold tracking-wide text-emerald-300">PENGISIAN CEPAT / AUTO-CAPAIAN</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  Berdasarkan tanggal mulai Semester Genap (**3 Januari 2026**) dan jadwal mingguan Anda, seharusnya sudah terlaksana 
                  <span className="mx-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">{expectedMeetings} pertemuan</span>. 
                  Cukup pilih materi/pertemuan akhir yang telah selesai dibahas untuk mengisi semua progres di bawahnya secara otomatis.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end pt-2">
                  {/* Select Dropdown */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-300">Akhir Pembahasan (Materi Selesai)</Label>
                    <Select value={autoFillSilabusId} onValueChange={setAutoFillSilabusId}>
                      <SelectTrigger className="bg-slate-800/80 border-slate-700 text-white text-xs h-9">
                        <SelectValue placeholder="Pilih materi terakhir..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-850 text-white max-h-[300px]">
                        {silabusItems.map(s => (
                          <SelectItem key={s.id} value={s.id} className="focus:bg-emerald-800 focus:text-white text-xs">
                            Pertemuan {s.pertemuan}: {s.materiPokok.substring(0, 50)}...
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Percentage Slider / Input */}
                  {autoFillSilabusId && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <div className="flex justify-between">
                        <Label className="text-xs font-semibold text-slate-300">Ketercapaian Pertemuan Terakhir</Label>
                        <span className="text-xs text-emerald-400 font-bold">{autoFillPct}%</span>
                      </div>
                      <div className="flex items-center gap-3 py-1">
                        <Slider
                          value={[autoFillPct]}
                          onValueChange={v => setAutoFillPct(v[0])}
                          max={100}
                          step={10}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div>
                    <Button
                      onClick={handleAutoFillSubmit}
                      disabled={!autoFillSilabusId || submitting}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium text-xs h-9 shadow-lg shadow-emerald-950/40"
                    >
                      {submitting ? 'Memproses...' : 'Terapkan Progres'}
                    </Button>
                  </div>
                </div>

                {/* Compare target indicators */}
                {autoFillSilabusId && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>
                        Progres Silabus: <strong className="text-white">{Math.round((silabusItems.find(s => s.id === autoFillSilabusId)?.pertemuan || 0) / silabusItems.length * 100)}%</strong>
                      </span>
                    </div>
                    {expectedMeetings > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-emerald-400" />
                        <span>
                          Target Jadwal: <strong className="text-white">{Math.round((silabusItems.find(s => s.id === autoFillSilabusId)?.pertemuan || 0) / expectedMeetings * 100)}%</strong>
                          {Math.round((silabusItems.find(s => s.id === autoFillSilabusId)?.pertemuan || 0) / expectedMeetings * 100) < 100 ? (
                            <span className="text-amber-400 ml-1.5 font-medium">(Terlambat dari Target)</span>
                          ) : (
                            <span className="text-emerald-400 ml-1.5 font-medium">(Sesuai Target)</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── Filter & Sort Controls ──────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden">
                {([
                  { key: 'all' as FilterType, label: 'Semua' },
                  { key: 'filled' as FilterType, label: 'Sudah Diisi' },
                  { key: 'empty' as FilterType, label: 'Belum Diisi' },
                ]).map(btn => (
                  <button
                    key={btn.key}
                    onClick={() => setFilterType(btn.key)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      filterType === btn.key
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort select */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <Select value={sortType} onValueChange={(v) => setSortType(v as SortType)}>
                <SelectTrigger className="w-full sm:w-[200px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pertemuan">Urutan Pertemuan</SelectItem>
                  <SelectItem value="persentase-high">Persentase Tertinggi</SelectItem>
                  <SelectItem value="persentase-low">Persentase Terendah</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtered empty state */}
          {filteredSortedItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="rounded-full bg-slate-100 p-3 mb-3">
                <Filter className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">
                {filterType === 'filled'
                  ? 'Belum Ada yang Diisi'
                  : filterType === 'empty'
                  ? 'Semua Sudah Diisi'
                  : 'Tidak Ada Data'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs">
                {filterType === 'filled'
                  ? 'Belum ada pertemuan yang memiliki capaian materi'
                  : filterType === 'empty'
                  ? 'Semua pertemuan sudah memiliki capaian materi. MasyaAllah!'
                  : 'Tidak ada item yang sesuai dengan filter saat ini'}
              </p>
            </div>
          )}

          {/* Silabus items */}
          {filteredSortedItems.length > 0 && (
            <div className="space-y-3">
              {filteredSortedItems.map(item => {
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

                        {/* Action buttons - hidden in student preview */}
                        {!studentPreview && (
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
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ─── Create / Edit Dialog (hidden in student preview) ── */}
      {!studentPreview && (
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
      )}

      {/* ─── Delete Confirmation Dialog (hidden in student preview) ── */}
      {!studentPreview && (
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
      )}
    </div>
  )
}
