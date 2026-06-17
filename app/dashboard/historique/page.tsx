import { redirect } from 'next/navigation'
import { assertAdmin } from '@/lib/dashboard/queries/utilisateurs-page'
import { fetchLogsActivites } from '@/lib/dashboard/queries/historique-page'
import HistoriquePageClient from '@/components/dashboard/historique/HistoriquePageClient'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export default async function HistoriquePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, actif')
    .eq('id', user.id)
    .single()

  if (!profile?.actif || !['admin_msd', 'responsable_production'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const logs = await fetchLogsActivites(1000)

  return <HistoriquePageClient logs={logs} />
}
