'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MultiStepModal from '@/components/dashboard/modals/MultiStepModal'
import ModalFooterNav from '@/components/dashboard/modals/ModalFooterNav'
import { FormField, formInputClass } from '@/components/dashboard/ui/FormField'
import { clotureLotCostsSchema } from '@/lib/validations/quick-actions'
import { createClient } from '@/utils/supabase/client'

const STEPS = ['Lot en cours', 'Coûts de clôture', 'Récapitulatif']

interface ClotureLotModalProps {
  open: boolean
  onClose: () => void
  lotId: string
  numeroLot: string
  quantiteProduite: number
}

export default function ClotureLotModal({
  open,
  onClose,
  lotId,
  numeroLot,
  quantiteProduite,
}: ClotureLotModalProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [coutMainOeuvre, setCoutMainOeuvre] = useState(0)
  const [chargesIndirectes, setChargesIndirectes] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDirty = coutMainOeuvre > 0 || chargesIndirectes > 0

  useEffect(() => {
    if (open) {
      setStep(1)
      setCoutMainOeuvre(0)
      setChargesIndirectes(0)
      setFieldErrors({})
      setServerError(null)
    }
  }, [open])

  function validateStep(s: number): boolean {
    setFieldErrors({})
    setServerError(null)
    if (s === 2) {
      const parsed = clotureLotCostsSchema.safeParse({
        cout_main_oeuvre: coutMainOeuvre,
        charges_indirectes: chargesIndirectes,
      })
      if (!parsed.success) {
        const errs: Record<string, string> = {}
        parsed.error.issues.forEach((issue) => {
          const key = String(issue.path[0])
          errs[key] = issue.message
        })
        setFieldErrors(errs)
        return false
      }
    }
    return true
  }

  async function handleSubmit() {
    if (!validateStep(2)) {
      setStep(2)
      return
    }
    setIsSubmitting(true)
    setServerError(null)
    const supabase = createClient()
    try {
      const { data, error } = await supabase.functions.invoke('calculate-production-cost', {
        body: {
          lot_id: lotId,
          cout_direct_main_oeuvre: coutMainOeuvre,
          charges_indirectes_fixes: chargesIndirectes,
        },
      })
      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)
      onClose()
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erreur lors de la clôture.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MultiStepModal
      open={open}
      title="Clôturer le lot de production"
      subtitle={`Lot ${numeroLot}`}
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
          onNext={() => validateStep(step) && setStep((s) => Math.min(s + 1, STEPS.length))}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Clôturer et calculer"
        />
      }
    >
      {serverError && (
        <div className="mb-4 rounded-md border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {serverError}
        </div>
      )}

      {step === 1 && (
        <dl className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/80 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">N° de lot</dt>
            <dd className="font-mono font-bold text-slate-900">{numeroLot}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Quantité produite</dt>
            <dd className="font-medium">{quantiteProduite} btl.</dd>
          </div>
          <p className="mt-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
            La clôture déclenchera le calcul automatique du coût de revient via l&apos;Edge
            Function SPGCR.
          </p>
        </dl>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <FormField
            label="Coût direct main-d'œuvre ($)"
            htmlFor="mainOeuvre"
            required
            error={fieldErrors.cout_main_oeuvre}
          >
            <input
              id="mainOeuvre"
              type="number"
              step="0.01"
              min="0"
              className={formInputClass(!!fieldErrors.cout_main_oeuvre)}
              value={coutMainOeuvre || ''}
              onChange={(e) =>
                setCoutMainOeuvre(parseFloat(e.target.value) || 0)
              }
            />
          </FormField>
          <FormField
            label="Charges indirectes fixes ($)"
            htmlFor="charges"
            required
            error={fieldErrors.charges_indirectes}
          >
            <input
              id="charges"
              type="number"
              step="0.01"
              min="0"
              className={formInputClass(!!fieldErrors.charges_indirectes)}
              value={chargesIndirectes || ''}
              onChange={(e) =>
                setChargesIndirectes(parseFloat(e.target.value) || 0)
              }
            />
          </FormField>
        </div>
      )}

      {step === 3 && (
        <dl className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/80 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Lot</dt>
            <dd className="font-mono font-medium">{numeroLot}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Main-d&apos;œuvre</dt>
            <dd className="font-medium">${coutMainOeuvre.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Charges indirectes</dt>
            <dd className="font-medium">${chargesIndirectes.toFixed(2)}</dd>
          </div>
        </dl>
      )}
    </MultiStepModal>
  )
}
