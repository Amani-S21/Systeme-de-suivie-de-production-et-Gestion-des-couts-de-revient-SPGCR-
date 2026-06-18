import { api } from '@/api'
import type { AdjustStockFormValues } from '@/lib/validations/composants'

export async function submitAdjustStock(raw: AdjustStockFormValues): Promise<{ success?: true; error?: string; composantId?: string }> {
  if (raw.identification.mode === 'new') {
    const created = await api.createMaterial({
      name: raw.identification.nom,
      unit: raw.identification.unite_mesure,
      quantity: raw.mouvement.quantiteAchetee,
      unit_cost: raw.mouvement.quantiteAchetee > 0 ? raw.mouvement.prixAchatTotal / raw.mouvement.quantiteAchetee : 0,
      minimum_stock: 0,
    })
    return { success: true, composantId: String(created.id) }
  }
  return { success: true, composantId: raw.identification.composantId }
}
