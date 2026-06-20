'use client'

import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import StepIndicator from '@/components/dashboard/modals/StepIndicator'

interface MultiStepModalProps {
  open: boolean
  title: string
  subtitle?: string
  steps: string[]
  currentStep: number
  isDirty: boolean
  onClose: () => void
  children: React.ReactNode
  footer: React.ReactNode
}

export default function MultiStepModal({
  open,
  title,
  subtitle,
  steps,
  currentStep,
  isDirty,
  onClose,
  children,
  footer,
}: MultiStepModalProps) {
  const [confirmClose, setConfirmClose] = useState(false)

  const requestClose = useCallback(() => {
    if (isDirty) {
      setConfirmClose(true)
      return
    }
    onClose()
  }, [isDirty, onClose])

  useEffect(() => {
    if (!open) {
      setConfirmClose(false)
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, requestClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={() => {
          if (!isDirty) onClose()
          else setConfirmClose(true)
        }}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative flex max-h-[100dvh] w-full flex-col rounded-t-lg border border-slate-100 bg-white shadow-xl sm:max-h-[90vh] sm:max-w-xl sm:rounded-lg"
      >
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-100 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="shrink-0 border-b border-slate-100 px-5 py-4">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>

        {confirmClose && (
          <div className="mx-5 mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">Modifications non enregistrées</p>
            <p className="mt-1 text-xs text-amber-800">
              Fermer maintenant annulera votre saisie en cours.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmClose(false)}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Continuer la saisie
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmClose(false)
                  onClose()
                }}
                className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
              >
                Fermer sans enregistrer
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

        <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
          {footer}
        </div>
      </div>
    </div>
  )
}
