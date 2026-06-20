import type { LucideIcon } from 'lucide-react'
import {
  Calculator,
  ClipboardList,
  Factory,
  LayoutDashboard,
  Package,
  Layers,
  Users,
  ScrollText,
  Settings,
  Workflow,
} from 'lucide-react'
import type { AppRole } from '@/types/spgcr'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles: AppRole[] | 'all'
  children?: { label: string; href: string }[]
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
    label: 'Production',
    href: '/dashboard/lots',
    icon: Factory,
    roles: 'all',
  },
  {
    label: 'Matières premières',
    href: '/dashboard/composants',
    icon: Package,
    roles: ['admin_msd', 'responsable_production'],
  },
  {
    label: 'Charges',
    href: '/dashboard/charges',
    icon: ClipboardList,
    roles: ['admin_msd', 'responsable_production'],
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
    icon: Layers,
    roles: ['admin_msd', 'responsable_production'],
    children: [
      { label: 'Catalogue produits', href: '/dashboard/produits' },
      { label: 'Recettes BOM', href: '/dashboard/nomenclatures' },
    ],
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
  return DASHBOARD_NAV.filter(
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
