'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Bell, Pin, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'
import { PengumumanForm, type PengumumanFormData } from '@/components/shared/PengumumanForm'

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

export function AdminPengumuman() {
  const [pengumuman, setPengumuman] = useState<PengumumanItem[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PengumumanItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchPengumuman = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/pengumuman')
      if (res.ok) {
        const data = await res.json()
        setPengumuman(data.pengumuman || [])
      }
    } catch {
      toast.error('Gagal memuat pengumuman')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPengumuman()
  }, [fetchPengumuman])

  const handleCreate = () => {
    setEditingItem(null)
    setDialogOpen(true)
  }

  const handleEdit = (item: PengumumanItem) => {
    setEditingItem(item)
    setDialogOpen(true)
  }

  const handleDelete = async (item: PengumumanItem) => {
    if (!confirm(`Hapus pengumuman "${item.title}"?`)) return
    setDeleting(item.id)
    try {
      const res = await fetch(`/api/pengumuman/${item.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Pengumuman dihapus')
        fetchPengumuman()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeleting(null)
    }
  }

  const handleSubmit = async (data: PengumumanFormData) => {
    setSaving(true)
    try {
      const isEdit = !!editingItem
      const url = editingItem
        ? `/api/pengumuman/${editingItem.id}`
        : '/api/pengumuman'
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          category: data.category,
          kelasId: data.kelasId || null,
          isPinned: data.isPinned,
        }),
      })

      if (res.ok) {
        toast.success(isEdit ? 'Pengumuman diperbarui' : 'Pengumuman dibuat')
        setDialogOpen(false)
        setEditingItem(null)
        fetchPengumuman()
      } else {
        const result = await res.json()
        toast.error(result.error || 'Terjadi kesalahan')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const pinnedItems = pengumuman.filter((p) => p.isPinned)
  const regularItems = pengumuman.filter((p) => !p.isPinned)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            {pengumuman.length} pengumuman &middot; {pinnedItems.length} disematkan
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={handleCreate}
        >
          <Plus className="h-4 w-4 mr-2" />
          Buat Pengumuman
        </Button>
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
          description="Buat pengumuman pertama untuk memberikan informasi kepada mahasantri"
          action={
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleCreate}
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Pengumuman
            </Button>
          }
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
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  deleting={deleting === item.id}
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
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  deleting={deleting === item.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingItem(null)
        }
        setDialogOpen(open)
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Pengumuman' : 'Buat Pengumuman'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Perbarui informasi pengumuman'
                : 'Isi detail pengumuman yang ingin dibuat'}
            </DialogDescription>
          </DialogHeader>
          <PengumumanForm
            initialData={
              editingItem
                ? {
                    title: editingItem.title,
                    content: editingItem.content,
                    category: editingItem.category,
                    kelasId: editingItem.kelasId || '',
                    isPinned: editingItem.isPinned,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            onCancel={() => {
              setDialogOpen(false)
              setEditingItem(null)
            }}
            loading={saving}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PengumumanCard({
  item,
  onEdit,
  onDelete,
  deleting,
}: {
  item: PengumumanItem
  onEdit: (item: PengumumanItem) => void
  onDelete: (item: PengumumanItem) => void
  deleting: boolean
}) {
  const categoryConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.UMUM

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow group">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {item.isPinned && (
                <Pin className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600" />
              )}
              <h3 className="font-semibold text-slate-800 truncate">
                {item.title}
              </h3>
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
            <p className="text-sm text-slate-600 whitespace-pre-line line-clamp-3 mb-3">
              {item.content}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-medium text-slate-500">{item.author.name}</span>
              <span>&middot;</span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600"
              onClick={() => onEdit(item)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
              onClick={() => onDelete(item)}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
