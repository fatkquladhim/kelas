import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'ADMIN' | 'MAHASANTRI'
export type MemberRole = 'MAHASANTRI' | 'ROIS_AM' | 'KETUA_FAN_ILMU' | 'KETUA_KELOMPOK' | 'SEKRETARIS' | 'BENDAHARA'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
}

export interface ClassInfo {
  id: string
  name: string
  semester: number
  tahunAjaran: string
}

export interface ClassMemberInfo {
  id: string
  userId: string
  userName: string
  userEmail: string
  role: MemberRole
  kelasId: string
}

export type PageView = 
  | 'login'
  | 'register'
  | 'admin-dashboard'
  | 'admin-students'
  | 'admin-classes'
  | 'admin-syllabus'
  | 'admin-schedule'
  | 'admin-matakuliah'
  | 'admin-roles'
  | 'student-dashboard'
  | 'student-schedule'
  | 'student-syllabus'
  | 'student-progress'
  | 'student-kehadiran'
  | 'admin-kehadiran'
  | 'rois-dashboard'
  | 'rois-members'
  | 'rois-kelompok'
  | 'student-kelompok'
  | 'admin-pengumuman'
  | 'pengumuman'
  | 'ketua-capaian'

interface AppState {
  user: User | null
  selectedKelas: ClassInfo | null
  allClasses: ClassInfo[]
  classMembers: ClassMemberInfo[]
  currentPage: PageView
  classesLoaded: boolean
  
  // Auth actions
  setUser: (user: User | null) => void
  setSelectedKelas: (kelas: ClassInfo | null) => void
  setAllClasses: (classes: ClassInfo[]) => void
  setClassMembers: (members: ClassMemberInfo[]) => void
  setCurrentPage: (page: PageView) => void
  logout: () => void
  loadClassesAndMembers: () => Promise<void>
  
  // Helper
  isAdmin: () => boolean
  isRoisAm: () => boolean
  isKetuaFanIlmu: () => boolean
  isKetuaKelompok: () => boolean
  getMyRole: () => MemberRole | null
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      selectedKelas: null,
      allClasses: [],
      classMembers: [],
      currentPage: 'login',
      classesLoaded: false,

      setUser: (user) => set({ user }),
      setSelectedKelas: (kelas) => set({ selectedKelas: kelas }),
      setAllClasses: (classes) => set({ allClasses: classes }),
      setClassMembers: (members) => set({ classMembers: members }),
      setCurrentPage: (page) => set({ currentPage: page }),
      logout: () => set({ user: null, selectedKelas: null, allClasses: [], classMembers: [], currentPage: 'login', classesLoaded: false }),
      
      loadClassesAndMembers: async () => {
        const state = get()
        if (state.classesLoaded || !state.user) return
        try {
          const kelasRes = await fetch('/api/admin/kelas')
          if (kelasRes.ok) {
            const kelasData = await kelasRes.json()
            const classes: ClassInfo[] = kelasData.kelas || []
            set({ allClasses: classes, classesLoaded: true })
            
            // Auto-select first class if none selected
            const currentKelas = get().selectedKelas
            if (!currentKelas && classes.length > 0) {
              set({ selectedKelas: classes[0] })
              // Load members for auto-selected class
              const membersRes = await fetch(`/api/admin/kelas/${classes[0].id}/members`)
              if (membersRes.ok) {
                const membersData = await membersRes.json()
                const members: ClassMemberInfo[] = (membersData.members || []).map(
                  (m: { id: string; userId: string; user: { name: string; email: string }; role: string; kelasId: string }) => ({
                    id: m.id,
                    userId: m.userId,
                    userName: m.user.name,
                    userEmail: m.user.email,
                    role: m.role as MemberRole,
                    kelasId: m.kelasId,
                  })
                )
                set({ classMembers: members })
              }
            } else if (currentKelas) {
              // Load members for already selected class
              const membersRes = await fetch(`/api/admin/kelas/${currentKelas.id}/members`)
              if (membersRes.ok) {
                const membersData = await membersRes.json()
                const members: ClassMemberInfo[] = (membersData.members || []).map(
                  (m: { id: string; userId: string; user: { name: string; email: string }; role: string; kelasId: string }) => ({
                    id: m.id,
                    userId: m.userId,
                    userName: m.user.name,
                    userEmail: m.user.email,
                    role: m.role as MemberRole,
                    kelasId: m.kelasId,
                  })
                )
                set({ classMembers: members })
              }
            }
          }
        } catch {
          // silent
        }
      },
      
      isAdmin: () => get().user?.role === 'ADMIN',
      isRoisAm: () => {
        const state = get()
        return state.classMembers.some(m => m.userId === state.user?.id && m.role === 'ROIS_AM')
      },
      isKetuaFanIlmu: () => {
        const state = get()
        return state.classMembers.some(m => m.userId === state.user?.id && m.role === 'KETUA_FAN_ILMU')
      },
      isKetuaKelompok: () => {
        const state = get()
        return state.classMembers.some(m => m.userId === state.user?.id && m.role === 'KETUA_KELOMPOK')
      },
      getMyRole: () => {
        const state = get()
        const member = state.classMembers.find(m => m.userId === state.user?.id)
        return member ? member.role : null
      },
    }),
    {
      name: 'kelas-app-storage',
      partialize: (state) => ({
        user: state.user,
        selectedKelas: state.selectedKelas,
      }),
    }
  )
)
