import { Banknote, Boxes, Eye, PackageCheck, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { Product, Production } from '@/types'
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

  useEffect(() => {
    if (!open) return
    setForm(product ? { name: product.name, sku: product.sku, unit: product.unit, sale_price: String(product.sale_price) } : emptyForm)
    setError('')
  }, [open, product])

  if (!open) return null

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, sale_price: Number(form.sale_price || 0) }
      if (product) await api.updateProduct(product.id, payload)
      else await api.createProduct(payload)
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.')
    } finally {
      setSaving(false)
    }
  }

  const input = 'h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={onClose} aria-label="Fermer" />
      <form onSubmit={submit} className="relative w-full max-w-lg rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-bold">{product ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          <button type="button" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {error && <p className="sm:col-span-2 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <label className="grid gap-1 text-xs font-bold sm:col-span-2">
            DESIGNATION
            <input
              required
              className={input}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value, sku: product ? form.sku : generateCode(event.target.value, 'PRODUIT') })}
            />
          </label>
          <label className="grid gap-1 text-xs font-bold">
            CODE AUTOMATIQUE
            <input tabIndex={-1} readOnly className={`${input} pointer-events-none cursor-not-allowed bg-slate-100 font-mono`} value={form.sku} />
          </label>
          <label className="grid gap-1 text-xs font-bold">
            UNITE
            <select className={input} value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })}>
              <option value="bouteille">Bouteille</option>
              <option value="carton">Carton</option>
              <option value="unite">Unite</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold sm:col-span-2">
            PRIX UNITAIRE / PRIX DE VENTE (FCFA)
            <input type="number" min="0" className={input} value={form.sale_price} onChange={(event) => setForm({ ...form, sale_price: event.target.value })} />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t bg-slate-50 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm">Annuler</button>
          <button disabled={saving} className="rounded-md bg-[#102544] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function FinishedProductsPage({ products, productions }: { products: Product[]; productions: Production[] }) {
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [edit, setEdit] = useState<Product | null>(null)
  const [view, setView] = useState<Product | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const finishedRows = useMemo(() => productions
    .filter((production) => production.status === 'terminee')
    .map((production) => {
      const product = products.find((item) => item.id === production.product_id) || production.product
      const unitPrice = Number(product?.sale_price || 0)
      const quantity = Number(production.quantity || 0)
      return {
        id: production.id,
        product,
        designation: product?.name || `Produit ${production.product_id}`,
        numeroLot: production.reference,
        quantity,
        unitPrice,
        totalSalePrice: quantity * unitPrice,
      }
    })
    .filter((item) => !query.trim() || `${item.designation} ${item.numeroLot}`.toLowerCase().includes(query.toLowerCase())), [products, productions, query])

  const filteredProducts = useMemo(() => products.filter((item) => !query.trim() || `${item.name} ${item.sku}`.toLowerCase().includes(query.toLowerCase())), [products, query])
  const exportRows = finishedRows.map((item) => ({
    Designation: item.designation,
    'Numero lot': item.numeroLot,
    Quantite: item.quantity,
    'Prix unitaire': item.unitPrice,
    'Prix de vente total': item.totalSalePrice,
  }))
  const refresh = () => window.dispatchEvent(new CustomEvent('spcr:refresh'))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Produits finis"
        description="Les lots clotures apparaissent ici avec leur designation, numero de lot, prix unitaire et prix de vente total."
        action={<PrimaryButton onClick={() => { setEdit(null); setModalOpen(true) }}><Plus className="h-4 w-4" />Ajouter un produit</PrimaryButton>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Produits references" value={String(products.length)} icon={Boxes} accent="indigo" />
        <KpiCard label="Lots clotures" value={String(finishedRows.length)} icon={PackageCheck} accent="emerald" />
        <KpiCard label="Prix de vente total" value={`${finishedRows.reduce((sum, item) => sum + item.totalSalePrice, 0).toLocaleString('fr-FR')} FCFA`} icon={Banknote} accent="amber" />
      </div>

      <section className={`${cardBase} overflow-hidden`}>
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une designation ou un numero de lot..." className="h-9 w-full rounded-md border pl-9 pr-3 text-sm" />
          </div>
          <ExportButtons onExportExcel={() => exportToCsv('produits-finis', exportRows)} onExportPdf={() => exportToPrint('Produits finis - SPGCR', exportRows)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4">Designation</th>
                <th>Numero lot</th>
                <th>Quantite</th>
                <th>Prix unitaire</th>
                <th>Prix de vente total</th>
                <th className="pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {finishedRows.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold">{item.designation}</td>
                  <td className="font-mono text-xs">{item.numeroLot}</td>
                  <td>{item.quantity.toLocaleString('fr-FR')}</td>
                  <td className="font-semibold">{item.unitPrice.toLocaleString('fr-FR')} FCFA</td>
                  <td className="font-bold text-slate-900">{item.totalSalePrice.toLocaleString('fr-FR')} FCFA</td>
                  <td className="pr-4">
                    <div className="flex justify-end gap-1">
                      <button title="Voir" onClick={() => item.product && setView(item.product)} className="rounded-md p-2 hover:bg-slate-100"><Eye className="h-4 w-4" /></button>
                      {item.product && <button title="Modifier" onClick={() => { setEdit(item.product); setModalOpen(true) }} className="rounded-md p-2 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
              {!finishedRows.length && <tr><td colSpan={6} className="p-12 text-center text-slate-400">Aucun produit fini pour le moment. Les lots clotures apparaitront ici automatiquement.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${cardBase} overflow-hidden`}>
        <div className="border-b p-4">
          <h2 className="text-sm font-bold text-slate-900">References produits</h2>
          <p className="mt-1 text-xs text-slate-500">Catalogue utilise pour lancer les lots et calculer les prix de vente.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="p-4">Produit</th><th>SKU</th><th>Unite</th><th>Prix unitaire</th><th className="pr-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold">{item.name}</td>
                  <td className="font-mono text-xs">{item.sku}</td>
                  <td>{item.unit}</td>
                  <td className="font-semibold">{Number(item.sale_price).toLocaleString('fr-FR')} FCFA</td>
                  <td className="pr-4">
                    <div className="flex justify-end gap-1">
                      <button title="Voir" onClick={() => setView(item)} className="rounded-md p-2 hover:bg-slate-100"><Eye className="h-4 w-4" /></button>
                      <button title="Modifier" onClick={() => { setEdit(item); setModalOpen(true) }} className="rounded-md p-2 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                      <button title="Supprimer" onClick={() => setDeleteId(item.id)} className="rounded-md p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredProducts.length && <tr><td colSpan={5} className="p-12 text-center text-slate-400">Aucune reference produit trouvee.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <ProductModal open={modalOpen} product={edit} onClose={() => setModalOpen(false)} onSaved={refresh} />
      <DetailModal open={!!view} title="Detail du produit" onClose={() => setView(null)}>
        {view && <dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs text-slate-500">Designation</dt><dd className="font-bold">{view.name}</dd></div><div><dt className="text-xs text-slate-500">SKU</dt><dd className="font-mono">{view.sku}</dd></div><div><dt className="text-xs text-slate-500">Unite</dt><dd>{view.unit}</dd></div><div><dt className="text-xs text-slate-500">Prix unitaire</dt><dd className="font-bold">{Number(view.sale_price).toLocaleString('fr-FR')} FCFA</dd></div></dl>}
      </DetailModal>
      <ConfirmDeleteModal open={deleteId !== null} title="Supprimer ce produit ?" description="La suppression est impossible si le produit possede deja des productions." onCancel={() => setDeleteId(null)} onConfirm={async () => { if (deleteId) await api.deleteProduct(deleteId); setDeleteId(null); refresh() }} />
    </div>
  )
}
