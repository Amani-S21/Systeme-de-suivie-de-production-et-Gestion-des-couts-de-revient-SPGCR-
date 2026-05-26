'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import type {
  NouveauComposantFormData,
  NouvelleBomFormData,
} from '@/components/dashboard/quick-actions/types'

export async function createProductionLot(input: {
  numero_lot: string
  produit_fini_id: string
  quantite_produite: number
  operateur_id: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Session expirée. Reconnectez-vous.' }

  if (!input.numero_lot?.trim()) {
    return { error: 'Le numéro de lot est obligatoire.' }
  }
  if (!input.produit_fini_id) {
    return { error: 'Sélectionnez un produit fini.' }
  }
  if (!input.quantite_produite || input.quantite_produite < 1) {
    return { error: 'La quantité doit être au moins 1.' }
  }

  const { error } = await supabase.from('lots_production').insert({
    numero_lot: input.numero_lot.trim(),
    produit_fini_id: input.produit_fini_id,
    quantite_produite: input.quantite_produite,
    operateur_id: input.operateur_id || user.id,
    statut: 'en_cours',
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ce numéro de lot existe déjà.' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function createComposant(input: NouveauComposantFormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Session expirée. Reconnectez-vous.' }

  if (!input.code?.trim() || !input.nom?.trim()) {
    return { error: 'Le code et le nom sont obligatoires.' }
  }

  const { error } = await supabase.from('composants').insert({
    code: input.code.trim(),
    nom: input.nom.trim(),
    categorie: input.categorie,
    unite_mesure: input.unite_mesure,
    stock_actuel: input.stock_actuel,
    cout_unitaire_moyen_pondere: input.cout_unitaire_moyen_pondere,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ce code composant existe déjà.' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function createNomenclatureBom(input: NouvelleBomFormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Session expirée. Reconnectez-vous.' }

  if (!input.produit_fini_id || !input.composant_id) {
    return { error: 'Produit fini et composant requis.' }
  }
  if (!input.quantite_requise || input.quantite_requise <= 0) {
    return { error: 'La quantité requise doit être positive.' }
  }

  const { error } = await supabase.from('nomenclatures_bom').insert({
    produit_fini_id: input.produit_fini_id,
    composant_id: input.composant_id,
    quantite_requise: input.quantite_requise,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Cette ligne BOM existe déjà pour ce produit.' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
