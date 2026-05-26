'use client'

import { useMemo, useState } from 'react'
import {
  Layers, Plus, Search, ArrowUpDown, Eye, Pencil, Trash2,
} from 'lucide-react'
import PageHeader from '@/components/dashboard/ui/PageHeader'
import PrimaryButton from '@/components/dashboard/ui/PrimaryButton'
import ExportButtons from '@/components/dashboard/ui/ExportButtons'
import ConfirmDeleteModal from '@/components/dashboard/ui/ConfirmDeleteModal'
import { cardBase } from '@/lib/dashboard/design'
import { exportToCsv, exportToPrint } from '@/lib/dashboard/export'
import type { FormuleRow } from '@/lib/dashboard/queries/nomenclatures-page'
import NouvelleFormuleModal from '@/components/dashboard/nomenclatures/NouvelleFormuleModal'

const UNITE_LABELS: Record<string, string> = {
  bouteille: 'Bouteille',
  carton: 'Carton',
}

interface Props {
  formules: FormuleRow[]
  produitsFinis: {
    id: string; code: string; nom: string
    volume_litre: number | null; unite_commerciale?: string | null
  }[]
  composants: { id: string; code: string; nom: string; unite_mesure: string }[]
}

type SortKey = 'produit_nom' | 'produit_code' | 'lignes'
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

export default function NomenclaturesPageClient({ formules, produitsFinis, composants }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('produit_nom')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [viewId, setViewId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return formules
      .filter((f) => !q || f.produit_nom.toLowerCase().includes(q) || f.produit_code.toLowerCase().includes(q))
      .sort((a, b) => {
        const mul = sortDir === 'asc' ? 1 : -1
        if (sortKey === 'produit_code') return mul * a.produit_code.localeCompare(b.produit_code)
        if (sortKey === 'lignes') return mul * (a.lignes.length - b.lignes.length)
        return mul * a.produit_nom.localeCompare(b.produit_nom)
      })
  }, [formules, query, sortKey, sortDir])

  const viewTarget = viewId ? formules.find((f) => f.produit_fini_id === viewId) : null

  function handleExportExcel() {
    exportToCsv('catalogue_recettes', filtered.map((f) => ({
      SKU: f.produit_code,
      Produit: f.produit_nom,
      Format: f.unite_commerciale ? (UNITE_LABELS[f.unite_commerciale] ?? f.unite_commerciale) : '—',
      'Volume (L)': f.volume_litre ?? '—',
      'Nb intrants': f.lignes.length,
      Recette: f.lignes.map((l) => `${l.composant_nom} ×${l.quantite_requise}${l.unite_mesure}`).join(' | '),
    })))
  }
  function handleExportPdf() { exportToPrint('Catalogue & Recettes — SPGCR') }
  async function handleConfirmDelete() { setDeleteId(null) }

  return (
    <>
      <PageHeader
        title="Catalogue & Recettes"
        description="Vue fusionnée : chaque produit fini et sa nomenclature BOM sur une seule ligne."
        action={
          <PrimaryButton onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Créer un Produit &amp; sa Recette
          </PrimaryButton>
        }
      />

      <div className={`${cardBase} overflow-hidden`}>
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom de produit ou SKU…"
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <ExportButtons onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} />
        </div>

        {/* Table */}
        {formules.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-8 py-16 text-center">
            <Layers className="h-10 w-10 text-slate-300" />
            <p className="font-medium text-slate-700">Aucun produit configuré</p>
            <p className="text-sm text-slate-500">Créez votre premier produit fini et sa recette BOM.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3"><SortBtn col="SKU" active={sortKey==='produit_code'} dir={sortDir} onClick={()=>toggleSort('produit_code')}/></th>
                  <th className="px-5 py-3"><SortBtn col="Produit Fini" active={sortKey==='produit_nom'} dir={sortDir} onClick={()=>toggleSort('produit_nom')}/></th>
                  <th className="px-5 py-3">Format</th>
                  <th className="px-5 py-3"><SortBtn col="Recette" active={sortKey==='lignes'} dir={sortDir} onClick={()=>toggleSort('lignes')}/></th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">Aucun résultat.</td></tr>
                ) : (
                  filtered.map((f) => (
                    <tr key={f.produit_fini_id} className="group align-top transition-colors hover:bg-slate-50/80">
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-800">{f.produit_code}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{f.produit_nom}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
                          {f.unite_commerciale ? (UNITE_LABELS[f.unite_commerciale] ?? f.unite_commerciale) : '—'}
                          {f.volume_litre != null && <span className="font-normal text-slate-400">· {f.volume_litre} L</span>}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {f.lignes.length === 0 ? (
                          <span className="text-xs italic text-slate-400">Aucune recette</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {f.lignes.map((l) => (
                              <span key={l.id}
                                className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800">
                                {l.composant_nom}
                                <span className="text-blue-400">× {l.quantite_requise} {l.unite_mesure}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" title="Consulter"
                            onClick={() => setViewId((v) => v===f.produit_fini_id ? null : f.produit_fini_id)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" title="Modifier"
                            onClick={() => setModalOpen(true)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" title="Supprimer"
                            onClick={() => setDeleteId(f.produit_fini_id)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
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
        )}

        <div className="border-t border-slate-100 px-5 py-2 text-right text-xs text-slate-400">
          {filtered.length} / {formules.length} produit{formules.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Detail panel */}
      {viewTarget && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-5 text-sm">
          <p className="font-bold text-slate-900">{viewTarget.produit_nom}
            <span className="ml-2 font-mono text-xs text-slate-500">({viewTarget.produit_code})</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {viewTarget.lignes.length} intrant{viewTarget.lignes.length !== 1 ? 's' : ''} dans la recette
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {viewTarget.lignes.map((l) => (
              <span key={l.id} className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-900">
                {l.composant_nom} — {l.quantite_requise} {l.unite_mesure}
              </span>
            ))}
          </div>
          <button onClick={() => setViewId(null)} className="mt-4 text-xs text-slate-500 underline hover:text-slate-700">Fermer</button>
        </div>
      )}

      <NouvelleFormuleModal open={modalOpen} onClose={() => setModalOpen(false)}
        produitsFinis={produitsFinis} composants={composants} />

      <ConfirmDeleteModal open={!!deleteId} title="Supprimer ce produit & sa recette ?"
        description="La nomenclature BOM associée sera également supprimée. Cette action est irréversible."
        onConfirm={handleConfirmDelete} onCancel={() => setDeleteId(null)} />
    </>
  )
}
