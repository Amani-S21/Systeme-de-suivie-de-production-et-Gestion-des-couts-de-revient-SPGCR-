'use client'

import { useMemo, useState } from 'react'
import { 
  Building2, Search, Plus, MapPin, BadgeCheck, XCircle, 
  Eye, Pencil, Trash2, ArrowUpDown, MoreHorizontal
} from 'lucide-react'
import PageHeader from '@/components/dashboard/ui/PageHeader'
import PrimaryButton from '@/components/dashboard/ui/PrimaryButton'
import ExportButtons from '@/components/dashboard/ui/ExportButtons'
import ConfirmDeleteModal from '@/components/dashboard/ui/ConfirmDeleteModal'
import { cardBase } from '@/lib/dashboard/design'
import { exportToCsv, exportToPrint } from '@/lib/dashboard/export'
import { SuccursaleRow, toggleSuccursale, deleteSuccursale } from '@/services/actions/succursales'
import SuccursaleModal from './SuccursaleModal'
import InventoryViewModal from './InventoryViewModal'

interface Props {
  initSuccursales: SuccursaleRow[]
  profiles: { id: string; nom: string; prenom: string }[]
}

type SortKey = 'nom' | 'ville' | 'code_depot'
type SortDir = 'asc' | 'desc'

export default function SuccursalesPageClient({ initSuccursales, profiles }: Props) {
  const [succursales, setSuccursales] = useState(initSuccursales)
  const [query, setQuery] = useState('')
  const [villeFilter, setVilleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('nom')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SuccursaleRow | null>(null)
  const [inventoryId, setInventoryId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const villes = useMemo(() => {
    const seen = new Set(initSuccursales.map(s => s.ville))
    return Array.from(seen).sort()
  }, [initSuccursales])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return succursales
      .filter(s => {
        const matchesQuery = !q || s.nom.toLowerCase().includes(q) || s.code_depot.toLowerCase().includes(q)
        const matchesVille = villeFilter === 'all' || s.ville === villeFilter
        const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? s.actif : !s.actif)
        return matchesQuery && matchesVille && matchesStatus
      })
      .sort((a, b) => {
        const mul = sortDir === 'asc' ? 1 : -1
        return mul * a[sortKey].localeCompare(b[sortKey])
      })
  }, [succursales, query, villeFilter, statusFilter, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  async function handleToggleStatus(id: string, current: boolean) {
    try {
      await toggleSuccursale(id, !current)
      setSuccursales(prev => prev.map(s => s.id === id ? { ...s, actif: !current } : s))
    } catch (err) {
      alert('Erreur lors du changement de statut')
    }
  }

  async function handleConfirmDelete() {
    if (!deleteId) return
    try {
      await deleteSuccursale(deleteId)
      setSuccursales(prev => prev.filter(s => s.id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      alert('Erreur lors de la suppression')
    }
  }

  function handleExportExcel() {
    exportToCsv('succursales', filtered.map(s => ({
      Code: s.code_depot,
      Nom: s.nom,
      Ville: s.ville,
      Adresse: s.adresse || '—',
      Responsable: s.responsable_nom,
      Statut: s.actif ? 'Actif' : 'Inactif'
    })))
  }

  return (
    <>
      <PageHeader
        title="Gestion des Succursales"
        description="Administration des sites physiques et dépôts régionaux du SPGCR."
        action={
          <PrimaryButton onClick={() => { setEditTarget(null); setModalOpen(true) }}>
            <Plus className="h-4 w-4" />
            Ajouter une Succursale
          </PrimaryButton>
        }
      />

      <div className={`${cardBase} overflow-hidden`}>
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center">
          <div className="relative min-w-[280px] flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher par nom ou code dépôt..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm outline-none transition-all focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={villeFilter}
              onChange={e => setVilleFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-300"
            >
              <option value="all">Toutes les villes</option>
              {villes.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-300"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif uniquement</option>
              <option value="inactive">Inactif uniquement</option>
            </select>
            
            <div className="ml-2 border-l border-slate-100 pl-4">
              <ExportButtons onExportExcel={handleExportExcel} onExportPdf={() => exportToPrint('Liste des Succursales — SPGCR')} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">
                  <button onClick={() => toggleSort('code_depot')} className="flex items-center gap-1 hover:text-slate-600">
                    Code Dépôt <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-6 py-4">
                   <button onClick={() => toggleSort('nom')} className="flex items-center gap-1 hover:text-slate-600">
                    Nom <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-6 py-4">Ville</th>
                <th className="px-6 py-4">Responsable</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-4 rounded-full bg-slate-50 p-4">
                        <Building2 className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900">Aucune succursale trouvée</p>
                      <p className="mt-1 text-xs text-slate-500">Essayez de modifier vos filtres ou effectuez une nouvelle recherche.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="group transition-all duration-200 hover:bg-slate-50/80 hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)]">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">{s.code_depot}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{s.nom}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" /> {s.adresse || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{s.ville}</td>
                    <td className="px-6 py-4">
                       <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        {s.responsable_nom}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleStatus(s.id, s.actif)}
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
                        s.actif 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100'
                      }`}>
                        {s.actif ? <BadgeCheck className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {s.actif ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setInventoryId(s.id)}
                          title="Voir l'inventaire"
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-white hover:text-blue-600 hover:shadow-sm"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => { setEditTarget(s); setModalOpen(true) }}
                          title="Modifier"
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-white hover:text-blue-600 hover:shadow-sm"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteId(s.id)}
                          title="Supprimer"
                          className="rounded-lg p-2 text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
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

      <SuccursaleModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        target={editTarget}
        profiles={profiles}
        onSuccess={(updated) => {
          if (editTarget) {
            setSuccursales(prev => prev.map(s => s.id === updated.id ? updated : s))
          } else {
            setSuccursales(prev => [updated, ...prev])
          }
        }}
      />

      <InventoryViewModal 
        open={!!inventoryId} 
        onClose={() => setInventoryId(null)} 
        succursaleId={inventoryId} 
      />

      <ConfirmDeleteModal 
        open={!!deleteId}
        title="Supprimer la succursale ?"
        description="Cette action est irréversible. Toutes les données liées (stocks, historique local) seront impactées."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  )
}
