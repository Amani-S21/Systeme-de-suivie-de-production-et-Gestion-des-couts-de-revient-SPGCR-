'use client'

import { useState } from 'react'
import { Package, Wine, Layers } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cardBase } from '@/lib/dashboard/design'
import type { AppRole } from '@/types/spgcr'
import type { QuickActionId, QuickActionsGridProps } from '@/components/dashboard/quick-actions/types'
import NouveauLotModal from '@/components/dashboard/quick-actions/NouveauLotModal'
import NouveauComposantModal from '@/components/dashboard/quick-actions/NouveauComposantModal'
import NouvelleBomModal from '@/components/dashboard/quick-actions/NouvelleBomModal'

interface ActionTile {
  id: QuickActionId
  title: string
  description: string
  icon: LucideIcon
  iconClass: string
  roles: AppRole[] | 'all'
}

const ACTIONS: ActionTile[] = [
  {
    id: 'nouveau-lot',
    title: 'Nouveau lot de production',
    description: 'Lancer une mise en bouteille et assigner un opérateur.',
    icon: Package,
    iconClass: 'bg-slate-100 text-slate-700',
    roles: 'all',
  },
  {
    id: 'nouveau-composant',
    title: 'Nouvel intrant / composant',
    description: 'Enregistrer une matière première, un emballage ou un intrant.',
    icon: Wine,
    iconClass: 'bg-emerald-50 text-emerald-700',
    roles: ['admin_msd', 'responsable_production'],
  },
  {
    id: 'nouvelle-bom',
    title: 'Nouvelle nomenclature BOM',
    description: 'Configurer une ligne de recette pour un Vin Ushindi.',
    icon: Layers,
    iconClass: 'bg-blue-50 text-blue-700',
    roles: ['admin_msd', 'responsable_production'],
  },
]

function canAccess(action: ActionTile, role: AppRole): boolean {
  return action.roles === 'all' || action.roles.includes(role)
}

export default function QuickActionsGrid({
  role,
  currentUserId,
  produitsFinis,
  operateurs,
  composants,
}: QuickActionsGridProps) {
  const [activeModal, setActiveModal] = useState<QuickActionId | null>(null)

  const visibleActions = ACTIONS.filter((a) => canAccess(a, role))

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-900">Actions rapides</h2>
        <p className="text-xs text-slate-500">
          Lancez une opération courante en quelques clics
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {visibleActions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => setActiveModal(action.id)}
              className={`${cardBase} group w-full p-5 text-left`}
            >
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-md border border-slate-100 ${action.iconClass}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-800">
                {action.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                {action.description}
              </p>
            </button>
          )
        })}
      </div>

      <NouveauLotModal
        open={activeModal === 'nouveau-lot'}
        onClose={() => setActiveModal(null)}
        role={role}
        currentUserId={currentUserId}
        produitsFinis={produitsFinis}
        operateurs={operateurs}
      />

      <NouveauComposantModal
        open={activeModal === 'nouveau-composant'}
        onClose={() => setActiveModal(null)}
      />

      <NouvelleBomModal
        open={activeModal === 'nouvelle-bom'}
        onClose={() => setActiveModal(null)}
        produitsFinis={produitsFinis}
        composants={composants}
      />
    </section>
  )
}
