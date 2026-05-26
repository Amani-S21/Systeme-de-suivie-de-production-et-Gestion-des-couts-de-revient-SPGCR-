'use client'

import type { LucideIcon } from 'lucide-react'
import { ArrowRight, CheckCircle2, Lock } from 'lucide-react'

export interface WorkflowActionButtonProps {
  step: number
  title: string
  hint: string
  icon: LucideIcon
  onClick?: () => void
  locked?: boolean
  lockedLabel?: string
}

const actionButtonClass =
  'group flex w-full items-center gap-4 rounded-md border border-slate-200 bg-white px-4 py-3.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:border-slate-200 disabled:hover:shadow-sm'

export default function WorkflowActionButton({
  step,
  title,
  hint,
  icon: Icon,
  onClick,
  locked = false,
  lockedLabel = 'Configuré par la direction',
}: WorkflowActionButtonProps) {
  if (locked) {
    return (
      <div
        className="flex w-full items-center gap-4 rounded-md border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3.5 text-left"
        aria-disabled
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
          {step}
        </span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-100 bg-white text-slate-400">
          <Lock className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-500">{title}</span>
          <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            {lockedLabel}
          </span>
        </span>
      </div>
    )
  }

  return (
    <button type="button" onClick={onClick} className={actionButtonClass}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
        {step}
      </span>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-slate-700 transition-colors group-hover:border-blue-100 group-hover:bg-blue-50 group-hover:text-blue-700">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900 group-hover:text-slate-800">
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{hint}</span>
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-slate-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-blue-600"
        aria-hidden
      />
    </button>
  )
}

export function WorkflowConnector() {
  return (
    <div
      className="hidden shrink-0 items-center justify-center md:flex md:px-1"
      aria-hidden
    >
      <ArrowRight className="h-4 w-4 text-slate-300" />
    </div>
  )
}
