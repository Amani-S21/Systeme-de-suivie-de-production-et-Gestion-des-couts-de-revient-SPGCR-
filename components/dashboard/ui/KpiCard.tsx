import type { LucideIcon } from 'lucide-react'
import { cardBase } from '@/lib/dashboard/design'

interface KpiCardProps {
  label: string
  value: string
  subtext?: string
  icon: LucideIcon
  accent?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate'
}

const accentStyles = {
  indigo: 'bg-slate-50 text-slate-700 border-slate-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  rose: 'bg-rose-50 text-rose-700 border-rose-100',
  slate: 'bg-slate-50 text-slate-600 border-slate-100',
}

export default function KpiCard({
  label,
  value,
  subtext,
  icon: Icon,
  accent = 'indigo',
}: KpiCardProps) {
  return (
    <div className={`${cardBase} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-bold tabular-nums text-slate-900">
            {value}
          </p>
          {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${accentStyles[accent]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}
