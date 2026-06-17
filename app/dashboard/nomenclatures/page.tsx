import {
  fetchComposantsForBom,
  fetchFormulesList,
  fetchProduitsFinisForBom,
} from '@/lib/dashboard/queries/nomenclatures-page'
import NomenclaturesPageClient from '@/components/dashboard/nomenclatures/NomenclaturesPageClient'

export default async function NomenclaturesPage() {
  const [formules, produitsFinis, composants] = await Promise.all([
    fetchFormulesList(),
    fetchProduitsFinisForBom(),
    fetchComposantsForBom(),
  ])

  return (
    <NomenclaturesPageClient
      formules={formules}
      produitsFinis={produitsFinis}
      composants={composants}
    />
  )
}
