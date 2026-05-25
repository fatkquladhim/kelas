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
  | 'rois-dashboard'
  | 'rois-members'

interface AppState {
  user: User | null
  selectedKelas: ClassInfo | null
  classMembers: ClassMemberInfo[]
  currentPage: PageView
  
  // Auth actions
  setUser: (user: User | null) => void
  setSelectedKelas: (kelas: ClassInfo | null) => void
  setClassMembers: (members: ClassMemberInfo[]) => void
  setCurrentPage: (page: PageView) => void
  logout: () => void
  
  // Helper
  isAdmin: () => boolean
  isRoisAm: () => boolean
  isKetuaFanIlmu: () => boolean
  getMyRole: () => MemberRole | null
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      selectedKelas: null,
      classMembers: [],
      currentPage: 'login',

      setUser: (user) => set({ user }),
      setSelectedKelas: (kelas) => set({ selectedKelas: kelas }),
      setClassMembers: (members) => set({ classMembers: members }),
      setCurrentPage: (page) => set({ currentPage: page }),
      logout: () => set({ user: null, selectedKelas: null, classMembers: [], currentPage: 'login' }),
      
      isAdmin: () => get().user?.role === 'ADMIN',
      isRoisAm: () => {
        const state = get()
        return state.classMembers.some(m => m.userId === state.user?.id && m.role === 'ROIS_AM')
      },
      isKetuaFanIlmu: () => {
        const state = get()
        return state.classMembers.some(m => m.userId === state.user?.id && m.role === 'KETUA_FAN_ILMU')
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
