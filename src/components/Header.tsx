'use client'

import { useAppStore } from '@/lib/store'
import { ClassSelector } from '@/components/shared/ClassSelector'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Menu } from 'lucide-react'
import { SidebarContent, getRoleLabel, getRoleBadgeColor } from '@/components/Sidebar'

const pageTitles: Record<string, string> = {
  'admin-dashboard': 'Dashboard Admin',
  'admin-students': 'Manajemen Mahasantri',
  'admin-classes': 'Manajemen Kelas',
  'admin-matakuliah': 'Mata Kuliah',
  'admin-syllabus': 'Silabus',
  'admin-schedule': 'Jadwal Perkuliahan',
  'admin-kehadiran': 'Manajemen Kehadiran',
  'admin-pengumuman': 'Kelola Pengumuman',
  'admin-roles': 'Pengaturan Role',
  'student-dashboard': 'Dashboard',
  'student-schedule': 'Jadwal Kuliah',
  'student-syllabus': 'Silabus Kuliah',
  'student-progress': 'Progres Materi',
  'student-kehadiran': 'Riwayat Kehadiran',
  'pengumuman': 'Pengumuman',
  'rois-dashboard': "Dashboard Rois A'm",
  'rois-members': 'Pengaturan Anggota',
  'ketua-capaian': 'Capaian Materi',
}

export function Header() {
  const { user, currentPage, isAdmin, getMyRole } = useAppStore()
  const myRole = getMyRole()

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200/80 bg-white/90 backdrop-blur-lg px-4 lg:px-6">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden hover:bg-slate-100">
            <Menu className="h-5 w-5 text-slate-600" />
            <span className="sr-only">Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Page Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-slate-800 truncate">
          {pageTitles[currentPage] || 'Dashboard'}
        </h1>
      </div>

      {/* Class Selector */}
      <ClassSelector />

      {/* User Avatar & Role */}
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-slate-700">{user?.name}</p>
          {isAdmin() ? (
            <p className="text-xs text-slate-500">Administrator</p>
          ) : myRole && myRole !== 'MAHASANTRI' ? (
            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 font-semibold border ${getRoleBadgeColor(myRole)}`}>
              {getRoleLabel(myRole)}
            </Badge>
          ) : (
            <p className="text-xs text-slate-500">Mahasantri</p>
          )}
        </div>
        <Avatar className="h-9 w-9 ring-2 ring-emerald-100">
          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
