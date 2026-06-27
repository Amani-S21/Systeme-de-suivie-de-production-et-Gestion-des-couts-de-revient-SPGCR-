import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Boxes, ClipboardList, Factory, FileBarChart, Layers3, PackageSearch, RefreshCw, ShoppingBag, Users, WalletCards } from 'lucide-react'
import { api } from '@/api'
import type { BomItem, Charge, DashboardSummary, Material, Product, Production, User } from '@/types'
import PageHeader from '@/components/dashboard/ui/PageHeader'
import ExportButtons from '@/components/dashboard/ui/ExportButtons'
import { exportToCsv, exportToPrint } from '@/lib/dashboard/export'

interface ReportDefinition { title: string; description: string; icon: typeof Factory; rows: Record<string, unknown>[] }

export default function ReportsPageClient() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [productions, setProductions] = useState<Production[]>([])
  const [charges, setCharges] = useState<Charge[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [boms, setBoms] = useState<Record<number, BomItem[]>>({})
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(false)
  async function load() {
    setLoading(true)
    try {
      const [nextMaterials, nextProductions, nextCharges, nextProducts, nextUsers, nextSummary] = await Promise.all([api.materials(), api.productions(), api.charges(), api.products(), api.users().catch(() => []), api.dashboard()])
      const bomEntries = await Promise.all(nextProducts.map(async product => [product.id, await api.productBom(product.id).catch(() => [])] as const))
      setMaterials(nextMaterials); setProductions(nextProductions); setCharges(nextCharges); setProducts(nextProducts); setUsers(nextUsers); setBoms(Object.fromEntries(bomEntries)); setSummary(nextSummary)
    } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  const reports = useMemo<ReportDefinition[]>(() => [
    { title: 'Rapport de production', description: 'Lots, quantités, produits, dates et statuts.', icon: Factory, rows: productions.map(item => ({ Référence: item.reference, Produit: item.product?.name || item.product_id, Quantité: Number(item.quantity), Statut: item.status, Date: item.created_at.slice(0, 10) })) },
    { title: 'Rapport des stocks', description: 'Disponibilités et valorisation des matières premières.', icon: Boxes, rows: materials.map(item => ({ Code: item.code, Matière: item.name, Stock: Number(item.quantity), Unité: item.unit, CUMP: Number(item.unit_cost), Valeur: Number(item.quantity) * Number(item.unit_cost) })) },
    { title: 'Rapport des charges', description: 'Charges classées par date et catégorie.', icon: ClipboardList, rows: charges.map(item => ({ Date: item.charge_date, Libellé: item.label, Catégorie: item.category, Montant: Number(item.amount) })) },
    { title: 'Rapport des coûts de revient', description: 'Coûts unitaires et évolution par produit.', icon: WalletCards, rows: (summary?.product_costs || []).map(item => ({ Produit: item.product, 'Coût unitaire': item.unit_cost, Évolution: `${item.evolution}%` })) },
    { title: 'Catalogue des produits', description: 'Produits finis, unités commerciales et prix de vente.', icon: ShoppingBag, rows: products.map(item => ({ SKU: item.sku, Produit: item.name, Unité: item.unit, 'Prix de vente': Number(item.sale_price) })) },
    { title: 'Nomenclatures BOM', description: 'Composition standard de chaque produit fini.', icon: Layers3, rows: products.flatMap(product => (boms[product.id] || []).map(line => ({ Produit: product.name, SKU: product.sku, Composant: materials.find(item => item.id === line.material_id)?.name || line.material_id, Quantité: Number(line.quantity_required), Unité: materials.find(item => item.id === line.material_id)?.unit || '' }))) },
    { title: 'Utilisateurs et permissions', description: 'Comptes, rôles et états d’activation.', icon: Users, rows: users.map(item => ({ Login: item.login, Nom: `${item.first_name} ${item.last_name}`, Email: item.email, Rôle: item.role, Statut: item.is_active ? 'Actif' : 'Inactif' })) },
    { title: 'Alertes de stock', description: 'Matières au seuil minimal ou en rupture.', icon: AlertTriangle, rows: materials.filter(item => Number(item.quantity) <= Number(item.minimum_stock)).map(item => ({ Code: item.code, Matière: item.name, Stock: Number(item.quantity), Seuil: Number(item.minimum_stock), Unité: item.unit })) },
    { title: 'Valorisation des stocks', description: 'Valeur financière disponible par matière.', icon: PackageSearch, rows: materials.map(item => ({ Code: item.code, Matière: item.name, Quantité: Number(item.quantity), CUMP: Number(item.unit_cost), 'Valeur totale': Number(item.quantity) * Number(item.unit_cost) })) },
    { title: 'Répartition des statuts', description: 'Synthèse des lots par statut de production.', icon: FileBarChart, rows: (summary?.production_status || []).map(item => ({ Statut: item.name, Nombre: item.value })) },
  ], [materials, productions, charges, products, users, boms, summary])
  return <div className="space-y-6">
    <PageHeader title="Rapports" description="Consultez et exportez les rapports consolidés du système SPCR." action={<button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-md border bg-white px-4 py-2 text-sm font-bold"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Actualiser</button>} />
    <div className="grid gap-4 md:grid-cols-2">{reports.map(report => <article key={report.title} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100"><report.icon className="h-5 w-5 text-slate-700" /></span><div><h2 className="font-bold text-slate-900">{report.title}</h2><p className="mt-1 text-xs text-slate-500">{report.description}</p></div></div><div className="mt-5 flex items-center justify-between border-t pt-4"><span className="text-sm font-semibold text-slate-600">{report.rows.length} ligne(s)</span><ExportButtons onExportExcel={() => exportToCsv(report.title, report.rows)} onExportPdf={() => exportToPrint(`${report.title} — SPCR`, report.rows)} /></div></article>)}</div>
    <section className="rounded-md border bg-white p-5"><div className="flex items-center gap-2"><FileBarChart className="h-5 w-5" /><h2 className="font-bold">Synthèse générale</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-md bg-slate-50 p-4"><p className="text-xs text-slate-500">Productions</p><p className="text-xl font-bold">{productions.length}</p></div><div className="rounded-md bg-slate-50 p-4"><p className="text-xs text-slate-500">Quantité produite</p><p className="text-xl font-bold">{Number(summary?.kpis.produced_quantity || 0).toLocaleString('fr-FR')}</p></div><div className="rounded-md bg-slate-50 p-4"><p className="text-xs text-slate-500">Valeur des charges</p><p className="text-xl font-bold">{charges.reduce((sum,item) => sum + Number(item.amount), 0).toLocaleString('fr-FR')} FCFA</p></div><div className="rounded-md bg-slate-50 p-4"><p className="text-xs text-slate-500">Matières suivies</p><p className="text-xl font-bold">{materials.length}</p></div></div></section>
  </div>
}
