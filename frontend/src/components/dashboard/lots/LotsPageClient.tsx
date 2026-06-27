'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from '@/router'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight, Search, Package, CheckCircle2, Clock, XCircle,
  Eye, Pencil, Trash2, ArrowUpDown, Plus,
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
import DetailModal from '@/components/dashboard/ui/DetailModal'
import { api } from '@/api'

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
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  
  useEffect(() => {
    const s = searchParams.get('search')
    if (s) setQuery(s)
  }, [searchParams])

  const [status, setStatus] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('dateLancement')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [newLotOpen, setNewLotOpen] = useState(false)
  const [clotureLotId, setClotureLotId] = useState<string | null>(null)
  const [consulterLotId, setConsulterLotId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'new' && role !== 'operateur_usine') setNewLotOpen(true)
    if (action === 'close') {
      const active = lots.find((lot) => lot.statut === 'en_cours')
      if (active) setClotureLotId(active.id)
    }
  }, [searchParams, role, lots])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const filteredLots = useMemo(() => {
    const q = query.toLowerCase().trim()
    return lots
      .filter((l) => {
        const matchesQuery = !q || l.numeroLot.toLowerCase().includes(q) || l.produitNom.toLowerCase().includes(q)
        const matchesStatus = status === 'all' || l.statut === status
        return matchesQuery && matchesStatus
      })
      .sort((a, b) => {
        const mul = sortDir === 'asc' ? 1 : -1
        if (sortKey === 'dateLancement') {
          return mul * (new Date(a.dateLancement).getTime() - new Date(b.dateLancement).getTime())
        }
        return mul * String(a[sortKey]).localeCompare(String(b[sortKey]))
      })
  }, [lots, query, status, sortKey, sortDir])

  const kpiData = [
    { label: 'Lots Actifs', value: kpis.lotsActifs, icon: Clock, accent: 'amber' as const },
    { label: 'Volume en Cuve', value: kpis.volumeCuve, icon: Package, accent: 'indigo' as const },
    { label: 'Clôtures (Mois)', value: kpis.cloturesCeMois, icon: CheckCircle2, accent: 'emerald' as const },
  ]

  function handleExportCsv() {
    exportToCsv('lots_production', filteredLots.map(l => ({
      'N° Lot': l.numeroLot,
      Produit: l.produitNom,
      Opérateur: l.operateurNom,
      Date: formatDate(l.dateLancement),
      Statut: l.statut,
    })))
  }

  const lotToCloturer = clotureLotId ? lots.find(l => l.id === clotureLotId) : null

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpiData.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Lots de Production</h1>
          <p className="text-sm text-slate-500 font-medium">Suivi en temps réel des ordres de fabrication.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons onExportExcel={handleExportCsv} onExportPdf={() => exportToPrint('Lots de Production — SPCR', filteredLots.map(l => ({ 'N° Lot': l.numeroLot, Produit: l.produitNom, Opérateur: l.operateurNom, Date: formatDate(l.dateLancement), Statut: l.statut })))} />
          {role !== 'operateur_usine' && (
            <button
              onClick={() => setNewLotOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-950/20 transition-all hover:bg-slate-800 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Nouveau Lot
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="bg-slate-50/50 border-b border-slate-100 p-4 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un lot ou un produit..."
              className="h-10 w-full pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:border-slate-300 focus:ring-4 focus:ring-slate-100 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 outline-none transition-all focus:border-slate-300"
            >
              <option value="all">Tous les statuts</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">
                  <SortBtn col="N° Lot" active={sortKey === 'numeroLot'} dir={sortDir} onClick={() => toggleSort('numeroLot')} />
                </th>
                <th className="px-6 py-4">
                  <SortBtn col="Produit" active={sortKey === 'produitNom'} dir={sortDir} onClick={() => toggleSort('produitNom')} />
                </th>
                <th className="px-6 py-4">Opérateur</th>
                <th className="px-6 py-4">
                  <SortBtn col="Date" active={sortKey === 'dateLancement'} dir={sortDir} onClick={() => toggleSort('dateLancement')} />
                </th>
                <th className="px-6 py-4">
                  <SortBtn col="Statut" active={sortKey === 'statut'} dir={sortDir} onClick={() => toggleSort('statut')} />
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20">
                    <EmptyState
                      icon={Package}
                      title="Aucun lot trouvé"
                      description="Réessayez avec un autre numéro de lot ou statut."
                    />
                  </td>
                </tr>
              ) : (
                filteredLots.map((lot) => (
                  <tr key={lot.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">{lot.numeroLot}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{lot.produitNom}</div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase tracking-tight">{lot.produitCode}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{lot.operateurNom}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(lot.dateLancement)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <StatutMeta statut={lot.statut} />
                        <StatutBadge statut={lot.statut} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setConsulterLotId(lot.id)}
                          title="Fiche de production"
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {lot.statut === 'en_cours' && (
                          <button
                            onClick={() => setClotureLotId(lot.id)}
                            title="Clôturer le lot"
                            className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        {role === 'admin_msd' && (
                          <button
                            onClick={() => setDeleteId(lot.id)}
                            title="Supprimer"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DetailModal open={!!consulterLotId} title="Détail du lot de production" onClose={() => setConsulterLotId(null)}>
        {consulterLotId && (
        <div>
          <BomConsumptionPanel
            lot={lots.find(l => l.id === consulterLotId)!}
            bomLines={bomLinesByProduitFiniId[lots.find(l => l.id === consulterLotId)!.produitFiniId] || []}
          />
        </div>
        )}
      </DetailModal>

      {/* Modals */}
      <NouveauLotModal
        open={newLotOpen}
        onClose={() => setNewLotOpen(false)}
        role={role}
        currentUserId={userId}
        produitsFinis={produitsFinis}
        operateurs={operateurs}
      />

      <DetailModal open={!!lotToCloturer} title="Clôturer le lot" onClose={() => setClotureLotId(null)}>
        {lotToCloturer && (
          <ClotureLotForm
            lotId={lotToCloturer.id}
            numeroLot={lotToCloturer.numeroLot}
            productId={lotToCloturer.produitFiniId}
            quantiteProduite={lotToCloturer.quantitePrevue}
            onSuccess={() => { setClotureLotId(null); router.refresh() }}
          />
        )}
      </DetailModal>

      <ConfirmDeleteModal
        open={!!deleteId}
        title="Supprimer le lot ?"
        description="Cette action supprimera également les calculs de prix de revient associés."
        onConfirm={async () => {
          if (deleteId) await api.deleteProduction(deleteId)
          setDeleteId(null)
          window.dispatchEvent(new CustomEvent('spcr:refresh'))
        }}
        onCancel={() => setDeleteId(null)}
      />
    </>
  )
}
