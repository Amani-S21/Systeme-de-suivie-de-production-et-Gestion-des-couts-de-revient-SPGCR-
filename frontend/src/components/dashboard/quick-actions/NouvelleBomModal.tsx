'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/router'
import MultiStepModal from '@/components/dashboard/modals/MultiStepModal'
import ModalFooterNav from '@/components/dashboard/modals/ModalFooterNav'
import { FormField, formInputClass } from '@/components/dashboard/ui/FormField'
import { createNomenclatureBom } from '@/services/actions/quick-actions'
import {
  nouvelleBomStep1Schema,
  nouvelleBomStep2Schema,
} from '@/lib/validations/quick-actions'
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDirty =
    data.produit_fini_id !== '' ||
    data.composant_id !== '' ||
    data.quantite_requise > 0

  useEffect(() => {
    if (open) {
      setStep(1)
      setData(initialData)
      setFieldErrors({})
      setServerError(null)
    }
  }, [open])

  function applyZodErrors(issues: { path: PropertyKey[]; message: string }[]) {
    const errs: Record<string, string> = {}
    issues.forEach((issue) => {
      errs[String(issue.path[0])] = issue.message
    })
    setFieldErrors(errs)
  }

  function validateStep(s: number): boolean {
    setFieldErrors({})
    setServerError(null)
    if (s === 1) {
      const parsed = nouvelleBomStep1Schema.safeParse({
        produit_fini_id: data.produit_fini_id,
      })
      if (!parsed.success) {
        applyZodErrors(parsed.error.issues)
        return false
      }
    }
    if (s === 2) {
      const parsed = nouvelleBomStep2Schema.safeParse({
        composant_id: data.composant_id,
        quantite_requise: data.quantite_requise,
      })
      if (!parsed.success) {
        applyZodErrors(parsed.error.issues)
        return false
      }
    }
    return true
  }

  async function handleSubmit() {
    if (!validateStep(1)) {
      setStep(1)
      return
    }
    if (!validateStep(2)) {
      setStep(2)
      return
    }
    setIsSubmitting(true)
    const result = await createNomenclatureBom(data)
    setIsSubmitting(false)
    if (result.error) {
      setServerError(result.error)
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
      title="Définir une Nomenclature BOM"
      subtitle="Étape 2 du parcours — recette standard Vin Ushindi"
      steps={STEPS}
      currentStep={step}
      isDirty={isDirty}
      onClose={onClose}
      footer={
        <ModalFooterNav
          currentStep={step}
          totalSteps={STEPS.length}
          onPrevious={() => {
            setFieldErrors({})
            setServerError(null)
            setStep((s) => s - 1)
          }}
          onNext={() => validateStep(step) && setStep((s) => s + 1)}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Créer la nomenclature"
        />
      }
    >
      {serverError && (
        <div className="mb-4 rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {serverError}
        </div>
      )}

      {step === 1 && (
        <FormField
          label="Produit fini cible"
          htmlFor="pf"
          required
          error={fieldErrors.produit_fini_id}
        >
          <select
            id="pf"
            value={data.produit_fini_id}
            onChange={(e) =>
              setData((d) => ({ ...d, produit_fini_id: e.target.value }))
            }
            className={formInputClass(!!fieldErrors.produit_fini_id)}
          >
            <option value="">— Sélectionner —</option>
            {produitsFinis.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom} ({p.code})
              </option>
            ))}
          </select>
        </FormField>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <FormField
            label="Composant"
            htmlFor="comp"
            required
            error={fieldErrors.composant_id}
          >
            <select
              id="comp"
              value={data.composant_id}
              onChange={(e) =>
                setData((d) => ({ ...d, composant_id: e.target.value }))
              }
              className={formInputClass(!!fieldErrors.composant_id)}
            >
              <option value="">— Sélectionner —</option>
              {composants.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.code})
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Quantité requise par unité produite"
            htmlFor="qte"
            required
            error={fieldErrors.quantite_requise}
          >
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
              className={formInputClass(!!fieldErrors.quantite_requise)}
            />
          </FormField>
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
              {data.quantite_requise} {composant?.unite_mesure ?? ''}
            </dd>
          </div>
        </dl>
      )}
    </MultiStepModal>
  )
}
