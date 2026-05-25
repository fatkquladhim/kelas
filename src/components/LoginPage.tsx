'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Loader2, Eye, EyeOff } from 'lucide-react'
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 mb-4 shadow-lg shadow-emerald-200">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Sistem Kelas Perkuliahan</h1>
          <p className="text-slate-500 mt-1">Pesantren Mahasantri</p>
        </div>

        <Card className="shadow-xl border-0 shadow-emerald-100">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Masuk ke Akun</CardTitle>
            <CardDescription className="text-center">
              Masukkan email dan password untuk melanjutkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@pesantren.ac.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Daftar sekarang
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6">
          Bismillahirrahmanirrahim — Persembahan untuk ilmu yang bermanfaat
        </p>
      </div>
    </div>
  )
}
