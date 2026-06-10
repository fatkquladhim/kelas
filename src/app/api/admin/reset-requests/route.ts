import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof Response) return auth

    const requests = await db.resetPasswordRequest.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('List reset requests error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { id, action } = body // action: 'APPROVE' or 'REJECT'

    if (!id || !action) {
      return NextResponse.json(
        { error: 'id and action are required' },
        { status: 400 }
      )
    }

    const resetReq = await db.resetPasswordRequest.findUnique({
      where: { id },
    })

    if (!resetReq) {
      return NextResponse.json({ error: 'Reset request not found' }, { status: 404 })
    }

    if (action === 'APPROVE') {
      const defaultPassword = 'default123'
      const hashedPassword = await hashPassword(defaultPassword)

      // Update password and status
      await db.$transaction([
        db.user.update({
          where: { id: resetReq.userId },
          data: { password: hashedPassword },
        }),
        db.resetPasswordRequest.update({
          where: { id },
          data: { status: 'APPROVED' },
        }),
      ])

      return NextResponse.json({
        message: `Password berhasil direset menjadi '${defaultPassword}'`,
      })
    } else if (action === 'REJECT') {
      await db.resetPasswordRequest.update({
        where: { id },
        data: { status: 'REJECTED' },
      })
      return NextResponse.json({ message: 'Permohonan reset ditolak' })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Update reset request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof Response) return auth

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id parameter is required' }, { status: 400 })
    }

    await db.resetPasswordRequest.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Reset request deleted' })
  } catch (error) {
    console.error('Delete reset request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
