'use client'

import { useMemo, useState } from 'react'
import {
  ScrollText, Search, ArrowUpDown, Calendar,
} from 'lucide-react'
import PageHeader from '@/components/dashboard/ui/PageHeader'
import ExportButtons from '@/components/dashboard/ui/ExportButtons'
import { exportToCsv, exportToPrint } from '@/lib/dashboard/export'
import type { ActionType, LogRow } from '@/types/dashboard-ui'

interface Props {
  logs: LogRow[]
}

const ACTION_GROUPS: Record<string, ActionType[]> = {
  Connexions: ['CONNEXION', 'DECONNEXION'],
  Production: ['CREATION_LOT', 'CLOTURE_LOT', 'CREATION_FORMULE'],
  Stocks: ['AJUSTEMENT_STOCK', 'CREATION_COMPOSANT'],
  Sécurité: ['ACTIVATION_COMPTE', 'DESACTIVATION_COMPTE', 'CHANGEMENT_ROLE', 'SUPPRESSION_UTILISATEUR'],
}

const ACTION_COLORS: Record<ActionType, string> = {
  CONNEXION: 'bg-blue-50 text-blue-700 border-blue-100',
  DECONNEXION: 'bg-slate-50 text-slate-600 border-slate-200',
  CREATION_LOT: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  CLOTURE_LOT: 'bg-teal-50 text-teal-700 border-teal-100',
  AJUSTEMENT_STOCK: 'bg-amber-50 text-amber-700 border-amber-100',
  CREATION_COMPOSANT: 'bg-orange-50 text-orange-700 border-orange-100',
  CREATION_FORMULE: 'bg-purple-50 text-purple-700 border-purple-100',
  ACTIVATION_COMPTE: 'bg-green-50 text-green-700 border-green-100',
  DESACTIVATION_COMPTE: 'bg-rose-50 text-rose-700 border-rose-100',
  CHANGEMENT_ROLE: 'bg-violet-50 text-violet-700 border-violet-100',
  SUPPRESSION_UTILISATEUR: 'bg-red-50 text-red-700 border-red-100',
  AUTRE: 'bg-slate-50 text-slate-600 border-slate-200',
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

type SortKey = 'created_at' | 'action_type' | 'user'
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

export default function HistoriquePageClient({ logs }: Props) {
  const [query, setQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const allowedTypes = useMemo<ActionType[] | null>(() => {
    if (groupFilter === 'all') return null
    return ACTION_GROUPS[groupFilter] ?? null
  }, [groupFilter])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const fromMs = dateFrom ? new Date(dateFrom).getTime() : 0
    const toMs = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : Infinity

    return logs
      .filter((l) => {
        const ts = new Date(l.created_at).getTime()
        if (ts < fromMs || ts > toMs) return false
        if (allowedTypes && !allowedTypes.includes(l.action_type)) return false
        if (q) {
          const name = `${l.profil_prenom ?? ''} ${l.profil_nom ?? ''}`.toLowerCase()
          return name.includes(q) || l.description.toLowerCase().includes(q)
        }
        return true
      })
      .sort((a, b) => {
        const mul = sortDir === 'asc' ? 1 : -1
        if (sortKey === 'action_type') return mul * a.action_type.localeCompare(b.action_type)
        if (sortKey === 'user') {
          const ua = `${a.profil_prenom}${a.profil_nom}`
          const ub = `${b.profil_prenom}${b.profil_nom}`
          return mul * ua.localeCompare(ub)
        }
        return mul * a.created_at.localeCompare(b.created_at)
      })
  }, [logs, query, groupFilter, dateFrom, dateTo, sortKey, sortDir, allowedTypes])

  function handleExportExcel() {
    exportToCsv('historique_activites', filtered.map((l) => ({
      'Date & Heure': fmtDateTime(l.created_at),
      Utilisateur: l.profil_prenom ? `${l.profil_prenom} ${l.profil_nom}` : 'Système',
      'Type d\'action': l.action_type,
      Description: l.description,
    })))
  }
  function handleExportPdf() { exportToPrint('Historique des Activités — SPGCR') }

  return (
    <>
      <PageHeader
        title="Historique & Logs"
        description="Journal chronologique de toutes les activités et événements du système SPGCR."
      />

      {/* Table card */}
      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-3">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            {/* Search */}
            <div className="relative min-w-[180px] flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par utilisateur ou mot-clé…"
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
            </div>

            {/* Group filter */}
            <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100">
              <option value="all">Tous les types</option>
              {Object.keys(ACTION_GROUPS).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            {/* Date range */}
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100" />
              <span className="text-xs text-slate-400">→</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>

            <ExportButtons onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ScrollText className="h-3.5 w-3.5" />
            <span className="font-semibold text-slate-700">{filtered.length}</span>
            / {logs.length} événement{logs.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Table */}
        {logs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <ScrollText className="h-10 w-10 text-slate-200" />
            <p className="font-medium text-slate-600">Aucun événement enregistré</p>
            <p className="text-sm text-slate-400">Les activités s'afficheront ici dès qu'elles seront journalisées.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3">
                    <SortBtn col="Date & Heure" active={sortKey==='created_at'} dir={sortDir} onClick={()=>toggleSort('created_at')}/>
                  </th>
                  <th className="px-5 py-3">
                    <SortBtn col="Utilisateur" active={sortKey==='user'} dir={sortDir} onClick={()=>toggleSort('user')}/>
                  </th>
                  <th className="px-5 py-3">
                    <SortBtn col="Type d'action" active={sortKey==='action_type'} dir={sortDir} onClick={()=>toggleSort('action_type')}/>
                  </th>
                  <th className="px-5 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">
                      Aucun log ne correspond aux filtres sélectionnés.
                    </td>
                  </tr>
                ) : (
                  filtered.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-5 py-3.5 text-xs tabular-nums text-slate-500 whitespace-nowrap">
                        {fmtDateTime(log.created_at)}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {log.profil_prenom
                          ? `${log.profil_prenom} ${log.profil_nom}`
                          : <span className="italic text-slate-400">Système</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${ACTION_COLORS[log.action_type]}`}>
                          {log.action_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-xs">
                        {log.description}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
