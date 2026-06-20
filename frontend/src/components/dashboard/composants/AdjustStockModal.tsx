'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import MultiStepModal from '@/components/dashboard/modals/MultiStepModal'
import ModalFooterNav from '@/components/dashboard/modals/ModalFooterNav'
import { FormField, formInputClass } from '@/components/dashboard/ui/FormField'
import { computeNewCump } from '@/lib/inventory/cump'
import { submitAdjustStock } from '@/app/dashboard/actions/composants'
import {
  composantIdentificationSchema,
  composantMouvementSchema,
  type AdjustStockFormValues,
} from '@/lib/validations/composants'
import type { ComposantRow } from '@/lib/dashboard/queries/composants-page'
import { generateCode } from '@/lib/dashboard/generate-code'

const STEPS = ['Identification', 'Mouvement de stock', 'Récapitulatif']

const defaultValues: AdjustStockFormValues = {
  identification: { mode: 'existing', composantId: '' },
  mouvement: { quantiteAchetee: 0, prixAchatTotal: 0 },
}

interface AdjustStockModalProps {
  open: boolean
  onClose: () => void
  composants: ComposantRow[]
  initialComposantId?: string
}

export default function AdjustStockModal({
  open,
  onClose,
  composants,
  initialComposantId,
}: AdjustStockModalProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<AdjustStockFormValues>({
    defaultValues,
    mode: 'onChange',
  })

  const { watch, reset, trigger, formState, setValue } = form
  const identification = watch('identification')
  const mouvement = watch('mouvement')

  useEffect(() => {
    if (open) {
      reset(initialComposantId
        ? { identification: { mode: 'existing', composantId: initialComposantId }, mouvement: { quantiteAchetee: 0, prixAchatTotal: 0 } }
        : defaultValues)
      setStep(1)
      setServerError(null)
    }
  }, [open, reset, initialComposantId])

  const selectedComposant = useMemo(() => {
    if (identification.mode !== 'existing') return null
    return composants.find((c) => c.id === identification.composantId) ?? null
  }, [identification, composants])

  const previewCump = useMemo(() => {
    if (identification.mode === 'new') {
      if (mouvement.quantiteAchetee <= 0) return 0
      return Math.round((mouvement.prixAchatTotal / mouvement.quantiteAchetee) * 100) / 100
    }
    if (!selectedComposant) return 0
    return computeNewCump(
      Number(selectedComposant.stock_actuel),
      Number(selectedComposant.cout_unitaire_moyen_pondere),
      mouvement.quantiteAchetee || 0,
      mouvement.prixAchatTotal || 0
    )
  }, [identification.mode, selectedComposant, mouvement])

  const previewStock = useMemo(() => {
    if (identification.mode === 'new') return mouvement.quantiteAchetee || 0
    if (!selectedComposant) return 0
    return Number(selectedComposant.stock_actuel) + (mouvement.quantiteAchetee || 0)
  }, [identification.mode, selectedComposant, mouvement])

  async function validateCurrentStep(): Promise<boolean> {
    setServerError(null)
    if (step === 1) {
      const parsed = composantIdentificationSchema.safeParse(identification)
      if (!parsed.success) {
        parsed.error.issues.forEach((issue) => {
          const path = issue.path.join('.') as 'identification.composantId'
          form.setError(path as keyof AdjustStockFormValues, {
            message: issue.message,
          })
        })
        return false
      }
      return true
    }
    if (step === 2) {
      const parsed = composantMouvementSchema.safeParse(mouvement)
      if (!parsed.success) {
        parsed.error.issues.forEach((issue) => {
          const field = issue.path[0] as 'quantiteAchetee' | 'prixAchatTotal'
          form.setError(`mouvement.${field}`, { message: issue.message })
        })
        return false
      }
      return true
    }
    return true
  }

  async function handleNext() {
    const ok = await validateCurrentStep()
    if (!ok) return
    setStep((s) => Math.min(s + 1, STEPS.length))
  }

  async function handleSubmit() {
    const idOk = composantIdentificationSchema.safeParse(identification)
    const movOk = composantMouvementSchema.safeParse(mouvement)
    if (!idOk.success) {
      setStep(1)
      return
    }
    if (!movOk.success) {
      setStep(2)
      return
    }
    setServerError(null)
    const result = await submitAdjustStock(form.getValues())
    if (result.error) {
      setServerError(result.error)
      return
    }
    onClose()
    router.refresh()
  }

  const isDirty = formState.isDirty

  return (
    <MultiStepModal
      open={open}
      title="Ajouter / Ajuster le stock"
      subtitle="Entrée en stock et mise à jour du CUMP"
      steps={STEPS}
      currentStep={step}
      isDirty={isDirty}
      onClose={onClose}
      footer={
        <ModalFooterNav
          currentStep={step}
          totalSteps={STEPS.length}
          onPrevious={() => {
            setServerError(null)
            setStep((s) => s - 1)
          }}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isSubmitting={formState.isSubmitting}
          submitLabel="Valider l'entrée en stock"
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
          <Controller
            name="identification.mode"
            control={form.control}
            render={({ field }) => (
              <div className="flex gap-2 rounded-md border border-slate-100 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => {
                    field.onChange('existing')
                    setValue('identification', { mode: 'existing', composantId: '' })
                  }}
                  className={`flex-1 rounded-md py-2 text-xs font-semibold transition-colors ${
                    field.value === 'existing'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Composant existant
                </button>
                <button
                  type="button"
                  onClick={() => {
                    field.onChange('new')
                    setValue('identification', {
                      mode: 'new',
                      code: '',
                      nom: '',
                      categorie: 'matiere_premiere',
                      unite_mesure: 'unite',
                    })
                  }}
                  className={`flex-1 rounded-md py-2 text-xs font-semibold transition-colors ${
                    field.value === 'new'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Nouveau composant
                </button>
              </div>
            )}
          />

          {identification.mode === 'existing' ? (
            <FormField
              label="Composant"
              htmlFor="composantId"
              required
              error={
                identification.mode === 'existing'
                  ? (formState.errors.identification as { composantId?: { message?: string } })
                      ?.composantId?.message
                  : undefined
              }
            >
              <select
                id="composantId"
                className={formInputClass(!!formState.errors.identification)}
                value={identification.composantId}
                onChange={(e) =>
                  setValue('identification', {
                    mode: 'existing',
                    composantId: e.target.value,
                  }, { shouldValidate: true, shouldDirty: true })
                }
              >
                <option value="">— Sélectionner —</option>
                {composants.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom} ({c.code})
                  </option>
                ))}
              </select>
            </FormField>
          ) : (
            <div className="space-y-4">
              <FormField
                label="Code (automatique)"
                htmlFor="code"
                required
                error={
                  identification.mode === 'new'
                    ? (formState.errors.identification as { code?: { message?: string } })?.code
                        ?.message
                    : undefined
                }
              >
                <input
                  id="code"
                  value={identification.code}
                  readOnly
                  tabIndex={-1}
                  onFocus={(event) => event.currentTarget.blur()}
                  className={`${formInputClass(!!formState.errors.identification)} pointer-events-none cursor-not-allowed bg-slate-100`}
                  placeholder="Ex. JUS-RAISIN-01"
                />
              </FormField>
              <FormField
                label="Nom"
                htmlFor="nom"
                required
                error={
                  identification.mode === 'new'
                    ? (formState.errors.identification as { nom?: { message?: string } })?.nom
                        ?.message
                    : undefined
                }
              >
                <input
                  id="nom"
                  className={formInputClass(!!formState.errors.identification)}
                  value={identification.nom}
                  onChange={(e) =>
                    setValue(
                      'identification',
                      { ...identification, nom: e.target.value, code: generateCode(e.target.value, 'MATIERE') },
                      { shouldValidate: true, shouldDirty: true }
                    )
                  }
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Catégorie" htmlFor="categorie" required>
                  <select
                    id="categorie"
                    className={formInputClass()}
                    value={identification.categorie}
                    onChange={(e) =>
                      setValue(
                        'identification',
                        {
                          ...identification,
                          categorie: e.target.value as typeof identification.categorie,
                        },
                        { shouldDirty: true }
                      )
                    }
                  >
                    <option value="matiere_premiere">Matière première</option>
                    <option value="intrant">Intrant</option>
                    <option value="emballage">Emballage</option>
                    <option value="charge_indirecte">Charge indirecte</option>
                  </select>
                </FormField>
                <FormField label="Unité" htmlFor="unite" required>
                  <select
                    id="unite"
                    className={formInputClass()}
                    value={identification.unite_mesure}
                    onChange={(e) =>
                      setValue(
                        'identification',
                        {
                          ...identification,
                          unite_mesure: e.target.value as typeof identification.unite_mesure,
                        },
                        { shouldDirty: true }
                      )
                    }
                  >
                    <option value="litre">Litre</option>
                    <option value="kg">Kilogramme</option>
                    <option value="unite">Unité</option>
                  </select>
                </FormField>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <FormField
            label="Quantité achetée"
            htmlFor="quantite"
            required
            error={formState.errors.mouvement?.quantiteAchetee?.message}
          >
            <input
              id="quantite"
              type="number"
              step="0.01"
              min="0"
              className={formInputClass(!!formState.errors.mouvement?.quantiteAchetee)}
              {...form.register('mouvement.quantiteAchetee', { valueAsNumber: true })}
            />
          </FormField>
          <FormField
            label="Prix d'achat total ($)"
            htmlFor="prix"
            required
            error={formState.errors.mouvement?.prixAchatTotal?.message}
          >
            <input
              id="prix"
              type="number"
              step="0.01"
              min="0"
              className={formInputClass(!!formState.errors.mouvement?.prixAchatTotal)}
              {...form.register('mouvement.prixAchatTotal', { valueAsNumber: true })}
            />
          </FormField>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50/80 p-4 text-sm">
          <h3 className="font-bold text-slate-900">Récapitulatif & CUMP théorique</h3>
          <dl className="space-y-2">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Composant</dt>
              <dd className="font-medium text-right">
                {identification.mode === 'new'
                  ? `${identification.nom} (${identification.code})`
                  : selectedComposant?.nom}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Entrée stock</dt>
              <dd className="font-medium">+{mouvement.quantiteAchetee}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
              <dt className="text-slate-500">Nouveau stock</dt>
              <dd className="font-medium">{previewStock}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Nouveau CUMP</dt>
              <dd className="text-lg font-bold text-slate-900">${previewCump.toFixed(2)}</dd>
            </div>
          </dl>
        </div>
      )}
    </MultiStepModal>
  )
}
