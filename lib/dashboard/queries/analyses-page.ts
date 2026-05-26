import { createClient } from '@/utils/supabase/server'

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

export async function fetchCoutsRevient(): Promise<CoutRevientRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('couts_revient')
    .select(`
      id,
      lot_id,
      cout_direct_matieres,
      cout_revient_total,
      cout_unitaire_theorique,
      marge_brute_estimee,
      calcule_at,
      lots_production (
        numero_lot,
        quantite_produite,
        produits_finis ( nom )
      )
    `)
    .order('calcule_at', { ascending: false })

  if (error || !data) return []

  return data.map((row: any) => {
    const lot = Array.isArray(row.lots_production)
      ? row.lots_production[0]
      : row.lots_production
    const produit = lot
      ? Array.isArray(lot.produits_finis)
        ? lot.produits_finis[0]
        : lot.produits_finis
      : null

    return {
      id: row.id,
      lot_id: row.lot_id,
      numero_lot: lot?.numero_lot ?? '—',
      produit_nom: produit?.nom ?? '—',
      cout_direct_matieres: Number(row.cout_direct_matieres ?? 0),
      cout_revient_total: Number(row.cout_revient_total ?? 0),
      cout_unitaire_theorique: Number(row.cout_unitaire_theorique ?? 0),
      marge_brute_estimee:
        row.marge_brute_estimee != null
          ? Number(row.marge_brute_estimee)
          : null,
      calcule_at: row.calcule_at,
      quantite_produite: Number(lot?.quantite_produite ?? 0),
    }
  })
}

export function computeStats(rows: CoutRevientRow[]): AnalysesStats {
  if (rows.length === 0) return { cout_moyen: 0, marge_globale: null }

  const coutMoyen =
    rows.reduce((acc, r) => acc + r.cout_unitaire_theorique, 0) / rows.length

  const avecMarge = rows.filter((r) => r.marge_brute_estimee != null)
  const margeGlobale =
    avecMarge.length > 0
      ? avecMarge.reduce((acc, r) => acc + r.marge_brute_estimee!, 0) /
        avecMarge.length
      : null

  return { cout_moyen: coutMoyen, marge_globale: margeGlobale }
}
