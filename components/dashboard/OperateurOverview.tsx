import { Calendar, Factory, Wine } from 'lucide-react'
import { fetchOperateurDashboardData } from '@/lib/dashboard/queries'
import { formatNumber, formatDate } from '@/lib/dashboard/format'
import KpiCard from '@/components/dashboard/ui/KpiCard'
import LotStatusBadge from '@/components/dashboard/ui/LotStatusBadge'
import EmptyTableRow from '@/components/dashboard/ui/EmptyTableRow'
import OperateurQuickActions from '@/components/dashboard/OperateurQuickActions'
import type { LotStatut } from '@/types/spgcr'
import { cardBase } from '@/lib/dashboard/design'

interface OperateurOverviewProps {
  userId: string
}

export default async function OperateurOverview({ userId }: OperateurOverviewProps) {
  const data = await fetchOperateurDashboardData(userId)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Mes lots ce mois-ci"
          value={String(data.kpis.lotsThisMonth)}
          icon={Calendar}
          accent="indigo"
        />
        <KpiCard
          label="Mes lots en cours"
          value={String(data.kpis.lotsEnCours)}
          icon={Factory}
          accent="amber"
        />
        <KpiCard
          label="Bouteilles embouteillées"
          value={formatNumber(data.kpis.totalBouteilles)}
          subtext="Tous lots confondus"
          icon={Wine}
          accent="emerald"
        />
      </div>

      <OperateurQuickActions activeLot={data.activeLot} />

      <div className={`${cardBase} overflow-hidden`}>
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900">
            Mon historique de lots
          </h3>
          <p className="text-xs text-slate-500">Du plus récent au plus ancien</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">N° Lot</th>
                <th className="px-5 py-3">Produit</th>
                <th className="px-5 py-3">Quantité</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.history.length === 0 ? (
                <EmptyTableRow colSpan={5} />
              ) : (
                data.history.map((lot) => (
                  <tr
                    key={lot.id}
                    className="transition-colors hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-800">
                      {lot.numeroLot}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{lot.produit}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {lot.quantite} btl.
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {formatDate(lot.dateProduction)}
                    </td>
                    <td className="px-5 py-3.5">
                      <LotStatusBadge statut={lot.statut as LotStatut} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
