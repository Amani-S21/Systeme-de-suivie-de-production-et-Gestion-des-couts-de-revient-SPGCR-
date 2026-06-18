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

export async function signup(_: unknown, formData: FormData): Promise<{ success?: true; error?: string }> {
  const payload = {
    email: String(formData.get('email') || '').trim(),
    login: String(formData.get('login') || formData.get('email') || '').trim().split('@')[0],
    password: String(formData.get('password') || ''),
    first_name: String(formData.get('firstName') || '').trim(),
    last_name: String(formData.get('lastName') || '').trim(),
    role: 'operateur_usine',
    is_active: false,
  }
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.detail || "Erreur inattendue lors de l'inscription.")
    }
    const result = await response.json()
    localStorage.setItem('spcr_token', result.access_token)
    localStorage.setItem('spcr_user', JSON.stringify(result.user))
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur inattendue lors de l'inscription." }
  }
}
