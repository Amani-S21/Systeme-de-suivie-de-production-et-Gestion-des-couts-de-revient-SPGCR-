'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { computeNewCump } from '@/lib/inventory/cump'
import {
  adjustStockFormSchema,
  type AdjustStockFormValues,
} from '@/lib/validations/composants'

export async function submitAdjustStock(raw: AdjustStockFormValues) {
  const parsed = adjustStockFormSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides.' }
  }

  const { identification, mouvement } = parsed.data
  const supabase = await createClient()

  let composantId: string
  let currentStock = 0
  let currentCump = 0

  if (identification.mode === 'new') {
    const { data: existing } = await supabase
      .from('composants')
      .select('id')
      .eq('code', identification.code.trim())
      .maybeSingle()

    if (existing) {
      return { error: 'Ce code composant existe déjà.' }
    }

    const newCump =
      mouvement.quantiteAchetee > 0
        ? mouvement.prixAchatTotal / mouvement.quantiteAchetee
        : 0

    const { data: created, error: insertError } = await supabase
      .from('composants')
      .insert({
        code: identification.code.trim().toUpperCase(),
        nom: identification.nom.trim(),
        categorie: identification.categorie,
        unite_mesure: identification.unite_mesure,
        stock_actuel: mouvement.quantiteAchetee,
        cout_unitaire_moyen_pondere: Math.round(newCump * 100) / 100,
      })
      .select('id')
      .single()

    if (insertError) return { error: insertError.message }
    composantId = created.id
  } else {
    const { data: comp, error: fetchError } = await supabase
      .from('composants')
      .select('id, stock_actuel, cout_unitaire_moyen_pondere')
      .eq('id', identification.composantId)
      .single()

    if (fetchError || !comp) {
      return { error: 'Composant introuvable.' }
    }

    composantId = comp.id
    currentStock = Number(comp.stock_actuel)
    currentCump = Number(comp.cout_unitaire_moyen_pondere)

    const newStock = currentStock + mouvement.quantiteAchetee
    const newCump = computeNewCump(
      currentStock,
      currentCump,
      mouvement.quantiteAchetee,
      mouvement.prixAchatTotal
    )

    const { error: updateError } = await supabase
      .from('composants')
      .update({
        stock_actuel: newStock,
        cout_unitaire_moyen_pondere: newCump,
      })
      .eq('id', composantId)

    if (updateError) return { error: updateError.message }
  }

  revalidatePath('/dashboard/composants')
  return { success: true, composantId }
}
