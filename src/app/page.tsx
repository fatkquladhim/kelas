'use client'

import { useEffect, useState, useCallback } from 'react'
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
import { StudentDashboard } from '@/components/student/StudentDashboard'
import { StudentSchedule } from '@/components/student/StudentSchedule'
import { StudentSyllabus } from '@/components/student/StudentSyllabus'
import { StudentProgress } from '@/components/student/StudentProgress'
import { RoisDashboard } from '@/components/rois/RoisDashboard'
import { RoisMembers } from '@/components/rois/RoisMembers'
import { Loader2 } from 'lucide-react'
import type { ClassInfo, ClassMemberInfo } from '@/lib/store'

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
    case 'student-dashboard':
      return <StudentDashboard />
    case 'student-schedule':
      return <StudentSchedule />
    case 'student-syllabus':
      return <StudentSyllabus />
    case 'student-progress':
      return <StudentProgress />
    case 'rois-dashboard':
      return <RoisDashboard />
    case 'rois-members':
      return <RoisMembers />
    default:
      return <StudentDashboard />
  }
}

export default function Home() {
  const { user, currentPage, setUser, setSelectedKelas, setClassMembers, logout } = useAppStore()
  const [authChecked, setAuthChecked] = useState(false)
  const [classDataLoaded, setClassDataLoaded] = useState(false)

  // Check auth on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Load class data once user is authenticated
  useEffect(() => {
    if (user && !classDataLoaded) {
      loadClassData()
    }
  }, [user, classDataLoaded])

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

  const loadClassData = async () => {
    if (!user) return
    try {
      // Fetch all classes (admin endpoint works for all authenticated users)
      const kelasRes = await fetch('/api/admin/kelas')
      if (kelasRes.ok) {
        const kelasData = await kelasRes.json()
        const classes: ClassInfo[] = kelasData.kelas || []

        if (classes.length > 0) {
          // Auto-select first class
          const firstClass = classes[0]
          setSelectedKelas(firstClass)

          // Load class members
          const membersRes = await fetch(`/api/admin/kelas/${firstClass.id}/members`)
          if (membersRes.ok) {
            const membersData = await membersRes.json()
            const members: ClassMemberInfo[] = (membersData.members || []).map(
              (m: { id: string; userId: string; user: { name: string; email: string }; role: string; kelasId: string }) => ({
                id: m.id,
                userId: m.userId,
                userName: m.user.name,
                userEmail: m.user.email,
                role: m.role as ClassMemberInfo['role'],
                kelasId: m.kelasId,
              })
            )
            setClassMembers(members)
          }
        }
      }
    } catch {
      // silent - class data loading is not critical
    } finally {
      setClassDataLoaded(true)
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
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="p-4 lg:p-6">
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
