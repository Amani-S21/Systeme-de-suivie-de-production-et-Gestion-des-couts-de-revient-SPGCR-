import type { LotStatut } from '@/types/spgcr'

const config: Record<LotStatut, { label: string; className: string }> = {
  en_cours: {
    label: 'En cours',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  termine: {
    label: 'Terminé',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  annule: {
    label: 'Annulé',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
}

export default function LotStatusBadge({ statut }: { statut: LotStatut }) {
  const { label, className } = config[statut]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${className}`}
    >
      {statut === 'en_cours' && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
      )}
      {label}
    </span>
  )
}
