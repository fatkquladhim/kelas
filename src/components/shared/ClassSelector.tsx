'use client'

import { useEffect, useState } from 'react'
import { useAppStore, type ClassInfo } from '@/lib/store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

export function ClassSelector() {
  const { selectedKelas, setSelectedKelas, setClassMembers } = useAppStore()
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserClasses()
  }, [])

  const fetchUserClasses = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/kelas')
      if (res.ok) {
        const data = await res.json()
        setClasses(data.kelas || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = async (kelasId: string) => {
    const kelas = classes.find(c => c.id === kelasId)
    setSelectedKelas(kelas || null)

    if (kelas) {
      try {
        const res = await fetch(`/api/admin/kelas/${kelas.id}/members`)
        if (res.ok) {
          const data = await res.json()
          setClassMembers(
            (data.members || []).map((m: { id: string; userId: string; user: { name: string; email: string }; role: string; kelasId: string }) => ({
              id: m.id,
              userId: m.userId,
              userName: m.user.name,
              userEmail: m.user.email,
              role: m.role as 'MAHASANTRI' | 'ROIS_AM' | 'KETUA_FAN_ILMU' | 'KETUA_KELOMPOK' | 'SEKRETARIS' | 'BENDAHARA',
              kelasId: m.kelasId,
            }))
          )
        }
      } catch {
        // silent
      }
    } else {
      setClassMembers([])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
        <span className="text-sm text-slate-500">Memuat...</span>
      </div>
    )
  }

  if (classes.length === 0) return null

  return (
    <Select value={selectedKelas?.id || ''} onValueChange={handleSelect}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Pilih Kelas" />
      </SelectTrigger>
      <SelectContent>
        {classes.map((kelas) => (
          <SelectItem key={kelas.id} value={kelas.id}>
            {kelas.name} - Semester {kelas.semester}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
