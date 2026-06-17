import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import DashboardShell from '@/components/dashboard/DashboardShell'
import type { AppRole } from '@/types/spgcr'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('nom, prenom, role, actif')
    .eq('id', user.id)
    .single()

  if (!profileRow?.actif) redirect('/attente-validation')

  const role = profileRow.role as AppRole

  return (
    <DashboardShell
      role={role}
      prenom={profileRow.prenom}
      nom={profileRow.nom}
      email={user.email ?? ''}
    >
      {children}
    </DashboardShell>
  )
}
