'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from '@/router'
import {
  CheckCircle, XCircle, Eye, Trash2, Search, ArrowUpDown, UserCheck, UserX, UserPlus,
} from 'lucide-react'
import PageHeader from '@/components/dashboard/ui/PageHeader'
import PrimaryButton from '@/components/dashboard/ui/PrimaryButton'
import ExportButtons from '@/components/dashboard/ui/ExportButtons'
import ConfirmDeleteModal from '@/components/dashboard/ui/ConfirmDeleteModal'
import DetailModal from '@/components/dashboard/ui/DetailModal'
import NouvelUtilisateurModal from '@/components/dashboard/utilisateurs/NouvelUtilisateurModal'
import { cardBase } from '@/lib/dashboard/design'
import { ROLE_LABELS } from '@/lib/dashboard/navigation'
import { exportToCsv, exportToPrint } from '@/lib/dashboard/export'
import {
  activateUserAccount,
  deactivateUserAccount,
  updateUserRole,
  deleteUserAccount,
} from '@/app/dashboard/actions/utilisateurs'
import type { UserProfileRow } from '@/lib/dashboard/queries/utilisateurs-page'
import type { AppRole } from '@/types/spgcr'

interface Props {
  pending: UserProfileRow[]
  active: UserProfileRow[]
}

const ROLES: AppRole[] = ['admin_msd', 'responsable_production', 'operateur_usine']

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

type SortKey = 'nom' | 'role' | 'created_at'
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

export default function UtilisateursPageClient({ pending, active }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'pending' | 'active'>('pending')
  const [isPending, startTransition] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [viewId, setViewId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get('action') === 'new') setIsAddModalOpen(true)
  }, [searchParams])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  function runAction(userId: string, fn: () => Promise<{ error?: string; success?: boolean }>) {
    setError(null)
    setActionId(userId)
    startTransition(async () => {
      try {
        const result = await fn()
        if (result.error) { setError(result.error); return }
        router.refresh()
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "L'action a échoué.")
      } finally {
        setActionId(null)
      }
    })
  }

  const all = tab === 'pending' ? pending : active
  const q = query.trim().toLowerCase()
  const filtered = all
    .filter((u) => !q ||
      u.nom.toLowerCase().includes(q) ||
      u.prenom.toLowerCase().includes(q))
    .sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'nom') return mul * `${a.nom}${a.prenom}`.localeCompare(`${b.nom}${b.prenom}`)
      if (sortKey === 'role') return mul * a.role.localeCompare(b.role)
      return mul * a.created_at.localeCompare(b.created_at)
    })

  const viewTarget = viewId ? all.find((u) => u.id === viewId) : null

  function handleExportExcel() {
    exportToCsv(`utilisateurs_${tab}`, filtered.map((u) => ({
      Prénom: u.prenom, Nom: u.nom,
      Rôle: ROLE_LABELS[u.role],
      Statut: u.actif ? 'Actif' : 'Inactif',
      "Inscrit le": formatDate(u.created_at),
    })))
  }
  function handleExportPdf() { exportToPrint('Gestion des Utilisateurs — SPGCR') }

  return (
    <>
      <PageHeader
        title="Gestion des Utilisateurs"
        description="Validation des comptes, attribution des rôles et journal des accès SPGCR."
      />

      {error && (
        <div className="mb-4 rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Tab switcher */}
      <div className="mb-4 flex gap-2 rounded-md border border-slate-100 bg-slate-50 p-1">
        {(['pending', 'active'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-2.5 text-sm font-semibold transition-all ${
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t === 'pending' ? `En attente (${pending.length})` : `Actifs (${active.length})`}
          </button>
        ))}
      </div>

      <div className={`${cardBase} overflow-hidden`}>
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom ou prénom…"
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="flex items-center gap-2">
            <ExportButtons onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} />
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Créer un utilisateur
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">
                  <SortBtn col="Utilisateur" active={sortKey==='nom'} dir={sortDir} onClick={()=>toggleSort('nom')}/>
                </th>
                <th className="px-5 py-3">
                  <SortBtn col="Rôle" active={sortKey==='role'} dir={sortDir} onClick={()=>toggleSort('role')}/>
                </th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">
                  <SortBtn col="Inscrit le" active={sortKey==='created_at'} dir={sortDir} onClick={()=>toggleSort('created_at')}/>
                </th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    {q ? 'Aucun résultat pour cette recherche.' : tab === 'pending' ? 'Aucun compte en attente.' : 'Aucun utilisateur actif.'}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="group transition-colors hover:bg-slate-50/80">
                    {/* Identité */}
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{u.prenom} {u.nom}</p>
                    </td>

                    {/* Rôle — dropdown pour les actifs */}
                    <td className="px-5 py-3.5">
                      {tab === 'active' ? (
                        <select value={u.role}
                          disabled={isPending && actionId === u.id}
                          onChange={(e) => runAction(u.id, () => updateUserRole(u.id, e.target.value as AppRole))}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100">
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                          {ROLE_LABELS[u.role]}
                        </span>
                      )}
                    </td>

                    {/* Statut badge */}
                    <td className="px-5 py-3.5">
                      {u.actif ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle className="h-3 w-3" /> Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-500">
                          <XCircle className="h-3 w-3" /> En attente
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-slate-500">{formatDate(u.created_at)}</td>

                    {/* Row actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {/* Voir fiche */}
                        <button type="button" title="Voir la fiche"
                          onClick={() => setViewId((v) => v === u.id ? null : u.id)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Toggle actif */}
                        {tab === 'pending' ? (
                          <button type="button" title="Activer le compte"
                            disabled={isPending && actionId === u.id}
                            onClick={() => runAction(u.id, () => activateUserAccount(u.id))}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 transition-colors disabled:opacity-40">
                            <UserCheck className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button type="button" title="Désactiver le compte"
                            disabled={isPending && actionId === u.id}
                            onClick={() => runAction(u.id, () => deactivateUserAccount(u.id))}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors disabled:opacity-40">
                            <UserX className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Supprimer */}
                        <button type="button" title="Supprimer le compte"
                          onClick={() => setDeleteId(u.id)}
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

        <div className="border-t border-slate-100 px-5 py-2 text-right text-xs text-slate-400">
          {filtered.length} / {all.length} utilisateur{all.length !== 1 ? 's' : ''}
        </div>
      </div>

      <DetailModal open={!!viewTarget} title="Détail de l'utilisateur" onClose={() => setViewId(null)}>
        {viewTarget && <div className="text-sm">
          <p className="font-bold text-slate-900">{viewTarget.prenom} {viewTarget.nom}</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {[
              ['Rôle', ROLE_LABELS[viewTarget.role]],
              ['Statut', viewTarget.actif ? 'Actif' : 'En attente'],
              ['Inscrit le', formatDate(viewTarget.created_at)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k}</dt>
                <dd className="mt-0.5 font-semibold text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        </div>}
      </DetailModal>

      <NouvelUtilisateurModal
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          if (window.location.search) {
            window.history.replaceState({}, '', '/dashboard/utilisateurs')
            window.dispatchEvent(new PopStateEvent('popstate'))
          }
        }}
      />

      <ConfirmDeleteModal
        open={!!deleteId}
        title="Supprimer ce compte utilisateur ?"
        description="Le compte sera définitivement retiré du système SPGCR. Cette action est irréversible."
        onConfirm={() => {
          if (!deleteId) return
          runAction(deleteId, () => deleteUserAccount(deleteId))
          setDeleteId(null)
        }}
        onCancel={() => setDeleteId(null)}
        loading={isPending && actionId === deleteId}
      />
    </>
  )
}
