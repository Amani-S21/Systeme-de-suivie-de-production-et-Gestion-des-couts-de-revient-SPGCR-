'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface SuccursaleRow {
  id: string
  nom: string
  adresse: string | null
  ville: string
  code_depot: string
  actif: boolean
  responsable_id: string | null
  responsable_nom?: string
  created_at: string
}

export interface BranchInventoryRow {
  produit_fini_id: string
  produit_nom: string
  produit_code: string
  quantite: number
  updated_at: string
}

export async function fetchSuccursales() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('succursales')
    .select(`
      *,
      responsable:profiles!succursales_responsable_id_fkey(nom, prenom)
    `)
    .order('nom')

  if (error) {
    console.error('Error fetching succursales:', error)
    return []
  }

  return data.map(s => ({
    ...s,
    responsable_nom: s.responsable ? `${s.responsable.prenom} ${s.responsable.nom}` : 'Non assigné'
  })) as SuccursaleRow[]
}

export async function fetchBranchInventory(succursaleId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('stock_produits_site')
    .select(`
      quantite,
      updated_at,
      produit:produits_finis(id, nom, code)
    `)
    .eq('succursale_id', succursaleId)

  if (error) {
    console.error('Error fetching branch inventory:', error)
    return []
  }

  return data.map((item: any) => ({
    produit_fini_id: item.produit.id,
    produit_nom: item.produit.nom,
    produit_code: item.produit.code,
    quantite: item.quantite,
    updated_at: item.updated_at
  })) as BranchInventoryRow[]
}

export async function upsertSuccursale(formData: Partial<SuccursaleRow>) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('succursales')
    .upsert(formData)

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/succursales')
  return { success: true }
}

export async function toggleSuccursale(id: string, active: boolean) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('succursales')
    .update({ actif: active })
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/succursales')
  return { success: true }
}

export async function deleteSuccursale(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('succursales')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/succursales')
  return { success: true }
}
