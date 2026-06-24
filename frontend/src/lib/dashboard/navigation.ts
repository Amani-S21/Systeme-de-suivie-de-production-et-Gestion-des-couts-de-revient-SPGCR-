import type { LucideIcon } from 'lucide-react'
import {
  Boxes,
  Calculator,
  Factory,
  LayoutDashboard,
  Package,
  Users,
  ScrollText,
  Settings,
  Workflow,
} from 'lucide-react'
import type { AppRole } from '@/types/spgcr'

export interface NavChildItem {
  label: string
  href: string
  children?: NavChildItem[]
}

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles: AppRole[] | 'all'
  children?: NavChildItem[]
}

export const DASHBOARD_NAV: NavItem[] = [
  {
    label: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: 'all',
  },
  {
    label: 'Opérations industrielles',
    href: '/dashboard/operations',
    icon: Workflow,
    roles: 'all',
  },
  {
    label: 'Matières premières',
    href: '/dashboard/composants',
    icon: Package,
    roles: ['admin_msd', 'responsable_production'],
    children: [
      {
        label: 'Composants',
        href: '/dashboard/composants',
        children: [
          { label: 'Liste des composants', href: '/dashboard/composants' },
          { label: 'Recettes', href: '/dashboard/nomenclatures' },
          { label: 'Charges', href: '/dashboard/charges' },
        ],
      },
      {
        label: 'Gestion des stocks',
        href: '/dashboard/stocks',
        children: [
          { label: 'Etat des besoins', href: '/dashboard/stocks?section=besoins' },
          { label: 'Stock existant', href: '/dashboard/stocks?section=stock' },
          { label: "Alerte d'un stock insuffisant", href: '/dashboard/stocks?section=alertes' },
        ],
      },
    ],
  },
  {
    label: 'Production',
    href: '/dashboard/lots',
    icon: Factory,
    roles: 'all',
  },
  {
    label: 'Calcul des coûts',
    href: '/dashboard/analyses',
    icon: Calculator,
    roles: ['admin_msd', 'responsable_production'],
    children: [
      { label: 'Analyses financières', href: '/dashboard/analyses' },
      { label: 'Clôturer un lot', href: '/dashboard/lots?action=close' },
    ],
  },
  {
    label: 'Produits',
    href: '/dashboard/produits',
    icon: Boxes,
    roles: ['admin_msd', 'responsable_production'],
  },
  {
    label: 'Rapports',
    href: '/dashboard/rapports',
    icon: ScrollText,
    roles: ['admin_msd', 'responsable_production'],
  },
  {
    label: 'Utilisateurs',
    href: '/dashboard/utilisateurs',
    icon: Users,
    roles: ['admin_msd'],
  },
  {
    label: 'Paramètres',
    href: '/dashboard/profil',
    icon: Settings,
    roles: 'all',
  },
]

export function getNavItemsForRole(role: AppRole): NavItem[] {
  return DASHBOARD_NAV.filter((item) => item.href !== '/dashboard/operations').filter(
    (item) =>
      item.roles === 'all' ||
      (Array.isArray(item.roles) && item.roles.includes(role))
  )
}

export const ROLE_LABELS: Record<AppRole, string> = {
  admin_msd: 'Administrateur Général',
  responsable_production: 'Responsable Production',
  operateur_usine: "Opérateur d'Usine",
}
