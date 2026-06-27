import { useEffect, useMemo, useState } from 'react'
import { Banknote, Eye, Layers3, Pencil, Plus, ReceiptText, Search, Trash2, X } from 'lucide-react'
import { api } from '@/api'
import type { Charge, Product } from '@/types'
import PageHeader from '@/components/dashboard/ui/PageHeader'
import PrimaryButton from '@/components/dashboard/ui/PrimaryButton'
import ConfirmDeleteModal from '@/components/dashboard/ui/ConfirmDeleteModal'
import DetailModal from '@/components/dashboard/ui/DetailModal'
import ExportButtons from '@/components/dashboard/ui/ExportButtons'
import { exportToCsv, exportToPrint } from '@/lib/dashboard/export'
import KpiCard from '@/components/dashboard/ui/KpiCard'
import { cardBase } from '@/lib/dashboard/design'

const CATEGORIES = [
  ['main_oeuvre', "Main d'oeuvre"],
  ['charge_indirecte', 'Charge indirecte'],
  ['energie', 'Energie'],
  ['transport', 'Transport'],
  ['maintenance', 'Maintenance'],
  ['administration', 'Administration'],
  ['autre', 'Autre charge'],
] as const

const emptyForm = {
  label: '',
  category: 'main_oeuvre',
  amount: '',
  charge_date: new Date().toISOString().slice(0, 10),
  description: '',
  product_id: '',
}

function categoryLabel(value: string) {
  return CATEGORIES.find(([key]) => key === value)?.[1] || value
}

function ChargeModal({
  open,
  charge,
  products,
  onClose,
  onSaved,
}: {
  open: boolean
  charge: Charge | null
  products: Product[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(charge ? {
      label: charge.label,
      category: charge.category,
      amount: String(charge.amount),
      charge_date: charge.charge_date,
      description: charge.description || '',
      product_id: charge.product_id ? String(charge.product_id) : '',
    } : emptyForm)
    setError('')
  }, [open, charge])

  if (!open) return null

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        product_id: Number(form.product_id),
      }
      if (charge) await api.updateCharge(charge.id, payload)
      else await api.createCharge(payload)
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={onClose} aria-label="Fermer" />
      <form onSubmit={submit} className="relative w-full max-w-lg rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-bold">{charge ? 'Modifier la charge' : 'Nouvelle charge'}</h2>
          <button type="button" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {error && <p className="sm:col-span-2 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <label className="grid gap-1 text-xs font-bold text-slate-600 sm:col-span-2">
            LIBELLE
            <input required minLength={2} className={inputClass} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600 sm:col-span-2">
            PRODUIT CONCERNE
            <select required className={inputClass} value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
              <option value="">Selectionner un produit</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name} - {product.sku}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            CATEGORIE
            <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            MONTANT (FCFA)
            <input required min="1" type="number" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            DATE
            <input required type="date" className={inputClass} value={form.charge_date} onChange={(e) => setForm({ ...form, charge_date: e.target.value })} />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600 sm:col-span-2">
            DESCRIPTION
            <textarea rows={3} className="w-full rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-blue-400" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t bg-slate-50 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm">Annuler</button>
          <button disabled={saving} className="rounded-md bg-[#102544] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
        </div>
      </form>
    </div>
  )
}

