'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import {
  persistCataloguePayloadSchema,
  soumissionBomSeuleSchema,
  type PersistCataloguePayload,
} from '@/lib/validations/nomenclatures'

/**
 * Étape 1 → 2 : crée ou met à jour le produit fini catalogue, ou valide la sélection existante.
 * Retourne l’UUID à utiliser pour la composition BOM.
 */
export async function persistProduitFiniCatalogue(payload: PersistCataloguePayload) {
  const parsed = persistCataloguePayloadSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides.' }
  }

  const data = parsed.data
  const supabase = await createClient()

  if (data.mode === 'existing') {
    const { data: row, error } = await supabase
      .from('produits_finis')
      .select('id')
      .eq('id', data.produit_fini_id)
      .maybeSingle()
    if (error) return { error: error.message }
    if (!row) return { error: 'Produit catalogue introuvable.' }
    return { id: data.produit_fini_id }
  }

  const nom = data.nom.trim()
  const code = data.code.trim().toUpperCase()
  const { draft_produit_fini_id } = data

  if (!draft_produit_fini_id) {
    const { data: dup } = await supabase
      .from('produits_finis')
      .select('id')
      .eq('code', code)
      .maybeSingle()
    if (dup) return { error: 'Ce code SKU existe déjà dans le catalogue.' }

    const { data: insertRow, error: insertErr } = await supabase
      .from('produits_finis')
      .insert({
        code,
        nom,
        unite_commerciale: data.unite_commerciale,
        volume_litre: null,
      })
      .select('id')
      .single()

    if (insertErr) {
      // Tolérance rétrocompatibilité si migration pas encore appliquée.
      // Postgres code typique : 42703 (undefined_column).
      const isMissingCol =
        insertErr.code === '42703' ||
        insertErr.message.toLowerCase().includes('unite_commerciale')

      if (isMissingCol) {
        const { data: insertRowFallback, error: insertFallbackErr } =
          await supabase
            .from('produits_finis')
            .insert({
              code,
              nom,
              volume_litre: null,
            })
            .select('id')
            .single()

        if (insertFallbackErr) {
          return { error: insertFallbackErr.message }
        }
        return { id: insertRowFallback!.id }
      }

      return { error: insertErr.message }
    }

    return { id: insertRow!.id }
  }

  const { data: dup } = await supabase
    .from('produits_finis')
    .select('id')
    .eq('code', code)
    .neq('id', draft_produit_fini_id)
    .maybeSingle()
  if (dup) return { error: 'Ce code SKU est déjà utilisé par un autre produit.' }

  const { error: updErr } = await supabase
    .from('produits_finis')
    .update({
      code,
      nom,
      unite_commerciale: data.unite_commerciale,
    })
    .eq('id', draft_produit_fini_id)

  if (updErr) {
    const isMissingCol =
      updErr.code === '42703' ||
      updErr.message.toLowerCase().includes('unite_commerciale')

    if (isMissingCol) {
      const { error: updFallbackErr } = await supabase
        .from('produits_finis')
        .update({
          code,
          nom,
        })
        .eq('id', draft_produit_fini_id)

      if (updFallbackErr) return { error: updFallbackErr.message }
      return { id: draft_produit_fini_id }
    }

    return { error: updErr.message }
  }

  return { id: draft_produit_fini_id }
}

/**
 * Étape finale : enregistre les lignes de nomenclature pour le produit déjà créé.
 */
export async function submitNomenclatureBomOnly(raw: unknown) {
  const parsed = soumissionBomSeuleSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides.' }
  }

  const { produit_fini_id, lignes, validation } = parsed.data

  const supabase = await createClient()

  if (!validation.signatureConfirmee) {
    return { error: 'Validation de la recette obligatoire.' }
  }

  const { data: pf } = await supabase
    .from('produits_finis')
    .select('id')
    .eq('id', produit_fini_id)
    .maybeSingle()
  if (!pf) return { error: 'Produit catalogue introuvable.' }

  const inserts = lignes.map((l) => ({
    produit_fini_id,
    composant_id: l.composant_id,
    quantite_requise: l.quantite_requise,
  }))

  const { error: bomError } = await supabase.from('nomenclatures_bom').insert(inserts)

  if (bomError) {
    if (bomError.code === '23505') {
      return {
        error:
          'Une ou plusieurs lignes existent déjà pour ce produit (composant en double).',
      }
    }
    return { error: bomError.message }
  }

  revalidatePath('/dashboard/nomenclatures')
  return { success: true }
}
