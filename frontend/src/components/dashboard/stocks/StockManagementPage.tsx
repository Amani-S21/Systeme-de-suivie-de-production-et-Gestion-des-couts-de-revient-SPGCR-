import { AlertTriangle, Boxes, ClipboardList, PackageSearch, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { BomItem, Material, Product, Production } from '@/types'
import PageHeader from '@/components/dashboard/ui/PageHeader'
import KpiCard from '@/components/dashboard/ui/KpiCard'
import ExportButtons from '@/components/dashboard/ui/ExportButtons'
import { exportToCsv, exportToPrint } from '@/lib/dashboard/export'
import { cardBase } from '@/lib/dashboard/design'

interface Props {
  materials: Material[]
  products: Product[]
  productions: Production[]
  boms: Record<number, BomItem[]>
}

function formatNumber(value: number) {
  return value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
}

export default function StockManagementPage({ materials, products, productions, boms }: Props) {
  const [query, setQuery] = useState('')

  const needs = useMemo(() => {
    const neededByMaterial = new Map<number, { quantity: number; lots: Set<string> }>()
    productions
      .filter((production) => production.status === 'planifiee' || production.status === 'en_cours')
      .forEach((production) => {
        const lines = boms[production.product_id] || []
        lines.forEach((line) => {
          const current = neededByMaterial.get(line.material_id) || { quantity: 0, lots: new Set<string>() }
          current.quantity += Number(line.quantity_required || 0) * Number(production.quantity || 0)
          current.lots.add(production.reference)
          neededByMaterial.set(line.material_id, current)
        })
      })

    return materials.map((material) => {
      const need = neededByMaterial.get(material.id)
      const productNames = productions
        .filter((production) => production.status === 'planifiee' || production.status === 'en_cours')
        .filter((production) => (boms[production.product_id] || []).some((line) => line.material_id === material.id))
        .map((production) => products.find((product) => product.id === production.product_id)?.name || production.product?.name || `Produit ${production.product_id}`)

      return {
        id: material.id,
        code: material.code,
        designation: material.name,
        unite: material.unit,
        stock: Number(material.quantity || 0),
        seuil: Number(material.minimum_stock || 0),
        besoin: need?.quantity || 0,
        lots: need ? Array.from(need.lots).join(', ') : '-',
        produits: Array.from(new Set(productNames)).join(', ') || '-',
      }
    })
  }, [materials, products, productions, boms])

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

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gestion des stocks"
        description="Etat des besoins, stock existant et alertes de stock insuffisant pour les matieres premieres."
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

        <div className="grid gap-5 p-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
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
          </div>

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
        </div>
      </section>
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
  icon: typeof Boxes
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
