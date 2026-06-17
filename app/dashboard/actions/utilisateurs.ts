'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import {
  activateUserSchema,
  updateUserRoleSchema,
} from '@/lib/validations/utilisateurs'
import { assertAdmin } from '@/lib/dashboard/queries/utilisateurs-page'
import { logActivite } from '@/lib/audit'
import type { AppRole } from '@/types/spgcr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

async function requireAdmin(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié.')

  const { data } = await supabase
    .from('profiles')
    .select('role, actif')
    .eq('id', user.id)
    .single()

  if (!data?.actif || data.role !== 'admin_msd') {
    throw new Error('Accès réservé aux administrateurs.')
  }
  return user.id
}

export async function activateUserAccount(userId: string) {
  const parsed = activateUserSchema.safeParse({ userId })
  if (!parsed.success) return { error: 'Identifiant invalide.' }

  let adminId: string
  try {
    adminId = await requireAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Accès refusé.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ actif: true })
    .eq('id', parsed.data.userId)

  if (error) return { error: error.message }

  await logActivite(adminId, 'ACTIVATION_COMPTE', `Compte utilisateur ${userId} activé.`, { target_id: userId })
  revalidatePath('/dashboard/utilisateurs')
  return { success: true }
}

export async function deactivateUserAccount(userId: string) {
  let adminId: string
  try {
    adminId = await requireAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Accès refusé.' }
  }
  if (adminId === userId) return { error: 'Vous ne pouvez pas vous désactiver vous-même.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ actif: false })
    .eq('id', userId)

  if (error) return { error: error.message }

  await logActivite(adminId, 'DESACTIVATION_COMPTE', `Compte utilisateur ${userId} désactivé.`, { target_id: userId })
  revalidatePath('/dashboard/utilisateurs')
  return { success: true }
}

export async function updateUserRole(userId: string, role: string) {
  const parsed = updateUserRoleSchema.safeParse({ userId, role })
  if (!parsed.success) return { error: 'Données invalides.' }

  let adminId: string
  try {
    adminId = await requireAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Accès refusé.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ role: parsed.data.role })
    .eq('id', parsed.data.userId)

  if (error) return { error: error.message }

  await logActivite(adminId, 'CHANGEMENT_ROLE', `Rôle de ${userId} changé en ${role}.`, { target_id: userId, new_role: role })
  revalidatePath('/dashboard/utilisateurs')
  return { success: true }
}

export async function deleteUserAccount(userId: string) {
  let adminId: string
  try {
    adminId = await requireAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Accès refusé.' }
  }
  if (adminId === userId) return { error: 'Vous ne pouvez pas supprimer votre propre compte.' }

  const supabase = await createClient()

  // Supprimer le profil (auth.users cascade via FK si configuré)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (error) return { error: error.message }

  await logActivite(adminId, 'SUPPRESSION_UTILISATEUR', `Compte utilisateur ${userId} supprimé.`, { target_id: userId })
  revalidatePath('/dashboard/utilisateurs')
  return { success: true }
}


export async function adminCreateUser(data: {
  email: string;
  nom: string;
  prenom: string;
  password?: string;
  role: AppRole;
}) {
  let adminId: string
  try {
    adminId = await requireAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Accès refusé.' }
  }

  // Pour créer un utilisateur sans déconnecter l'admin, on utilise un client Supabase JS standard
  // qui n'est pas lié aux cookies du navigateur (pas d'auto-login).
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password || 'TemporaryPassword123!',
    options: {
      data: {
        nom: data.nom,
        prenom: data.prenom,
        role: data.role,
      },
    },
  })

  if (error) {
    console.error('Manual signup error:', error)
    return { error: `Erreur d'inscription Auth : ${error.message}` }
  }

  // Si on arrive ici, l'utilisateur a été créé dans auth.users et le trigger a dû créer le profil.
  if (authData.user) {
    await logActivite(adminId, 'AUTRE', `Utilisateur créé manuellement par l'admin : ${data.email}`, { 
      email: data.email, 
      role: data.role,
      user_id: authData.user.id 
    })
  }

  revalidatePath('/dashboard/utilisateurs')
  return { success: true }
}


