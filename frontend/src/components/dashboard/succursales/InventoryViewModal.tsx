'use client'

import { useState, useEffect } from 'react'
import MultiStepModal from '@/components/dashboard/modals/MultiStepModal'
import { fetchBranchInventory, BranchInventoryRow } from '@/services/actions/succursales'
import { Package, RefreshCw } from 'lucide-react'
import { formatNumber } from '@/lib/dashboard/format'

interface Props {
  open: boolean
  onClose: () => void
  succursaleId: string | null
}

export default function InventoryViewModal({ open, onClose, succursaleId }: Props) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<BranchInventoryRow[]>([])

  useEffect(() => {
    if (open && succursaleId) {
      load()
    }
  }, [open, succursaleId])

  async function load() {
    setLoading(true)
    try {
      const data = await fetchBranchInventory(succursaleId!)
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MultiStepModal
      open={open}
      onClose={onClose}
      title="Inventaire du Site"
      steps={['Stocks produits finis']}
      currentStep={1}
      isDirty={false}
      footer={
        <div className="flex w-full justify-end px-6 py-4 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-slate-800"
          >
            Fermer
          </button>
        </div>
      }
    >
      <div className="min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
            <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
            <p className="mt-4 text-sm font-medium text-slate-500">Chargement de l'inventaire...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="rounded-full bg-slate-50 p-4">
              <Package className="h-8 w-8 text-slate-200" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-900">Inventaire vide</p>
            <p className="mt-1 text-xs text-slate-500">Aucun produit fini n'est actuellement stocké sur ce site.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50/30">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-right">Quantité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(item => (
                  <tr key={item.produit_fini_id} className="bg-white hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.produit_nom}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.produit_code}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                        {formatNumber(item.quantite, 0)} btl.
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MultiStepModal>
  )
}
