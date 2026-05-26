import type { LucideIcon } from 'lucide-react'
import { cardBase } from '@/lib/dashboard/design'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div
      className={`${cardBase} flex flex-col items-center justify-center border-dashed px-8 py-16 text-center`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
        <Icon className="h-6 w-6 text-slate-500" />
      </div>
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  )
}
