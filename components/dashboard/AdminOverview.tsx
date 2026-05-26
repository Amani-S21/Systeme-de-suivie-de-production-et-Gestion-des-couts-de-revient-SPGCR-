import {
  DollarSign,
  TrendingUp,
  PackageCheck,
  Receipt,
} from 'lucide-react'
import { fetchAdminDashboardData } from '@/lib/dashboard/queries'
import { formatCurrency, formatDate } from '@/lib/dashboard/format'
import KpiCard from '@/components/dashboard/ui/KpiCard'
import ChartCard from '@/components/dashboard/ui/ChartCard'
import LotStatusBadge from '@/components/dashboard/ui/LotStatusBadge'
import EmptyTableRow from '@/components/dashboard/ui/EmptyTableRow'
import CostEvolutionChart from '@/components/dashboard/charts/CostEvolutionChart'
import CostBreakdownPie from '@/components/dashboard/charts/CostBreakdownPie'
import type { LotStatut } from '@/types/spgcr'
import { cardBase } from '@/lib/dashboard/design'

export default async function AdminOverview() {
  const data = await fetchAdminDashboardData()

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Coût de revient moyen / bouteille"
          value={formatCurrency(data.kpis.avgUnitCost)}
          subtext="Sur les lots terminés"
          icon={DollarSign}
          accent="indigo"
        />
        <KpiCard
          label="Marge brute totale estimée"
          value={formatCurrency(data.kpis.totalMarge)}
          icon={TrendingUp}
          accent="emerald"
        />
        <KpiCard
          label="Lots clôturés"
          value={String(data.kpis.lotsClotures)}
          icon={PackageCheck}
          accent="amber"
        />
        <KpiCard
          label="Charges indirectes imputées"
          value={formatCurrency(data.kpis.totalChargesIndirectes)}
          icon={Receipt}
          accent="slate"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Évolution coût vs marge"
          subtitle="6 derniers lots terminés"
        >
          <CostEvolutionChart data={data.evolutionData} />
        </ChartCard>

        <ChartCard
          title="Répartition des coûts"
          subtitle={
            data.latestLotLabel
              ? `Dernier lot : ${data.latestLotLabel}`
              : 'En attente de données — valeurs à 0'
          }
        >
          <CostBreakdownPie data={data.breakdownData} />
        </ChartCard>
      </div>

      <div className={`${cardBase} overflow-hidden`}>
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900">
            5 derniers lots calculés
          </h3>
          <p className="text-xs text-slate-500">Coût unitaire théorique et statut</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">N° Lot</th>
                <th className="px-5 py-3">Quantité</th>
                <th className="px-5 py-3">Coût unitaire</th>
                <th className="px-5 py-3">Calculé le</th>
                <th className="px-5 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentLots.length === 0 ? (
                <EmptyTableRow colSpan={5} />
              ) : (
                data.recentLots.map((lot) => (
                  <tr
                    key={lot.id}
                    className="transition-colors hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-800">
                      {lot.numeroLot}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {lot.quantite} btl.
                    </td>
                    <td className="px-5 py-3.5 font-bold tabular-nums text-slate-900">
                      {formatCurrency(lot.coutUnitaire)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {formatDate(lot.calculeAt)}
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
