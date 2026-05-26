'use server'

import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function forgotPasswordAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Veuillez entrer votre adresse email.' }
  }

  const supabase = await createClient()
  const origin = (await headers()).get('origin')

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Un email contenant le lien de réinitialisation vous a été envoyé.' }
}
