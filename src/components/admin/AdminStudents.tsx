'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import { Search, UserPlus, MoreHorizontal, Trash2, Shield, Loader2, Users } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  _count?: { classMemberships: number }
}

export function AdminStudents() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Create user dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('MAHASANTRI')
  const [creating, setCreating] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch {
      toast.error('Gagal memuat data mahasantri')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && u.isActive) ||
      (statusFilter === 'pending' && !u.isActive)
    return matchSearch && matchRole && matchStatus
  })

  const handleActivate = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })
      if (res.ok) {
        toast.success(`${user.name} berhasil diaktifkan`)
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengaktifkan')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }

  const handleRoleChange = async (user: User, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        toast.success(`Role ${user.name} diubah`)
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengubah role')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${user.name}?`)) return
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`${user.name} berhasil dihapus`)
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menghapus')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }

  const handleCreate = async () => {
    if (!newName || !newEmail || !newPassword) {
      toast.error('Semua field wajib diisi')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, role: newRole }),
      })
      if (res.ok) {
        toast.success('Mahasantri berhasil ditambahkan')
        setCreateOpen(false)
        setNewName('')
        setNewEmail('')
        setNewPassword('')
        setNewRole('MAHASANTRI')
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal menambahkan')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setCreating(false)
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
      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="MAHASANTRI">Mahasantri</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <UserPlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Tambah</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Mahasantri Baru</DialogTitle>
                <DialogDescription>Masukkan data mahasantri yang akan ditambahkan</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Lengkap</label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nama lengkap" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@pesantren.ac.id" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Password" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAHASANTRI">Mahasantri</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreate} disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Tambah
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Tidak ada mahasantri ditemukan"
              description={search || roleFilter !== 'all' || statusFilter !== 'all' ? 'Coba ubah filter pencarian' : 'Belum ada data mahasantri'}
            />
          ) : (
            <ScrollArea className="max-h-[calc(100vh-220px)]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[250px]">Nama</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Kelas</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-500 md:hidden">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-slate-600">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'} className="text-xs">
                          {user.role === 'ADMIN' ? 'Admin' : 'Mahasantri'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={user.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                          }
                        >
                          {user.isActive ? 'Aktif' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {user._count?.classMemberships || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!user.isActive && (
                              <DropdownMenuItem onClick={() => handleActivate(user)}>
                                <Shield className="h-4 w-4 mr-2" />
                                Aktifkan
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleRoleChange(user, user.role === 'ADMIN' ? 'MAHASANTRI' : 'ADMIN')}>
                              <Shield className="h-4 w-4 mr-2" />
                              Ubah ke {user.role === 'ADMIN' ? 'Mahasantri' : 'Admin'}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(user)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
