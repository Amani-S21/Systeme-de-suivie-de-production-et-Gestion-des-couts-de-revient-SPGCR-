export interface SuccursaleRow {
  id: string
  nom: string
  code?: string
  code_depot: string
  ville: string
  adresse: string
  responsable_id?: string | null
  responsable_nom?: string | null
  actif: boolean
  created_at?: string
}

export interface BranchInventoryRow {
  id: string
  produit_fini_id?: string
  produit_nom?: string
  produit_code?: string
  composant_nom: string
  quantite?: number
  stock_actuel: number
  unite_mesure: string
}

export async function upsertSuccursale(_data: Partial<SuccursaleRow>) {
  return { success: true }
}

export async function toggleSuccursale(_id: string, _actif: boolean) {
  return { success: true }
}

export async function deleteSuccursale(_id: string) {
  return { success: true }
}

export async function fetchBranchInventory(_id: string): Promise<BranchInventoryRow[]> {
  return []
}
