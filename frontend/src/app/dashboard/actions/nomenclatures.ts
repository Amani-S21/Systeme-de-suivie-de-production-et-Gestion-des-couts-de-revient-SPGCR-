import { api } from '@/api'

export async function persistProduitFiniCatalogue(payload: any): Promise<{ id?: string; error?: string }> {
  if (payload.mode === 'existing') return { id: String(payload.produit_fini_id) }
  if (payload.draft_produit_fini_id) return { id: String(payload.draft_produit_fini_id) }
  try {
    const product = await api.createProduct({
      name: payload.nom,
      sku: String(payload.code).toUpperCase(),
      unit: payload.unite_commerciale,
      sale_price: 0,
    })
    return { id: String(product.id) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Creation du produit impossible.' }
  }
}

export async function submitNomenclatureBomOnly(raw: any): Promise<{ success?: true; error?: string }> {
  try {
    await api.replaceProductBom(raw.produit_fini_id, {
      lines: raw.lignes.map((line: any) => ({
        material_id: Number(line.composant_id),
        quantity_required: Number(line.quantite_requise),
      })),
    })
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Enregistrement de la recette impossible.' }
  }
}
