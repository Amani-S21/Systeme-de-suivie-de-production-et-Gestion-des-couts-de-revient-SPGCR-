'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MultiStepModal from '@/components/dashboard/modals/MultiStepModal'
import ModalFooterNav from '@/components/dashboard/modals/ModalFooterNav'
import { inputBase } from '@/lib/dashboard/design'
import { createComposant } from '@/app/dashboard/actions/quick-actions'
import type { NouveauComposantFormData } from '@/components/dashboard/quick-actions/types'

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
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDirty = data.code !== '' || data.nom !== '' || data.stock_actuel > 0

  useEffect(() => {
    if (open) {
      setStep(1)
      setData(initialData)
      setError(null)
    }
  }, [open])

  function validateStep(s: number): boolean {
    setError(null)
    if (s === 1) {
      if (!data.code.trim()) {
        setError('Le code est obligatoire.')
        return false
      }
      if (!data.nom.trim()) {
        setError('Le nom est obligatoire.')
        return false
      }
    }
    if (s === 2) {
      if (data.stock_actuel < 0 || data.cout_unitaire_moyen_pondere < 0) {
        setError('Les valeurs ne peuvent pas être négatives.')
        return false
      }
    }
    return true
  }

  async function handleSubmit() {
    if (!validateStep(1) || !validateStep(2)) return
    setIsSubmitting(true)
    const result = await createComposant(data)
    setIsSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    onClose()
    router.refresh()
  }

  const catLabel = CATEGORIES.find((c) => c.value === data.categorie)?.label

  return (
    <MultiStepModal
      open={open}
      title="Nouvel intrant / composant"
      subtitle="Ajoutez une matière première ou un emballage"
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
          submitLabel="Enregistrer le composant"
        />
      }
    >
      {error && (
        <div className="mb-4 rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label htmlFor="code" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Code unique
            </label>
            <input
              id="code"
              value={data.code}
              onChange={(e) => setData((d) => ({ ...d, code: e.target.value }))}
              className={`${inputBase} h-11 w-full font-mono`}
              placeholder="Ex. JUS-RAISIN-01"
            />
          </div>
          <div>
            <label htmlFor="nom" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Désignation
            </label>
            <input
              id="nom"
              value={data.nom}
              onChange={(e) => setData((d) => ({ ...d, nom: e.target.value }))}
              className={`${inputBase} h-11 w-full`}
              placeholder="Ex. Jus de raisin concentré"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="categorie" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Catégorie
              </label>
              <select
                id="categorie"
                value={data.categorie}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    categorie: e.target.value as NouveauComposantFormData['categorie'],
                  }))
                }
                className={`${inputBase} h-11 w-full`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="unite" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Unité de mesure
              </label>
              <select
                id="unite"
                value={data.unite_mesure}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    unite_mesure: e.target.value as NouveauComposantFormData['unite_mesure'],
                  }))
                }
                className={`${inputBase} h-11 w-full`}
              >
                {UNITES.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label htmlFor="stock" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Stock actuel
            </label>
            <input
              id="stock"
              type="number"
              min={0}
              step="0.01"
              value={data.stock_actuel}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  stock_actuel: parseFloat(e.target.value) || 0,
                }))
              }
              className={`${inputBase} h-11 w-full`}
            />
          </div>
          <div>
            <label htmlFor="cout" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Coût unitaire moyen pondéré ($)
            </label>
            <input
              id="cout"
              type="number"
              min={0}
              step="0.01"
              value={data.cout_unitaire_moyen_pondere}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  cout_unitaire_moyen_pondere: parseFloat(e.target.value) || 0,
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
            <dd className="font-medium">${data.cout_unitaire_moyen_pondere.toFixed(2)}</dd>
          </div>
        </dl>
      )}
    </MultiStepModal>
  )
}
