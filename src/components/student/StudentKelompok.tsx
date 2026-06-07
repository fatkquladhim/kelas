'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
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
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Users, 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Loader2, 
  ShieldCheck, 
  ClipboardList, 
  Sparkles, 
  MessageSquare,
  Award,
  BookOpen,
  TrendingUp,
  FileCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { EmptyState } from '@/components/shared/EmptyState'

interface UserInfo {
  id: string
  name: string
  email: string
  kelompokMemberId?: string
}

interface TargetHafalan {
  id: string
  materi: string
  tanggalTarget: string
}

interface HafalanLog {
  id: string
  targetId?: string
  materi: string
  status: string // "LANCAR", "KURANG_LANCAR", "BELUM_SETOR"
  catatan: string
  tanggalSetor: string
  target?: TargetHafalan
  verifier: { id: string; name: string }
}

interface TugasInfo {
  id: string
  title: string
  description: string
  dueDate: string
  mataKuliah: { code: string; name: string }
}

interface TugasDistribution {
  id: string
  tugasId: string
  taskDetail: string
  status: string // "BELUM", "SELESAI"
  catatan: string
  tugas: TugasInfo
}

interface GroupData {
  inGroup: boolean
  kelompokId?: string
  name?: string
  leader?: UserInfo
  members?: UserInfo[]
  targets?: TargetHafalan[]
  myLogs?: HafalanLog[]
  myTasks?: TugasDistribution[]
}

