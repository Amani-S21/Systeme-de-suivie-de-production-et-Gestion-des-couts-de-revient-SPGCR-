import type { AppRole } from '@/types/spgcr'

export type QuickActionId =
  | 'nouveau-lot'
  | 'nouveau-composant'
  | 'nouvelle-bom'
  | 'gestion-lot'

export interface ActiveLotInfo {
  id: string
  numeroLot: string
  quantiteProduite: number
}

export interface ProduitFiniOption {
  id: string
  code: string
  nom: string
  volume_litre: number | null
}

export interface OperateurOption {
  id: string
  prenom: string
  nom: string
}

export interface ComposantOption {
  id: string
  code: string
  nom: string
  unite_mesure: string
}

export interface QuickActionsGridProps {
  role: AppRole
  currentUserId: string
  produitsFinis: ProduitFiniOption[]
  operateurs: OperateurOption[]
  composants: ComposantOption[]
  activeLot: ActiveLotInfo | null
}

export interface NouveauLotFormData {
  produitFiniId: string
  quantite: number
  operateurId: string
  numeroLot: string
  numeroLotManuel: boolean
}

export interface NouveauComposantFormData {
  code: string
  nom: string
  categorie: 'matiere_premiere' | 'intrant' | 'emballage' | 'charge_indirecte'
  unite_mesure: 'litre' | 'kg' | 'unite'
  stock_actuel: number
  cout_unitaire_moyen_pondere: number
}

export interface NouvelleBomFormData {
  produit_fini_id: string
  composant_id: string
  quantite_requise: number
}
