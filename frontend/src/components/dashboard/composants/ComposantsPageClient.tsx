'use client'

import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from '@/router'
import {
  Plus, Search, ArrowUpDown, Eye, Pencil, Trash2,
} from 'lucide-react'
import PageHeader from '@/components/dashboard/ui/PageHeader'
import PrimaryButton from '@/components/dashboard/ui/PrimaryButton'
import ExportButtons from '@/components/dashboard/ui/ExportButtons'
import ConfirmDeleteModal from '@/components/dashboard/ui/ConfirmDeleteModal'
import { cardBase } from '@/lib/dashboard/design'
import { formatCurrency, formatNumber } from '@/lib/dashboard/format'
import { exportToCsv, exportToPrint } from '@/lib/dashboard/export'
import type { ComposantRow } from '@/lib/dashboard/queries/composants-page'
import AdjustStockModal from '@/components/dashboard/composants/AdjustStockModal'
import DetailModal from '@/components/dashboard/ui/DetailModal'
import { api } from '@/api'

interface ComposantsPageClientProps {
  composants: ComposantRow[]
}

const CATEGORIE_LABELS: Record<string, string> = {
  matiere_premiere: 'Matière première',
  intrant: 'Intrant',
  emballage: 'Emballage',
  charge_indirecte: 'Charge indirecte',
}

type SortKey = 'nom' | 'stock_actuel' | 'cout_unitaire_moyen_pondere'
type SortDir = 'asc' | 'desc'

function SortBtn({ col, active, dir, onClick }: {
  col: string; active: boolean; dir: SortDir; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
    >
      {col}
      <ArrowUpDown
        className={`h-3 w-3 transition-opacity ${active ? 'opacity-100 text-blue-500' : 'opacity-30'}`}
      />
    </button>
  )
}

export default function ComposantsPageClient({ composants }: ComposantsPageClientProps) {
  const searchParams = useSearchParams()
  const [modalOpen, setModalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [categorie, setCategorie] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('nom')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [viewId, setViewId] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<ComposantRow | null>(null)

  useEffect(() => {
    if (searchParams.get('action') === 'adjust') setModalOpen(true)
  }, [searchParams])

  useEffect(() => {
    const s = searchParams.get('search')
    if (s) setQuery(s)
  }, [searchParams])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const categories = useMemo(() => {
    const seen = new Set(composants.map((c) => c.categorie))
    return Array.from(seen)
  }, [composants])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return composants
      .filter((c) => {
        const catOk = categorie === 'all' || c.categorie === categorie
        const qOk = !q || c.nom.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
        return catOk && qOk
      })
      .sort((a, b) => {
        const mul = sortDir === 'asc' ? 1 : -1
        if (sortKey === 'nom') return mul * a.nom.localeCompare(b.nom)
        return mul * (Number(a[sortKey]) - Number(b[sortKey]))
      })
  }, [composants, query, categorie, sortKey, sortDir])

  const viewTarget = viewId ? composants.find((c) => c.id === viewId) : null

  function handleExportExcel() {
    exportToCsv('composants_stocks', filtered.map((c) => ({
      Code: c.code,
      Nom: c.nom,
      Catégorie: CATEGORIE_LABELS[c.categorie] ?? c.categorie,
      'Stock actuel': c.stock_actuel,
      Unité: c.unite_mesure,
      'CUMP ($)': c.cout_unitaire_moyen_pondere,
    })))
  }

  function handleExportPdf() {
    exportToPrint('Composants & Stocks — SPGCR')
  }

  async function handleConfirmDelete() {
    if (deleteId) await api.deleteMaterial(deleteId)
    setDeleteId(null)
    window.dispatchEvent(new CustomEvent('spcr:refresh'))
  }

  return (
    <>
      <PageHeader
        title="Composants & Stocks"
        description="Matières premières, intrants et emballages — suivi des stocks et du coût unitaire moyen pondéré."
        action={
          <PrimaryButton onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Ajouter / Ajuster stock
          </PrimaryButton>
        }
      />

      <div className={`${cardBase} overflow-hidden`}>
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par nom ou code…"
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <select
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Toutes catégories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORIE_LABELS[cat] ?? cat}
                </option>
              ))}
            </select>
          </div>
          <ExportButtons onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">
                  <SortBtn col="Nom" active={sortKey === 'nom'} dir={sortDir} onClick={() => toggleSort('nom')} />
                </th>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Catégorie</th>
                <th className="px-5 py-3">
                  <SortBtn col="Stock actuel" active={sortKey === 'stock_actuel'} dir={sortDir} onClick={() => toggleSort('stock_actuel')} />
                </th>
                <th className="px-5 py-3">Unité</th>
                <th className="px-5 py-3">
                  <SortBtn col="CUMP" active={sortKey === 'cout_unitaire_moyen_pondere'} dir={sortDir} onClick={() => toggleSort('cout_unitaire_moyen_pondere')} />
                </th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
                    Aucun composant ne correspond à votre recherche.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="group transition-colors hover:bg-slate-50/80">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{c.nom}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{c.code}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <span className="inline-flex items-center rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-xs font-medium">
                        {CATEGORIE_LABELS[c.categorie] ?? c.categorie}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold tabular-nums text-slate-900">
                      {formatNumber(Number(c.stock_actuel), 2)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{c.unite_mesure}</td>
                    <td className="px-5 py-3.5 font-semibold tabular-nums text-slate-800">
                      {formatCurrency(Number(c.cout_unitaire_moyen_pondere))}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewId((v) => v === c.id ? null : c.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditTarget(c); setModalOpen(true) }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(c.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DetailModal open={!!viewTarget} title="Détail du composant" onClose={() => setViewId(null)}>
        {viewTarget && <div className="text-sm text-slate-700">
          <p className="font-bold text-slate-900">{viewTarget.nom} <span className="font-mono text-xs text-slate-500">({viewTarget.code})</span></p>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {[
              ['Catégorie', CATEGORIE_LABELS[viewTarget.categorie] ?? viewTarget.categorie],
              ['Stock actuel', `${formatNumber(Number(viewTarget.stock_actuel), 2)} ${viewTarget.unite_mesure}`],
              ['CUMP', formatCurrency(Number(viewTarget.cout_unitaire_moyen_pondere))],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k}</dt>
                <dd className="mt-0.5 font-semibold text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        </div>}
      </DetailModal>

      <AdjustStockModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null) }}
        composants={composants}
        initialComposantId={editTarget?.id}
      />

      <ConfirmDeleteModal
        open={!!deleteId}
        title="Supprimer ce composant ?"
        description="Cette action est irréversible."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  )
}
