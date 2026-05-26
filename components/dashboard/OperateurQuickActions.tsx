'use client'

import Link from 'next/link'
import { PlusCircle, Lock, Wine } from 'lucide-react'
import ClotureLotForm from '@/components/ClotureLotForm'
import { cardBase, cardPadding } from '@/lib/dashboard/design'

interface OperateurQuickActionsProps {
  activeLot: {
    id: string
    numeroLot: string
    quantiteProduite: number
  } | null
}

export default function OperateurQuickActions({ activeLot }: OperateurQuickActionsProps) {
  return (
    <div className={`${cardBase} ${cardPadding}`}>
      <h3 className="text-sm font-bold text-slate-900">Actions rapides</h3>
      <p className="mt-1 text-xs text-slate-500">
        Créez un nouveau lot ou clôturez votre production en cours.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/dashboard/lots/nouveau"
          className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-md"
        >
          <PlusCircle className="h-4 w-4" />
          Nouveau lot
        </Link>
        <Link
          href="/dashboard/lots"
          className="inline-flex items-center gap-2 rounded-md border border-slate-100 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
        >
          <Wine className="h-4 w-4" />
          Mes lots
        </Link>
      </div>

      {activeLot ? (
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Lock className="h-4 w-4 text-slate-600" />
            Clôturer le lot actif : {activeLot.numeroLot}
          </div>
          <ClotureLotForm
            lotId={activeLot.id}
            numeroLot={activeLot.numeroLot}
            quantiteProduite={activeLot.quantiteProduite}
          />
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          Aucun lot en cours à clôturer. Démarrez une nouvelle production pour commencer.
        </p>
      )}
    </div>
  )
}
