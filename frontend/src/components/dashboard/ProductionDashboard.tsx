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
import Link from 'next/link'
import type { DashboardSummary } from '@/types'

const COLORS = ['#2f6fed', '#3bb978', '#fb970f', '#8b45dd']

function formatNumber(value: string | number, digits = 0) {
  return Number(value || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function periodLabel() {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const fmt = (date: Date) => date.toLocaleDateString('fr-FR')
  return `Du ${fmt(first)} au ${fmt(last)}`
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

export default function ProductionDashboard({ summary }: { summary: DashboardSummary | null }) {
  const data: DashboardSummary = summary || {
    kpis: { produced_quantity: '0', average_unit_cost: '0', total_production_cost: '0', margin_rate: '0' },
    production_evolution: [],
    cost_breakdown: [],
    recent_productions: [],
    product_costs: [],
  }
  const evolution = data.production_evolution
  const previous = evolution[evolution.length - 2]?.quantity || 0
  const current = evolution[evolution.length - 1]?.quantity || 0
  const productionTrend = previous > 0 ? ((current - previous) / previous) * 100 : null
  const totalBreakdown = data.cost_breakdown.reduce((sum, item) => sum + Number(item.value || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-[29px] font-bold leading-tight text-[#0b1e3b]">Tableau de bord</h1>
          <p className="mt-1 text-sm text-slate-600">Bienvenue dans votre système de suivi de production et de gestion des coûts de revient.</p>
        </div>
        <div className="flex h-12 items-center gap-3 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm">
          <CalendarDays className="h-5 w-5 text-slate-500" />
          <span>{periodLabel()}</span>
        </div>
      </div>

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
            {evolution.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolution} margin={{ top: 8, right: 18, left: 4, bottom: 0 }}>
                  <CartesianGrid stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#dbe2ea' }} />
                  <YAxis tick={{ fill: '#475569', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [`${formatNumber(Number(value))} unités`, 'Quantité produite']} />
                  <Line type="monotone" dataKey="quantity" stroke="#2f6fed" strokeWidth={2.5} dot={{ r: 4, fill: '#2f6fed' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-sm text-slate-400">Aucune production enregistrée.</div>}
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
            ) : <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">Aucun coût calculé.</div>}
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
