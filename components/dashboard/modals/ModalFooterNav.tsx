import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface ModalFooterNavProps {
  currentStep: number
  totalSteps: number
  onPrevious: () => void
  onNext: () => void
  onSubmit?: () => void
  isSubmitting?: boolean
  submitLabel?: string
  nextDisabled?: boolean
}

export default function ModalFooterNav({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Confirmer',
  nextDisabled = false,
}: ModalFooterNavProps) {
  const isFirst = currentStep === 1
  const isLast = currentStep === totalSteps

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirst || isSubmitting}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-100 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
        Précédent
      </button>

      {isLast ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || nextDisabled}
          className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-md disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement…
            </>
          ) : (
            submitLabel
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled || isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-md disabled:opacity-60"
        >
          Suivant
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
