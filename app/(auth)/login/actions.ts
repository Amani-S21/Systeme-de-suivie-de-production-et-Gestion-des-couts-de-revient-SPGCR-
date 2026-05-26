'use server'

import { createActionClient } from '@/lib/supabase-action'

export async function login(
  _: unknown,
  formData: FormData
): Promise<{ success?: true; error?: string }> {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Veuillez remplir tous les champs.' }
  }

  try {
    const supabase = await createActionClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { success: true }
  } catch {
    return { error: 'Erreur inattendue lors de la connexion.' }
  }
}

export async function signup(
  _: unknown,
  formData: FormData
): Promise<{ success?: true; error?: string }> {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const firstName = (formData.get('firstName') as string)?.trim()
  const lastName = (formData.get('lastName') as string)?.trim()

  if (!email || !password || !firstName || !lastName) {
    return { error: 'Veuillez remplir tous les champs requis.' }
  }

  try {
    const supabase = await createActionClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nom: lastName,
          prenom: firstName,
          role: 'operateur_usine',
        },
      },
    })

    if (error) return { error: error.message }
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inattendue lors de l'inscription."
    return { error: msg }
  }
}