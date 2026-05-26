export type AppRole = 'admin_msd' | 'responsable_production' | 'operateur_usine'

export type LotStatut = 'en_cours' | 'termine' | 'annule'

export interface Profile {
  id: string
  nom: string
  prenom: string
  role: AppRole
  actif: boolean
}

export interface CoutRevient {
  id: string
  lot_id: string
  cout_direct_matieres: number
  cout_direct_main_oeuvre: number
  charges_indirectes: number
  cout_revient_total: number
  cout_unitaire_theorique: number
  marge_brute_estimee: number | null
  calcule_at: string
}

export interface LotProduction {
  id: string
  numero_lot: string
  quantite_produite: number
  statut: LotStatut
  date_production: string
  operateur_id: string
  produit_fini_id: string
}

export interface LotWithCout extends LotProduction {
  couts_revient: CoutRevient | CoutRevient[] | null
  produits_finis?: { nom: string; volume_litre: number } | null
  profiles?: { prenom: string; nom: string } | null
}

export interface ComposantStock {
  id: string
  code: string
  nom: string
  stock_actuel: number
  unite_mesure: string
}
