import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Package,
  Wine,
  Layers,
  DollarSign,
  Users,
} from 'lucide-react'
import type { AppRole } from '@/types/spgcr'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles: AppRole[] | 'all'
}

export const DASHBOARD_NAV: NavItem[] = [
  {
    label: "Vue d'ensemble",
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: 'all',
  },
  {
    label: 'Lots de Production',
    href: '/dashboard/lots',
    icon: Package,
    roles: 'all',
  },
  {
    label: 'Gestion des Composants / Stocks',
    href: '/dashboard/composants',
    icon: Wine,
    roles: ['admin_msd', 'responsable_production'],
  },
  {
    label: 'Nomenclatures (BOM)',
    href: '/dashboard/nomenclatures',
    icon: Layers,
    roles: ['admin_msd', 'responsable_production'],
  },
  {
    label: 'Analyses Financières / Coûts de Revient',
    href: '/dashboard/analyses',
    icon: DollarSign,
    roles: ['admin_msd'],
  },
  {
    label: 'Gestion des Utilisateurs / Validation',
    href: '/dashboard/utilisateurs',
    icon: Users,
    roles: ['admin_msd'],
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