export default function ChargesConfigPageClient() {
  const [charges, setCharges] = useState<Charge[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [productId, setProductId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [edit, setEdit] = useState<Charge | null>(null)
  const [view, setView] = useState<Charge | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    try {
      setCharges(await api.charges({ search, category, productId, dateFrom, dateTo }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    api.products().then(setProducts).catch(() => setProducts([]))
  }, [])

  const productName = (id?: number | null) => products.find((product) => product.id === id)?.name || 'Non rattache'
  const total = useMemo(() => charges.reduce((sum, item) => sum + Number(item.amount), 0), [charges])
  const rows = charges.map((charge) => ({
    Date: charge.charge_date,
    Produit: productName(charge.product_id),
    Libelle: charge.label,
    Categorie: categoryLabel(charge.category),
    'Montant FCFA': Number(charge.amount),
  }))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Charges"
        description="Configuration des charges par produit : main d'oeuvre, charges indirectes et autres frais."
        action={<PrimaryButton onClick={() => { setEdit(null); setModalOpen(true) }}><Plus className="h-4 w-4" />Ajouter une charge</PrimaryButton>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total filtre" value={`${total.toLocaleString('fr-FR')} FCFA`} subtext="Selon les filtres appliques" icon={Banknote} accent="emerald" />
        <KpiCard label="Charges enregistrees" value={String(charges.length)} subtext="Ecritures visibles" icon={ReceiptText} accent="indigo" />
        <KpiCard label="Produits concernes" value={String(new Set(charges.map((charge) => charge.product_id).filter(Boolean)).size)} subtext="Produits rattaches" icon={Layers3} accent="amber" />
      </div>

      <div className={`${cardBase} overflow-hidden`}>
        <div className="grid gap-2 border-b p-4 md:grid-cols-[1fr_190px_180px_150px_150px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input className="h-10 w-full rounded-md border pl-9 pr-3 text-sm" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="h-10 rounded-md border px-2 text-sm" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">Tous produits</option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
          <select className="h-10 rounded-md border px-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Toutes categories</option>
            {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input type="date" className="h-10 rounded-md border px-2 text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" className="h-10 rounded-md border px-2 text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <button onClick={load} className="h-10 rounded-md bg-slate-800 px-4 text-sm font-bold text-white">Filtrer</button>
        </div>

        <div className="flex items-center justify-between border-b bg-slate-50/40 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">{charges.length} ecriture(s) trouvee(s)</p>
          <ExportButtons onExportExcel={() => exportToCsv('charges', rows)} onExportPdf={() => exportToPrint('Rapport des charges - SPCR', rows)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <tr><th className="p-4">Date</th><th>Produit</th><th>Libelle</th><th>Categorie</th><th>Montant</th><th className="pr-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {charges.map((charge) => (
                <tr key={charge.id} className="transition-colors hover:bg-slate-50/80">
                  <td className="p-4 text-slate-600">{new Date(`${charge.charge_date}T00:00:00`).toLocaleDateString('fr-FR')}</td>
                  <td className="font-semibold text-slate-900">{productName(charge.product_id)}</td>
                  <td className="font-semibold text-slate-900">{charge.label}</td>
                  <td><span className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">{categoryLabel(charge.category)}</span></td>
                  <td className="font-bold text-slate-900">{Number(charge.amount).toLocaleString('fr-FR')} FCFA</td>
                  <td className="pr-4">
                    <div className="flex justify-end gap-1">
                      <button title="Voir" onClick={() => setView(charge)} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800"><Eye className="h-4 w-4" /></button>
                      <button title="Modifier" onClick={() => { setEdit(charge); setModalOpen(true) }} className="rounded-md p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-700"><Pencil className="h-4 w-4" /></button>
                      <button title="Supprimer" onClick={() => setDeleteId(charge.id)} className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!charges.length && <tr><td colSpan={6} className="p-12 text-center text-slate-400">{loading ? 'Chargement...' : 'Aucune charge enregistree.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <ChargeModal open={modalOpen} charge={edit} products={products} onClose={() => setModalOpen(false)} onSaved={load} />
      <DetailModal open={!!view} title="Detail de la charge" onClose={() => setView(null)}>
        {view && (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-slate-500">Produit</dt><dd className="font-bold">{productName(view.product_id)}</dd></div>
            <div><dt className="text-xs text-slate-500">Libelle</dt><dd className="font-bold">{view.label}</dd></div>
            <div><dt className="text-xs text-slate-500">Montant</dt><dd className="font-bold">{Number(view.amount).toLocaleString('fr-FR')} FCFA</dd></div>
            <div><dt className="text-xs text-slate-500">Categorie</dt><dd>{categoryLabel(view.category)}</dd></div>
            <div><dt className="text-xs text-slate-500">Date</dt><dd>{view.charge_date}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Description</dt><dd>{view.description || 'Aucune description'}</dd></div>
          </dl>
        )}
      </DetailModal>
      <ConfirmDeleteModal open={deleteId !== null} title="Supprimer cette charge ?" description="Cette charge sera definitivement supprimee." onCancel={() => setDeleteId(null)} onConfirm={async () => { if (deleteId) await api.deleteCharge(deleteId); setDeleteId(null); await load() }} />
    </div>
  )
}
