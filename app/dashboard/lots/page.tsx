import { Package } from 'lucide-react'
import DashboardSectionPlaceholder from '@/components/dashboard/DashboardSectionPlaceholder'

export default function LotsPage() {
  return (
    <DashboardSectionPlaceholder
      icon={Package}
      title="Lots de Production"
      description="Le module de gestion complète des lots sera disponible prochainement. En attendant, utilisez la vue d'ensemble pour suivre vos productions."
    />
  )
}
