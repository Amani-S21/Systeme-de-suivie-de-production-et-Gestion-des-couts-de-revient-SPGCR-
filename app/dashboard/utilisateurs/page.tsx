import { Users } from 'lucide-react'
import DashboardSectionPlaceholder from '@/components/dashboard/DashboardSectionPlaceholder'

export default function UtilisateursPage() {
  return (
    <DashboardSectionPlaceholder
      icon={Users}
      title="Gestion des Utilisateurs"
      description="Validation des comptes et attribution des rôles — module administrateur à venir."
    />
  )
}
