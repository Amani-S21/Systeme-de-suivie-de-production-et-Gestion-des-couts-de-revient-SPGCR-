import { createClient } from '@/utils/supabase/server'

export interface ComposantRow {
  id: string
  code: string
  nom: string
  categorie: string
  unite_mesure: string
  stock_actuel: number
  cout_unitaire_moyen_pondere: number
}

export async function fetchComposantsList(): Promise<ComposantRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('composants')
    .select('id, code, nom, categorie, unite_mesure, stock_actuel, cout_unitaire_moyen_pondere')
    .order('nom')

  if (error) throw new Error(error.message)
  return (data ?? []) as ComposantRow[]
}

export async function fetchComposantCodes(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('composants').select('code')
  return (data ?? []).map((c) => c.code.toLowerCase())
}
