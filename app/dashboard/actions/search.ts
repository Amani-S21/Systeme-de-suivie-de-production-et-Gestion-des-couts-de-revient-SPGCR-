'use server'

import { createClient } from '@/utils/supabase/server'

export type SearchResult = {
  id: string
  title: string
  subtitle?: string
  type: 'lot' | 'composant' | 'produit'
  href: string
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return []

  const supabase = await createClient()
  const q = query.trim()

  const results: SearchResult[] = []

  // 1. Search Lots
  const { data: lots } = await supabase
    .from('lots_production')
    .select('id, numero_lot, produits_finis(nom)')
    .ilike('numero_lot', `%${q}%`)
    .limit(5)

  lots?.forEach((l) => {
    results.push({
      id: l.id,
      title: `Lot ${l.numero_lot}`,
      subtitle: (l.produits_finis as any)?.nom,
      type: 'lot',
      href: `/dashboard/lots?search=${l.numero_lot}`,
    })
  })

  // 2. Search Composants
  const { data: composants } = await supabase
    .from('composants')
    .select('id, nom, code')
    .or(`nom.ilike.%${q}%,code.ilike.%${q}%`)
    .limit(5)

  composants?.forEach((c) => {
    results.push({
      id: c.id,
      title: c.nom,
      subtitle: c.code,
      type: 'composant',
      href: `/dashboard/composants?search=${c.code}`,
    })
  })

  // 3. Search Produits Finis
  const { data: produits } = await supabase
    .from('produits_finis')
    .select('id, nom, code')
    .or(`nom.ilike.%${q}%,code.ilike.%${q}%`)
    .limit(5)

  produits?.forEach((p) => {
    results.push({
      id: p.id,
      title: p.nom,
      subtitle: p.code,
      type: 'produit',
      href: `/dashboard/nomenclatures?search=${p.code}`,
    })
  })

  return results
}
