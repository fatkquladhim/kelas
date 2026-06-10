'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Bell, Pin, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { PengumumanForm, type PengumumanFormData } from '@/components/shared/PengumumanForm'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface Author {
  id: string
  name: string
  email: string
}

interface Kelas {
  id: string
  name: string
}

interface PengumumanItem {
  id: string
  title: string
  content: string
  category: string
  kelasId: string | null
  authorId: string
  isPinned: boolean
  createdAt: string
  updatedAt: string
  author: Author
  kelas: Kelas | null
}

const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  UMUM: { label: 'Umum', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  JADWAL: { label: 'Jadwal', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  UJIAN: { label: 'Ujian', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  LAINNYA: { label: 'Lainnya', className: 'bg-purple-100 text-purple-700 border-purple-200' },
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PengumumanList() {
  const { user, selectedKelas, classMembers } = useAppStore()
  const [pengumuman, setPengumuman] = useState<PengumumanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const canPost =
    user?.role === 'ADMIN' ||
    classMembers.some(
      m => m.userId === user?.id && (m.role === 'ROIS_AM' || m.role === 'KETUA_FAN_ILMU')
    )

  const fetchPengumuman = useCallback(async () => {
    try {
      setLoading(true)
      const url = selectedKelas
        ? `/api/pengumuman?kelasId=${selectedKelas.id}`
        : '/api/pengumuman'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setPengumuman(data.pengumuman || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [selectedKelas])

  useEffect(() => {
    fetchPengumuman()
  }, [fetchPengumuman])

  const handleCreate = async (data: PengumumanFormData) => {
    setCreating(true)
    try {
      const body: any = { ...data }
      if (!canPost || user?.role !== 'ADMIN') {
        body.kelasId = selectedKelas?.id || ''
      }
      const res = await fetch('/api/pengumuman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success('Pengumuman berhasil dibuat')
        setCreateOpen(false)
        fetchPengumuman()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Gagal membuat pengumuman')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setCreating(false)
    }
  }

  const pinnedItems = pengumuman.filter((p) => p.isPinned)
  const regularItems = pengumuman.filter((p) => !p.isPinned)

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-6">
      {/* Info & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {selectedKelas && (
          <p className="text-sm text-slate-500">
            Menampilkan pengumuman untuk kelas{' '}
            <span className="font-medium text-slate-700">{selectedKelas.name}</span> dan pengumuman umum
          </p>
        )}
        {canPost && (
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tulis Pengumuman
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : pengumuman.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Belum ada pengumuman"
          description="Belum ada pengumuman yang diterbitkan saat ini"
        />
      ) : (
        <div className="space-y-4">
          {/* Pinned */}
          {pinnedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <Pin className="h-4 w-4 text-emerald-600" />
                Disematkan
              </div>
              {pinnedItems.map((item) => (
                <PengumumanCard
                  key={item.id}
                  item={item}
                  expanded={expandedId === item.id}
                  onToggle={() => toggleExpand(item.id)}
                />
              ))}
            </div>
          )}

          {/* Regular */}
          {regularItems.length > 0 && (
            <div className="space-y-3">
              {pinnedItems.length > 0 && (
                <div className="text-sm font-medium text-slate-600">
                  Pengumuman Lainnya
                </div>
              )}
              {regularItems.map((item) => (
                <PengumumanCard
                  key={item.id}
                  item={item}
                  expanded={expandedId === item.id}
                  onToggle={() => toggleExpand(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Buat Pengumuman Baru</DialogTitle>
            <DialogDescription>
              {user?.role === 'ADMIN'
                ? 'Admin dapat membuat pengumuman untuk semua kelas atau kelas tertentu'
                : 'Pengumuman akan dikhususkan untuk kelas Anda saat ini'}
            </DialogDescription>
          </DialogHeader>
          <PengumumanForm
            initialData={
              user?.role !== 'ADMIN' && selectedKelas
                ? { title: '', content: '', category: 'UMUM', kelasId: selectedKelas.id, isPinned: false }
                : undefined
            }
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            loading={creating}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PengumumanCard({
  item,
  expanded,
  onToggle,
}: {
  item: PengumumanItem
  expanded: boolean
  onToggle: () => void
}) {
  const categoryConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.UMUM
  const isLongContent = item.content.length > 200

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {item.isPinned && (
            <Pin className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600" />
          )}
          <h3 className="font-semibold text-slate-800">{item.title}</h3>
          <Badge
            variant="outline"
            className={`text-[10px] px-2 py-0 ${categoryConfig.className}`}
          >
            {categoryConfig.label}
          </Badge>
          {item.kelas && (
            <Badge variant="outline" className="text-[10px] px-2 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
              {item.kelas.name}
            </Badge>
          )}
        </div>

        <div className="relative">
          <p
            className={`text-sm text-slate-600 whitespace-pre-line ${
              !expanded && isLongContent ? 'line-clamp-3' : ''
            }`}
          >
            {item.content}
          </p>
          {isLongContent && (
            <button
              onClick={onToggle}
              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium mt-1 transition-colors"
            >
              {expanded ? (
                <>
                  Sembunyikan <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Baca selengkapnya <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
          <span className="font-medium text-slate-500">{item.author.name}</span>
          <span>&middot;</span>
          <span>{formatDate(item.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  )
}