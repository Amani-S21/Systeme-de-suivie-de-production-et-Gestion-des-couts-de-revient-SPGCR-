// app/api/auth/signout/route.ts
// Route API pour la déconnexion Supabase.
// Appelée depuis le Header client via fetch('/api/auth/signout', { method: 'POST' })
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
