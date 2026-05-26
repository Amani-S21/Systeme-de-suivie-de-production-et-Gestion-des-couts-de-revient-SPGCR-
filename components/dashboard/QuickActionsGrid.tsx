'use client'

import { useState } from 'react'
import { ArrowRight, Boxes, Layers3, Factory, Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AppRole } from '@/types/spgcr'
import type { QuickActionId, QuickActionsGridProps } from '@/components/dashboard/quick-actions/types'
import LotChooserModal from '@/components/dashboard/quick-actions/LotChooserModal'
import NouveauLotModal from '@/components/dashboard/quick-actions/NouveauLotModal'
import NouveauComposantModal from '@/components/dashboard/quick-actions/NouveauComposantModal'
import NouvelleFormuleModal from '@/components/dashboard/nomenclatures/NouvelleFormuleModal'
import ClotureLotModal from '@/components/dashboard/quick-actions/ClotureLotModal'

type StepAccent = 'amber' | 'blue' | 'emerald'

interface WorkflowStepDef {
  step: 1 | 2 | 3
  id: QuickActionId
  title: string
  hint: string
  icon: LucideIcon
  roles: AppRole[] | 'all'
  accent: StepAccent
}

const WORKFLOW_STEPS: WorkflowStepDef[] = [
  {
    step: 1,
    id: 'nouveau-composant',
    title: 'Étape 1 — Approvisionner les Stocks',
    hint: 'Composants & CUMP : enregistrez les intrants, puis mettez à jour les coûts.',
    icon: Boxes,
    roles: ['admin_msd', 'responsable_production'],
    accent: 'amber',
  },
  {
    step: 2,
    id: 'nouvelle-bom',
    title: 'Étape 2 — Enregistrer un Produit & sa Recette (BOM)',
    hint: 'Déclarez un produit au catalogue théorique, puis configurez sa recette standard.',
    icon: Layers3,
    roles: ['admin_msd', 'responsable_production'],
    accent: 'blue',
  },
  {
    step: 3,
    id: 'gestion-lot',
    title: 'Étape 3 — Lancer un Lot de Production',
    hint: 'Mise en bouteille : ouvrez un lot ou clôturez la production en cours.',
    icon: Factory,
    roles: 'all',
    accent: 'emerald',
  },
]

function canAccessStep(step: WorkflowStepDef, role: AppRole): boolean {
  return step.roles === 'all' || step.roles.includes(role)
}

function isOperateurOnly(role: AppRole): boolean {
  return role === 'operateur_usine'
}

function getAccentClasses(accent: StepAccent) {
  switch (accent) {
    case 'amber':
      return {
        hoverBorder: 'hover:border-amber-400',
        hoverBg: 'hover:bg-amber-50/30',
        hoverArrow: 'group-hover:text-amber-500',
        focusRing: 'focus-visible:ring-amber-500/30',
        hoverIcon: 'group-hover:text-amber-600',
        badgeHoverBg: 'group-hover:bg-amber-100',
        badgeHoverText: 'group-hover:text-amber-700',
      }
    case 'blue':
      return {
        hoverBorder: 'hover:border-blue-400',
        hoverBg: 'hover:bg-blue-50/30',
        hoverArrow: 'group-hover:text-blue-500',
        focusRing: 'focus-visible:ring-blue-500/30',
        hoverIcon: 'group-hover:text-blue-600',
        badgeHoverBg: 'group-hover:bg-blue-100',
        badgeHoverText: 'group-hover:text-blue-700',
      }
    case 'emerald':
      return {
        hoverBorder: 'hover:border-emerald-400',
        hoverBg: 'hover:bg-emerald-50/30',
        hoverArrow: 'group-hover:text-emerald-500',
        focusRing: 'focus-visible:ring-emerald-500/30',
        hoverIcon: 'group-hover:text-emerald-600',
        badgeHoverBg: 'group-hover:bg-emerald-100',
        badgeHoverText: 'group-hover:text-emerald-700',
      }
  }
}

interface StepActionButtonProps {
  step: number
  title: string
  hint: string
  icon: LucideIcon
  accent: StepAccent
  disabled?: boolean
  onClick?: () => void
}

function StepActionButton({
  step,
  title,
  hint,
  icon: Icon,
  accent,
  disabled,
  onClick,
}: StepActionButtonProps) {
  const accentClasses = getAccentClasses(accent)

  const base =
    'group flex w-full items-start gap-4 rounded-md border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-md'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={[
        base,
        accentClasses.hoverBorder,
        accentClasses.hoverBg,
        accentClasses.focusRing,
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
        disabled ? 'cursor-not-allowed opacity-60 pointer-events-none' : '',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700',
          accentClasses.badgeHoverBg,
          accentClasses.badgeHoverText,
        ].join(' ')}
      >
        {step}
      </span>

      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition-colors duration-200">
        <Icon className={`h-5 w-5 ${accentClasses.hoverIcon}`} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900">
          {title}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-slate-500">
          {hint}
        </span>
      </span>

      <ArrowRight
        className={[
          'h-4 w-4 shrink-0 text-slate-400 transition-all duration-200',
          'group-hover:translate-x-1',
          accentClasses.hoverArrow,
        ].join(' ')}
        aria-hidden
      />
    </button>
  )
}

