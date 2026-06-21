'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/router'
import MultiStepModal from '@/components/dashboard/modals/MultiStepModal'
import ModalFooterNav from '@/components/dashboard/modals/ModalFooterNav'
import { FormField, formInputClass } from '@/components/dashboard/ui/FormField'
import { generateNumeroLot } from '@/lib/dashboard/generate-numero-lot'
import { createProductionLot } from '@/services/actions/quick-actions'
import {
  nouveauLotStep1Schema,
  nouveauLotStep2Schema,
} from '@/lib/validations/quick-actions'
import type {
  NouveauLotFormData,
  OperateurOption,
  ProduitFiniOption,
} from '@/components/dashboard/quick-actions/types'
import type { AppRole } from '@/types/spgcr'

const STEPS = ['Produit & quantité', 'Opérateur & lot', 'Récapitulatif']

interface NouveauLotModalProps {
  open: boolean
  onClose: () => void
  role: AppRole
  currentUserId: string
  produitsFinis: ProduitFiniOption[]
  operateurs: OperateurOption[]
}

const initialData = (userId: string): NouveauLotFormData => ({
  produitFiniId: '',
  quantite: 0,
  operateurId: userId,
  numeroLot: generateNumeroLot(),
  numeroLotManuel: false,
})

export default function NouveauLotModal({
  open,
  onClose,
  role,
  currentUserId,
  produitsFinis,
  operateurs,
}: NouveauLotModalProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<NouveauLotFormData>(() => initialData(currentUserId))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isOperateurOnly = role === 'operateur_usine'
  const isDirty =
    data.produitFiniId !== '' ||
    data.quantite > 0 ||
    data.numeroLotManuel

  useEffect(() => {
    if (open) {
      setStep(1)
      setData(initialData(currentUserId))
      setFieldErrors({})
      setServerError(null)
    }
  }, [open, currentUserId])

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
      const parsed = nouveauLotStep1Schema.safeParse({
        produitFiniId: data.produitFiniId,
        quantite: data.quantite,
      })
      if (!parsed.success) {
        applyZodErrors(parsed.error.issues)
        return false
      }
    }
    if (s === 2) {
      const parsed = nouveauLotStep2Schema.safeParse({
        numeroLot: data.numeroLot,
        operateurId: data.operateurId,
      })
      if (!parsed.success) {
        applyZodErrors(parsed.error.issues)
        return false
      }
    }
    return true
  }

  function handleNext() {
    if (!validateStep(step)) return
    setStep((s) => Math.min(s + 1, STEPS.length))
  }

  function handlePrevious() {
    setFieldErrors({})
    setServerError(null)
    setStep((s) => Math.max(s - 1, 1))
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
    setServerError(null)
    const result = await createProductionLot({
      numero_lot: data.numeroLot,
      produit_fini_id: data.produitFiniId,
      quantite_produite: data.quantite,
      operateur_id: data.operateurId,
    })
    setIsSubmitting(false)
    if (result.error) {
      setServerError(result.error)
      return
    }
    onClose()
    router.refresh()
  }

  const selectedProduit = produitsFinis.find((p) => p.id === data.produitFiniId)
  const selectedOperateur = operateurs.find((o) => o.id === data.operateurId)

  return (
    <MultiStepModal
      open={open}
      title="Ouvrir un lot de production"
      subtitle="Étape 3 du parcours — mise en bouteille Vin Ushindi"
      steps={STEPS}
      currentStep={step}
      isDirty={isDirty}
      onClose={onClose}
      footer={
        <ModalFooterNav
          currentStep={step}
          totalSteps={STEPS.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Lancer la production"
        />
      }
    >
      {serverError && (
        <div className="mb-4 rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {serverError}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <FormField
            label="Produit fini (Vin Ushindi)"
            htmlFor="produit"
            required
            error={fieldErrors.produitFiniId}
          >
            <select
              id="produit"
              value={data.produitFiniId}
              onChange={(e) =>
                setData((d) => ({ ...d, produitFiniId: e.target.value }))
              }
              className={formInputClass(!!fieldErrors.produitFiniId)}
            >
              <option value="">— Sélectionner —</option>
              {produitsFinis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} ({p.code})
                  {p.volume_litre != null ? ` · ${p.volume_litre} L` : ''}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Quantité prévue (bouteilles)"
            htmlFor="quantite"
            required
            error={fieldErrors.quantite}
          >
            <input
              id="quantite"
              type="number"
              min={1}
              value={data.quantite || ''}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  quantite: parseInt(e.target.value, 10) || 0,
                }))
              }
              className={formInputClass(!!fieldErrors.quantite)}
              placeholder="Ex. 500"
            />
          </FormField>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {!isOperateurOnly && (
            <FormField
              label="Opérateur assigné"
              htmlFor="operateur"
              required
              error={fieldErrors.operateurId}
            >
              <select
                id="operateur"
                value={data.operateurId}
                onChange={(e) =>
                  setData((d) => ({ ...d, operateurId: e.target.value }))
                }
                className={formInputClass(!!fieldErrors.operateurId)}
              >
                {operateurs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.prenom} {o.nom}
                  </option>
                ))}
              </select>
            </FormField>
          )}
          {isOperateurOnly && (
            <p className="rounded-md border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Ce lot vous sera automatiquement assigné en tant qu&apos;opérateur.
            </p>
          )}
          <FormField
            label="Numéro de lot"
            htmlFor="numeroLot"
            required
            error={fieldErrors.numeroLot}
          >
            <div className="mb-1.5 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    numeroLot: generateNumeroLot(),
                    numeroLotManuel: false,
                  }))
                }
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Régénérer
              </button>
            </div>
            <input
              id="numeroLot"
              type="text"
              value={data.numeroLot}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  numeroLot: e.target.value,
                  numeroLotManuel: true,
                }))
              }
              className={`${formInputClass(!!fieldErrors.numeroLot)} font-mono text-sm`}
            />
          </FormField>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/80 p-4 text-sm">
          <h3 className="font-bold text-slate-900">Récapitulatif</h3>
          <dl className="space-y-2">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Produit</dt>
              <dd className="font-medium text-slate-900">
                {selectedProduit?.nom ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Quantité</dt>
              <dd className="font-medium text-slate-900">{data.quantite} btl.</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Opérateur</dt>
              <dd className="font-medium text-slate-900">
                {selectedOperateur
                  ? `${selectedOperateur.prenom} ${selectedOperateur.nom}`
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">N° de lot</dt>
              <dd className="font-mono font-medium text-slate-900">{data.numeroLot}</dd>
            </div>
          </dl>
        </div>
      )}
    </MultiStepModal>
  )
}
