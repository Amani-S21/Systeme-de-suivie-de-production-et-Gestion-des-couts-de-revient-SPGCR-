import { createClient } from '@/utils/supabase/server'

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

export async function fetchFormulesList(): Promise<FormuleRow[]> {
  const supabase = await createClient()

  const produitsSelect = [
    'id',
    'code',
    'nom',
    'volume_litre',
    'unite_commerciale',
  ].join(', ')

  const { data: produits, error: produitsErr } = await supabase
    .from('produits_finis')
    .select(produitsSelect)
    .order('nom')

  // Tolérance si la colonne n'a pas encore été ajoutée (migration pas appliquée).
  // On garde le workflow BOM fonctionnel avec unité à null.
  const produitsData = (produitsErr
    ? (
        await supabase
          .from('produits_finis')
          .select('id, code, nom, volume_litre')
          .order('nom')
      ).data ?? []
    : produits ?? []) as any[]

  const { data: noms } = await supabase.from('nomenclatures_bom').select(`
    id,
    produit_fini_id,
    composant_id,
    quantite_requise,
    composants ( code, nom, unite_mesure )
  `)

  const byProduct = new Map<string, FormuleRow>()

  for (const p of produitsData ?? []) {
    byProduct.set(p.id, {
      produit_fini_id: p.id,
      produit_code: p.code,
      produit_nom: p.nom,
      volume_litre: p.volume_litre,
      unite_commerciale: (p as { unite_commerciale?: string | null })
        .unite_commerciale
        ? (p as { unite_commerciale?: string | null }).unite_commerciale!
        : null,
      lignes: [],
    })
  }

  for (const row of noms ?? []) {
    const pfId = row.produit_fini_id as string
    const comp = Array.isArray(row.composants) ? row.composants[0] : row.composants
    if (!byProduct.has(pfId)) continue
    const formule = byProduct.get(pfId)!
    formule.lignes.push({
      id: row.id,
      composant_id: row.composant_id,
      composant_nom: comp?.nom ?? '—',
      composant_code: comp?.code ?? '—',
      quantite_requise: Number(row.quantite_requise),
      unite_mesure: comp?.unite_mesure ?? '',
    })
  }

  return Array.from(byProduct.values()).filter((f) => f.lignes.length > 0)
}

export async function fetchComposantsForBom() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('composants')
    .select('id, code, nom, unite_mesure')
    .order('nom')
  return data ?? []
}

export async function fetchProduitsFinisForBom() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('produits_finis')
    .select('id, code, nom, volume_litre, unite_commerciale')
    .order('nom')

  if (!error) return data ?? []

  const { data: fallback } = await supabase
    .from('produits_finis')
    .select('id, code, nom, volume_litre')
    .order('nom')

  return (fallback ?? []).map((p) => ({
    ...p,
    unite_commerciale: null,
  }))
}
