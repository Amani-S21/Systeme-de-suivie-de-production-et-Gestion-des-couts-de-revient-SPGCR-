export interface SuccursaleRow {
  id: string
  nom: string
  code: string
  ville: string
  actif: boolean
  created_at?: string
}

export interface BranchInventoryRow {
  id: string
  composant_nom: string
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
