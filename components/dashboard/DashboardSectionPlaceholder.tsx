import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cardBase, cardPadding } from '@/lib/dashboard/design'

interface DashboardSectionPlaceholderProps {
  title: string
  description: string
  icon: LucideIcon
}

export default function DashboardSectionPlaceholder({
  title,
  description,
  icon: Icon,
}: DashboardSectionPlaceholderProps) {
  return (
    <div className={`${cardBase} ${cardPadding} mx-auto max-w-lg text-center`}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
        <Icon className="h-6 w-6 text-slate-600" />
      </div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la vue d&apos;ensemble
      </Link>
    </div>
  )
}
