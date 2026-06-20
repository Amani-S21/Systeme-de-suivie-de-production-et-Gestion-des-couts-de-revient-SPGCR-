import { login as apiLogin } from '@/api'

export async function login(_: unknown, formData: FormData): Promise<{ success?: true; error?: string }> {
  const login = String(formData.get('login') || '').trim()
  const password = String(formData.get('password') || '')
  try {
    const result = await apiLogin(login, password)
    localStorage.setItem('spcr_token', result.access_token)
    localStorage.setItem('spcr_user', JSON.stringify(result.user))
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Erreur inattendue lors de la connexion.' }
  }
}
