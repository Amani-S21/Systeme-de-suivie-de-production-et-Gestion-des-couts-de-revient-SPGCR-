export async function persistProduitFiniCatalogue(payload: any): Promise<{ id?: string; error?: string }> {
  return { id: payload.produit_fini_id || payload.draft_produit_fini_id || crypto.randomUUID() }
}

export async function submitNomenclatureBomOnly(_raw: unknown): Promise<{ success?: true; error?: string }> {
  return { success: true }
}
