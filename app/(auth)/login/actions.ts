'use server'

import { createActionClient } from '@/lib/supabase-action'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    throw new Error('Veuillez remplir tous les champs.')
  }

  const supabase = await createActionClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) throw new Error(error.message)
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string

  if (!email || !password || !firstName || !lastName) {
    throw new Error('Veuillez remplir tous les champs requis.')
  }

  const supabase = await createActionClient()
  
  // Inscription avec métadonnées pour notre trigger PostgreSQL public.profiles
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        role: 'stock', // Rôle par défaut selon le PRD
      },
    },
  })

  if (error) throw new Error(error.message)
  
  // Redirection ou message de confirmation
  redirect('/dashboard')
}