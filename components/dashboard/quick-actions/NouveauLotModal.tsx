'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MultiStepModal from '@/components/dashboard/modals/MultiStepModal'
import ModalFooterNav from '@/components/dashboard/modals/ModalFooterNav'
import { inputBase } from '@/lib/dashboard/design'
import { generateNumeroLot } from '@/lib/dashboard/generate-numero-lot'
import { createProductionLot } from '@/app/dashboard/actions/quick-actions'
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
  const [error, setError] = useState<string | null>(null)
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
      setError(null)
    }
  }, [open, currentUserId])

  function validateStep(s: number): boolean {
    setError(null)
    if (s === 1) {
      if (!data.produitFiniId) {
        setError('Choisissez un produit fini.')
        return false
      }
      if (!data.quantite || data.quantite < 1) {
        setError('Indiquez une quantité prévue d\'au moins 1 bouteille.')
        return false
      }
    }
    if (s === 2) {
      if (!data.numeroLot.trim()) {
        setError('Le numéro de lot est obligatoire.')
        return false
      }
      if (!data.operateurId) {
        setError('Assignez un opérateur.')
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
    setError(null)
    setStep((s) => Math.max(s - 1, 1))
  }

  async function handleSubmit() {
    if (!validateStep(2)) {
      setStep(2)
      return
    }
    setIsSubmitting(true)
    setError(null)
    const result = await createProductionLot({
      numero_lot: data.numeroLot,
      produit_fini_id: data.produitFiniId,
      quantite_produite: data.quantite,
      operateur_id: data.operateurId,
    })
    setIsSubmitting(false)
    if (result.error) {
      setError(result.error)
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
      title="Nouveau lot de production"
      subtitle="Lancez une mise en bouteille Vin Ushindi"
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
      {error && (
        <div className="mb-4 rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label htmlFor="produit" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Produit fini (Vin Ushindi)
            </label>
            <select
              id="produit"
              value={data.produitFiniId}
              onChange={(e) =>
                setData((d) => ({ ...d, produitFiniId: e.target.value }))
              }
              className={`${inputBase} h-11 w-full`}
            >
              <option value="">— Sélectionner —</option>
              {produitsFinis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} ({p.code})
                  {p.volume_litre != null ? ` · ${p.volume_litre} L` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="quantite" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Quantité prévue (bouteilles)
            </label>
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
              className={`${inputBase} h-11 w-full`}
              placeholder="Ex. 500"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {!isOperateurOnly && (
            <div>
              <label htmlFor="operateur" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Opérateur assigné
              </label>
              <select
                id="operateur"
                value={data.operateurId}
                onChange={(e) =>
                  setData((d) => ({ ...d, operateurId: e.target.value }))
                }
                className={`${inputBase} h-11 w-full`}
              >
                {operateurs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.prenom} {o.nom}
                  </option>
                ))}
              </select>
            </div>
          )}
          {isOperateurOnly && (
            <p className="rounded-md border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Ce lot vous sera automatiquement assigné en tant qu&apos;opérateur.
            </p>
          )}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="numeroLot" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Numéro de lot
              </label>
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
              className={`${inputBase} h-11 w-full font-mono text-sm`}
            />
          </div>
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
