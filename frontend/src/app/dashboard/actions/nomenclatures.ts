export async function persistProduitFiniCatalogue(payload: any) {
  return { id: payload.produit_fini_id || payload.draft_produit_fini_id || crypto.randomUUID() }
}

export async function submitNomenclatureBomOnly(_raw: unknown) {
  return { success: true }
}
