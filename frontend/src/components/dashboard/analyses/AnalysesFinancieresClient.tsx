'use client'

import { useMemo, useState } from 'react'
import {
  TrendingUp, DollarSign, BarChart2, Calendar, ArrowUpDown, Search,
} from 'lucide-react'
import PageHeader from '@/components/dashboard/ui/PageHeader'
import ExportButtons from '@/components/dashboard/ui/ExportButtons'
import { exportToCsv, exportToPrint } from '@/lib/dashboard/export'
import type { AnalysesStats, CoutRevientRow } from '@/types/dashboard-ui'

interface Props {
  rows: CoutRevientRow[]
  stats: AnalysesStats
}

function fmt(n: number, digits = 2) {
  return n.toLocaleString('fr-CD', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

type SortKey = 'numero_lot' | 'produit_nom' | 'cout_direct_matieres' | 'cout_unitaire_theorique' | 'calcule_at'
type SortDir = 'asc' | 'desc'

function SortBtn({ col, active, dir, onClick }: {
  col: string; active: boolean; dir: SortDir; onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors">
      {col}
      <ArrowUpDown className={`h-3 w-3 ${active ? 'opacity-100 text-blue-500' : 'opacity-30'}`} />
    </button>
  )
}

export default function AnalysesFinancieresClient({ rows, stats }: Props) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('calcule_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows
      .filter((r) => !q || r.numero_lot.toLowerCase().includes(q) || r.produit_nom.toLowerCase().includes(q))
      .sort((a, b) => {
        const mul = sortDir === 'asc' ? 1 : -1
        if (sortKey === 'produit_nom') return mul * a.produit_nom.localeCompare(b.produit_nom)
        if (sortKey === 'cout_direct_matieres') return mul * (a.cout_direct_matieres - b.cout_direct_matieres)
        if (sortKey === 'cout_unitaire_theorique') return mul * (a.cout_unitaire_theorique - b.cout_unitaire_theorique)
        if (sortKey === 'calcule_at') return mul * a.calcule_at.localeCompare(b.calcule_at)
        return mul * a.numero_lot.localeCompare(b.numero_lot)
      })
  }, [rows, query, sortKey, sortDir])

  const margeColor =
    stats.marge_globale == null ? 'text-slate-400'
      : stats.marge_globale >= 0 ? 'text-emerald-600' : 'text-rose-600'

  function handleExportExcel() {
    exportToCsv('analyses_financieres', filtered.map((r) => ({
      'N° Lot': r.numero_lot,
      Produit: r.produit_nom,
      'Coût matières ($)': r.cout_direct_matieres,
      'Coût unitaire ($/btl)': r.cout_unitaire_theorique,
      'Date clôture': fmtDate(r.calcule_at),
    })))
  }
  function handleExportPdf() { exportToPrint('Analyses Financières — SPGCR') }

  return (
    <>
      <PageHeader
        title="Analyses Financières"
        description="Tableau de bord des coûts de revient et marges de l’unité industrielle."
      />

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <DollarSign className="h-5 w-5 text-blue-600" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Coût de Revient Moyen</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
              {fmt(stats.cout_moyen)} <span className="text-sm font-medium text-slate-500">$/Bouteille</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Moyenne sur {rows.length} lot{rows.length !== 1 ? 's' : ''} clôturé{rows.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Marge Bénéficiaire Globale</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${margeColor}`}>
              {stats.marge_globale != null ? `${fmt(stats.marge_globale)} %` : '—'}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Basée sur les marges estimées disponibles</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        {/* Header + toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BarChart2 className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800">Détail par Lot de Production</h2>
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
              {filtered.length} / {rows.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher…"
                className="h-8 w-44 rounded-md border border-slate-200 bg-white pl-8 pr-3 text-xs outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <ExportButtons onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <BarChart2 className="h-10 w-10 text-slate-200" />
            <p className="font-medium text-slate-600">Aucune donnée disponible</p>
            <p className="text-sm text-slate-400">Les coûts apparaîtront ici une fois les lots clôturés.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3"><SortBtn col="N° Lot" active={sortKey==='numero_lot'} dir={sortDir} onClick={()=>toggleSort('numero_lot')}/></th>
                  <th className="px-6 py-3"><SortBtn col="Produit" active={sortKey==='produit_nom'} dir={sortDir} onClick={()=>toggleSort('produit_nom')}/></th>
                  <th className="px-6 py-3 text-right"><SortBtn col="Coût Matières ($)" active={sortKey==='cout_direct_matieres'} dir={sortDir} onClick={()=>toggleSort('cout_direct_matieres')}/></th>
                  <th className="px-6 py-3 text-right"><SortBtn col="Coût Unitaire ($/btl)" active={sortKey==='cout_unitaire_theorique'} dir={sortDir} onClick={()=>toggleSort('cout_unitaire_theorique')}/></th>
                  <th className="px-6 py-3">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <SortBtn col="Date Clôture" active={sortKey==='calcule_at'} dir={sortDir} onClick={()=>toggleSort('calcule_at')}/>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-800">{row.numero_lot}</td>
                    <td className="px-6 py-3.5 text-slate-700">{row.produit_nom}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums text-slate-700">{fmt(row.cout_direct_matieres)}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums font-semibold text-slate-900">{fmt(row.cout_unitaire_theorique)}</td>
                    <td className="px-6 py-3.5 text-slate-500">{fmtDate(row.calcule_at)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50/80">
                  <td colSpan={2} className="px-6 py-3 text-xs font-bold text-slate-500">Total / Moyenne</td>
                  <td className="px-6 py-3 text-right tabular-nums text-xs font-bold text-slate-700">
                    {fmt(filtered.reduce((a, r) => a + r.cout_direct_matieres, 0))}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums text-xs font-bold text-blue-700">
                    {fmt(stats.cout_moyen)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
