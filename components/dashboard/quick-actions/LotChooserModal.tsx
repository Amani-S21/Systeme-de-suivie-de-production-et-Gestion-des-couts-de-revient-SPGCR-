'use client'

import { Package, Lock, X } from 'lucide-react'

interface LotChooserModalProps {
  open: boolean
  onClose: () => void
  numeroLot?: string
  onNouveauLot: () => void
  onCloturer: () => void
}

export default function LotChooserModal({
  open,
  onClose,
  numeroLot,
  onNouveauLot,
  onCloturer,
}: LotChooserModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className="relative w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-lg"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Étape 3 — Production
        </p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">
          Ouvrir ou clôturer un lot ?
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Choisissez l&apos;opération à effectuer sur la ligne de production.
        </p>
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => {
              onClose()
              onNouveauLot()
            }}
            className="group flex w-full items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md"
          >
            <Package className="h-5 w-5 text-slate-600 group-hover:text-blue-600" />
            <span>
              <span className="block text-sm font-semibold text-slate-900">
                Ouvrir un nouveau lot
              </span>
              <span className="text-xs text-slate-500">Démarrer une mise en bouteille</span>
            </span>
          </button>
          {numeroLot && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onCloturer()
              }}
              className="group flex w-full items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500 hover:shadow-md"
            >
              <Lock className="h-5 w-5 text-amber-600" />
              <span>
                <span className="block text-sm font-semibold text-slate-900">
                  Clôturer le lot en cours
                </span>
                <span className="font-mono text-xs text-slate-500">{numeroLot}</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
