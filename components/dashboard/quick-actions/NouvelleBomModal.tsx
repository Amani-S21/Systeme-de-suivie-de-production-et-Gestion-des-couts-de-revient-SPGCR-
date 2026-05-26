'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MultiStepModal from '@/components/dashboard/modals/MultiStepModal'
import ModalFooterNav from '@/components/dashboard/modals/ModalFooterNav'
import { inputBase } from '@/lib/dashboard/design'
import { createNomenclatureBom } from '@/app/dashboard/actions/quick-actions'
import type {
  ComposantOption,
  NouvelleBomFormData,
  ProduitFiniOption,
} from '@/components/dashboard/quick-actions/types'

const STEPS = ['Produit fini', 'Composant & quantité', 'Récapitulatif']

const initialData: NouvelleBomFormData = {
  produit_fini_id: '',
  composant_id: '',
  quantite_requise: 0,
}

interface NouvelleBomModalProps {
  open: boolean
  onClose: () => void
  produitsFinis: ProduitFiniOption[]
  composants: ComposantOption[]
}

export default function NouvelleBomModal({
  open,
  onClose,
  produitsFinis,
  composants,
}: NouvelleBomModalProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<NouvelleBomFormData>(initialData)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDirty =
    data.produit_fini_id !== '' ||
    data.composant_id !== '' ||
    data.quantite_requise > 0

  useEffect(() => {
    if (open) {
      setStep(1)
      setData(initialData)
      setError(null)
    }
  }, [open])

  function validateStep(s: number): boolean {
    setError(null)
    if (s === 1 && !data.produit_fini_id) {
      setError('Sélectionnez un produit fini.')
      return false
    }
    if (s === 2) {
      if (!data.composant_id) {
        setError('Sélectionnez un composant.')
        return false
      }
      if (!data.quantite_requise || data.quantite_requise <= 0) {
        setError('La quantité requise doit être positive.')
        return false
      }
    }
    return true
  }

  async function handleSubmit() {
    if (!validateStep(1) || !validateStep(2)) return
    setIsSubmitting(true)
    const result = await createNomenclatureBom(data)
    setIsSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    onClose()
    router.refresh()
  }

  const produit = produitsFinis.find((p) => p.id === data.produit_fini_id)
  const composant = composants.find((c) => c.id === data.composant_id)

  return (
    <MultiStepModal
      open={open}
      title="Nouvelle nomenclature BOM"
      subtitle="Définir une ligne de recette produit / composant"
      steps={STEPS}
      currentStep={step}
      isDirty={isDirty}
      onClose={onClose}
      footer={
        <ModalFooterNav
          currentStep={step}
          totalSteps={STEPS.length}
          onPrevious={() => {
            setError(null)
            setStep((s) => s - 1)
          }}
          onNext={() => validateStep(step) && setStep((s) => s + 1)}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Créer la nomenclature"
        />
      }
    >
      {error && (
        <div className="mb-4 rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {step === 1 && (
        <div>
          <label htmlFor="pf" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Produit fini cible
          </label>
          <select
            id="pf"
            value={data.produit_fini_id}
            onChange={(e) =>
              setData((d) => ({ ...d, produit_fini_id: e.target.value }))
            }
            className={`${inputBase} h-11 w-full`}
          >
            <option value="">— Sélectionner —</option>
            {produitsFinis.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom} ({p.code})
              </option>
            ))}
          </select>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label htmlFor="comp" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Composant
            </label>
            <select
              id="comp"
              value={data.composant_id}
              onChange={(e) =>
                setData((d) => ({ ...d, composant_id: e.target.value }))
              }
              className={`${inputBase} h-11 w-full`}
            >
              <option value="">— Sélectionner —</option>
              {composants.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="qte" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Quantité requise par unité produite
            </label>
            <input
              id="qte"
              type="number"
              min={0}
              step="0.0001"
              value={data.quantite_requise || ''}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  quantite_requise: parseFloat(e.target.value) || 0,
                }))
              }
              className={`${inputBase} h-11 w-full`}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <dl className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/80 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Produit fini</dt>
            <dd className="font-medium text-right">{produit?.nom ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Composant</dt>
            <dd className="font-medium text-right">{composant?.nom ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Quantité requise</dt>
            <dd className="font-medium">
              {data.quantite_requise}{' '}
              {composant?.unite_mesure ?? ''}
            </dd>
          </div>
        </dl>
      )}
    </MultiStepModal>
  )
}
