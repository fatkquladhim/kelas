import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth

    const kelasList = await db.kelas.findMany({
      orderBy: [{ tahunAjaran: 'desc' }, { semester: 'desc' }],
      select: { id: true, name: true, semester: true, tahunAjaran: true },
    })

    return NextResponse.json({ kelas: kelasList })
  } catch (error) {
    console.error('List kelas error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
