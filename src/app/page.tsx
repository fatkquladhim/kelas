'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { LoginPage } from '@/components/LoginPage'
import { RegisterPage } from '@/components/RegisterPage'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { AdminStudents } from '@/components/admin/AdminStudents'
import { AdminClasses } from '@/components/admin/AdminClasses'
import { AdminMataKuliah } from '@/components/admin/AdminMataKuliah'
import { AdminSyllabus } from '@/components/admin/AdminSyllabus'
import { AdminSchedule } from '@/components/admin/AdminSchedule'
import { AdminRoles } from '@/components/admin/AdminRoles'
import { AdminAttendance } from '@/components/admin/AdminAttendance'
import { StudentDashboard } from '@/components/student/StudentDashboard'
import { StudentSchedule } from '@/components/student/StudentSchedule'
import { StudentSyllabus } from '@/components/student/StudentSyllabus'
import { StudentProgress } from '@/components/student/StudentProgress'
import { StudentAttendance } from '@/components/student/StudentAttendance'
import { RoisDashboard } from '@/components/rois/RoisDashboard'
import { RoisMembers } from '@/components/rois/RoisMembers'
import { RoisKelompok } from '@/components/rois/RoisKelompok'
import { StudentKelompok } from '@/components/student/StudentKelompok'
import { KetuaCapaianMateri } from '@/components/ketua-fan-ilmu/KetuaCapaianMateri'
import { AdminPengumuman } from '@/components/admin/AdminPengumuman'
import { PengumumanList } from '@/components/student/PengumumanList'
import { ProfilePage } from '@/components/shared/ProfilePage'
import { Loader2 } from 'lucide-react'

function PageContent() {
  const { currentPage } = useAppStore()

  switch (currentPage) {
    case 'admin-dashboard':
      return <AdminDashboard />
    case 'admin-students':
      return <AdminStudents />
    case 'admin-classes':
      return <AdminClasses />
    case 'admin-matakuliah':
      return <AdminMataKuliah />
    case 'admin-syllabus':
      return <AdminSyllabus />
    case 'admin-schedule':
      return <AdminSchedule />
    case 'admin-roles':
      return <AdminRoles />
    case 'admin-kehadiran':
      return <AdminAttendance />
    case 'student-dashboard':
      return <StudentDashboard />
    case 'student-schedule':
      return <StudentSchedule />
    case 'student-syllabus':
      return <StudentSyllabus />
    case 'student-progress':
      return <StudentProgress />
    case 'student-kehadiran':
      return <StudentAttendance />
    case 'rois-dashboard':
      return <RoisDashboard />
    case 'rois-members':
      return <RoisMembers />
    case 'rois-kelompok':
      return <RoisKelompok />
    case 'student-kelompok':
      return <StudentKelompok />
    case 'ketua-capaian':
      return <KetuaCapaianMateri />
    case 'admin-pengumuman':
      return <AdminPengumuman />
    case 'pengumuman':
      return <PengumumanList />
    case 'profile':
      return <ProfilePage />
    default:
      return <StudentDashboard />
  }
}

export default function Home() {
  const { user, currentPage, setUser, logout, loadClassesAndMembers } = useAppStore()
  const [authChecked, setAuthChecked] = useState(false)

  // Check auth on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Load class data once user is authenticated
  useEffect(() => {
    if (user) {
      loadClassesAndMembers()
    }
  }, [user])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data.user && data.user.isActive) {
          setUser(data.user)
          if (currentPage === 'login' || currentPage === 'register') {
            const page = data.user.role === 'ADMIN' ? 'admin-dashboard' : 'student-dashboard'
            useAppStore.getState().setCurrentPage(page)
          }
        } else if (data.user && !data.user.isActive) {
          logout()
          useAppStore.getState().setCurrentPage('login')
        }
      } else {
        logout()
      }
    } catch {
      logout()
    } finally {
      setAuthChecked(true)
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500">Memuat...</p>
        </div>
      </div>
    )
  }

  // Auth pages (no layout)
  if (!user || currentPage === 'login' || currentPage === 'register') {
    if (currentPage === 'register') {
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key="register"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <RegisterPage />
          </motion.div>
        </AnimatePresence>
      )
    }
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="login"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <LoginPage />
        </motion.div>
      </AnimatePresence>
    )
  }

  // Main layout with sidebar
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="p-4 lg:p-6 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <PageContent />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
