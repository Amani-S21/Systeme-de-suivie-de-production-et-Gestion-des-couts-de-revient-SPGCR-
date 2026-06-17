import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ProfilPageClient from '@/components/dashboard/profil/ProfilPageClient'

export const dynamic = 'force-dynamic'

export default async function ProfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nom, prenom, role, actif, created_at')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/dashboard')

  return <ProfilPageClient profile={profile} email={user.email || ''} />
}
