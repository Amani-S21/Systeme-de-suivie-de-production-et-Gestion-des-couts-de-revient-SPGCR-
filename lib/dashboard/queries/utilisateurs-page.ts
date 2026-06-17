import { createClient } from '@/utils/supabase/server'
import type { AppRole } from '@/types/spgcr'

export interface UserProfileRow {
  id: string
  nom: string
  prenom: string
  role: AppRole
  actif: boolean
  created_at: string
}

export async function fetchAllProfilesForAdmin(): Promise<UserProfileRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nom, prenom, role, actif, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as UserProfileRow[]
}

export async function assertAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('profiles')
    .select('role, actif')
    .eq('id', user.id)
    .single()

  return data?.actif === true && data?.role === 'admin_msd'
}
