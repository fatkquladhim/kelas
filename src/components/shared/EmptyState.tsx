'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="rounded-full bg-emerald-50 p-4 mb-4">
        <Icon className="h-8 w-8 text-emerald-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
