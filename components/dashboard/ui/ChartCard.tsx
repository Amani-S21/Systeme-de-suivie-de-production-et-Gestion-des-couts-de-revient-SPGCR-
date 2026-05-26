import { cardBase, cardPadding } from '@/lib/dashboard/design'

interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export default function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <div className={`${cardBase} ${cardPadding}`}>
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
