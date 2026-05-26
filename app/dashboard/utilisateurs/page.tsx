import { redirect } from 'next/navigation'
import {
  assertAdmin,
  fetchAllProfilesForAdmin,
} from '@/lib/dashboard/queries/utilisateurs-page'
import UtilisateursPageClient from '@/components/dashboard/utilisateurs/UtilisateursPageClient'

export default async function UtilisateursPage() {
  const isAdmin = await assertAdmin()
  if (!isAdmin) redirect('/dashboard')

  const profiles = await fetchAllProfilesForAdmin()
  const pending = profiles.filter((p) => !p.actif)
  const active = profiles.filter((p) => p.actif)

  return <UtilisateursPageClient pending={pending} active={active} />
}
