import { AlertTriangle, Boxes, ClipboardList, PackageSearch, Plus, Search, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { BomItem, Material, Product, Production } from '@/types'
import PageHeader from '@/components/dashboard/ui/PageHeader'
import PrimaryButton from '@/components/dashboard/ui/PrimaryButton'
import KpiCard from '@/components/dashboard/ui/KpiCard'
import ExportButtons from '@/components/dashboard/ui/ExportButtons'
import { exportToCsv, exportToPrint } from '@/lib/dashboard/export'
import { cardBase } from '@/lib/dashboard/design'
import { notify } from '@/lib/notifications'

interface Props {
  materials: Material[]
  products: Product[]
  productions: Production[]
  boms: Record<number, BomItem[]>
}

interface ManualNeed {
  id: string
  materialId: number
  productLabel: string
  reference: string
  quantity: number
}

const NEEDS_STORAGE_KEY = 'spcr_manual_needs'

function formatNumber(value: number) {
  return value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
}

export default function StockManagementPage({ materials, products, productions, boms }: Props) {
  const [query, setQuery] = useState('')
  const [needModalOpen, setNeedModalOpen] = useState(false)
  const [manualNeeds, setManualNeeds] = useState<ManualNeed[]>(() => {
    const raw = localStorage.getItem(NEEDS_STORAGE_KEY)
    if (!raw) return []
    try {
      return JSON.parse(raw) as ManualNeed[]
    } catch {
      return []
    }
  })
  const [needForm, setNeedForm] = useState({
    materialId: '',
    productLabel: '',
    reference: '',
    quantity: '',
  })
  const section = new URLSearchParams(window.location.search).get('section')
  const showNeeds = !section || section === 'besoins'
  const showStock = !section || section === 'stock'
  const showAlerts = !section || section === 'alertes'
  const canAddNeed = !section || section === 'besoins'

  useEffect(() => {
    localStorage.setItem(NEEDS_STORAGE_KEY, JSON.stringify(manualNeeds))
  }, [manualNeeds])

  const needs = useMemo(() => {
    const neededByMaterial = new Map<number, { quantity: number; lots: Set<string> }>()
    const productsByMaterial = new Map<number, Set<string>>()
    productions
      .filter((production) => production.status === 'planifiee' || production.status === 'en_cours')
      .forEach((production) => {
        const productName = products.find((product) => product.id === production.product_id)?.name || production.product?.name || `Produit ${production.product_id}`
        const lines = boms[production.product_id] || []
        lines.forEach((line) => {
          const current = neededByMaterial.get(line.material_id) || { quantity: 0, lots: new Set<string>() }
          current.quantity += Number(line.quantity_required || 0) * Number(production.quantity || 0)
          current.lots.add(production.reference)
          neededByMaterial.set(line.material_id, current)
          const productSet = productsByMaterial.get(line.material_id) || new Set<string>()
          productSet.add(productName)
          productsByMaterial.set(line.material_id, productSet)
        })
      })

    manualNeeds.forEach((need) => {
      const current = neededByMaterial.get(need.materialId) || { quantity: 0, lots: new Set<string>() }
      current.quantity += need.quantity
      current.lots.add(need.reference)
      neededByMaterial.set(need.materialId, current)
      const productSet = productsByMaterial.get(need.materialId) || new Set<string>()
      productSet.add(need.productLabel)
      productsByMaterial.set(need.materialId, productSet)
    })

    return materials.map((material) => {
      const need = neededByMaterial.get(material.id)
      const productNames = Array.from(productsByMaterial.get(material.id) || [])

      return {
        id: material.id,
        code: material.code,
        designation: material.name,
        unite: material.unit,
        stock: Number(material.quantity || 0),
        seuil: Number(material.minimum_stock || 0),
        besoin: need?.quantity || 0,
        lots: need ? Array.from(need.lots).join(', ') : '-',
        produits: productNames.join(', ') || '-',
      }
    })
  }, [materials, products, productions, boms, manualNeeds])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return needs
    return needs.filter((item) => `${item.code} ${item.designation} ${item.produits} ${item.lots}`.toLowerCase().includes(needle))
  }, [needs, query])

  const alerts = filtered.filter((item) => item.stock <= item.seuil || item.stock < item.besoin)
  const stockValue = filtered.reduce((sum, item) => {
    const material = materials.find((entry) => entry.id === item.id)
    return sum + item.stock * Number(material?.unit_cost || 0)
  }, 0)

  const rows = filtered.map((item) => ({
    Code: item.code,
    Matiere: item.designation,
    'Stock existant': item.stock,
    Besoin: item.besoin,
    Seuil: item.seuil,
    Unite: item.unite,
    Lots: item.lots,
  }))

  function submitManualNeed(event: React.FormEvent) {
    event.preventDefault()
    const materialId = Number(needForm.materialId)
    const quantity = Number(needForm.quantity)
    if (!materialId || quantity <= 0 || !needForm.productLabel.trim()) {
      notify('error', 'Veuillez remplir la matiere, le produit concerne et une quantite valide.')
      return
    }
    const reference = needForm.reference.trim() || `BES-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`
    setManualNeeds((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        materialId,
        productLabel: needForm.productLabel.trim(),
        reference,
        quantity,
      },
    ])
    setNeedForm({ materialId: '', productLabel: '', reference: '', quantity: '' })
    setNeedModalOpen(false)
    notify('success', "L'etat de besoin a ete ajoute.")
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gestion des stocks"
        description="Etat des besoins, stock existant et alertes de stock insuffisant pour les matieres premieres."
        action={canAddNeed ? <PrimaryButton onClick={() => setNeedModalOpen(true)}><Plus className="h-4 w-4" />Ajouter un etat de besoin</PrimaryButton> : null}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Matieres suivies" value={String(materials.length)} icon={Boxes} accent="indigo" />
        <KpiCard label="Valeur du stock" value={`${formatNumber(stockValue)} FCFA`} icon={ClipboardList} accent="emerald" />
        <KpiCard label="Alertes insuffisantes" value={String(alerts.length)} icon={AlertTriangle} accent={alerts.length ? 'rose' : 'slate'} />
      </div>

      <section className={`${cardBase} overflow-hidden`}>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher une matiere, un lot ou un produit..."
              className="h-9 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <ExportButtons
            onExportExcel={() => exportToCsv('gestion-stocks', rows)}
            onExportPdf={() => exportToPrint('Gestion des stocks - SPGCR', rows)}
          />
        </div>

        <div className={`${section ? 'space-y-5 p-4' : 'grid gap-5 p-4 xl:grid-cols-[1.15fr_0.85fr]'}`}>
          <div className="space-y-5">
            {showNeeds && (
            <StockTable
              title="Etat des besoins"
              icon={PackageSearch}
              columns={['Matiere', 'Produit concerne', 'Lots', 'Besoin', 'Stock']}
              rows={filtered.map((item) => [
                <span className="font-semibold">{item.designation}</span>,
                item.produits,
                item.lots,
                `${formatNumber(item.besoin)} ${item.unite}`,
                `${formatNumber(item.stock)} ${item.unite}`,
              ])}
              empty="Aucun besoin calcule pour les productions planifiees ou en cours."
            />
            )}

            {showStock && (
            <StockTable
              title="Stock existant"
              icon={Boxes}
              columns={['Code', 'Designation', 'Stock actuel', 'Seuil minimum', 'Unite']}
              rows={filtered.map((item) => [
                <span className="font-mono text-xs">{item.code}</span>,
                <span className="font-semibold">{item.designation}</span>,
                `${formatNumber(item.stock)} ${item.unite}`,
                `${formatNumber(item.seuil)} ${item.unite}`,
                item.unite,
              ])}
              empty="Aucune matiere premiere en stock."
            />
            )}
          </div>

          {showAlerts && (
          <StockTable
            title="Alerte d'un stock insuffisant"
            icon={AlertTriangle}
            columns={['Matiere', 'Stock', 'Besoin / seuil', 'Statut']}
            rows={alerts.map((item) => [
              <span className="font-semibold">{item.designation}</span>,
              `${formatNumber(item.stock)} ${item.unite}`,
              item.stock < item.besoin ? `${formatNumber(item.besoin)} ${item.unite}` : `${formatNumber(item.seuil)} ${item.unite}`,
              <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">
                {item.stock < item.besoin ? 'Besoin non couvert' : 'Sous le seuil'}
              </span>,
            ])}
            empty="Aucune alerte de stock insuffisant."
          />
          )}
        </div>
      </section>

      {needModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={() => setNeedModalOpen(false)} aria-label="Fermer" />
          <form onSubmit={submitManualNeed} className="relative w-full max-w-lg rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-900">Ajouter un etat de besoin</h2>
                <p className="mt-1 text-xs text-slate-500">Besoin manuel lie a une matiere premiere.</p>
              </div>
              <button type="button" onClick={() => setNeedModalOpen(false)} className="rounded-md p-2 hover:bg-slate-100" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-bold sm:col-span-2">
                MATIERE PREMIERE
                <select
                  required
                  value={needForm.materialId}
                  onChange={(event) => setNeedForm({ ...needForm, materialId: event.target.value })}
                  className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Selectionner une matiere</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>{material.name} - {material.code}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-bold">
                PRODUIT / BESOIN
                <input
                  required
                  value={needForm.productLabel}
                  onChange={(event) => setNeedForm({ ...needForm, productLabel: event.target.value })}
                  placeholder="Ex: Produit A"
                  className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="grid gap-1 text-xs font-bold">
                REFERENCE
                <input
                  value={needForm.reference}
                  onChange={(event) => setNeedForm({ ...needForm, reference: event.target.value })}
                  placeholder="BES-2026-0001"
                  className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="grid gap-1 text-xs font-bold sm:col-span-2">
                QUANTITE DEMANDEE
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={needForm.quantity}
                  onChange={(event) => setNeedForm({ ...needForm, quantity: event.target.value })}
                  className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t bg-slate-50 px-5 py-4">
              <button type="button" onClick={() => setNeedModalOpen(false)} className="rounded-md border px-4 py-2 text-sm">Annuler</button>
              <button className="rounded-md bg-[#102544] px-4 py-2 text-sm font-bold text-white">Enregistrer</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function StockTable({
  title,
  icon: Icon,
  columns,
  rows,
  empty,
}: {
  title: string
  icon: LucideIcon
  columns: string[]
  rows: React.ReactNode[][]
  empty: string
}) {
  return (
    <section className="overflow-hidden rounded-md border border-slate-100 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <Icon className="h-4 w-4 text-slate-500" />
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 text-slate-700">{cell}</td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-400">{empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
