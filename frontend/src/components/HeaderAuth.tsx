// Composant Serveur : récupère la session Supabase et passe les données au Header client.
// Pattern : Server Component (session) → Client Component (UI animée)
import Header from './Header'

export default async function HeaderAuth() {
  return <Header user={null} profile={null} />
}
