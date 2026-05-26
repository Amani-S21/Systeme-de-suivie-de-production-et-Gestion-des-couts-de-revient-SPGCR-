import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import {
  fetchCoutsRevient,
  computeStats,
} from '@/lib/dashboard/queries/analyses-page'
import AnalysesFinancieresClient from '@/components/dashboard/analyses/AnalysesFinancieresClient'

export const dynamic = 'force-dynamic'

export default async function AnalysesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role as string | undefined

  if (role !== 'admin_msd' && role !== 'responsable_production') {
    redirect('/dashboard')
  }

  const [rows] = await Promise.all([fetchCoutsRevient()])
  const stats = computeStats(rows)

  return <AnalysesFinancieresClient rows={rows} stats={stats} />
}
