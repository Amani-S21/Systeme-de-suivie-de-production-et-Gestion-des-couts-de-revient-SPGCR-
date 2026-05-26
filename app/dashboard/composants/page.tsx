import { fetchComposantsList } from '@/lib/dashboard/queries/composants-page'
import ComposantsPageClient from '@/components/dashboard/composants/ComposantsPageClient'

export default async function ComposantsPage() {
  const composants = await fetchComposantsList()
  return <ComposantsPageClient composants={composants} />
}
