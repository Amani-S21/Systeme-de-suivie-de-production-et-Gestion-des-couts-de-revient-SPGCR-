'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import {
  nouveauComposantSchema,
  nouvelleBomSchema,
  nouveauLotStep1Schema,
  nouveauLotStep2Schema,
} from '@/lib/validations/quick-actions'
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

  const step1 = nouveauLotStep1Schema.safeParse({
    produitFiniId: input.produit_fini_id,
    quantite: input.quantite_produite,
  })
  if (!step1.success) {
    return { error: step1.error.issues[0]?.message ?? 'Données invalides.' }
  }

  const step2 = nouveauLotStep2Schema.safeParse({
    numeroLot: input.numero_lot,
    operateurId: input.operateur_id || user.id,
  })
  if (!step2.success) {
    return { error: step2.error.issues[0]?.message ?? 'Données invalides.' }
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

  const parsed = nouveauComposantSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides.' }
  }

  const { error } = await supabase.from('composants').insert({
    code: parsed.data.code.trim(),
    nom: parsed.data.nom.trim(),
    categorie: parsed.data.categorie,
    unite_mesure: parsed.data.unite_mesure,
    stock_actuel: parsed.data.stock_actuel,
    cout_unitaire_moyen_pondere: parsed.data.cout_unitaire_moyen_pondere,
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

  const parsed = nouvelleBomSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides.' }
  }

  const { error } = await supabase.from('nomenclatures_bom').insert({
    produit_fini_id: parsed.data.produit_fini_id,
    composant_id: parsed.data.composant_id,
    quantite_requise: parsed.data.quantite_requise,
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
