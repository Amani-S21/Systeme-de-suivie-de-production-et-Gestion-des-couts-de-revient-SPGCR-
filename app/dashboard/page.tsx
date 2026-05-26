import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import AdminOverview from '@/components/dashboard/AdminOverview'
import ResponsableOverview from '@/components/dashboard/ResponsableOverview'
import OperateurOverview from '@/components/dashboard/OperateurOverview'
import type { AppRole } from '@/types/spgcr'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, actif')
    .eq('id', user.id)
    .single()

  if (!profile?.actif) redirect('/attente-validation')

  const role = profile.role as AppRole

  return (
    <>
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Tableau de bord
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Vue d&apos;ensemble
        </h1>
      </div>
      {role === 'admin_msd' && <AdminOverview />}
      {role === 'responsable_production' && <ResponsableOverview />}
      {role === 'operateur_usine' && <OperateurOverview userId={user.id} />}
    </>
  )
}
