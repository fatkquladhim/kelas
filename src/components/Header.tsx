'use client'

import { useAppStore } from '@/lib/store'
import { ClassSelector } from '@/components/shared/ClassSelector'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { SidebarContent } from '@/components/Sidebar'

const pageTitles: Record<string, string> = {
  'admin-dashboard': 'Dashboard Admin',
  'admin-students': 'Manajemen Mahasantri',
  'admin-classes': 'Manajemen Kelas',
  'admin-matakuliah': 'Mata Kuliah',
  'admin-syllabus': 'Silabus',
  'admin-schedule': 'Jadwal Perkuliahan',
  'admin-roles': 'Pengaturan Role',
  'student-dashboard': 'Dashboard Mahasantri',
  'student-schedule': 'Jadwal Kuliah',
  'student-syllabus': 'Silabus Kuliah',
  'student-progress': 'Progres Materi',
  'rois-dashboard': 'Dashboard Rois A\'m',
  'rois-members': 'Pengaturan Anggota',
}

export function Header() {
  const { user, currentPage } = useAppStore()

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/95 backdrop-blur px-4 lg:px-6">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Page Title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-slate-800">
          {pageTitles[currentPage] || 'Dashboard'}
        </h1>
      </div>

      {/* Class Selector */}
      <ClassSelector />

      {/* User Avatar */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-slate-700">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.role === 'ADMIN' ? 'Administrator' : 'Mahasantri'}</p>
        </div>
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-emerald-600 text-white text-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
