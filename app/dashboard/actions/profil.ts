'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { logActivite } from '@/lib/audit'

export async function updateProfile(data: { prenom: string; nom: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('profiles')
    .update({
      prenom: data.prenom,
      nom: data.nom,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  await logActivite(user.id, 'AUTRE', `Profil mis à jour : ${data.prenom} ${data.nom}`, { update: data })
  
  revalidatePath('/', 'layout')
  revalidatePath('/dashboard/profil')
  
  return { success: true }
}
