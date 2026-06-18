import { AlertTriangle, Factory, Gauge } from 'lucide-react'
import { fetchResponsableDashboardData } from '@/lib/dashboard/queries'
import { formatNumber, formatDate } from '@/lib/dashboard/format'
import { STOCK_CRITICAL_THRESHOLD } from '@/lib/dashboard/constants'
import KpiCard from '@/components/dashboard/ui/KpiCard'
import ChartCard from '@/components/dashboard/ui/ChartCard'
import EmptyTableRow from '@/components/dashboard/ui/EmptyTableRow'
import VolumeLineChart from '@/components/dashboard/charts/VolumeLineChart'
import StockBarChart from '@/components/dashboard/charts/StockBarChart'
import { cardBase } from '@/lib/dashboard/design'

export default async function ResponsableOverview() {
  const data = await fetchResponsableDashboardData()

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Alertes stock critique"
          value={String(data.kpis.criticalStockCount)}
          subtext={`Seuil : < ${STOCK_CRITICAL_THRESHOLD} unités`}
          icon={AlertTriangle}
          accent={data.kpis.criticalStockCount > 0 ? 'rose' : 'emerald'}
        />
        <KpiCard
          label="Lots en cours"
          value={String(data.kpis.lotsEnCours)}
          icon={Factory}
          accent="amber"
        />
        <KpiCard
          label="Rendement global"
          value={`${data.kpis.rendement} %`}
          subtext="Bouteilles terminées / total"
          icon={Gauge}
          accent="indigo"
        />
      </div>

      {data.criticalStock.length > 0 && (
        <div className="rounded-lg border border-rose-100 bg-rose-50/80 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-600">
            Composants en alerte
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {data.criticalStock.map((c) => (
              <li
                key={c.id}
                className="rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-800"
              >
                {c.nom} : {formatNumber(Number(c.stock_actuel), 1)} {c.unite_mesure}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Volume de vin produit" subtitle="Litres par mois (lots terminés)">
          <VolumeLineChart data={data.volumeData} />
        </ChartCard>

        <ChartCard title="État des stocks" subtitle="Matières premières principales">
          <StockBarChart data={data.stockData} />
        </ChartCard>
      </div>

      <div className={`${cardBase} overflow-hidden`}>
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900">
            Lots de production en cours
          </h3>
          <p className="text-xs text-slate-500">Suivi en temps réel</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">N° Lot</th>
                <th className="px-5 py-3">Produit</th>
                <th className="px-5 py-3">Opérateur</th>
                <th className="px-5 py-3">Quantité</th>
                <th className="px-5 py-3">Progression</th>
                <th className="px-5 py-3">Début</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.activeLotsRows.length === 0 ? (
                <EmptyTableRow colSpan={6} />
              ) : (
                data.activeLotsRows.map((lot) => (
                  <tr key={lot.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-800">
                      {lot.numeroLot}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{lot.produit}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {lot.operateur}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {lot.quantite} btl.
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 max-w-[120px] overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-700 transition-all"
                            style={{ width: `${lot.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold tabular-nums text-slate-500">
                          {lot.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {formatDate(lot.dateProduction)}
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
