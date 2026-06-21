'use client'

import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from '@/router'
import {
  Layers, Plus, Search, ArrowUpDown, Eye, Pencil, Trash2,
} from 'lucide-react'
import PageHeader from '@/components/dashboard/ui/PageHeader'
import PrimaryButton from '@/components/dashboard/ui/PrimaryButton'
import ExportButtons from '@/components/dashboard/ui/ExportButtons'
import ConfirmDeleteModal from '@/components/dashboard/ui/ConfirmDeleteModal'
import { cardBase } from '@/lib/dashboard/design'
import { exportToCsv, exportToPrint } from '@/lib/dashboard/export'
import type { FormuleRow } from '@/types/dashboard-ui'
import NouvelleFormuleModal from '@/components/dashboard/nomenclatures/NouvelleFormuleModal'
import DetailModal from '@/components/dashboard/ui/DetailModal'
import { api } from '@/api'

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
  const searchParams = useSearchParams()
  const [modalOpen, setModalOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('produit_nom')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [viewId, setViewId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('action') === 'new') setModalOpen(true)
  }, [searchParams])

  useEffect(() => {
    const s = searchParams.get('search')
    if (s) setQuery(s)
  }, [searchParams])

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
  async function handleConfirmDelete() {
    if (deleteId) await api.deleteProduct(deleteId)
    setDeleteId(null)
    window.dispatchEvent(new CustomEvent('spcr:refresh'))
  }

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
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom de produit ou SKU…"
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <ExportButtons onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">
                  <SortBtn col="Produit" active={sortKey === 'produit_nom'} dir={sortDir} onClick={() => toggleSort('produit_nom')} />
                </th>
                <th className="px-5 py-3">
                  <SortBtn col="SKU" active={sortKey === 'produit_code'} dir={sortDir} onClick={() => toggleSort('produit_code')} />
                </th>
                <th className="px-5 py-3">Format</th>
                <th className="px-5 py-3 text-right">
                  <SortBtn col="Intrants" active={sortKey === 'lignes'} dir={sortDir} onClick={() => toggleSort('lignes')} />
                </th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400">Aucun produit trouvé.</td></tr>
              ) : filtered.map((f) => (
                <tr key={f.produit_fini_id} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{f.produit_nom}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{f.produit_code}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">
                    {f.unite_commerciale ? (UNITE_LABELS[f.unite_commerciale] ?? f.unite_commerciale) : '—'} 
                    <span className="ml-1 opacity-60">({f.volume_litre ?? '—'}L)</span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-slate-700">{f.lignes.length}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setViewId(v => v === f.produit_fini_id ? null : f.produit_fini_id)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteId(f.produit_fini_id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DetailModal open={!!viewTarget} title="Détail de la recette BOM" onClose={() => setViewId(null)}>
        {viewTarget && <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Layers className="h-5 w-5" /></div>
            <div>
              <h4 className="font-bold text-slate-900">Composition : {viewTarget.produit_nom}</h4>
              <p className="text-xs text-slate-500">Recette technique du produit fini (BOM)</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {viewTarget.lignes.map((l) => (
              <div key={l.composant_id} className="bg-white/80 p-3 rounded-lg border border-white shadow-sm flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">{l.composant_nom}</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{l.quantite_requise} {l.unite_mesure}</span>
              </div>
            ))}
          </div>
        </div>}
      </DetailModal>

      <NouvelleFormuleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        produitsFinis={produitsFinis}
        composants={composants}
      />

      <ConfirmDeleteModal
        open={!!deleteId}
        title="Supprimer la nomenclature ?"
        description="Ceci supprimera le produit fini et sa recette associée."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  )
}
