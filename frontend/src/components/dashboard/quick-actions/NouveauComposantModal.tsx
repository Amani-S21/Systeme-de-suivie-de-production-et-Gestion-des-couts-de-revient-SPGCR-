'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/router'
import MultiStepModal from '@/components/dashboard/modals/MultiStepModal'
import ModalFooterNav from '@/components/dashboard/modals/ModalFooterNav'
import { FormField, formInputClass } from '@/components/dashboard/ui/FormField'
import { createComposant } from '@/services/actions/quick-actions'
import {
  nouveauComposantStep1Schema,
  nouveauComposantStep2Schema,
} from '@/lib/validations/quick-actions'
import type { NouveauComposantFormData } from '@/components/dashboard/quick-actions/types'
import { generateCode } from '@/lib/dashboard/generate-code'

const STEPS = ['Identification', 'Stocks & coûts', 'Récapitulatif']

const CATEGORIES = [
  { value: 'matiere_premiere', label: 'Matière première' },
  { value: 'intrant', label: 'Intrant' },
  { value: 'emballage', label: 'Emballage' },
  { value: 'charge_indirecte', label: 'Charge indirecte' },
] as const

const UNITES = [
  { value: 'litre', label: 'Litre' },
  { value: 'kg', label: 'Kilogramme' },
  { value: 'unite', label: 'Unité' },
] as const

const initialData: NouveauComposantFormData = {
  code: '',
  nom: '',
  categorie: 'matiere_premiere',
  unite_mesure: 'unite',
  stock_actuel: 0,
  cout_unitaire_moyen_pondere: 0,
}

interface NouveauComposantModalProps {
  open: boolean
  onClose: () => void
}

export default function NouveauComposantModal({ open, onClose }: NouveauComposantModalProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<NouveauComposantFormData>(initialData)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDirty = data.code !== '' || data.nom !== '' || data.stock_actuel > 0

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
      const parsed = nouveauComposantStep1Schema.safeParse({
        code: data.code,
        nom: data.nom,
        categorie: data.categorie,
        unite_mesure: data.unite_mesure,
      })
      if (!parsed.success) {
        applyZodErrors(parsed.error.issues)
        return false
      }
    }
    if (s === 2) {
      const parsed = nouveauComposantStep2Schema.safeParse({
        stock_actuel: data.stock_actuel,
        cout_unitaire_moyen_pondere: data.cout_unitaire_moyen_pondere,
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
    setServerError(null)
    try {
      const result = await createComposant(data)
      if (result.error) {
        setServerError(result.error)
        return
      }
      onClose()
      router.refresh()
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Impossible d’enregistrer le composant.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const catLabel = CATEGORIES.find((c) => c.value === data.categorie)?.label

  return (
    <MultiStepModal
      open={open}
      title="Enregistrer un Intrant / Stock"
      subtitle="Étape 1 du parcours — matière première ou emballage"
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
          submitLabel="Enregistrer le composant"
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
          <FormField label="Code unique (automatique)" htmlFor="code" required error={fieldErrors.code}>
            <input
              id="code"
              value={data.code}
              readOnly
              tabIndex={-1}
              onFocus={(event) => event.currentTarget.blur()}
              className={`${formInputClass(!!fieldErrors.code)} pointer-events-none cursor-not-allowed bg-slate-100`}
              placeholder="Ex. JUS-RAISIN-01"
            />
          </FormField>
          <FormField label="Désignation" htmlFor="nom" required error={fieldErrors.nom}>
            <input
              id="nom"
              value={data.nom}
              onChange={(e) => setData((d) => ({ ...d, nom: e.target.value, code: generateCode(e.target.value, 'MATIERE') }))}
              className={formInputClass(!!fieldErrors.nom)}
              placeholder="Ex. Jus de raisin concentré"
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Catégorie" htmlFor="categorie" required>
              <select
                id="categorie"
                value={data.categorie}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    categorie: e.target.value as NouveauComposantFormData['categorie'],
                  }))
                }
                className={formInputClass()}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Unité de mesure" htmlFor="unite" required>
              <select
                id="unite"
                value={data.unite_mesure}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    unite_mesure: e.target.value as NouveauComposantFormData['unite_mesure'],
                  }))
                }
                className={formInputClass()}
              >
                {UNITES.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <FormField
            label="Stock actuel"
            htmlFor="stock"
            required
            error={fieldErrors.stock_actuel}
          >
            <input
              id="stock"
              type="number"
              min={0}
              step="0.01"
              value={data.stock_actuel || ''}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  stock_actuel: parseFloat(e.target.value) || 0,
                }))
              }
              className={formInputClass(!!fieldErrors.stock_actuel)}
            />
          </FormField>
          <FormField
            label="Coût unitaire moyen pondéré (FCFA)"
            htmlFor="cout"
            required
            error={fieldErrors.cout_unitaire_moyen_pondere}
          >
            <input
              id="cout"
              type="number"
              min={0}
              step="0.01"
              value={data.cout_unitaire_moyen_pondere || ''}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  cout_unitaire_moyen_pondere: parseFloat(e.target.value) || 0,
                }))
              }
              className={formInputClass(!!fieldErrors.cout_unitaire_moyen_pondere)}
            />
          </FormField>
        </div>
      )}

      {step === 3 && (
        <dl className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/80 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Code</dt>
            <dd className="font-mono font-medium">{data.code}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Nom</dt>
            <dd className="font-medium">{data.nom}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Catégorie</dt>
            <dd className="font-medium">{catLabel}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Stock</dt>
            <dd className="font-medium">
              {data.stock_actuel} {data.unite_mesure}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">CUMP</dt>
            <dd className="font-medium">{data.cout_unitaire_moyen_pondere.toFixed(2)} FCFA</dd>
          </div>
        </dl>
      )}
    </MultiStepModal>
  )
}