export default function QuickActionsGrid({
  role,
  currentUserId,
  produitsFinis,
  operateurs,
  composants,
  activeLot,
}: QuickActionsGridProps) {
  const [activeModal, setActiveModal] = useState<QuickActionId | 'cloture-lot' | null>(null)
  const [lotChooserOpen, setLotChooserOpen] = useState(false)

  const operateurOnly = isOperateurOnly(role)

  function handleStep3Click() {
    if (activeLot) {
      setLotChooserOpen(true)
      return
    }
    setActiveModal('nouveau-lot')
  }

  return (
    <section className="rounded-md border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Parcours de production
        </p>
        <h2 className="mt-1 text-sm font-bold text-slate-900">
          Workflow guidé — Actions rapides
        </h2>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
          Suivez l&apos;ordre logique : configurez d&apos;abord les stocks, définissez la
          recette (BOM), puis lancez ou clôturez la production sur la ligne Vin Ushindi.
        </p>
      </div>

      {operateurOnly && (
        <div className="mb-5 flex gap-3 rounded-md border border-blue-100 bg-blue-50/60 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <div className="text-xs leading-relaxed text-slate-600">
            <p className="font-semibold text-slate-800">
              Étapes 1 et 2 déjà configurées par la direction
            </p>
            <p className="mt-0.5">
              Les intrants et nomenclatures BOM sont gérés par l&apos;administration et le
              responsable production. Vous pouvez passer directement à l&apos;étape 3 pour
              ouvrir ou clôturer un lot.
            </p>
          </div>
        </div>
      )}

      {/* Timeline desktop (frise discrète) */}
      <div className="hidden md:flex md:items-stretch md:gap-4">
        {WORKFLOW_STEPS.map((stepDef, index) => {
          const hasAccess = canAccessStep(stepDef, role)
          const disabled = !hasAccess

          const onClick =
            stepDef.id === 'gestion-lot'
              ? handleStep3Click
              : () => setActiveModal(stepDef.id)

          return (
            <div key={stepDef.id} className="flex min-w-0 flex-1 items-stretch">
              <StepActionButton
                step={stepDef.step}
                title={stepDef.title}
                hint={stepDef.hint}
                icon={stepDef.icon}
                accent={stepDef.accent}
                disabled={disabled}
                onClick={onClick}
              />

              {index < WORKFLOW_STEPS.length - 1 && (
                <div className="mx-4 flex items-center" aria-hidden>
                  <div className="h-px w-10 bg-slate-200" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Timeline mobile */}
      <div className="space-y-4 md:hidden">
        {WORKFLOW_STEPS.map((stepDef, index) => {
          const hasAccess = canAccessStep(stepDef, role)
          const disabled = !hasAccess

          const onClick =
            stepDef.id === 'gestion-lot'
              ? handleStep3Click
              : () => setActiveModal(stepDef.id)

          return (
            <div key={stepDef.id}>
              <StepActionButton
                step={stepDef.step}
                title={stepDef.title}
                hint={stepDef.hint}
                icon={stepDef.icon}
                accent={stepDef.accent}
                disabled={disabled}
                onClick={onClick}
              />

              {index < WORKFLOW_STEPS.length - 1 && (
                <div className="mx-auto mt-4 flex w-full justify-center" aria-hidden>
                  <div className="h-px w-16 bg-slate-200" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-center text-[10px] font-medium uppercase tracking-wider text-slate-400 md:text-left">
        Créez d&apos;abord les stocks → puis la recette → enfin la production
      </p>

      <LotChooserModal
        open={lotChooserOpen}
        onClose={() => setLotChooserOpen(false)}
        numeroLot={activeLot?.numeroLot}
        onNouveauLot={() => setActiveModal('nouveau-lot')}
        onCloturer={() => setActiveModal('cloture-lot')}
      />

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

      <NouvelleFormuleModal
        open={activeModal === 'nouvelle-bom'}
        onClose={() => setActiveModal(null)}
        produitsFinis={produitsFinis}
        composants={composants}
      />

      {activeLot && (
        <ClotureLotModal
          open={activeModal === 'cloture-lot'}
          onClose={() => setActiveModal(null)}
          lotId={activeLot.id}
          numeroLot={activeLot.numeroLot}
          quantiteProduite={activeLot.quantiteProduite}
        />
      )}
    </section>
  )
}
