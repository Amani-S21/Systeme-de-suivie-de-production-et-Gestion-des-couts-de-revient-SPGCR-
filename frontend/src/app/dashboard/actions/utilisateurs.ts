import { api } from '@/api'
import type { AppRole } from '@/types/spgcr'

export async function activateUserAccount(userId: string) {
  await api.updateUser(userId, { is_active: true })
  return { success: true }
}

export async function deactivateUserAccount(userId: string) {
  await api.updateUser(userId, { is_active: false })
  return { success: true }
}

export async function updateUserRole(userId: string, role: string) {
  await api.updateUser(userId, { role })
  return { success: true }
}

export async function deleteUserAccount(userId: string) {
  await api.deleteUser(userId)
  return { success: true }
}

export async function adminCreateUser(data: {
  email: string
  login: string
  nom: string
  prenom: string
  password: string
  role: AppRole
}): Promise<{ success?: true; error?: string }> {
  try {
    await api.createUser({
      email: data.email.trim(),
      login: data.login.trim(),
      password: data.password,
      first_name: data.prenom.trim(),
      last_name: data.nom.trim(),
      role: data.role,
      is_active: true,
    })
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Création de l'utilisateur impossible." }
  }
}
