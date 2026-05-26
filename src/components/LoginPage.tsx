'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookOpen, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export function LoginPage() {
  const { setUser, setCurrentPage } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Email dan password wajib diisi')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Gagal masuk')
        return
      }

      setUser(data.user)
      if (data.user.role === 'ADMIN') {
        setCurrentPage('admin-dashboard')
      } else {
        setCurrentPage('student-dashboard')
      }
      toast.success('Berhasil masuk! Assalamu\'alaikum.')
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Background Islamic Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2310653a' stroke-width='0.8'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z'/%3E%3Cpath d='M40 10L70 40L40 70L10 40Z'/%3E%3Cpath d='M40 20L60 40L40 60L20 40Z'/%3E%3Ccircle cx='40' cy='40' r='8'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px',
        }}
      />
      {/* Decorative blobs */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10 px-4">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-xl shadow-emerald-200/50 relative">
            <BookOpen className="h-10 w-10 text-white" />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-900" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Sistem Kelas Perkuliahan</h1>
          <p className="text-emerald-600 font-medium mt-1 text-sm">Pesantren Mahasantri</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-emerald-300" />
            <span className="text-xs text-emerald-500 font-arabic">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-emerald-300" />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-100/50 border border-emerald-100/50 p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">Masuk ke Akun</h2>
            <p className="text-sm text-slate-500 mt-1">Masukkan email dan password untuk melanjutkan</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nama@pesantren.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 bg-slate-50/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-11 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20 bg-slate-50/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200/50 transition-all duration-200 font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Belum punya akun?{' '}
              <button
                onClick={() => setCurrentPage('register')}
                className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
              >
                Daftar sekarang
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-xs text-slate-400">
            Persembahan untuk ilmu yang bermanfaat
          </p>
          <p className="text-[10px] text-slate-300">
            Sistem Manajemen Kelas Perkuliahan Pesantren v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
