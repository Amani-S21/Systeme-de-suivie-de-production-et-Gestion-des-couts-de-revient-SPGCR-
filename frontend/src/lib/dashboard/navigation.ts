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
    label: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: 'all',
  },
  {
    label: '1. Composants & Stocks',
    href: '/dashboard/composants',
    icon: Package,
    roles: ['admin_msd', 'responsable_production'],
  },
  {
    label: '2. Catalogue & Recettes',
    href: '/dashboard/nomenclatures',
    icon: Layers,
    roles: ['admin_msd', 'responsable_production'],
  },
  {
    label: '3. Lots de Production',
    href: '/dashboard/lots',
    icon: Wine,
    roles: 'all',
  },
  {
    label: '4. Analyses Financières',
    href: '/dashboard/analyses',
    icon: DollarSign,
    roles: ['admin_msd', 'responsable_production'],
  },
  {
    label: 'Gestion des Utilisateurs',
    href: '/dashboard/utilisateurs',
    icon: Users,
    roles: ['admin_msd'],
  },
  {
    label: 'Gestion des Succursales',
    href: '/dashboard/succursales',
    icon: Building2,
    roles: ['admin_msd'],
  },
  {
    label: 'Historique & Logs',
    href: '/dashboard/historique',
    icon: ScrollText,
    roles: ['admin_msd', 'responsable_production'],
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
