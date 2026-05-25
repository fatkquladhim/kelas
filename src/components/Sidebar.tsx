'use client'

import { useAppStore, type PageView } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  BookOpen,
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  ClipboardList,
  BarChart3,
  Shield,
  Settings,
  LogOut,
  X,
  UserCog,
} from 'lucide-react'
import type { MemberRole } from '@/lib/store'

interface NavItem {
  label: string
  page: PageView
  icon: React.ElementType
}

function getRoleBadgeColor(role: MemberRole): string {
  switch (role) {
    case 'ROIS_AM': return 'bg-emerald-100 text-emerald-700'
    case 'KETUA_FAN_ILMU': return 'bg-blue-100 text-blue-700'
    case 'KETUA_KELOMPOK': return 'bg-purple-100 text-purple-700'
    case 'SEKRETARIS': return 'bg-amber-100 text-amber-700'
    case 'BENDAHARA': return 'bg-orange-100 text-orange-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function getRoleLabel(role: MemberRole): string {
  switch (role) {
    case 'ROIS_AM': return 'Rois A\'m'
    case 'KETUA_FAN_ILMU': return 'Ketua Fan Ilmu'
    case 'KETUA_KELOMPOK': return 'Ketua Kelompok'
    case 'SEKRETARIS': return 'Sekretaris'
    case 'BENDAHARA': return 'Bendahara'
    default: return 'Mahasantri'
  }
}

interface SidebarContentProps {
  onClose?: () => void
}

export function SidebarContent({ onClose }: SidebarContentProps) {
  const { user, currentPage, setCurrentPage, logout, isAdmin, isRoisAm, isKetuaFanIlmu, getMyRole, selectedKelas } = useAppStore()

  const adminNavItems: NavItem[] = [
    { label: 'Dashboard', page: 'admin-dashboard', icon: LayoutDashboard },
    { label: 'Mahasantri', page: 'admin-students', icon: Users },
    { label: 'Kelas', page: 'admin-classes', icon: GraduationCap },
    { label: 'Mata Kuliah', page: 'admin-matakuliah', icon: BookOpen },
    { label: 'Silabus', page: 'admin-syllabus', icon: ClipboardList },
    { label: 'Jadwal', page: 'admin-schedule', icon: Calendar },
    { label: 'Pengaturan Role', page: 'admin-roles', icon: Shield },
  ]

  const studentNavItems: NavItem[] = [
    { label: 'Dashboard', page: 'student-dashboard', icon: LayoutDashboard },
    { label: 'Jadwal', page: 'student-schedule', icon: Calendar },
    { label: 'Silabus', page: 'student-syllabus', icon: ClipboardList },
    { label: 'Progres Materi', page: 'student-progress', icon: BarChart3 },
  ]

  const myRole = getMyRole()

  let navItems: NavItem[] = []

  if (isAdmin()) {
    navItems = adminNavItems
  } else {
    navItems = [...studentNavItems]
    if (isRoisAm()) {
      navItems.push({ label: 'Dashboard Rois', page: 'rois-dashboard', icon: Shield })
      navItems.push({ label: 'Pengaturan Anggota', page: 'rois-members', icon: UserCog })
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // silent
    }
    logout()
    onClose?.()
  }

  const handleNavClick = (page: PageView) => {
    setCurrentPage(page)
    onClose?.()
  }

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Kelas Perkuliahan</h2>
            <p className="text-xs text-slate-400">Pesantren</p>
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <Separator className="bg-slate-700" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.page
            return (
              <button
                key={item.page}
                onClick={() => handleNavClick(item.page)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-slate-700" />

      {/* User Info */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-emerald-600 text-white text-xs">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <div className="flex items-center gap-1">
              {isAdmin() ? (
                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-red-500/20 text-red-300">
                  Admin
                </span>
              ) : myRole ? (
                <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium', getRoleBadgeColor(myRole))}>
                  {getRoleLabel(myRole)}
                </span>
              ) : (
                <span className="text-xs text-slate-400">Mahasantri</span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-red-300 hover:bg-slate-800"
            onClick={handleLogout}
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        {selectedKelas && (
          <p className="text-xs text-slate-500 mt-2 truncate">
            📚 {selectedKelas.name} — Semester {selectedKelas.semester}
          </p>
        )}
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
      <SidebarContent />
    </div>
  )
}

export { getRoleBadgeColor, getRoleLabel }
