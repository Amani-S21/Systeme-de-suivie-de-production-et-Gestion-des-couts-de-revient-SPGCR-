import { api } from '@/api'
import type { AdjustStockFormValues } from '@/lib/validations/composants'

export async function submitAdjustStock(raw: AdjustStockFormValues): Promise<{ success?: true; error?: string; composantId?: string }> {
  if (raw.identification.mode === 'new') {
    const created = await api.createMaterial({
      code: raw.identification.code,
      name: raw.identification.nom,
      unit: raw.identification.unite_mesure,
      quantity: raw.mouvement.quantiteAchetee,
      unit_cost: raw.mouvement.quantiteAchetee > 0 ? raw.mouvement.prixAchatTotal / raw.mouvement.quantiteAchetee : 0,
      minimum_stock: 0,
    })
    return { success: true, composantId: String(created.id) }
  }
  const composantId = raw.identification.composantId
  const material = (await api.materials()).find((item) => String(item.id) === composantId)
  if (!material) return { error: 'Composant introuvable.' }

  const purchasedQuantity = raw.mouvement.quantiteAchetee
  const oldQuantity = Number(material.quantity)
  const purchaseUnitCost = purchasedQuantity > 0 ? raw.mouvement.prixAchatTotal / purchasedQuantity : 0
  const newQuantity = oldQuantity + purchasedQuantity
  const weightedCost = newQuantity > 0
    ? ((oldQuantity * Number(material.unit_cost)) + (purchasedQuantity * purchaseUnitCost)) / newQuantity
    : 0

  await api.addStockMovement(material.id, {
    movement_type: 'entree',
    quantity: purchasedQuantity,
    reason: 'Approvisionnement depuis les operations industrielles',
  })
  await api.updateMaterial(material.id, { unit_cost: weightedCost })
  return { success: true, composantId: String(material.id) }
}
