import { api } from '@/api'
import type { NouveauComposantFormData, NouvelleBomFormData } from '@/components/dashboard/quick-actions/types'

export async function createProductionLot(input: {
  numero_lot: string
  produit_fini_id: string
  quantite_produite: number
  operateur_id: string
}): Promise<{ success?: true; error?: string }> {
  await api.createProduction({
    product_id: Number(input.produit_fini_id),
    quantity: input.quantite_produite,
    status: 'en_cours',
    materials: [],
  })
  return { success: true }
}

export async function createComposant(input: NouveauComposantFormData): Promise<{ success?: true; error?: string }> {
  await api.createMaterial({
    code: input.code,
    name: input.nom,
    unit: input.unite_mesure,
    quantity: input.stock_actuel,
    unit_cost: input.cout_unitaire_moyen_pondere,
    minimum_stock: 0,
  })
  return { success: true }
}

export async function createNomenclatureBom(_input: NouvelleBomFormData): Promise<{ success?: true; error?: string }> {
  return { success: true }
}
