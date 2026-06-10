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
  UserCheck,
  Bell,
  ClipboardCheck,
  User,
} from 'lucide-react'
import type { MemberRole } from '@/lib/store'

interface NavItem {
  label: string
  page: PageView
  icon: React.ElementType
}

function getRoleBadgeColor(role: MemberRole): string {
  switch (role) {
    case 'ROIS_AM': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    case 'KETUA_FAN_ILMU': return 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
    case 'KETUA_KELOMPOK': return 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
    case 'SEKRETARIS': return 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    case 'BENDAHARA': return 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
    default: return 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
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
    { label: 'Kehadiran', page: 'admin-kehadiran', icon: UserCheck },
    { label: 'Pengumuman', page: 'admin-pengumuman', icon: Bell },
    { label: 'Pengaturan Role', page: 'admin-roles', icon: Shield },
  ]

  const studentNavItems: NavItem[] = [
    { label: 'Dashboard', page: 'student-dashboard', icon: LayoutDashboard },
    { label: 'Jadwal', page: 'student-schedule', icon: Calendar },
    { label: 'Silabus', page: 'student-syllabus', icon: ClipboardList },
    { label: 'Progres Materi', page: 'student-progress', icon: BarChart3 },
    { label: 'Kehadiran', page: 'student-kehadiran', icon: UserCheck },
    { label: 'Kelompok Saya', page: 'student-kelompok', icon: Users },
    { label: 'Pengumuman', page: 'pengumuman', icon: Bell },
  ]

  const myRole = getMyRole()

  let navItems: NavItem[] = []

  if (isAdmin()) {
    navItems = adminNavItems
  } else {
    navItems = [...studentNavItems]
    if (isRoisAm()) {
      navItems.push({ label: 'Dashboard Rois', page: 'rois-dashboard', icon: Shield })
      navItems.push({ label: 'Manajemen Kelompok', page: 'rois-kelompok', icon: Users })
      navItems.push({ label: 'Pengaturan Anggota', page: 'rois-members', icon: UserCog })
    }
    if (isKetuaFanIlmu()) {
      navItems.push({ label: 'Capaian Materi', page: 'ketua-capaian', icon: ClipboardCheck })
    }
  }
  navItems.push({ label: 'Profil Saya', page: 'profile', icon: User })

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
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white">
      {/* Decorative top gradient line */}
      <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Kelas Perkuliahan</h2>
            <p className="text-[11px] text-slate-400 font-medium">Pesantren</p>
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

      <Separator className="bg-slate-700/50" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = currentPage === item.page
            return (
              <button
                key={item.page}
                onClick={() => handleNavClick(item.page)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                )}
              >
                <item.icon className={cn('h-4 w-4', isActive && 'text-white')} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white/80" />
                )}
              </button>
            )
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-slate-700/50" />

      {/* Selected Class Badge */}
      {selectedKelas && (
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 rounded-lg bg-slate-800/60 border border-slate-700/50 px-3 py-2">
            <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />
            <p className="text-[11px] text-slate-300 truncate">{selectedKelas.name}</p>
            <span className="text-[10px] text-emerald-400 font-semibold shrink-0">
              S{selectedKelas.semester}
            </span>
          </div>
        </div>
      )}

      {/* User Info */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 ring-2 ring-emerald-500/30">
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isAdmin() ? (
                <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                  Admin
                </span>
              ) : myRole ? (
                <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold', getRoleBadgeColor(myRole))}>
                  {getRoleLabel(myRole)}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">Mahasantri</span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
            onClick={handleLogout}
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
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
