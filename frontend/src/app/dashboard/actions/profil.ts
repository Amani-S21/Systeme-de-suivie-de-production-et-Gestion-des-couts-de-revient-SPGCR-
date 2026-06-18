import { api } from '@/api'

export async function updateProfile(payload: { nom: string; prenom: string }) {
  const raw = localStorage.getItem('spcr_user')
  if (!raw) return { error: 'Session expiree.' }
  const user = JSON.parse(raw)
  const updated = await api.updateUser(user.id, { first_name: payload.prenom, last_name: payload.nom })
  localStorage.setItem('spcr_user', JSON.stringify(updated))
  return { success: true }
}
