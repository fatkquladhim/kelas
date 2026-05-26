'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

export function ClassSelector() {
  const { allClasses, selectedKelas, setSelectedKelas, setClassMembers, classesLoaded } = useAppStore()

  const handleSelect = async (kelasId: string) => {
    const kelas = allClasses.find(c => c.id === kelasId)
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

  if (!classesLoaded) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
        <span className="text-sm text-slate-500 hidden sm:inline">Memuat...</span>
      </div>
    )
  }

  if (allClasses.length === 0) return null

  return (
    <Select value={selectedKelas?.id || ''} onValueChange={handleSelect}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Pilih Kelas" />
      </SelectTrigger>
      <SelectContent>
        {allClasses.map((kelas) => (
          <SelectItem key={kelas.id} value={kelas.id}>
            {kelas.name} - Semester {kelas.semester}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