export function StudentKelompok() {
  const { user, selectedKelas } = useAppStore()
  const [data, setData] = useState<GroupData | null>(null)
  const [loading, setLoading] = useState(true)

  // Active Tab
  const [activeTab, setActiveTab] = useState<'info' | 'hafalan' | 'tugas'>('info')

  // Leader Action: Abesnsi Hafalan State
  const [kelompokLogs, setKelompokLogs] = useState<HafalanLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [currentMateri, setCurrentMateri] = useState<string>('')
  
  // Log Dialog State
  const [logDialogOpen, setLogDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<UserInfo | null>(null)
  const [logStatus, setLogStatus] = useState<string>('LANCAR')
  const [logCatatan, setLogCatatan] = useState<string>('')
  const [savingLog, setSavingLog] = useState(false)

  // Leader Action: Tugas State
  const [classTugasList, setClassTugasList] = useState<TugasInfo[]>([])
  const [selectedTugasId, setSelectedTugasId] = useState<string>('')
  const [loadingTugas, setLoadingTugas] = useState(false)
  const [distributingTugas, setDistributingTugas] = useState<any[]>([])

  // Task Assign Dialog State
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedAssignee, setSelectedAssignee] = useState<UserInfo | null>(null)
  const [taskDetail, setTaskDetail] = useState('')
  const [savingAssignment, setSavingAssignment] = useState(false)

  // Student Action: Update my task status
  const [taskUpdateOpen, setTaskUpdateOpen] = useState(false)
  const [selectedMyTask, setSelectedMyTask] = useState<TugasDistribution | null>(null)
  const [myTaskStatus, setMyTaskStatus] = useState<string>('BELUM')
  const [myTaskCatatan, setMyTaskCatatan] = useState<string>('')
  const [updatingMyTask, setUpdatingMyTask] = useState(false)

  const isLeader = data?.leader?.id === user?.id

  // Fetch student group data
  const fetchGroupData = useCallback(async () => {
    if (!selectedKelas?.id) return
    try {
      setLoading(true)
      const res = await fetch(`/api/mahasantri/kelompok?kelasId=${selectedKelas.id}`)
      if (res.ok) {
        const groupData = await res.json()
        setData(groupData)
      }
    } catch {
      toast.error('Gagal memuat data kelompok')
    } finally {
      setLoading(false)
    }
  }, [selectedKelas?.id])

  useEffect(() => {
    fetchGroupData()
  }, [fetchGroupData])

  // Fetch logs for the kelompok (Leader & Member riwayat)
  const fetchKelompokLogs = useCallback(async () => {
    if (!data?.kelompokId) return
    try {
      setLoadingLogs(true)
      const res = await fetch(`/api/kelompok/hafalan-log?kelompokId=${data.kelompokId}`)
      if (res.ok) {
        const logsData = await res.json()
        setKelompokLogs(logsData.logs || [])
      }
    } catch {
      // silent
    } finally {
      setLoadingLogs(false)
    }
  }, [data?.kelompokId])

  useEffect(() => {
    if (data?.kelompokId) {
      fetchKelompokLogs()
    }
  }, [data?.kelompokId, fetchKelompokLogs])

  // Fetch all tasks for the class (Leader view)
  const fetchClassTugas = useCallback(async () => {
    if (!selectedKelas?.id || !isLeader) return
    try {
      setLoadingTugas(true)
      const res = await fetch(`/api/ketua-fan/tugas?kelasId=${selectedKelas.id}`)
      if (res.ok) {
        const tugasData = await res.json()
        setClassTugasList(tugasData.tugas || [])
        if (tugasData.tugas?.length > 0) {
          setSelectedTugasId(tugasData.tugas[0].id)
        }
      }
    } catch {
      // silent
    } finally {
      setLoadingTugas(false)
    }
  }, [selectedKelas?.id, isLeader])

  useEffect(() => {
    if (isLeader) {
      fetchClassTugas()
    }
  }, [isLeader, fetchClassTugas])

  // Fetch distributions for the selected task (Leader view)
  const fetchTugasDistributions = useCallback(async (tugasId: string) => {
    if (!tugasId || !data?.kelompokId) return
    try {
      const res = await fetch(`/api/kelompok/tugas-distribution?tugasId=${tugasId}&kelompokId=${data.kelompokId}`)
      if (res.ok) {
        const distData = await res.json()
        setDistributingTugas(distData.distributions || [])
      }
    } catch {
      // silent
    }
  }, [data?.kelompokId])

  useEffect(() => {
    if (isLeader && selectedTugasId) {
      fetchTugasDistributions(selectedTugasId)
    }
  }, [isLeader, selectedTugasId, fetchTugasDistributions])

  // Save Log Handler (Leader view)
  const handleOpenLog = (member: UserInfo) => {
    const latestLog = kelompokLogs.find(l => l.member.user.id === member.id)
    setSelectedMember(member)
    setLogStatus(latestLog?.status || 'LANCAR')
    setLogCatatan(latestLog?.catatan || '')
    setLogDialogOpen(true)
  }

  const handleSaveLog = async () => {
    if (!selectedMember || !data?.kelompokId) return
    if (!currentMateri.trim()) {
      toast.error('Harap isi materi hafalan terlebih dahulu')
      return
    }
    try {
      setSavingLog(true)
      
      const kelompokMemberId = selectedMember.kelompokMemberId
      if (!kelompokMemberId) throw new Error('Detail anggota tidak ditemukan')

      const res = await fetch('/api/kelompok/hafalan-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kelompokMemberId,
          materi: currentMateri.trim(),
          status: logStatus,
          catatan: logCatatan.trim(),
        }),
      })

      if (res.ok) {
        toast.success(`Hafalan ${selectedMember.name} berhasil disimpan`)
        setLogDialogOpen(false)
        setLogCatatan('')
        await fetchKelompokLogs()
        await fetchGroupData()
      } else {
        const resData = await res.json()
        throw new Error(resData.error || 'Gagal menyimpan absensi')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSavingLog(false)
    }
  }

  // Assign Task Handler (Leader view)
  const handleOpenAssign = (member: UserInfo) => {
    const existingDist = distributingTugas.find(d => d.user.id === member.id)
    setSelectedAssignee(member)
    setTaskDetail(existingDist?.taskDetail || '')
    setAssignDialogOpen(true)
  }

  const handleSaveAssignment = async () => {
    if (!selectedAssignee || !selectedTugasId || !data?.kelompokId) return
    try {
      setSavingAssignment(true)
      const res = await fetch('/api/kelompok/tugas-distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tugasId: selectedTugasId,
          kelompokId: data.kelompokId,
          userId: selectedAssignee.id,
          taskDetail,
          status: 'BELUM',
        }),
      })

      if (res.ok) {
        toast.success(`Tugas berhasil dibagikan ke ${selectedAssignee.name}`)
        setAssignDialogOpen(false)
        await fetchTugasDistributions(selectedTugasId)
      } else {
        const resData = await res.json()
        throw new Error(resData.error || 'Gagal mendistribusikan tugas')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSavingAssignment(false)
    }
  }

  // Update My Task Handler (Student view)
  const handleOpenMyTaskUpdate = (taskDist: TugasDistribution) => {
    setSelectedMyTask(taskDist)
    setMyTaskStatus(taskDist.status)
    setMyTaskCatatan(taskDist.catatan || '')
    setTaskUpdateOpen(true)
  }

  const handleSaveMyTaskUpdate = async () => {
    if (!selectedMyTask || !data?.kelompokId) return
    try {
      setUpdatingMyTask(true)
      const res = await fetch('/api/kelompok/tugas-distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tugasId: selectedMyTask.tugas.id,
          kelompokId: data.kelompokId,
          userId: user?.id,
          status: myTaskStatus,
          catatan: myTaskCatatan,
        }),
      })

      if (res.ok) {
        toast.success('Status tugas berhasil diperbarui')
        setTaskUpdateOpen(false)
        await fetchGroupData()
      } else {
        const resData = await res.json()
        throw new Error(resData.error || 'Gagal memperbarui tugas')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setUpdatingMyTask(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LANCAR':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">Lancar</Badge>
      case 'KURANG_LANCAR':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200">Kurang Lancar</Badge>
      case 'BELUM_SETOR':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border border-red-200">Belum Setor</Badge>
      case 'SELESAI':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">Selesai</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border border-slate-200">Belum</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!data?.inGroup) {
    return (
      <EmptyState 
        icon={Users} 
        title="Belum Terdaftar Kelompok" 
        description="Anda belum dimasukkan ke kelompok manapun di kelas ini. Hubungi Rois A'm kelas Anda untuk pembagian kelompok." 
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Group Card Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 p-8 text-white shadow-2xl shadow-emerald-900/20 relative overflow-hidden border border-emerald-800/50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-10 translate-y-10">
          <Users className="h-40 w-40 text-emerald-100" />
        </div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge className="bg-white/20 text-white border-0 text-xs">
            {isLeader ? 'Ketua Kelompok' : 'Anggota Kelompok'}
          </Badge>
          <span className="text-xs text-emerald-200">&middot;</span>
          <span className="text-xs text-emerald-100">Ketua: {data.leader?.name}</span>
        </div>
        <h2 className="text-xl font-bold">{data.name}</h2>
        <p className="text-emerald-100 text-xs mt-1">
          Terdiri dari {data.members?.length} anggota kelas utama
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-100 pb-px">
        <button
          onClick={() => setActiveTab('info')}
          className={`pb-3 text-xs font-semibold px-4 transition-colors border-b-2 -mb-px ${
            activeTab === 'info' 
              ? 'border-emerald-600 text-emerald-700' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Informasi & Anggota
        </button>
        <button
          onClick={() => setActiveTab('hafalan')}
          className={`pb-3 text-xs font-semibold px-4 transition-colors border-b-2 -mb-px ${
            activeTab === 'hafalan' 
              ? 'border-emerald-600 text-emerald-700' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Absen Setoran Hafalan
        </button>
        <button
          onClick={() => setActiveTab('tugas')}
          className={`pb-3 text-xs font-semibold px-4 transition-colors border-b-2 -mb-px ${
            activeTab === 'tugas' 
              ? 'border-emerald-600 text-emerald-700' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Tugas Kelompok
        </button>
      </div>

      {/* ===== TAB CONTENT 1: INFO ===== */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Members List */}
          <Card className="border border-emerald-100/50 shadow-xl shadow-slate-200/40 rounded-2xl md:col-span-2 bg-white/80 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                <Users className="h-5 w-5 text-emerald-600" />
                Daftar Anggota Kelompok
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.members?.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all duration-150">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-slate-400">{m.email}</p>
                      </div>
                    </div>
                    {m.id === data.leader?.id ? (
                      <Badge className="bg-emerald-600 text-white flex items-center gap-1 text-[10px]">
                        <Award className="h-3 w-3 shrink-0" />
                        Ketua
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Anggota</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Group details summary */}
          <div className="space-y-6">
            <Card className="border-0 shadow-sm bg-slate-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">Ringkasan Kelompok</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span>Nama Kelompok</span>
                  <span className="font-semibold text-slate-800">{data.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Jumlah Anggota</span>
                  <span className="font-semibold text-slate-800">{data.members?.length} Orang</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Target Hafalan Aktif</span>
                  <span className="font-semibold text-emerald-700 truncate max-w-[150px]">
                    {data.targets && data.targets.length > 0 ? data.targets[0].materi : 'Belum Ada'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ===== TAB CONTENT 2: HAFALAN ===== */}
      {activeTab === 'hafalan' && (
        <div className="space-y-6">
          {/* Dynamic Materi Input for Leader */}
          {isLeader && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-200/60 rounded-2xl p-6 space-y-4 shadow-lg shadow-emerald-100/50">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600 animate-pulse" />
                <h4 className="text-base font-bold text-slate-800">Materi Setoran Hari Ini</h4>
              </div>
              <p className="text-xs text-slate-500">
                Tentukan materi hafalan yang disetorkan oleh anggota kelompok hari ini sebelum mencatat absensi.
              </p>
              <Input
                placeholder="Contoh: Surah Al-Baqarah ayat 1-10, Kitab Alfiyah bait 1-5, dll."
                value={currentMateri}
                onChange={(e) => setCurrentMateri(e.target.value)}
                className="bg-white/80 backdrop-blur-sm border-slate-200 focus-visible:ring-emerald-500 font-medium h-11 text-sm shadow-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Hafalan Panel (Left / col-span-2) */}
            <div className="lg:col-span-2 space-y-6">
              {isLeader ? (
                /* LEADER VIEW: Direct Member Attendance List */
                <Card className="border border-slate-100 shadow-xl shadow-slate-200/40 rounded-2xl overflow-hidden bg-white/90 backdrop-blur-xl">
                  <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      Absensi Setoran Hafalan Anggota
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-1">
                      Klik pada anggota kelompok untuk mencatat atau memperbarui setoran materi di atas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {loadingLogs ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {data.members?.map(member => {
                          // Find latest log of this member in kelompokLogs
                          const latestLog = kelompokLogs.find(l => l.member.user.id === member.id)
                          return (
                            <div
                              key={member.id}
                              onClick={() => handleOpenLog(member)}
                              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all duration-150 group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 transition-colors">
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                                  {latestLog ? (
                                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px] sm:max-w-[400px]">
                                      Terakhir: <span className="font-semibold text-slate-700">{latestLog.materi}</span>
                                      {latestLog.catatan && ` - "${latestLog.catatan}"`}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-slate-400 italic mt-0.5">Belum ada riwayat setoran</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {latestLog ? (
                                  <div className="flex flex-col items-end gap-1">
                                    {getStatusBadge(latestLog.status)}
                                    <span className="text-[9px] text-slate-400">
                                      {new Date(latestLog.tanggalSetor).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    </span>
                                  </div>
                                ) : (
                                  <Badge variant="secondary" className="text-[10px] bg-slate-50 text-slate-400">Belum Setor</Badge>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                /* MEMBER VIEW: My Setoran Logs */
                <Card className="border border-slate-100 shadow-xl shadow-slate-200/40 rounded-2xl bg-white/90 backdrop-blur-xl">
                  <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                      <BookOpen className="h-5 w-5 text-emerald-600" />
                      Status Setoran Hafalan Saya
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-1">
                      Daftar riwayat setoran hafalan Anda yang telah dikoreksi oleh Ketua Kelompok
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {data.myLogs && data.myLogs.length > 0 ? (
                      <div className="space-y-3">
                        {data.myLogs.map(log => (
                          <div key={log.id} className="p-3.5 rounded-xl border border-slate-100 flex items-start justify-between gap-3 bg-white">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 leading-snug">{log.materi}</p>
                              {log.catatan && (
                                <p className="text-xs text-slate-600 mt-1.5 italic bg-slate-50 p-2 rounded border border-slate-100 leading-relaxed">
                                  &quot;{log.catatan}&quot;
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2.5">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Setor: {new Date(log.tanggalSetor).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span>&middot;</span>
                                <span>Pemeriksa: {log.verifier.name}</span>
                              </div>
                            </div>
                            <div className="shrink-0">
                              {getStatusBadge(log.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center border border-dashed rounded-xl border-slate-200">
                        <p className="text-xs text-slate-400 italic">Anda belum memiliki riwayat setoran hafalan.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar Feed (Right / col-span-1) */}
            <div className="space-y-6">
              <Card className="border-0 shadow-sm bg-slate-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    Riwayat Hafalan Kelompok
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                  {kelompokLogs.length > 0 ? (
                    kelompokLogs.map(log => (
                      <div key={log.id} className="p-3 rounded-lg border bg-white text-xs border-slate-100 flex items-start gap-2.5 shadow-sm">
                        <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700 shrink-0">
                          {log.member.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800 truncate">{log.member.user.name}</p>
                          <p className="text-[11px] text-slate-600 font-medium mt-0.5 line-clamp-2">{log.materi}</p>
                          <div className="flex items-center justify-between gap-1.5 mt-2 flex-wrap">
                            {getStatusBadge(log.status)}
                            <span className="text-[9px] text-slate-400">
                              {new Date(log.tanggalSetor).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-4">Belum ada riwayat setoran hafalan kelompok</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ===== TAB CONTENT 3: TUGAS ===== */}
      {activeTab === 'tugas' && (
        <div className="space-y-6">
          {isLeader ? (
            /* Leader View: Distribute tasks */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-0 shadow-sm lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-emerald-600" />
                    Pembagian Tugas dari Rois Fan
                  </CardTitle>
                  <CardDescription>
                    Pilih tugas dan bagikan detail bagian pengerjaan kepada anggota kelompok Anda
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Tugas Select */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500">Pilih Tugas Kelas</Label>
                    <Select value={selectedTugasId} onValueChange={setSelectedTugasId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tugas..." />
                      </SelectTrigger>
                      <SelectContent>
                        {classTugasList.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            [{t.mataKuliah.code}] {t.title}
                          </SelectItem>
                        ))}
                        {classTugasList.length === 0 && (
                          <SelectItem value="none" disabled>Belum ada tugas dari Rois Fan</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTugasId && selectedTugasId !== 'none' && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Anggota & Bagian Tugas</h4>
                      
                      <div className="space-y-2">
                        {data.members?.map(member => {
                          const dist = distributingTugas.find(d => d.user.id === member.id)
                          return (
                            <div
                              key={member.id}
                              onClick={() => handleOpenAssign(member)}
                              className="flex items-start justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all duration-150 gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                  {dist?.taskDetail ? dist.taskDetail : <span className="text-slate-400 italic">Belum dibagikan bagian tugas</span>}
                                </p>
                                {dist?.catatan && <p className="text-[10px] text-emerald-600 mt-1 italic">&quot;{dist.catatan}&quot;</p>}
                              </div>
                              <div className="shrink-0 flex items-center gap-2 self-center">
                                {dist ? getStatusBadge(dist.status) : <Badge variant="secondary" className="text-[9px] bg-slate-100 text-slate-400 border border-slate-200">Belum</Badge>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Task descriptions sidebar */}
              <div className="space-y-6">
                {selectedTugasId && selectedTugasId !== 'none' && (
                  <Card className="border-0 shadow-sm bg-slate-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detail Tugas Utama</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{classTugasList.find(t => t.id === selectedTugasId)?.title}</p>
                        <p className="text-slate-400 font-mono text-[10px] mt-0.5">{classTugasList.find(t => t.id === selectedTugasId)?.mataKuliah.name}</p>
                      </div>
                      <p className="text-slate-600 leading-relaxed bg-white border p-2.5 rounded-lg">
                        {classTugasList.find(t => t.id === selectedTugasId)?.description || 'Tidak ada deskripsi'}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        Due: {new Date(classTugasList.find(t => t.id === selectedTugasId)?.dueDate || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            /* Student Member View: Tasks assigned to me */
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-emerald-600" />
                  Daftar Tugas Kelompok Saya
                </CardTitle>
                <CardDescription>
                  Bagian tugas yang didelegasikan oleh Ketua Kelompok Anda. Klik pada tugas untuk mengupdate status pengerjaan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.myTasks && data.myTasks.length > 0 ? (
                  <div className="space-y-3">
                    {data.myTasks.map(taskDist => (
                      <div 
                        key={taskDist.id} 
                        onClick={() => handleOpenMyTaskUpdate(taskDist)}
                        className="p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all duration-150"
                      >
                        <div className="space-y-2 min-w-0">
                          <div>
                            <span className="font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded mr-2">
                              {taskDist.tugas.mataKuliah.code}
                            </span>
                            <span className="text-[10px] text-slate-400">Due: {new Date(taskDist.tugas.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                            <p className="text-sm font-bold text-slate-800 mt-1 leading-snug">{taskDist.tugas.title}</p>
                          </div>
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Bagian Saya:</p>
                            <p className="text-xs text-slate-700 mt-0.5 font-medium leading-relaxed">{taskDist.taskDetail}</p>
                          </div>
                          {taskDist.catatan && (
                            <p className="text-xs text-slate-500 italic flex items-start gap-1">
                              <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                              &quot;{taskDist.catatan}&quot;
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 self-start sm:self-center">
                          {getStatusBadge(taskDist.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center border border-dashed rounded-lg border-slate-200">
                    <p className="text-xs text-slate-400 italic">Belum ada tugas kelompok yang ditugaskan ke Anda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dialog for Absensi Hafalan (Leader View) */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Koreksi Hafalan</DialogTitle>
            <DialogDescription>
              Ubah status kelancaran setoran hafalan untuk <strong className="text-emerald-700">{selectedMember?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="status">Status Kelancaran</Label>
              <Select value={logStatus} onValueChange={setLogStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LANCAR">Lancar</SelectItem>
                  <SelectItem value="KURANG_LANCAR">Kurang Lancar</SelectItem>
                  <SelectItem value="BELUM_SETOR">Belum Setor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="catatan">Catatan / Koreksi Tafsir</Label>
              <Textarea 
                id="catatan" 
                placeholder="Misal: Tajwid harakat mad thabi'i di ayat 5 perlu diperhatikan" 
                value={logCatatan}
                onChange={e => setLogCatatan(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveLog} disabled={savingLog} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {savingLog && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan Absen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Assigning Tasks (Leader View) */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Bagi Bagian Tugas</DialogTitle>
            <DialogDescription>
              Delegasikan sub-tugas atau bagian materi khusus kepada <strong className="text-emerald-700">{selectedAssignee?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="taskDetail">Deskripsi Bagian Tugas</Label>
              <Textarea 
                id="taskDetail" 
                placeholder="Misal: Kerjakan ringkasan kitab Fathul Muin bab Salat jama'ah di masjid (halaman 10-15)" 
                value={taskDetail}
                onChange={e => setTaskDetail(e.target.value)}
                className="h-28"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveAssignment} disabled={savingAssignment} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {savingAssignment && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delegasikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Student Update Task (Student View) */}
      <Dialog open={taskUpdateOpen} onOpenChange={setTaskUpdateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Update Progres Tugas</DialogTitle>
            <DialogDescription>
              Laporkan status pengerjaan bagian tugas Anda kepada Ketua Kelompok
            </DialogDescription>
          </DialogHeader>
          {selectedMyTask && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bagian Tugas:</p>
                <p className="text-sm font-semibold text-slate-700">{selectedMyTask.taskDetail}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="my-task-status">Status Pengerjaan</Label>
                <Select value={myTaskStatus} onValueChange={setMyTaskStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BELUM">Belum Selesai</SelectItem>
                    <SelectItem value="SELESAI">Sudah Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="my-task-catatan">Catatan / Link Progres (Opsional)</Label>
                <Textarea 
                  id="my-task-catatan" 
                  placeholder="Misal: Sudah selesai dirangkum di lembar kertas dan siap dikumpulkan." 
                  value={myTaskCatatan}
                  onChange={e => setMyTaskCatatan(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskUpdateOpen(false)}>Batal</Button>
            <Button onClick={handleSaveMyTaskUpdate} disabled={updatingMyTask} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {updatingMyTask && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Simpan Progres
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
