// Composant Serveur : récupère la session Supabase et passe les données au Header client.
// Pattern : Server Component (session) → Client Component (UI animée)
import { createClient } from '@/utils/supabase/server'
import Header from './Header'

export default async function HeaderAuth() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let profile: { nom: string; prenom: string; role: string } | null = null

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('nom, prenom, role')
      .eq('id', user.id)
      .single()

    if (data) {
      profile = data
    }
  }

  return (
    <Header
      user={user ? { email: user.email ?? '' } : null}
      profile={profile}
    />
  )
}
