import type { AppRole } from './spgcr'

export type ActionType =
  | 'CONNEXION'
  | 'DECONNEXION'
  | 'CREATION_LOT'
  | 'CLOTURE_LOT'
  | 'AJUSTEMENT_STOCK'
  | 'CREATION_COMPOSANT'
  | 'CREATION_FORMULE'
  | 'ACTIVATION_COMPTE'
  | 'DESACTIVATION_COMPTE'
  | 'CHANGEMENT_ROLE'
  | 'SUPPRESSION_UTILISATEUR'
  | 'AUTRE'

export interface ComposantRow {
  id: string
  code: string
  nom: string
  categorie: string
  unite_mesure: string
  stock_actuel: number
  cout_unitaire_moyen_pondere: number
}

export interface UserProfileRow {
  id: string
  nom: string
  prenom: string
  role: AppRole
  actif: boolean
  created_at: string
}

export interface BomLineRow {
  id: string
  composant_id: string
  composant_nom: string
  composant_code: string
  quantite_requise: number
  unite_mesure: string
}

export interface FormuleRow {
  produit_fini_id: string
  produit_code: string
  produit_nom: string
  volume_litre: number | null
  unite_commerciale: string | null
  lignes: BomLineRow[]
}

export interface LogRow {
  id: string
  profil_id: string | null
  action_type: ActionType
  description: string
  metadata: Record<string, unknown> | null
  created_at: string
  profil_nom: string | null
  profil_prenom: string | null
}

export interface CoutRevientRow {
  id: string
  lot_id: string
  numero_lot: string
  produit_nom: string
  cout_direct_matieres: number
  cout_revient_total: number
  cout_unitaire_theorique: number
  marge_brute_estimee: number | null
  calcule_at: string
  quantite_produite: number
}

export interface AnalysesStats {
  cout_moyen: number
  marge_globale: number | null
}

