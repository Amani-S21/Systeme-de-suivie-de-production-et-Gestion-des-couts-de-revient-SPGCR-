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
  nom: string
  prenom: string
  password?: string
  role: AppRole
}): Promise<{ success?: true; error?: string }> {
  await api.createUser({
    email: data.email,
    login: data.email.split('@')[0],
    password: data.password || 'TemporaryPassword123!',
    first_name: data.prenom,
    last_name: data.nom,
    role: data.role,
    is_active: true,
  })
  return { success: true }
}
