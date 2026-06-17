import { redirect } from 'next/navigation'
import { assertAdmin, fetchAllProfilesForAdmin } from '@/lib/dashboard/queries/utilisateurs-page'
import { fetchSuccursales } from '@/app/dashboard/actions/succursales'
import SuccursalesPageClient from '@/components/dashboard/succursales/SuccursalesPageClient'

export default async function SuccursalesPage() {
  const isAdmin = await assertAdmin()
  if (!isAdmin) redirect('/dashboard')

  const [succursales, profiles] = await Promise.all([
    fetchSuccursales(),
    fetchAllProfilesForAdmin(),
  ])

  // Filtrer les profils pour ne proposer que des responsables ou admins comme responsables de site
  const potentialResponsables = profiles.filter(p => p.actif && (p.role === 'admin_msd' || p.role === 'responsable_production'))

  return (
    <SuccursalesPageClient 
      initSuccursales={succursales} 
      profiles={potentialResponsables}
    />
  )
}
