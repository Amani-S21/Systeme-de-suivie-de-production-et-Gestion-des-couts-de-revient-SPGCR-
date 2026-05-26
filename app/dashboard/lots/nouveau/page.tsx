import { PlusCircle } from 'lucide-react'
import DashboardSectionPlaceholder from '@/components/dashboard/DashboardSectionPlaceholder'

export default function NouveauLotPage() {
  return (
    <DashboardSectionPlaceholder
      icon={PlusCircle}
      title="Créer un nouveau lot"
      description="Le formulaire de création de lot sera intégré ici. Contactez votre responsable production pour les premières saisies."
    />
  )
}
