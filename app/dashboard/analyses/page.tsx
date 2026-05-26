import { DollarSign } from 'lucide-react'
import DashboardSectionPlaceholder from '@/components/dashboard/DashboardSectionPlaceholder'

export default function AnalysesPage() {
  return (
    <DashboardSectionPlaceholder
      icon={DollarSign}
      title="Analyses Financières"
      description="Rapports détaillés sur les coûts de revient et marges — réservé à l'administration."
    />
  )
}
