'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight, Search, Package, CheckCircle2, Clock, XCircle,
  Eye, Pencil, Trash2, ArrowUpDown,
} from 'lucide-react'
import KpiCard from '@/components/dashboard/ui/KpiCard'
import EmptyState from '@/components/dashboard/ui/EmptyState'
import ExportButtons from '@/components/dashboard/ui/ExportButtons'
import ConfirmDeleteModal from '@/components/dashboard/ui/ConfirmDeleteModal'
import NouveauLotModal from '@/components/dashboard/quick-actions/NouveauLotModal'
import ClotureLotForm from '@/components/ClotureLotForm'
import type { AppRole, LotStatut } from '@/types/spgcr'
import type {
  OperateurOption,
  ProduitFiniOption,
} from '@/components/dashboard/quick-actions/types'
import { formatDate, formatNumber } from '@/lib/dashboard/format'
import { exportToCsv, exportToPrint } from '@/lib/dashboard/export'

export interface LotRow {
  id: string
  numeroLot: string
  produitFiniId: string
  produitCode: string
  produitNom: string
  volumeLitre: number | null
  operateurNom: string
  quantitePrevue: number
  dateLancement: string
  statut: LotStatut
}

export interface BomLine {
  composantId: string
  composantCode: string
  composantNom: string
  uniteMesure: string
  quantiteRequiseParLitre: number
}

export interface LotsPageClientProps {
  role: AppRole
  userId: string
  lots: LotRow[]
  bomLinesByProduitFiniId: Record<string, BomLine[]>
  produitsFinis: ProduitFiniOption[]
  operateurs: OperateurOption[]
  kpis: {
    lotsActifs: string
    volumeCuve: string
    cloturesCeMois: string
  }
}

type StatusFilter = 'all' | LotStatut
type SortKey = 'numeroLot' | 'produitNom' | 'dateLancement' | 'statut'
type SortDir = 'asc' | 'desc'

