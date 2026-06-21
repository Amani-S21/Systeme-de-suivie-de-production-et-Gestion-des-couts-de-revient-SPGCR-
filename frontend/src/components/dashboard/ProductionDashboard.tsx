import { useEffect, useState } from 'react'
import {
  BarChart3,
  CalendarDays,
  Database,
  Factory,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Link from '@/router'
import { api } from '@/api'
import type { DashboardSummary, Material, Product, Production } from '@/types'
import type { AppRole } from '@/types/spgcr'

const COLORS = ['#2f6fed', '#3bb978', '#fb970f', '#8b45dd']

function formatNumber(value: string | number, digits = 0) {
  return Number(value || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function inputDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function initialPeriod() {
  const now = new Date()
  return {
    from: inputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: inputDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  }
}

function emptySummary(): DashboardSummary {
  return {
    kpis: { produced_quantity: '0', average_unit_cost: '0', total_production_cost: '0', margin_rate: '0' },
    production_evolution: [],
    cost_breakdown: [
      { name: 'Matières premières', value: 0 },
      { name: "Main d'oeuvre", value: 0 },
      { name: 'Charges indirectes', value: 0 },
      { name: 'Autres charges', value: 0 },
    ],
    recent_productions: [],
    product_costs: [],
    production_status: [
      { name: 'Planifiées', value: 0 },
      { name: 'En cours', value: 0 },
      { name: 'Terminées', value: 0 },
      { name: 'Annulées', value: 0 },
    ],
  }
}

function zeroEvolution(from: string, to: string) {
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  const rows: { month: string; quantity: number }[] = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cursor <= end && rows.length < 12) {
    rows.push({
      month: cursor.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
      quantity: 0,
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return rows.length ? rows : [{ month: 'Période', quantity: 0 }]
}

function KpiCard({ icon: Icon, title, value, unit, color, trend }: {
  icon: typeof Factory
  title: string
  value: string
  unit?: string
  color: string
  trend?: number | null
}) {
  const positive = trend != null && trend >= 0
  return (
    <article className="flex min-h-[138px] items-center gap-5 rounded-md border border-slate-200/80 bg-white px-4 py-5 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
      <div className={`flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full text-white shadow-sm ${color}`}>
        <Icon className="h-7 w-7" />
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-slate-700">{title}</p>
        <p className="mt-1 truncate text-[28px] font-bold leading-none text-slate-950">{value}</p>
        {unit && <p className="mt-1 text-sm text-slate-600">{unit}</p>}
        <p className={`mt-3 flex items-center gap-1 text-xs ${trend == null ? 'text-slate-400' : positive ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend == null ? null : positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {trend == null ? 'Données consolidées' : `${positive ? '+' : ''}${trend.toFixed(1)}% par rapport au mois dernier`}
        </p>
      </div>
    </article>
  )
}

interface Props {
  summary: DashboardSummary | null
  role: AppRole
  userId: string
  products: Product[]
  materials: Material[]
  productions: Production[]
}

export default function ProductionDashboard({ summary, role, userId, products, materials, productions }: Props) {
  const initial = initialPeriod()
  const [dateFrom, setDateFrom] = useState(initial.from)
  const [dateTo, setDateTo] = useState(initial.to)
  const [data, setData] = useState<DashboardSummary>(summary || emptySummary())
  const [loading, setLoading] = useState(false)
  const [filterError, setFilterError] = useState('')

  async function applyFilter() {
    if (!dateFrom || !dateTo || dateFrom > dateTo) {
      setFilterError('La date de début doit précéder la date de fin.')
      return
    }
    setFilterError('')
    setLoading(true)
    try {
      setData(await api.dashboard(dateFrom, dateTo))
    } catch (error) {
      setFilterError(error instanceof Error ? error.message : 'Impossible de filtrer les statistiques.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void applyFilter()
  }, [])

  const evolution = data.production_evolution.length ? data.production_evolution : zeroEvolution(dateFrom, dateTo)
  const previous = evolution[evolution.length - 2]?.quantity || 0
  const current = evolution[evolution.length - 1]?.quantity || 0
  const productionTrend = previous > 0 ? ((current - previous) / previous) * 100 : null
  const totalBreakdown = data.cost_breakdown.reduce((sum, item) => sum + Number(item.value || 0), 0)
  const statusData = data.production_status?.length ? data.production_status : emptySummary().production_status
  const productBarData = data.product_costs.length
    ? data.product_costs
    : [{ product: 'Aucune donnée', unit_cost: 0, evolution: 0 }]

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <h1 className="text-[29px] font-bold leading-tight text-[#0b1e3b]">{role === 'admin_msd' ? 'Tableau de bord administrateur' : 'Pilotage de la production'}</h1>
          <p className="mt-1 text-sm text-slate-600">{role === 'admin_msd' ? 'Vue consolidée du système de production, des coûts et des marges.' : 'Suivi opérationnel des productions, stocks, charges et coûts de revient.'}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="grid grid-cols-1 gap-2 rounded-md border border-slate-200 bg-white p-2 shadow-sm sm:grid-cols-[auto_1fr_1fr_auto] sm:items-end">
            <CalendarDays className="mb-2 hidden h-5 w-5 text-slate-500 sm:block" />
            <label className="grid gap-1 text-[10px] font-bold uppercase text-slate-400">
              Du
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-400" />
            </label>
            <label className="grid gap-1 text-[10px] font-bold uppercase text-slate-400">
              Au
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-400" />
            </label>
            <button type="button" onClick={applyFilter} disabled={loading} className="h-9 rounded-md bg-[#102544] px-4 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Chargement...' : 'Appliquer'}
            </button>
          </div>
        </div>
      </div>

      {filterError && <p className="rounded-md border border-red-100 bg-red-50 px-4 py-2 text-xs font-medium text-red-700">{filterError}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Factory} title="Quantité produite" value={formatNumber(data.kpis.produced_quantity)} unit="unités" color="bg-gradient-to-br from-blue-400 to-blue-600" trend={productionTrend} />
        <KpiCard icon={Database} title="Coût de revient moyen" value={formatNumber(data.kpis.average_unit_cost)} unit="FCFA / unité" color="bg-gradient-to-br from-emerald-400 to-emerald-600" />
        <KpiCard icon={WalletCards} title="Coût total de production" value={formatNumber(data.kpis.total_production_cost)} unit="FCFA" color="bg-gradient-to-br from-amber-400 to-orange-500" />
        <KpiCard icon={BarChart3} title="Marge sur coût" value={`${formatNumber(data.kpis.margin_rate, 1)}%`} color="bg-gradient-to-br from-purple-400 to-purple-600" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-md border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <h2 className="text-lg font-bold text-slate-900">Évolution de la production</h2>
          <div className="mt-4 h-[245px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolution} margin={{ top: 8, right: 18, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#dbe2ea' }} />
                <YAxis domain={[0, 'auto']} tick={{ fill: '#475569', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => [`${formatNumber(Number(value))} unités`, 'Quantité produite']} />
                <Line type="monotone" dataKey="quantity" stroke="#2f6fed" strokeWidth={2.5} dot={{ r: 4, fill: '#2f6fed' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-md border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <h2 className="text-lg font-bold text-slate-900">Répartition des coûts de production</h2>
          <div className="mt-2 flex h-[257px] flex-col items-center sm:flex-row">
            {totalBreakdown > 0 ? (
              <>
                <div className="h-[220px] w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.cost_breakdown} dataKey="value" innerRadius={52} outerRadius={94} stroke="#fff" strokeWidth={2}>
                        {data.cost_breakdown.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => `${formatNumber(Number(value))} FCFA`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid w-full gap-4 sm:w-1/2">
                  {data.cost_breakdown.map((item, index) => (
                    <div key={item.name} className="grid grid-cols-[12px_1fr_auto] items-center gap-3 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                      <span className="text-slate-700">{item.name}</span>
                      <span className="font-medium text-slate-700">{((Number(item.value) / totalBreakdown) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="relative h-[220px] w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[{ name: 'Aucune donnée', value: 1 }]} dataKey="value" innerRadius={52} outerRadius={94} fill="#e2e8f0" stroke="#fff" strokeWidth={2} />
                    </PieChart>
                  </ResponsiveContainer>
                  <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-500">0</span>
                </div>
                <div className="grid w-full gap-4 sm:w-1/2">
                  {emptySummary().cost_breakdown.map((item, index) => (
                    <div key={item.name} className="grid grid-cols-[12px_1fr_auto] items-center gap-3 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[index] }} />
                      <span className="text-slate-700">{item.name}</span>
                      <span className="font-medium text-slate-500">0%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-md border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <h2 className="text-lg font-bold text-slate-900">Productions par statut</h2>
          <div className="mt-4 h-[245px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} />
                <YAxis domain={[0, 'auto']} allowDecimals={false} tick={{ fill: '#475569', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => [`${formatNumber(Number(value))}`, 'Productions']} />
                <Bar dataKey="value" fill="#2f6fed" radius={[4, 4, 0, 0]} maxBarSize={58} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-md border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <h2 className="text-lg font-bold text-slate-900">Coût unitaire par produit</h2>
          <div className="mt-4 h-[245px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productBarData} layout="vertical" margin={{ top: 8, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" domain={[0, 'auto']} tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} />
                <YAxis type="category" dataKey="product" width={105} tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => [`${formatNumber(Number(value))} FCFA`, 'Coût unitaire']} />
                <Bar dataKey="unit_cost" fill="#3bb978" radius={[0, 4, 4, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-md border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Dernières productions enregistrées</h2>
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full min-w-[570px] border-collapse text-sm">
              <thead><tr className="bg-slate-50 text-left text-xs font-bold text-slate-700"><th>Référence</th><th>Produit</th><th>Quantité</th><th>Date</th><th>Action</th></tr></thead>
              <tbody>{data.recent_productions.length ? data.recent_productions.map((row) => (
                <tr key={row.id}><td className="font-medium">{row.reference}</td><td>{row.product}</td><td>{formatNumber(row.quantity)} unités</td><td>{new Date(row.date).toLocaleDateString('fr-FR')}</td><td><Link href={`/dashboard/lots?search=${row.reference}`} className="rounded border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-700">Voir</Link></td></tr>
              )) : <tr><td colSpan={5} className="py-10 text-center text-slate-400">Aucune production enregistrée.</td></tr>}</tbody>
            </table>
          </div>
          <Link href="/dashboard/lots" className="mt-5 inline-flex rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">Voir toutes les productions</Link>
        </article>

        <article className="rounded-md border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Coût de revient par produit</h2>
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead><tr className="bg-slate-50 text-left text-xs font-bold text-slate-700"><th>Produit</th><th className="text-center">Coût de revient (FCFA/unité)</th><th className="text-center">Évolution</th></tr></thead>
              <tbody>{data.product_costs.length ? data.product_costs.map((row) => (
                <tr key={row.product}><td className="font-medium">{row.product}</td><td className="text-center">{formatNumber(row.unit_cost)}</td><td className={`text-center font-medium ${row.evolution > 0 ? 'text-red-600' : row.evolution < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{row.evolution > 0 ? '↑' : row.evolution < 0 ? '↓' : '–'} {Math.abs(row.evolution).toFixed(1)}%</td></tr>
              )) : <tr><td colSpan={3} className="py-10 text-center text-slate-400">Aucun coût par produit disponible.</td></tr>}</tbody>
            </table>
          </div>
          <Link href="/dashboard/analyses" className="mt-5 inline-flex rounded-md border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">Voir le détail des coûts</Link>
        </article>
      </section>
    </div>
  )
}
