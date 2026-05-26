'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface PengumumanFormData {
  title: string
  content: string
  category: string
  kelasId: string
  isPinned: boolean
}

interface Kelas {
  id: string
  name: string
  semester: number
}

interface PengumumanFormProps {
  initialData?: PengumumanFormData
  onSubmit: (data: PengumumanFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function PengumumanForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: PengumumanFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [category, setCategory] = useState(initialData?.category || 'UMUM')
  const [kelasId, setKelasId] = useState(initialData?.kelasId || '')
  const [isPinned, setIsPinned] = useState(initialData?.isPinned || false)
  const [classes, setClasses] = useState<Kelas[]>([])

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/admin/kelas')
        if (res.ok) {
          const data = await res.json()
          setClasses(data.kelas || [])
        }
      } catch {
        // silent
      }
    }
    fetchClasses()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    await onSubmit({ title: title.trim(), content: content.trim(), category, kelasId, isPinned })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Judul <span className="text-red-500">*</span></Label>
        <Input
          id="title"
          placeholder="Masukkan judul pengumuman..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Konten <span className="text-red-500">*</span></Label>
        <Textarea
          id="content"
          placeholder="Tulis isi pengumuman..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
          rows={5}
          className="resize-none"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Kategori</Label>
          <Select value={category} onValueChange={setCategory} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UMUM">Umum</SelectItem>
              <SelectItem value="JADWAL">Jadwal</SelectItem>
              <SelectItem value="UJIAN">Ujian</SelectItem>
              <SelectItem value="LAINNYA">Lainnya</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Kelas (Opsional)</Label>
          <Select value={kelasId} onValueChange={setKelasId} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Kelas</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} - Semester {c.semester}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="isPinned"
          checked={isPinned}
          onCheckedChange={setIsPinned}
          disabled={loading}
        />
        <Label htmlFor="isPinned" className="cursor-pointer">
          Sematkan di atas (Pin)
        </Label>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Batal
        </Button>
        <Button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={loading || !title.trim() || !content.trim()}
        >
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {initialData ? 'Simpan Perubahan' : 'Buat Pengumuman'}
        </Button>
      </div>
    </form>
  )
}