function StatutBadge({ statut }: { statut: LotStatut }) {
  const base = 'inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold border'
  switch (statut) {
    case 'en_cours': return <span className={`${base} bg-amber-50 text-amber-700 border-amber-100`}>En cours</span>
    case 'termine':  return <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-100`}>Terminé</span>
    case 'annule':   return <span className={`${base} bg-red-50 text-red-700 border-red-100`}>Annulé</span>
  }
}

function StatutMeta({ statut }: { statut: LotStatut }) {
  if (statut === 'en_cours') return <Clock className="h-3.5 w-3.5 text-amber-500" />
  if (statut === 'termine')  return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
  return <XCircle className="h-3.5 w-3.5 text-red-400" />
}

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

function BomConsumptionPanel({ lot, bomLines }: { lot: LotRow; bomLines: BomLine[] }) {
  const litres = lot.volumeLitre != null ? lot.quantitePrevue * lot.volumeLitre : null
  const computed = bomLines.map((line) => ({
    ...line,
    quantiteTotale: litres != null
      ? line.quantiteRequiseParLitre * litres
      : line.quantiteRequiseParLitre * lot.quantitePrevue,
  }))
  return (
    <div className="rounded-md border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-sm font-bold text-slate-900">Consommation BOM — lot {lot.numeroLot}</p>
      <p className="mt-0.5 text-xs text-slate-500">
        {lot.volumeLitre != null
          ? `Volume produit : ${formatNumber(litres ?? 0, 2)} L`
          : 'Volume non défini — estimation sur quantité de bouteilles'}
      </p>
      {computed.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">Aucune ligne BOM pour ce produit.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-3 py-2">Composant</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Qté totale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {computed.map((c) => (
                <tr key={c.composantId} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2.5 text-slate-800">{c.composantNom}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{c.composantCode}</td>
                  <td className="px-3 py-2.5 tabular-nums text-slate-700">
                    {formatNumber(c.quantiteTotale, 4)} {c.uniteMesure}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function LotsPageClient({
  role, userId, lots, bomLinesByProduitFiniId, produitsFinis, operateurs, kpis,
}: LotsPageClientProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('dateLancement')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [newLotOpen, setNewLotOpen] = useState(false)
  const [clotureLotId, setClotureLotId] = useState<string | null>(null)
  const [consulterLotId, setConsulterLotId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return lots
      .filter((l) => {
        const statOk = status === 'all' || l.statut === status
        const qOk = !q || l.numeroLot.toLowerCase().includes(q) || l.produitNom.toLowerCase().includes(q)
        return statOk && qOk
      })
      .sort((a, b) => {
        const mul = sortDir === 'asc' ? 1 : -1
        if (sortKey === 'dateLancement') return mul * a.dateLancement.localeCompare(b.dateLancement)
        if (sortKey === 'statut') return mul * a.statut.localeCompare(b.statut)
        if (sortKey === 'produitNom') return mul * a.produitNom.localeCompare(b.produitNom)
        return mul * a.numeroLot.localeCompare(b.numeroLot)
      })
  }, [lots, query, status, sortKey, sortDir])

  function handleExportExcel() {
    exportToCsv('lots_production', filtered.map((l) => ({
      'N° Lot': l.numeroLot,
      Produit: l.produitNom,
      Opérateur: l.operateurNom,
      'Qté prévue': l.quantitePrevue,
      'Date lancement': formatDate(l.dateLancement),
      Statut: l.statut,
    })))
  }
  function handleExportPdf() { exportToPrint('Lots de Production — SPGCR') }
  async function handleConfirmDelete() { setDeleteId(null) }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Lots Actifs" value={kpis.lotsActifs} icon={Package} accent="amber" subtext="Statut en_cours" />
        <KpiCard label="Volume en Cuve" value={kpis.volumeCuve} icon={Clock} accent="indigo" subtext="Sur les lots en cours" />
        <KpiCard label="Clôturés (Ce mois)" value={kpis.cloturesCeMois} icon={CheckCircle2} accent="emerald" subtext="Statut termine" />
      </div>

      {/* Filters toolbar */}
      <section className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par numéro de lot ou produit…"
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['all','en_cours','termine','annule'] as const).map((s) => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                    status === s ? 'border-blue-300 bg-blue-50 text-blue-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}>
                  {s === 'all' ? 'Tous' : s === 'en_cours' ? 'En cours' : s === 'termine' ? 'Terminés' : 'Annulés'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ExportButtons onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} />
            <button
              type="button"
              onClick={() => setNewLotOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Lancer un lot
            </button>
          </div>
        </div>
      </section>

      {/* Table */}
      {lots.length === 0 ? (
        <EmptyState icon={Package} title="Aucun lot de production"
          description="Commencez par lancer un nouveau lot." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="Aucun résultat"
          description="Aucun lot ne correspond à votre recherche ou filtre." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
          <table className="min-w-[920px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3"><SortBtn col="N° Lot" active={sortKey==='numeroLot'} dir={sortDir} onClick={()=>toggleSort('numeroLot')}/></th>
                <th className="px-4 py-3"><SortBtn col="Produit" active={sortKey==='produitNom'} dir={sortDir} onClick={()=>toggleSort('produitNom')}/></th>
                <th className="px-4 py-3">Opérateur</th>
                <th className="px-4 py-3">Qté prévue</th>
                <th className="px-4 py-3"><SortBtn col="Date" active={sortKey==='dateLancement'} dir={sortDir} onClick={()=>toggleSort('dateLancement')}/></th>
                <th className="px-4 py-3"><SortBtn col="Statut" active={sortKey==='statut'} dir={sortDir} onClick={()=>toggleSort('statut')}/></th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((lot) => {
                const bomLines = bomLinesByProduitFiniId[lot.produitFiniId] ?? []
                const isClotureOpen = clotureLotId === lot.id
                const isConsulterOpen = consulterLotId === lot.id
                return (
                  <>
                    <tr key={lot.id} className="group transition-colors hover:bg-slate-50/80">
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-800">{lot.numeroLot}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-800">{lot.produitNom}</p>
                        {lot.produitCode && <p className="mt-0.5 font-mono text-xs text-slate-500">{lot.produitCode}</p>}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">{lot.operateurNom}</td>
                      <td className="px-4 py-3.5 tabular-nums text-slate-700">{formatNumber(lot.quantitePrevue, 0)} btl.</td>
                      <td className="px-4 py-3.5 text-slate-600">{formatDate(lot.dateLancement)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <StatutMeta statut={lot.statut} />
                          <StatutBadge statut={lot.statut} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" title="Consulter"
                            onClick={() => { setConsulterLotId((v) => v===lot.id ? null : lot.id); setClotureLotId(null) }}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {lot.statut === 'en_cours' && (
                            <button type="button" title="Clôturer"
                              onClick={() => { setClotureLotId((v) => v===lot.id ? null : lot.id); setConsulterLotId(null) }}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button type="button" title="Supprimer"
                            onClick={() => setDeleteId(lot.id)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {(isClotureOpen || isConsulterOpen) && (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 bg-slate-50/50">
                          {isClotureOpen ? (
                            <ClotureLotForm lotId={lot.id} numeroLot={lot.numeroLot}
                              quantiteProduite={lot.quantitePrevue}
                              onSuccess={() => { setClotureLotId(null); router.refresh() }} />
                          ) : (
                            <BomConsumptionPanel lot={lot} bomLines={bomLines} />
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
          <div className="border-t border-slate-100 px-4 py-2 text-right text-xs text-slate-400">
            {filtered.length} / {lots.length} lot{lots.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <NouveauLotModal open={newLotOpen} onClose={() => setNewLotOpen(false)}
        role={role} currentUserId={userId} produitsFinis={produitsFinis} operateurs={operateurs} />

      <ConfirmDeleteModal open={!!deleteId} title="Supprimer ce lot ?"
        description="Cette action est irréversible. Le lot et ses données de clôture seront définitivement supprimés."
        onConfirm={handleConfirmDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
