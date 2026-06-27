import { useEffect, useMemo, useState } from 'react'
import { Banknote, Boxes, Eye, PackageCheck, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import type { Product } from '@/types'
import { api } from '@/api'
import PageHeader from '@/components/dashboard/ui/PageHeader'
import PrimaryButton from '@/components/dashboard/ui/PrimaryButton'
import KpiCard from '@/components/dashboard/ui/KpiCard'
import DetailModal from '@/components/dashboard/ui/DetailModal'
import ConfirmDeleteModal from '@/components/dashboard/ui/ConfirmDeleteModal'
import ExportButtons from '@/components/dashboard/ui/ExportButtons'
import { exportToCsv, exportToPrint } from '@/lib/dashboard/export'
import { generateCode } from '@/lib/dashboard/generate-code'
import { cardBase } from '@/lib/dashboard/design'

const emptyForm = { name: '', sku: '', unit: 'bouteille', sale_price: '' }

function ProductModal({ open, product, onClose, onSaved }: { open: boolean; product: Product | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const signature = product ? `${product.id}-${product.name}-${product.sale_price}` : 'new'
  useEffect(() => {
    if (!open) return
    setForm(product ? { name: product.name, sku: product.sku, unit: product.unit, sale_price: String(product.sale_price) } : emptyForm)
    setError('')
  }, [open, signature])
  if (!open) return null
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError('')
    try {
      const payload = { ...form, sale_price: Number(form.sale_price || 0) }
      if (product) await api.updateProduct(product.id, payload)
      else await api.createProduct(payload)
      onSaved(); onClose()
    } catch (err) { setError(err instanceof Error ? err.message : 'Enregistrement impossible.') } finally { setSaving(false) }
  }
  const input = 'h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
  return <div className="fixed inset-0 z-[110] flex items-center justify-center p-4"><button type="button" className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={onClose} aria-label="Fermer" /><form onSubmit={submit} className="relative w-full max-w-lg rounded-lg bg-white shadow-2xl"><div className="flex items-center justify-between border-b px-5 py-4"><h2 className="font-bold">{product ? 'Modifier le produit' : 'Nouveau produit'}</h2><button type="button" onClick={onClose}><X className="h-4 w-4" /></button></div><div className="grid gap-4 p-5 sm:grid-cols-2">{error && <p className="sm:col-span-2 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}<label className="grid gap-1 text-xs font-bold sm:col-span-2">DÉSIGNATION<input required className={input} value={form.name} onChange={event => setForm({ ...form, name: event.target.value, sku: product ? form.sku : generateCode(event.target.value, 'PRODUIT') })} /></label><label className="grid gap-1 text-xs font-bold">CODE SKU AUTOMATIQUE<input tabIndex={-1} readOnly className={`${input} pointer-events-none cursor-not-allowed bg-slate-100 font-mono`} value={form.sku} /></label><label className="grid gap-1 text-xs font-bold">UNITÉ<select className={input} value={form.unit} onChange={event => setForm({ ...form, unit: event.target.value })}><option value="bouteille">Bouteille</option><option value="carton">Carton</option><option value="unite">Unité</option></select></label><label className="grid gap-1 text-xs font-bold sm:col-span-2">PRIX DE VENTE (FCFA)<input type="number" min="0" className={input} value={form.sale_price} onChange={event => setForm({ ...form, sale_price: event.target.value })} /></label></div><div className="flex justify-end gap-2 border-t bg-slate-50 px-5 py-4"><button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm">Annuler</button><button disabled={saving} className="rounded-md bg-[#102544] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Enregistrement...' : 'Enregistrer'}</button></div></form></div>
}

export default function ProductCatalogPage({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [edit, setEdit] = useState<Product | null>(null)
  const [view, setView] = useState<Product | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const filtered = useMemo(() => products.filter(item => !query.trim() || `${item.name} ${item.sku}`.toLowerCase().includes(query.toLowerCase())), [products, query])
  const rows = filtered.map(item => ({ SKU: item.sku, Produit: item.name, Unité: item.unit, 'Prix de vente': Number(item.sale_price) }))
  const refresh = () => window.dispatchEvent(new CustomEvent('spcr:refresh'))
  return <div className="space-y-5"><PageHeader title="Catalogue des produits" description="Référentiel des produits finis commercialisés par l’unité industrielle." action={<PrimaryButton onClick={() => { setEdit(null); setModalOpen(true) }}><Plus className="h-4 w-4" />Ajouter un produit</PrimaryButton>} /><div className="grid gap-4 sm:grid-cols-3"><KpiCard label="Produits référencés" value={String(products.length)} icon={Boxes} accent="indigo" /><KpiCard label="Prix moyen" value={`${(products.reduce((sum,item) => sum + Number(item.sale_price),0) / Math.max(products.length,1)).toLocaleString('fr-FR')} FCFA`} icon={Banknote} accent="emerald" /><KpiCard label="Unités commerciales" value={String(new Set(products.map(item => item.unit)).size)} icon={PackageCheck} accent="amber" /></div><section className={`${cardBase} overflow-hidden`}><div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher un produit ou un SKU..." className="h-9 w-full rounded-md border pl-9 pr-3 text-sm" /></div><ExportButtons onExportExcel={() => exportToCsv('catalogue-produits', rows)} onExportPdf={() => exportToPrint('Catalogue des produits — SPCR', rows)} /></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Produit</th><th>SKU</th><th>Unité</th><th>Prix de vente</th><th className="pr-4 text-right">Actions</th></tr></thead><tbody className="divide-y">{filtered.map(item => <tr key={item.id} className="hover:bg-slate-50"><td className="p-4 font-bold">{item.name}</td><td className="font-mono text-xs">{item.sku}</td><td>{item.unit}</td><td className="font-semibold">{Number(item.sale_price).toLocaleString('fr-FR')} FCFA</td><td className="pr-4"><div className="flex justify-end gap-1"><button title="Voir" onClick={() => setView(item)} className="rounded-md p-2 hover:bg-slate-100"><Eye className="h-4 w-4" /></button><button title="Modifier" onClick={() => { setEdit(item); setModalOpen(true) }} className="rounded-md p-2 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button><button title="Supprimer" onClick={() => setDeleteId(item.id)} className="rounded-md p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}{!filtered.length && <tr><td colSpan={5} className="p-12 text-center text-slate-400">Aucun produit trouvé.</td></tr>}</tbody></table></div></section><ProductModal open={modalOpen} product={edit} onClose={() => setModalOpen(false)} onSaved={refresh} /><DetailModal open={!!view} title="Détail du produit" onClose={() => setView(null)}>{view && <dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs text-slate-500">Désignation</dt><dd className="font-bold">{view.name}</dd></div><div><dt className="text-xs text-slate-500">SKU</dt><dd className="font-mono">{view.sku}</dd></div><div><dt className="text-xs text-slate-500">Unité</dt><dd>{view.unit}</dd></div><div><dt className="text-xs text-slate-500">Prix de vente</dt><dd className="font-bold">{Number(view.sale_price).toLocaleString('fr-FR')} FCFA</dd></div></dl>}</DetailModal><ConfirmDeleteModal open={deleteId !== null} title="Supprimer ce produit ?" description="La suppression est impossible si le produit possède déjà des productions." onCancel={() => setDeleteId(null)} onConfirm={async () => { if (deleteId) await api.deleteProduct(deleteId); setDeleteId(null); refresh() }} /></div>
}
